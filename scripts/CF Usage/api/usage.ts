import { graphql } from './cloudflare'
import { aggregateHourly, aggregateWorkers, sumPages } from './usage_parse'
import { periodFor, utcDateString, windowStartFor } from '../limits'
import type { Result } from './http'
import type { DayRow, HourRow, PagesRow, SumFields } from './usage_parse'
import type { HourPoint, Profile, Totals, UsageSnapshot } from '../types'

/**
 * GraphQL queries for usage data.
 *
 * Values are inlined as JSON string literals instead of passed as variables:
 * they are ISO timestamps we computed and ids Cloudflare gave us, and inlining
 * sidesteps guessing the schema's scalar type names (`Time`, `Date`, …).
 *
 * `cpuTimeUs` is not in the published tutorial, so every query that asks for it
 * has a fallback without it. A refused field costs one retry, not the screen.
 */
const SUM_FULL = 'requests subrequests errors cpuTimeUs'
const SUM_MIN = 'requests subrequests errors'
const HOUR_MS = 3_600_000

const lit = (value: string) => JSON.stringify(value)
const iso = (t: number) => new Date(t).toISOString()

type AccountData<T> = { viewer: { accounts: T[] } }

function range(start: number, end: number, extra = ''): string {
  return `{ datetime_geq: ${lit(iso(start))}, datetime_leq: ${lit(iso(end))}${extra} }`
}

function workersQuery(
  accountId: string,
  sum: string,
  windowStart: number,
  hourStart: number,
  end: number
) {
  return `query {
  viewer {
    accounts(filter: { accountTag: ${lit(accountId)} }) {
      byDay: workersInvocationsAdaptive(limit: 10000, filter: ${range(windowStart, end)}) {
        sum { ${sum} }
        dimensions { scriptName date }
      }
      byHour: workersInvocationsAdaptive(limit: 100, filter: ${range(hourStart, end)}) {
        sum { requests }
        dimensions { datetimeHour }
      }
    }
  }
}`
}

function pagesQuery(accountId: string, windowStart: number, end: number) {
  return `query {
  viewer {
    accounts(filter: { accountTag: ${lit(accountId)} }) {
      pages: pagesFunctionsInvocationsAdaptiveGroups(limit: 1000, filter: ${range(windowStart, end)}) {
        sum { requests }
        dimensions { date }
      }
    }
  }
}`
}

type WorkersData = AccountData<{ byDay: DayRow[]; byHour: HourRow[] }>
type PagesData = AccountData<{ pages: PagesRow[] }>

/** First tries with CPU time, then without; reports which one succeeded. */
async function queryWithCpuFallback<T>(
  token: string,
  build: (sum: string) => string,
  timeoutMs: number
): Promise<{ result: Result<T>; withCpu: boolean }> {
  const full = await graphql<T>(token, build(SUM_FULL), {}, timeoutMs)
  if (full.ok || full.reason !== 'api') return { result: full, withCpu: true }
  const min = await graphql<T>(token, build(SUM_MIN), {}, timeoutMs)
  return { result: min.ok ? min : full, withCpu: false }
}

export async function fetchSnapshot(
  profile: Profile,
  token: string,
  now: number = Date.now(),
  timeoutMs = 10000
): Promise<Result<UsageSnapshot>> {
  const period = periodFor(profile, now)
  const windowStart = windowStartFor(profile, now)
  const hourStart = Math.floor(now / HOUR_MS) * HOUR_MS - 23 * HOUR_MS
  const today = utcDateString(now)

  const [workers, pages] = await Promise.all([
    queryWithCpuFallback<WorkersData>(
      token,
      (sum) =>
        workersQuery(profile.accountId, sum, windowStart, hourStart, now),
      timeoutMs
    ),
    graphql<PagesData>(
      token,
      pagesQuery(profile.accountId, windowStart, now),
      {},
      timeoutMs
    )
  ])

  if (!workers.result.ok) return workers.result
  const account = workers.result.value.viewer.accounts[0]
  if (account == null) {
    return {
      ok: false,
      reason: 'api',
      message: 'Account not visible to this token'
    }
  }

  const warnings: string[] = []
  if (!workers.withCpu) warnings.push('cpu')

  const agg = aggregateWorkers(account.byDay ?? [], today, workers.withCpu)

  let pagesWindow: number | undefined
  let pagesToday: number | undefined
  const pagesAccount = pages.ok ? pages.value.viewer.accounts[0] : undefined
  if (pagesAccount != null) {
    const sums = sumPages(pagesAccount.pages ?? [], today)
    pagesWindow = sums.window
    pagesToday = sums.today
  } else {
    warnings.push('pages')
  }

  return {
    ok: true,
    value: {
      profileId: profile.id,
      fetchedAt: now,
      periodKey: period.key,
      periodStart: period.start,
      periodEnd: period.end,
      windowStart,
      window: agg.window,
      today: agg.today,
      pagesWindow,
      pagesToday,
      perWorker: agg.perWorker,
      hourly: aggregateHourly(account.byHour ?? [], now, 24),
      warnings
    }
  }
}

// --- Per-Worker detail -------------------------------------------------------

export type Quantiles = {
  cpuP50?: number
  cpuP99?: number
  wallP50?: number
  wallP99?: number
}

