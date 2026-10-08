/**
 * Pure data shapes. Nothing here touches the `'scripting'` runtime, so every
 * surface (app, widget) and every pure module can import it freely.
 */

export type Plan = 'free' | 'paid'

export type Limits = {
  /** Free plan: Workers + Pages Functions requests per UTC day. */
  dailyRequests: number
  /** Paid plan: requests included per billing month. */
  monthlyRequests: number
  /** Paid plan: CPU milliseconds included per billing month. */
  monthlyCpuMs: number
}

export const defaultLimits: Limits = {
  dailyRequests: 100_000,
  monthlyRequests: 10_000_000,
  monthlyCpuMs: 30_000_000
}

export const THRESHOLD_CHOICES = [50, 80, 95, 100]
export const defaultThresholds = [80, 95, 100]

/** A Worker the user asked to be alerted about on its own. */
export type WatchedWorker = {
  script: string
  /** Alert once a UTC day when this Worker alone reaches this many requests. */
  dailyRequests: number
}

/**
 * One API token bound to one account. The token itself never lives here — it is
 * in the Keychain under `tokenKey(id)` — so a Storage dump is harmless.
 */
export type Profile = {
  id: string
  alias: string
  accountId: string
  accountName: string
  plan: Plan
  limits: Limits
  /** Paid plan only: day of month (1–28, UTC) the billing cycle starts on. */
  billingDay: number
  /** Percent thresholds that raise an alert, e.g. [80, 95, 100]. */
  thresholds: number[]
  watched: WatchedWorker[]
  sortIndex: number
  createdAt: number
}

export type Totals = {
  requests: number
  subrequests: number
  errors: number
  /** Absent when the GraphQL schema refused the CPU field. */
  cpuMs?: number
}

export type WorkerUsage = Totals & {
  script: string
  /** Requests since 00:00 UTC — what a watched Worker's cap is measured against. */
  todayRequests: number
}

export type HourPoint = { t: number; requests: number }

export type UsageSnapshot = {
  profileId: string
  fetchedAt: number
  /** Identifies the quota period; alert de-duplication resets when it changes. */
  periodKey: string
  periodStart: number
  periodEnd: number
  /** Start of what `window` covers: the UTC month on Free, the billing cycle on Paid. */
  windowStart: number
  /** Workers totals since `windowStart`. */
  window: Totals
  /** Workers totals since 00:00 UTC. */
  today: Totals
  /** Pages Functions requests; undefined when that dataset could not be read. */
  pagesWindow?: number
  pagesToday?: number
  perWorker: WorkerUsage[]
  /** Account-wide Workers requests per hour for the last 24 hours. */
  hourly: HourPoint[]
  /** Non-fatal problems, e.g. a dataset the token cannot read. */
  warnings: string[]
}

export type ProfileAlertState = {
  periodKey: string
  fired: string[]
}

export type AlertState = Record<string, ProfileAlertState>
