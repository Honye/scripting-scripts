/**
 * Billing arithmetic. Every function here is pure — no Storage, no network, no
 * UI — because these rules decide when we wake the user up, and a wrong answer
 * is worse than no answer.
 *
 * Cross-currency is deliberately never summed (spec FR-SUB-04): v1 has no
 * exchange rates, so an account only ever compares its balance against charges
 * denominated in its own currency. Charges in another currency are surfaced
 * separately by `foreignSubscriptions` and never folded into a total.
 */
import type { Account, BillingCycle, Entry } from './types'

export type AlertLevel = 'none' | 'warn' | 'severe'

/** How far ahead the "warn" level looks. */
export const WARN_WINDOW_DAYS = 30

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * Calendar-correct month arithmetic. `Date.setMonth` overflows — Jan 31 plus one
 * month lands on Mar 3 — whereas a subscription started on the 31st bills on the
 * 28th in February, so the day is clamped to the length of the target month.
 */
function addMonths(ts: number, months: number): number {
  const source = new Date(ts)
  const day = source.getDate()
  const target = new Date(ts)
  target.setDate(1)
  target.setMonth(target.getMonth() + months)
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate()
  target.setDate(Math.min(day, lastDay))
  return target.getTime()
}

export function advanceOnce(
  ts: number,
  cycle: BillingCycle | undefined,
  customCycleDays?: number
): number {
  switch (cycle) {
    case 'monthly':
      return addMonths(ts, 1)
    case 'quarterly':
      return addMonths(ts, 3)
    case 'yearly':
      return addMonths(ts, 12)
    case 'custom':
      return ts + Math.max(1, customCycleDays ?? 30) * DAY_MS
    default:
      return addMonths(ts, 1)
  }
}

/**
 * Rolls a stale billing date forward past `now` (FR-SUB-05). Returns the entry
 * unchanged when nothing moved, so callers can cheaply detect a real advance.
 */
export function advanceEntry(entry: Entry, now: number = Date.now()): Entry {
  if (entry.kind !== 'subscription' || entry.nextBillingAt == null) return entry
  let at = entry.nextBillingAt
  // Bounded so a corrupt date or a 1-day custom cycle cannot spin forever.
  for (let i = 0; at <= now && i < 500; i++) {
    at = advanceOnce(at, entry.cycle, entry.customCycleDays)
  }
  return at === entry.nextBillingAt ? entry : { ...entry, nextBillingAt: at }
}

export function isBillable(entry: Entry): boolean {
  return (
    entry.kind === 'subscription' &&
    entry.active !== false &&
    entry.nextBillingAt != null
  )
}

/** Active subscriptions charged to this account, in the account's own currency. */
export function subscriptionsFor(entries: Entry[], account: Account): Entry[] {
  return entries.filter(
    (e) => isBillable(e) && e.accountId === account.id && e.currency === account.currency
  )
}

/** Active subscriptions on this account billed in some other currency. */
export function foreignSubscriptions(entries: Entry[], account: Account): Entry[] {
  return entries.filter(
    (e) => isBillable(e) && e.accountId === account.id && e.currency !== account.currency
  )
}

export function nextBill(subscriptions: Entry[]): Entry | null {
  let best: Entry | null = null
  for (const entry of subscriptions) {
    if (best == null || entry.nextBillingAt! < best.nextBillingAt!) best = entry
  }
  return best
}

/**
 * Total charged between `now` and `until`, counting a subscription once per
 * occurrence — a 7-day custom cycle really does bill four times in a month.
 */
export function dueBetween(
  subscriptions: Entry[],
  now: number,
  until: number
): number {
  let total = 0
  for (const entry of subscriptions) {
    let at = entry.nextBillingAt!
    for (let i = 0; at <= until && i < 500; i++) {
      if (at >= now) total += entry.price
      at = advanceOnce(at, entry.cycle, entry.customCycleDays)
    }
  }
  return total
}

/** Still to be charged before this calendar month ends (FR-ACC-02). */
export function dueThisMonth(subscriptions: Entry[], now: number = Date.now()): number {
  const end = new Date(now)
  end.setMonth(end.getMonth() + 1, 1)
  end.setHours(0, 0, 0, 0)
  return dueBetween(subscriptions, now, end.getTime() - 1)
}

/**
 * FR-ALERT-01. `severe` means the very next charge already cannot be paid —
 * silent billing failure is imminent, which is the whole reason this app exists.
 * `warn` means the next charge clears but the 30-day run does not.
 */
export function alertLevelFor(
  account: Account,
  entries: Entry[],
  now: number = Date.now()
): AlertLevel {
  const subscriptions = subscriptionsFor(entries, account)
  const next = nextBill(subscriptions)
  if (next == null) return 'none'
  if (account.balance < next.price) return 'severe'
  if (account.balance < dueBetween(subscriptions, now, now + WARN_WINDOW_DAYS * DAY_MS)) {
    return 'warn'
  }
  return 'none'
}

export type AccountStanding = {
  account: Account
  level: AlertLevel
  /** The soonest charge in the account's own currency, if any. */
  next: Entry | null
  dueThisMonth: number
}

const LEVEL_RANK: Record<AlertLevel, number> = { severe: 0, warn: 1, none: 2 }

/**
 * Orders accounts by how much they need attention: anything that will fail to
 * bill first, then anything that will run out within the month, then by how
 * soon the next charge lands, and finally the user's own ordering.
 *
 * The widget shows only the first one or few, so this ranking decides what a
 * glance at the Home Screen is worth. Sorting by the user's order alone would
 * put a healthy account in front of one about to fail.
 */
export function rankAccounts(
  accounts: Account[],
  entries: Entry[],
  now: number = Date.now()
): AccountStanding[] {
  return accounts
    .map((account) => {
      const subscriptions = subscriptionsFor(entries, account)
      return {
        account,
        level: alertLevelFor(account, entries, now),
        next: nextBill(subscriptions),
        dueThisMonth: dueThisMonth(subscriptions, now)
      }
    })
    .sort((a, b) => {
      const byLevel = LEVEL_RANK[a.level] - LEVEL_RANK[b.level]
      if (byLevel !== 0) return byLevel
      const aAt = a.next?.nextBillingAt ?? Number.MAX_SAFE_INTEGER
      const bAt = b.next?.nextBillingAt ?? Number.MAX_SAFE_INTEGER
      if (aAt !== bAt) return aAt - bAt
      return a.account.sortIndex - b.account.sortIndex
    })
}
