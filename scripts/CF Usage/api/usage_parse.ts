import type { HourPoint, Totals, WorkerUsage } from '../types'

/**
 * Pure aggregation of GraphQL rows. Every metric but `requests` is treated as
 * optional: if the schema refused a field, the fallback query simply omits it
 * and the parser carries `undefined` rather than a misleading zero.
 */
export type SumFields = {
  requests: number
  subrequests?: number
  errors?: number
  cpuTimeUs?: number
}

export type DayRow = {
  sum: SumFields
  dimensions: { scriptName: string; date: string }
}

export type HourRow = {
  sum: { requests: number }
  dimensions: { datetimeHour: string }
}

export type PagesRow = {
  sum: { requests: number }
  dimensions: { date: string }
}

function emptyTotals(withCpu: boolean): Totals {
  return withCpu
    ? { requests: 0, subrequests: 0, errors: 0, cpuMs: 0 }
    : { requests: 0, subrequests: 0, errors: 0 }
}

function add(into: Totals, sum: SumFields) {
  into.requests += sum.requests ?? 0
  into.subrequests += sum.subrequests ?? 0
  into.errors += sum.errors ?? 0
  if (into.cpuMs != null) into.cpuMs += (sum.cpuTimeUs ?? 0) / 1000
}

export function aggregateWorkers(
  rows: DayRow[],
  today: string,
  withCpu: boolean
): { window: Totals; today: Totals; perWorker: WorkerUsage[] } {
  const window = emptyTotals(withCpu)
  const todayTotals = emptyTotals(withCpu)
  const byScript = new Map<string, WorkerUsage>()

  for (const row of rows) {
    const script = row.dimensions.scriptName
    let worker = byScript.get(script)
    if (worker == null) {
      worker = { script, todayRequests: 0, ...emptyTotals(withCpu) }
      byScript.set(script, worker)
    }
    add(window, row.sum)
    add(worker, row.sum)
    if (row.dimensions.date === today) {
      add(todayTotals, row.sum)
      worker.todayRequests += row.sum.requests ?? 0
    }
  }

  const perWorker = Array.from(byScript.values()).sort(
    (a, b) => b.todayRequests - a.todayRequests || b.requests - a.requests
  )
  return { window, today: todayTotals, perWorker }
}

const HOUR_MS = 3_600_000

/**
 * One point per hour for the `hours` hours ending at `now`, zero-filled: the
 * adaptive dataset omits empty groups, and a chart with gaps for quiet hours
 * reads as missing data rather than as zero traffic.
 */
export function aggregateHourly(
  rows: HourRow[],
  now: number,
  hours: number
): HourPoint[] {
  const endHour = Math.floor(now / HOUR_MS) * HOUR_MS
  const startHour = endHour - (hours - 1) * HOUR_MS
  const buckets = new Map<number, number>()
  for (const row of rows) {
    const t = Date.parse(row.dimensions.datetimeHour)
    if (Number.isNaN(t)) continue
    const hour = Math.floor(t / HOUR_MS) * HOUR_MS
    buckets.set(hour, (buckets.get(hour) ?? 0) + (row.sum.requests ?? 0))
  }
  const points: HourPoint[] = []
  for (let t = startHour; t <= endHour; t += HOUR_MS) {
    points.push({ t, requests: buckets.get(t) ?? 0 })
  }
  return points
}

/** Rolls hourly points up into UTC days, for the 7-day chart. */
export function rollupDaily(points: HourPoint[]): HourPoint[] {
  const days = new Map<number, number>()
  for (const p of points) {
    const day = Math.floor(p.t / 86_400_000) * 86_400_000
    days.set(day, (days.get(day) ?? 0) + p.requests)
  }
  return Array.from(days.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([t, requests]) => ({ t, requests }))
}

export function sumPages(
  rows: PagesRow[],
  today: string
): { window: number; today: number } {
  let window = 0
  let todayCount = 0
  for (const row of rows) {
    window += row.sum.requests ?? 0
    if (row.dimensions.date === today) todayCount += row.sum.requests ?? 0
  }
  return { window, today: todayCount }
}
