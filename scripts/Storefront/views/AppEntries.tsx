import {
  HStack,
  Image,
  List,
  ProgressView,
  Section,
  Spacer,
  Text,
  VStack
} from 'scripting'
import { i18n } from '../i18n'
import { formatMoney } from '../format'
import { regionFor } from '../regions'
import { kindLabel } from './EntryEditor'
import type { Account, AppRef, Entry } from '../types'

/**
 * FR-ENT-09, "by app". The question this answers is the one no subscription
 * tracker can: *which account* did each of these go on, and what has this app
 * cost me across all of them.
 *
 * Totals are per currency and are never combined (FR-SUB-04). An app bought in
 * the US store and subscribed to in the China store has two totals, not one —
 * any single number would require an exchange rate this app deliberately
 * does not have.
 */
export function AppEntries({
  accounts,
  entries,
  appRefs
}: {
  accounts: Account[]
  entries: Entry[]
  appRefs: Record<string, AppRef>
}) {
  const byAccount = new Map(accounts.map((a) => [a.id, a]))

  const groups = new Map<string, Entry[]>()
  for (const entry of entries) {
    // Entries recorded by hand may have no app id; group those by their title
    // so they still aggregate sensibly instead of collapsing into one bucket.
    const key = entry.appId !== '' ? entry.appId : `title:${entry.title}`
    const list = groups.get(key)
    if (list == null) groups.set(key, [entry])
    else list.push(entry)
  }

  if (groups.size === 0) {
    return (
      <List navigationTitle={i18n.byApp} navigationBarTitleDisplayMode="inline">
        <Text foregroundStyle="secondaryLabel">{i18n.byAppEmpty}</Text>
      </List>
    )
  }

  return (
    <List navigationTitle={i18n.byApp} navigationBarTitleDisplayMode="inline">
      {Array.from(groups.entries()).map(([key, group]) => {
        const ref = appRefs[group[0].appId]
        const name = ref?.name ?? group[0].title

        const totals = new Map<string, number>()
        for (const entry of group) {
          totals.set(entry.currency, (totals.get(entry.currency) ?? 0) + entry.price)
        }

        return (
          <Section
            key={key}
            header={
              <HStack spacing={8}>
                {ref?.iconUrl ? (
                  <Image
                    imageUrl={ref.iconUrl}
                    resizable
                    frame={{ width: 22, height: 22 }}
                    clipShape={{ type: 'rect', cornerRadius: 5 }}
                    placeholder={<ProgressView />}
                  />
                ) : null}
                <Text lineLimit={1}>{name}</Text>
                <Spacer />
                <Text foregroundStyle="secondaryLabel">
                  {i18n.entryCount(group.length)}
                </Text>
              </HStack>
            }
            footer={
              <HStack>
                <Text>{i18n.totalSpent}</Text>
                <Spacer />
                <Text>
                  {Array.from(totals.entries())
                    .map(([currency, sum]) => formatMoney(sum, currency))
                    .join('  ·  ')}
                </Text>
              </HStack>
            }
          >
            {group.map((entry) => {
              const account = byAccount.get(entry.accountId)
              const region = account != null ? regionFor(account.region) : null
              return (
                <HStack key={entry.id}>
                  <VStack alignment="leading" spacing={2}>
                    <Text lineLimit={1}>{entry.title}</Text>
                    <Text font="caption" foregroundStyle="secondaryLabel">
                      {kindLabel(entry.kind)} · {region?.flag ?? ''}{' '}
                      {account?.alias ?? ''}
                    </Text>
                  </VStack>
                  <Spacer />
                  <Text foregroundStyle="secondaryLabel">
                    {formatMoney(entry.price, entry.currency)}
                  </Text>
                </HStack>
              )
            })}
          </Section>
        )
      })}
    </List>
  )
}
