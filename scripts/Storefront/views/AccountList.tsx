import {
  Button,
  EditButton,
  ForEach,
  HStack,
  Image,
  List,
  Navigation,
  NavigationLink,
  NavigationStack,
  Section,
  Spacer,
  Text,
  useEffect,
  useObservable,
  useRef
} from 'scripting'
import { i18n } from '../i18n'
import { AccountCard } from '../components/AccountCard'
import { AccountEditor } from './AccountEditor'
import { AccountDetail } from './AccountDetail'
import { AppEntries } from './AppEntries'
import { AppLookup } from './AppLookup'
import { SettingsView } from './SettingsView'
import { TestFlightList } from './TestFlightList'
import { UpcomingBills } from './UpcomingBills'
import type { EntryDraft } from './EntryEditor'
import type { Account, AppRef, Entry, Settings, TFItem } from '../types'

export function AccountList({
  accounts,
  entries,
  appRefs,
  tfItems,
  currentAccountId,
  settings,
  onUpsert,
  onDelete,
  onReorder,
  onSetCurrent,
  onSettingsChange,
  onSaveEntry,
  onDeleteEntry,
  onReschedule,
  hasUpcoming,
  launchAccountId,
  onSaveTFItem,
  onDeleteTFItem,
  onRestored
}: {
  accounts: Account[]
  entries: Entry[]
  appRefs: Record<string, AppRef>
  tfItems: TFItem[]
  currentAccountId: string | null
  settings: Settings
  onUpsert: (account: Account) => void
  onDelete: (accountId: string) => void
  onReorder: (ids: string[]) => void
  onSetCurrent: (accountId: string) => void
  onSettingsChange: (settings: Settings) => void
  onSaveEntry: (draft: EntryDraft) => void
  onDeleteEntry: (entryId: string) => void
  onReschedule: () => Promise<number>
  hasUpcoming: boolean
  /** Set when the app was launched by tapping a reminder (FR-ALERT-06). */
  launchAccountId: string | null
  onSaveTFItem: (item: TFItem) => void
  onDeleteTFItem: (id: string) => void
  onRestored: () => void
}) {
  // `ForEach` reorders by rewriting this observable in place, so it has to be
  // re-seeded whenever the accounts themselves change.
  const rows = useObservable<Account[]>(() => accounts)
  const orderKey = (list: Account[]) => list.map((a) => a.id).join(',')

  useEffect(() => {
    rows.setValue(accounts)
  }, [accounts])

  useEffect(() => {
    // Only a real drag should be persisted; a plain re-render must not look
    // like an edit.
    if (orderKey(rows.value) === orderKey(accounts)) return
    onReorder(rows.value.map((a) => a.id))
  }, [rows.value])

  // Opening the tapped account as a sheet rather than pushing it keeps the
  // navigation stack honest: the user did not walk here, so back should not
  // pretend they did.
  const openedFromNotification = useRef(false)
  useEffect(() => {
    if (openedFromNotification.current || launchAccountId == null) return
    const account = accounts.find((a) => a.id === launchAccountId)
    if (account == null) return
    openedFromNotification.current = true
    Navigation.present({ element: <NavigationStack>{detailFor(account)}</NavigationStack> })
  }, [launchAccountId, accounts])

  const addAccount = async () => {
    const created = await Navigation.present<Account | undefined>({
      element: <AccountEditor />
    })
    if (created != null) onUpsert(created)
  }

  const detailFor = (account: Account) => (
    <AccountDetail
      account={account}
      accounts={accounts}
      entries={entries}
      appRefs={appRefs}
      tfItems={tfItems}
      currentAccountId={currentAccountId}
      settings={settings}
      onUpdate={onUpsert}
      onDelete={onDelete}
      onSetCurrent={onSetCurrent}
      onSettingsChange={onSettingsChange}
      onSaveEntry={onSaveEntry}
      onDeleteEntry={onDeleteEntry}
    />
  )

  return (
    <List
      navigationTitle={i18n.appTitle}
      toolbar={{
        topBarLeading: accounts.length > 1 ? [<EditButton />] : [],
        topBarTrailing: [
          <Button action={addAccount}>
            <Image systemName="plus" />
          </Button>
        ]
      }}
    >
      {accounts.length === 0 ? (
        <Section footer={<Text>{i18n.accountsEmptyHint}</Text>}>
          <Text foregroundStyle="secondaryLabel">{i18n.accountsEmpty}</Text>
        </Section>
      ) : (
        <Section header={<Text>{i18n.accountsTitle}</Text>}>
          <ForEach
            data={rows}
            editActions="move"
            builder={(account) => (
              <NavigationLink key={account.id} destination={detailFor(account)}>
                <AccountCard
                  account={account}
                  entries={entries}
                  isCurrent={currentAccountId === account.id}
                />
              </NavigationLink>
            )}
          />
        </Section>
      )}

      <Section>
        <NavigationLink
          destination={<UpcomingBills accounts={accounts} entries={entries} />}
        >
          <HStack>
            <Image systemName="calendar" />
            <Text foregroundStyle="label">{i18n.upcomingBills}</Text>
            <Spacer />
          </HStack>
        </NavigationLink>
        <NavigationLink
          destination={
            <AppEntries accounts={accounts} entries={entries} appRefs={appRefs} />
          }
        >
          <HStack>
            <Image systemName="square.grid.2x2" />
            <Text foregroundStyle="label">{i18n.byApp}</Text>
            <Spacer />
          </HStack>
        </NavigationLink>
        <NavigationLink
          destination={
            <TestFlightList
              items={tfItems}
              accounts={accounts}
              settings={settings}
              onSave={onSaveTFItem}
              onDelete={onDeleteTFItem}
              onSettingsChange={onSettingsChange}
            />
          }
        >
          <HStack>
            <Image systemName="airplane" />
            <Text foregroundStyle="label">{i18n.testflight}</Text>
            <Spacer />
            <Text font="caption" foregroundStyle="secondaryLabel">
              {tfItems.length > 0 ? String(tfItems.length) : ''}
            </Text>
          </HStack>
        </NavigationLink>
        <NavigationLink
          destination={
            <AppLookup
              accountRegions={Array.from(new Set(accounts.map((a) => a.region)))}
            />
          }
        >
          <HStack>
            <Image systemName="magnifyingglass" />
            <Text foregroundStyle="label">{i18n.appLookup}</Text>
            <Spacer />
          </HStack>
        </NavigationLink>
      </Section>

      <Section>
        <NavigationLink
          destination={
            <SettingsView
              settings={settings}
              onChange={onSettingsChange}
              onReschedule={onReschedule}
              hasUpcoming={hasUpcoming}
              onRestored={onRestored}
            />
          }
        >
          <HStack>
            <Image systemName="gearshape" />
            <Text foregroundStyle="label">{i18n.settings}</Text>
            <Spacer />
          </HStack>
        </NavigationLink>
      </Section>
    </List>
  )
}