export type WorkerDetailData = {
  /** Hourly requests over the range, zero-filled. */
  series: HourPoint[]
  totals: Totals
  /** Milliseconds; absent when the schema refused the quantile fields. */
  quantiles?: Quantiles
}

const QUANTILES = 'quantiles { cpuTimeP50 cpuTimeP99 wallTimeP50 wallTimeP99 }'

function workerQuery(
  accountId: string,
  script: string,
  sum: string,
  quantiles: string,
  start: number,
  end: number
) {
  const filter = range(start, end, `, scriptName: ${lit(script)}`)
  return `query {
  viewer {
    accounts(filter: { accountTag: ${lit(accountId)} }) {
      series: workersInvocationsAdaptive(limit: 1000, filter: ${filter}) {
        sum { requests }
        dimensions { datetimeHour }
      }
      total: workersInvocationsAdaptive(limit: 1, filter: ${filter}) {
        sum { ${sum} }
        ${quantiles}
      }
    }
  }
}`
}

type QuantileRow = {
  cpuTimeP50?: number
  cpuTimeP99?: number
  wallTimeP50?: number
  wallTimeP99?: number
}

type WorkerData = AccountData<{
  series: HourRow[]
  total: { sum: SumFields; quantiles?: QuantileRow }[]
}>

/** Quantiles come back in microseconds (the tutorial's sample shows ~200 for a trivial Worker). */
const usToMs = (us?: number) => (us == null ? undefined : us / 1000)

export async function fetchWorkerDetail(
  token: string,
  accountId: string,
  script: string,
  hours: number,
  now: number = Date.now()
): Promise<Result<WorkerDetailData>> {
  const start = Math.floor(now / HOUR_MS) * HOUR_MS - (hours - 1) * HOUR_MS
  const attempts: [string, string][] = [
    [SUM_FULL, QUANTILES],
    [SUM_MIN, 'quantiles { cpuTimeP50 cpuTimeP99 }'],
    [SUM_MIN, '']
  ]

  let firstFailure: Result<WorkerDetailData> | null = null
  for (const [sum, quantiles] of attempts) {
    const res = await graphql<WorkerData>(
      token,
      workerQuery(accountId, script, sum, quantiles, start, now),
      {}
    )
    if (!res.ok) {
      firstFailure ??= res
      if (res.reason !== 'api') return res
      continue
    }
    const account = res.value.viewer.accounts[0]
    if (account == null) {
      return {
        ok: false,
        reason: 'api',
        message: 'Account not visible to this token'
      }
    }
    const row = account.total?.[0]
    const totals: Totals = {
      requests: row?.sum.requests ?? 0,
      subrequests: row?.sum.subrequests ?? 0,
      errors: row?.sum.errors ?? 0,
      cpuMs: row?.sum.cpuTimeUs != null ? row.sum.cpuTimeUs / 1000 : undefined
    }
    const q = row?.quantiles
    return {
      ok: true,
      value: {
        series: aggregateHourly(account.series ?? [], now, hours),
        totals,
        quantiles:
          q == null
            ? undefined
            : {
                cpuP50: usToMs(q.cpuTimeP50),
                cpuP99: usToMs(q.cpuTimeP99),
                wallP50: usToMs(q.wallTimeP50),
                wallP99: usToMs(q.wallTimeP99)
              }
      }
    }
  }
  return firstFailure!
}

// --- Diagnostics ---------------------------------------------------------------

export type Probe = { name: string; ok: boolean; detail: string }

/**
 * Runs each query shape on its own and reports the raw outcome, so a field name
 * the schema rejects shows up as Cloudflare's own message instead of a silently
 * missing number.
 */
export async function runProbes(
  token: string,
  accountId: string
): Promise<Probe[]> {
  const now = Date.now()
  const dayAgo = now - 24 * HOUR_MS
  const probes: [string, string][] = [
    [
      'workers sum (full)',
      workersQuery(accountId, SUM_FULL, dayAgo, dayAgo, now)
    ],
    [
      'workers sum (min)',
      workersQuery(accountId, SUM_MIN, dayAgo, dayAgo, now)
    ],
    ['pages functions', pagesQuery(accountId, dayAgo, now)],
    [
      'worker quantiles',
      `query { viewer { accounts(filter: { accountTag: ${lit(accountId)} }) {
        workersInvocationsAdaptive(limit: 1, filter: ${range(dayAgo, now)}) { ${QUANTILES} }
      } } }`
    ],
    [
      'dataset settings',
      `query { viewer { accounts(filter: { accountTag: ${lit(accountId)} }) {
        settings {
          workersInvocationsAdaptive { enabled maxDuration notOlderThan maxPageSize }
          pagesFunctionsInvocationsAdaptiveGroups { enabled maxDuration notOlderThan maxPageSize }
        }
      } } }`
    ]
  ]

  const results: Probe[] = []
  for (const [name, query] of probes) {
    const res = await graphql<unknown>(token, query, {})
    results.push(
      res.ok
        ? { name, ok: true, detail: JSON.stringify(res.value).slice(0, 600) }
        : {
            name,
            ok: false,
            detail: `${res.reason}${res.status ? ` ${res.status}` : ''}: ${res.message ?? ''}`
          }
    )
  }
  return results
}
