import { i18n } from './i18n'
import { formatDate, formatMoney } from './format'
import type { ReminderPlan } from './notifications'
import type { Account } from './types'

/**
 * Turns a plan into the words the user sees on the lock screen.
 *
 * Separate from `notifications.ts` so the planner stays free of i18n and stays
 * testable, and so the copy for the one message this app sends unprompted sits
 * in one readable place.
 *
 * FR-ALERT-05 fixes the contents: account alias, item, amount, charge date and
 * the balance. FR-SUB-06 adds the reason this is not merely informational — the
 * balance is hand-maintained, so the moment we tell the user about a charge is
 * also the best moment to ask them to correct the number we based it on.
 */
export function renderReminder(
  plan: ReminderPlan,
  accounts: Account[]
): { title: string; body: string } {
  const account = accounts.find((a) => a.id === plan.accountId)
  const alias = account?.alias ?? ''
  const amount = formatMoney(plan.amount, plan.currency)
  const date = formatDate(plan.billingAt, i18n.dateLocale)

  if (!plan.comparable) {
    return {
      title: i18n.notifyTitle(alias, plan.title),
      body: i18n.notifyBodyForeign(amount, date)
    }
  }

  const balance = formatMoney(plan.balanceBefore, account?.currency ?? plan.currency)

  return {
    title: i18n.notifyTitle(alias, plan.title),
    body: plan.short
      ? i18n.notifyBodyShort(amount, date, balance)
      : i18n.notifyBody(amount, date, balance)
  }
}
