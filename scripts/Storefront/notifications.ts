import { Notification } from 'scripting'
import { isBillable } from './billing'
import type { Account, Entry } from './types'

/**
 * Local notification primitives.
 *
 * P1 provides only the building blocks the diagnostics spike exercises; the
 * billing reminder planner (`rescheduleAll`) lands in P5 on top of these.
 *
 * Two rules that the rest of the app depends on:
 *  - Only ever clear with `removeAllPendingsOfCurrentScript`. The unscoped
 *    `removeAllPendings` would wipe pending notifications belonging to the
 *    user's other Scripting scripts.
 *  - iOS keeps at most 64 pending notifications per app, and every script in
 *    Scripting shares that budget, so the planner caps how many it schedules.
 */
export const MAX_SCHEDULED = 20

/**
 * Foundation date components are 1-based for `month`, unlike `Date.getMonth()`.
 * Verified against the runtime in the P1 spike.
 */
export function dateComponentsFrom(date: Date): DateComponents {
  return new DateComponents({
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
    hour: date.getHours(),
    minute: date.getMinutes(),
    second: date.getSeconds()
  })
}

export type ScheduleOptions = {
  title: string
  body?: string
  fireAt: Date
  timeSensitive?: boolean
  userInfo?: Record<string, any>
  threadIdentifier?: string
}

/** Resolves false when the system refuses — most often unauthorized. */
export async function scheduleAt(options: ScheduleOptions): Promise<boolean> {
  try {
    return await Notification.schedule({
      title: options.title,
      body: options.body,
      interruptionLevel: options.timeSensitive ? 'timeSensitive' : 'active',
      userInfo: options.userInfo,
      threadIdentifier: options.threadIdentifier,
      // Always a one-shot trigger: billing dates get advanced, edited and
      // paused, so a repeating trigger would drift away from the real data.
      trigger: new CalendarNotificationTrigger({
        dateMatching: dateComponentsFrom(options.fireAt),
        repeats: false
      })
    })
  } catch {
    return false
  }
}

/**
 * Delivers immediately rather than scheduling. Used for "a beta reopened"
 * (FR-TF-08), which is news about right now — a trigger date would make it
 * arrive after the slot is gone.
 */
export async function notifyNow(
  title: string,
  body: string,
  userInfo?: Record<string, any>
): Promise<boolean> {
  try {
    return await Notification.schedule({
      title,
      body,
      interruptionLevel: 'active',
      userInfo,
      trigger: null
    })
  } catch {
    return false
  }
}

export async function countPending(): Promise<number> {
  try {
    const pendings = await Notification.getAllPendingsOfCurrentScript()
    return pendings.length
  } catch {
    return -1
  }
}

export async function clearPending(): Promise<void> {
  try {
    await Notification.removeAllPendingsOfCurrentScript()
  } catch {
    // Nothing actionable; the caller re-schedules regardless.
  }
}

// --- Billing reminders (P5) ------------------------------------------------

/** Local hour reminders fire at. Late enough to be awake, early enough to act. */
const REMINDER_HOUR = 10

export type ReminderPlan = {
  entryId: string
  accountId: string
  fireAt: Date
  billingAt: number
  title: string
  amount: number
  currency: string
  /** Projected balance at this charge, after every earlier charge that month. */
  balanceBefore: number
  /** True when the projected balance cannot cover this charge. */
  short: boolean
  /** Only false when the charge is in a currency the balance cannot be compared to. */
  comparable: boolean
}

function reminderDate(billingAt: number, leadDays: number): Date {
  const date = new Date(billingAt)
  date.setDate(date.getDate() - leadDays)
  date.setHours(REMINDER_HOUR, 0, 0, 0)
  return date
}

/**
 * Decides what to schedule. Pure — no Notification calls — so the arithmetic
 * that wakes the user up can be exercised without a device.
 *
 * The affordability check runs a **running balance** per account rather than
 * comparing each charge to the full balance on its own. With ¥30 and three ¥20
 * charges coming, only the first one actually clears; alerting on all three, or
 * on none, would both be wrong. Charges in another currency cannot be subtracted
 * from the balance at all (FR-SUB-04), so they are carried as `comparable:
 * false` and never silently treated as free.
 */
export function planReminders(
  accounts: Account[],
  entries: Entry[],
  leadDays: number,
  now: number = Date.now()
): ReminderPlan[] {
  const byAccount = new Map(accounts.map((a) => [a.id, a]))
  const running = new Map<string, number>()
  for (const account of accounts) running.set(account.id, account.balance)

  const plans: ReminderPlan[] = []

  // Chronological, so the running balance is drawn down in the order the
  // charges will actually hit.
  const billable = entries
    .filter(isBillable)
    .sort((a, b) => a.nextBillingAt! - b.nextBillingAt!)

  for (const entry of billable) {
    const account = byAccount.get(entry.accountId)
    if (account == null) continue

    const comparable = account.currency === entry.currency
    const balanceBefore = running.get(account.id) ?? 0
    const short = comparable && balanceBefore < entry.price
    if (comparable) running.set(account.id, balanceBefore - entry.price)

    const fireAt = reminderDate(entry.nextBillingAt!, leadDays)
    // A reminder for a moment that has already passed is noise, not a warning.
    if (fireAt.getTime() <= now) continue

    plans.push({
      entryId: entry.id,
      accountId: account.id,
      fireAt,
      billingAt: entry.nextBillingAt!,
      title: entry.title,
      amount: entry.price,
      currency: entry.currency,
      balanceBefore,
      short,
      comparable
    })
  }

  // FR-ALERT-07: iOS allows 64 pending notifications per app, shared by every
  // script in Scripting. Keep only the soonest few; the rest get scheduled on a
  // later launch, by which time they are the soonest.
  return plans
    .sort((a, b) => a.fireAt.getTime() - b.fireAt.getTime())
    .slice(0, MAX_SCHEDULED)
}

export type RescheduleOutcome = {
  planned: number
  scheduled: number
  /** True when nothing could be scheduled although something was planned. */
  refused: boolean
}

/**
 * Clears this script's pending reminders and lays down a fresh set.
 *
 * Rebuilding wholesale rather than diffing is deliberate: billing dates move,
 * subscriptions get paused, balances change, and a stale reminder that survives
 * one of those edits is worse than no reminder at all.
 */
export async function rescheduleAll(
  accounts: Account[],
  entries: Entry[],
  leadDays: number,
  render: (plan: ReminderPlan) => { title: string; body: string },
  now: number = Date.now()
): Promise<RescheduleOutcome> {
  await clearPending()

  const plans = planReminders(accounts, entries, leadDays, now)
  let scheduled = 0

  for (const plan of plans) {
    const text = render(plan)
    const ok = await scheduleAt({
      title: text.title,
      body: text.body,
      fireAt: plan.fireAt,
      // FR-ALERT-04: only a charge that will actually fail earns the right to
      // break through Focus.
      timeSensitive: plan.short,
      // Read back from `Notification.current` on launch to open the right
      // account (FR-ALERT-06).
      userInfo: { accountId: plan.accountId, entryId: plan.entryId },
      threadIdentifier: `account-${plan.accountId}`
    })
    if (ok) scheduled++
  }

  return {
    planned: plans.length,
    scheduled,
    refused: plans.length > 0 && scheduled === 0
  }
}
