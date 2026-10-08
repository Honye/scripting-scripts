import type { Profile, UsageSnapshot } from './types'

/**
 * Quota arithmetic. Pure — no runtime APIs — so the numbers that decide whether
 * the user gets woken up can be reasoned about without a device.
 *
 * Everything is UTC: Cloudflare resets the Free daily quota at 00:00 UTC and
 * bills on UTC days, so local midnight would be the wrong boundary for anyone
 * not in UTC.
 */
export const DAY_MS = 86_400_000

export function utcDayStart(t: number): number {
  const d = new Date(t)
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
}

export function utcMonthStart(t: number): number {
  const d = new Date(t)
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)
}

/** `YYYY-MM-DD` of the UTC day containing `t` — the GraphQL `date` dimension format. */
export function utcDateString(t: number): string {
  return new Date(t).toISOString().slice(0, 10)
}

export type Period = { start: number; end: number; key: string }

export function clampBillingDay(day: number): number {
  return Math.min(28, Math.max(1, Math.round(day)))
}

/** The quota period `now` falls in: a UTC day on Free, a billing month on Paid. */
export function periodFor(profile: Profile, now: number): Period {
  if (profile.plan === 'free') {
    const start = utcDayStart(now)
    return { start, end: start + DAY_MS, key: `d:${utcDateString(start)}` }
  }
  const day = clampBillingDay(profile.billingDay)
  const d = new Date(now)
  let start = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), day)
  // `Date.UTC` normalises a month of -1 to December of the year before.
  if (start > now)
    start = Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - 1, day)
  const s = new Date(start)
  const end = Date.UTC(s.getUTCFullYear(), s.getUTCMonth() + 1, day)
  return { start, end, key: `m:${utcDateString(start)}` }
}

/**
 * What the snapshot's `window` totals cover. On Free the quota is daily, but the
 * month-to-date figure is still what the dashboard's usage panel shows next to
 * it, so the window is the UTC month.
 */
export function windowStartFor(profile: Profile, now: number): number {
  return profile.plan === 'free'
    ? utcMonthStart(now)
    : periodFor(profile, now).start
}

export type MeterKind = 'requests' | 'cpu'

export type Meter = {
  kind: MeterKind
  used: number
  limit: number
  /** used / limit; may exceed 1. */
  ratio: number
}

function meter(kind: MeterKind, used: number, limit: number): Meter {
  return { kind, used, limit, ratio: limit > 0 ? used / limit : 0 }
}

/**
 * The quotas this plan is measured against. Pages Functions requests count
 * towards the same Workers request quota on both plans, so they are added in
 * whenever the dataset was readable.
 */
export function metersFor(profile: Profile, snapshot: UsageSnapshot): Meter[] {
  if (profile.plan === 'free') {
    return [
      meter(
        'requests',
        snapshot.today.requests + (snapshot.pagesToday ?? 0),
        profile.limits.dailyRequests
      )
    ]
  }
  const meters = [
    meter(
      'requests',
      snapshot.window.requests + (snapshot.pagesWindow ?? 0),
      profile.limits.monthlyRequests
    )
  ]
  if (snapshot.window.cpuMs != null) {
    meters.push(
      meter('cpu', snapshot.window.cpuMs, profile.limits.monthlyCpuMs)
    )
  }
  return meters
}

export function worstMeter(meters: Meter[]): Meter | null {
  return meters.reduce<Meter | null>(
    (worst, m) => (worst == null || m.ratio > worst.ratio ? m : worst),
    null
  )
}

export type Level = 'ok' | 'warn' | 'severe'

export function levelFor(ratio: number): Level {
  if (ratio >= 0.95) return 'severe'
  if (ratio >= 0.8) return 'warn'
  return 'ok'
}

/**
 * A snapshot taken in an earlier period describes a quota that has since reset;
 * its numbers must not be shown as current.
 */
export function isSnapshotCurrent(
  snapshot: UsageSnapshot,
  now: number
): boolean {
  return now < snapshot.periodEnd && now >= snapshot.periodStart
}
