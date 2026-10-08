import { Notification } from 'scripting'
import { i18n } from './i18n'
import { compact, grouped, percent, untilShort } from './format'
import { isSnapshotCurrent, metersFor, utcDateString } from './limits'
import type { Meter } from './limits'
import type {
  AlertState,
  Profile,
  ProfileAlertState,
  UsageSnapshot
} from './types'

export type PlannedAlert =
  | { kind: 'meter'; meter: Meter; threshold: number; resetsAt: number }
  | { kind: 'worker'; script: string; used: number; cap: number }

/**
 * Decides what to notify about. Pure apart from its inputs, so the rules below
 * can be checked without a device:
 *
 *  - Only the **highest newly crossed** threshold of a meter fires. Jumping from
 *    70% to 97% between two refreshes yields one "95%" notification, not an
 *    "80%" and a "95%" back to back; both are marked fired.
 *  - `fired` resets when the quota period changes, so tomorrow (Free) or next
 *    cycle (Paid) can alert again.
 *  - A watched Worker's cap is daily even on Paid, so its key carries the UTC
 *    date and keys from other days are pruned.
 *  - A snapshot from an earlier period never alerts: its quota has reset.
 */
export function planAlerts(
  profile: Profile,
  snapshot: UsageSnapshot,
  prev: ProfileAlertState | undefined,
  now: number = Date.now()
): { alerts: PlannedAlert[]; next: ProfileAlertState } {
  const samePeriod = prev != null && prev.periodKey === snapshot.periodKey
  const today = utcDateString(now)
  const fired = new Set(
    (samePeriod ? prev!.fired : []).filter(
      (key) => !key.startsWith('w:') || key.endsWith(`:${today}`)
    )
  )
  const next = (): ProfileAlertState => ({
    periodKey: snapshot.periodKey,
    fired: Array.from(fired)
  })

  if (!isSnapshotCurrent(snapshot, now)) return { alerts: [], next: next() }

  const alerts: PlannedAlert[] = []
  const thresholds = [...profile.thresholds].sort((a, b) => a - b)

  for (const meter of metersFor(profile, snapshot)) {
    const crossed = thresholds.filter((t) => meter.ratio * 100 >= t)
    const fresh = crossed.filter((t) => !fired.has(`${meter.kind}:${t}`))
    for (const t of crossed) fired.add(`${meter.kind}:${t}`)
    if (fresh.length > 0) {
      alerts.push({
        kind: 'meter',
        meter,
        threshold: fresh[fresh.length - 1],
        resetsAt: snapshot.periodEnd
      })
    }
  }

  for (const watch of profile.watched) {
    if (!(watch.dailyRequests > 0)) continue
    const worker = snapshot.perWorker.find((w) => w.script === watch.script)
    const used = worker?.todayRequests ?? 0
    const key = `w:${watch.script}:${today}`
    if (used >= watch.dailyRequests && !fired.has(key)) {
      fired.add(key)
      alerts.push({
        kind: 'worker',
        script: watch.script,
        used,
        cap: watch.dailyRequests
      })
    }
  }

  return { alerts, next: next() }
}

export function renderAlert(
  profile: Profile,
  alert: PlannedAlert,
  now: number = Date.now()
): { title: string; body: string } {
  const title = i18n.alertTitle(profile.alias)
  if (alert.kind === 'worker') {
    return {
      title,
      body: i18n.alertWorker(
        alert.script,
        grouped(alert.used),
        grouped(alert.cap)
      )
    }
  }
  const { meter, resetsAt } = alert
  const reset = untilShort(resetsAt, now)
  if (meter.kind === 'cpu') {
    return {
      title,
      body: i18n.alertCpu(
        `${compact(meter.used)} ms`,
        `${compact(meter.limit)} ms`,
        percent(meter.ratio),
        reset
      )
    }
  }
  return {
    title,
    body: i18n.alertRequests(
      grouped(meter.used),
      grouped(meter.limit),
      percent(meter.ratio),
      reset
    )
  }
}

/** Delivers immediately (copied from Storefront's `notifyNow`). */
export async function notifyNow(
  title: string,
  body: string,
  urgent: boolean,
  userInfo?: Record<string, any>
): Promise<boolean> {
  try {
    return await Notification.schedule({
      title,
      body,
      interruptionLevel: urgent ? 'timeSensitive' : 'active',
      threadIdentifier: 'cf-usage',
      userInfo,
      trigger: null
    })
  } catch {
    return false
  }
}

/**
 * Plans and delivers alerts for one profile, then returns the updated state.
 * State is only advanced for alerts that were actually delivered, so a refused
 * notification is retried on the next refresh rather than silently swallowed.
 */
export async function deliverAlerts(
  profile: Profile,
  snapshot: UsageSnapshot,
  state: AlertState,
  now: number = Date.now()
): Promise<AlertState> {
  const prev = state[profile.id]
  const { alerts, next } = planAlerts(profile, snapshot, prev, now)

  let allDelivered = true
  for (const alert of alerts) {
    const text = renderAlert(profile, alert, now)
    const urgent = alert.kind === 'meter' ? alert.threshold >= 100 : false
    const ok = await notifyNow(text.title, text.body, urgent, {
      profileId: profile.id
    })
    if (!ok) allDelivered = false
  }

  if (!allDelivered) {
    // Keep the old state (but follow a period change) so the next run retries.
    const samePeriod = prev != null && prev.periodKey === snapshot.periodKey
    return {
      ...state,
      [profile.id]: samePeriod
        ? prev!
        : { periodKey: snapshot.periodKey, fired: [] }
    }
  }
  return { ...state, [profile.id]: next }
}
