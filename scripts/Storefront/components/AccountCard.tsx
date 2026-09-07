import { HStack, Image, Spacer, Text, VStack } from 'scripting'
import { i18n } from '../i18n'
import { daysSince, formatMoney, isBalanceStale } from '../format'
import { regionFor } from '../regions'
import {
  alertLevelFor,
  dueThisMonth,
  foreignSubscriptions,
  nextBill,
  subscriptionsFor
} from '../billing'
import type { Account, Entry } from '../types'

/**
 * Two levels, two colors (FR-ALERT-02). Red is reserved for "the next charge
 * will fail" so that scanning the list surfaces real breakage first; orange is
 * the softer 30-day warning.
 */
const ALERT_STYLE = {
  severe: { color: 'systemRed', icon: 'exclamationmark.triangle.fill' },
  warn: { color: 'systemOrange', icon: 'exclamationmark.circle' },
  none: { color: 'secondaryLabel', icon: '' }
} as const

export function AccountCard({
  account,
  entries,
  isCurrent
}: {
  account: Account
  entries: Entry[]
  isCurrent: boolean
}) {
  const region = regionFor(account.region)
  const subscriptions = subscriptionsFor(entries, account)
  const foreign = foreignSubscriptions(entries, account)
  const level = alertLevelFor(account, entries)
  const alert = ALERT_STYLE[level]
  const monthly = dueThisMonth(subscriptions)
  const next = nextBill(subscriptions)
  const stale = isBalanceStale(account.balanceUpdatedAt)

  return (
    <VStack alignment="leading" spacing={6} padding={{ vertical: 4 }}>
      <HStack spacing={8}>
        <Text font={22}>{region.flag}</Text>
        <VStack alignment="leading" spacing={1}>
          <HStack spacing={6}>
            <Text fontWeight="semibold">{account.alias}</Text>
            {isCurrent ? (
              <HStack spacing={3}>
                <Image
                  systemName="checkmark.circle.fill"
                  font="caption2"
                  foregroundStyle="systemGreen"
                />
                <Text font="caption2" foregroundStyle="systemGreen">
                  {i18n.currentAccount}
                </Text>
              </HStack>
            ) : null}
          </HStack>
          <Text font="caption" foregroundStyle="secondaryLabel">
            {region.code.toUpperCase()} · {account.currency}
          </Text>
        </VStack>
        <Spacer />
        <VStack alignment="trailing" spacing={1}>
          <Text
            fontWeight="semibold"
            foregroundStyle={level === 'severe' ? 'systemRed' : 'label'}
          >
            {formatMoney(account.balance, account.currency)}
          </Text>
          {stale ? (
            <Text font="caption2" foregroundStyle="systemOrange">
              {i18n.balanceStale}
            </Text>
          ) : (
            <Text font="caption2" foregroundStyle="secondaryLabel">
              {i18n.balanceUpdated(daysSince(account.balanceUpdatedAt))}
            </Text>
          )}
        </VStack>
      </HStack>

      {subscriptions.length > 0 ? (
        <HStack spacing={10}>
          <Text font="caption" foregroundStyle="secondaryLabel">
            {i18n.dueThisMonth} {formatMoney(monthly, account.currency)}
          </Text>
          {next != null ? (
            <Text font="caption" foregroundStyle="secondaryLabel">
              · {i18n.nextBill} {formatMoney(next.price, next.currency)}
            </Text>
          ) : null}
          <Spacer />
        </HStack>
      ) : null}

      {level !== 'none' ? (
        <HStack spacing={4}>
          <Image systemName={alert.icon} font="caption" foregroundStyle={alert.color} />
          <Text font="caption" foregroundStyle={alert.color}>
            {level === 'severe' ? i18n.alertSevere : i18n.alertWarn}
          </Text>
          <Spacer />
        </HStack>
      ) : null}

      {foreign.length > 0 ? (
        <Text font="caption2" foregroundStyle="secondaryLabel">
          {i18n.otherCurrencyNote(foreign.length)}
        </Text>
      ) : null}
    </VStack>
  )
}
