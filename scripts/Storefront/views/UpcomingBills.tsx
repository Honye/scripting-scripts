import { HStack, List, Section, Spacer, Text, VStack } from 'scripting'
import { i18n } from '../i18n'
import { daysUntil, formatDate, formatMoney } from '../format'
import { regionFor } from '../regions'
import { isBillable } from '../billing'
import type { Account, Entry } from '../types'

/**
 * FR-SUB-08: one timeline across every account, because the question "what is
 * about to be charged" does not respect account boundaries.
 *
 * No cross-currency total appears anywhere on this screen (FR-SUB-04). Each row
 * carries its own currency, and the affordability check compares a charge only
 * against a balance denominated the same way — a ¥ balance says nothing about
 * whether a $ charge will clear.
 */
export function UpcomingBills({
  accounts,
  entries
}: {
  accounts: Account[]
  entries: Entry[]
}) {
  const byId = new Map(accounts.map((a) => [a.id, a]))
  const now = Date.now()

  const upcoming = entries
    .filter(isBillable)
    .sort((a, b) => a.nextBillingAt! - b.nextBillingAt!)

  return (
    <List
      navigationTitle={i18n.upcomingBills}
      navigationBarTitleDisplayMode="inline"
    >
      {upcoming.length === 0 ? (
        <Section>
          <Text foregroundStyle="secondaryLabel">{i18n.upcomingEmpty}</Text>
        </Section>
      ) : (
        <Section footer={<Text>{i18n.totalSpentMixed}</Text>}>
          {upcoming.map((entry) => {
            const account = byId.get(entry.accountId)
            const region = account != null ? regionFor(account.region) : null
            const days = daysUntil(entry.nextBillingAt!, now)
            const comparable =
              account != null && account.currency === entry.currency
            const short = comparable && account!.balance < entry.price

            return (
              <HStack key={entry.id}>
                <VStack alignment="leading" spacing={2}>
                  <Text lineLimit={1}>{entry.title}</Text>
                  <Text font="caption" foregroundStyle="secondaryLabel">
                    {region?.flag ?? ''} {account?.alias ?? ''} ·{' '}
                    {formatDate(entry.nextBillingAt!, i18n.dateLocale)}
                  </Text>
                </VStack>
                <Spacer />
                <VStack alignment="trailing" spacing={2}>
                  <Text
                    fontWeight="semibold"
                    foregroundStyle={short ? 'systemRed' : 'label'}
                  >
                    {formatMoney(entry.price, entry.currency)}
                  </Text>
                  <Text
                    font="caption"
                    foregroundStyle={short ? 'systemRed' : 'secondaryLabel'}
                  >
                    {short ? i18n.alertSevere : i18n.dueIn(days)}
                  </Text>
                </VStack>
              </HStack>
            )
          })}
        </Section>
      )}
    </List>
  )
}
