import {
  Button,
  ForEach,
  HStack,
  Image,
  List,
  Navigation,
  NavigationStack,
  ProgressView,
  Section,
  Spacer,
  Text,
  VStack,
  useEffect,
  useObservable,
  useState
} from 'scripting'
import { i18n } from '../i18n'
import { daysSince, formatMoney, isBalanceStale } from '../format'
import { regionFor, regionName } from '../regions'
import {
  dueThisMonth,
  foreignSubscriptions,
  nextBill,
  subscriptionsFor
} from '../billing'
import { hasPassword, revealAndCopyPassword } from '../credentials'
import { alertLevelFor } from '../billing'
import { AccountEditor } from './AccountEditor'
import { GiftCards } from './GiftCards'
import { EntryEditor, kindLabel } from './EntryEditor'
import { SwitchGuide } from './SwitchGuide'
import type { EntryDraft } from './EntryEditor'
import type { Account, AppRef, Entry, Settings, TFItem } from '../types'

/**
 * Pushed destinations in this runtime are built once, when the link is tapped,
 * so this screen cannot rely on new props arriving from `App`. It keeps a local
 * mirror of the account it edits and reports every change upward — the parent
 * stays the persistence owner, this view stays visually correct.
 */
/** Fixed-width mask; never sized to the real password. */
const MASK = '••••••••'

export function AccountDetail({
  account: initialAccount,
  accounts,
  entries,
  appRefs,
  tfItems,
  currentAccountId,
  settings,
  onUpdate,
  onDelete,
  onSetCurrent,
  onSettingsChange,
  onSaveEntry,
  onDeleteEntry
}: {
  account: Account
  accounts: Account[]
  entries: Entry[]
  appRefs: Record<string, AppRef>
  tfItems: TFItem[]
  currentAccountId: string | null
  settings: Settings
  onUpdate: (account: Account) => void
  onDelete: (accountId: string) => void
  onSetCurrent: (accountId: string) => void
  onSettingsChange: (settings: Settings) => void
  onSaveEntry: (draft: EntryDraft) => void
  onDeleteEntry: (entryId: string) => void
}) {
  const dismiss = Navigation.useDismiss()
  const [account, setAccount] = useState<Account>(initialAccount)
  const [isCurrent, setIsCurrent] = useState(currentAccountId === initialAccount.id)
  const [introSeen, setIntroSeen] = useState(settings.switchGuideIntroSeen)
  // This account's records, owned locally for the same reason the account is:
  // a pushed destination does not receive new props from `App`. Holding them
  // here also means the list's data source and its rendered rows can never
  // disagree — which is exactly what crashed UIKit when they did.
  const [accountEntries, setAccountEntries] = useState<Entry[]>(() =>
    entries.filter((e) => e.accountId === initialAccount.id)
  )
  const [revealed, setRevealed] = useState<string | null>(null)
  const [status, setStatus] = useState('')

  const region = regionFor(account.region)
  const subscriptions = subscriptionsFor(accountEntries, account)
  const foreign = foreignSubscriptions(accountEntries, account)
  const next = nextBill(subscriptions)
  const stored = hasPassword(account.id)

  /**
   * `ForEach` performs swipe-to-delete by rewriting this observable in place,
   * so it has to be re-seeded whenever the records change for any other reason.
   *
   * The rows must go through `ForEach`, not `accountEntries.map()`. A plain map
   * declares a fixed set of children; when a swipe action then shortened that
   * set, UIKit tried to animate a row deletion against a data source that still
   * had the old count and raised an inconsistency exception — the crash.
   */
  const rows = useObservable<Entry[]>(() => accountEntries)
  const orderKey = (list: Entry[]) => list.map((e) => e.id).join(',')

  useEffect(() => {
    rows.setValue(accountEntries)
  }, [accountEntries])

  useEffect(() => {
    if (orderKey(rows.value) === orderKey(accountEntries)) return
    const remaining = new Set(rows.value.map((e) => e.id))
    const removed = accountEntries.filter((e) => !remaining.has(e.id))
    setAccountEntries(rows.value)
    for (const entry of removed) onDeleteEntry(entry.id)
  }, [rows.value])

  const editEntry = async (entry?: Entry) => {
    const draft = await Navigation.present<EntryDraft | undefined>({
      element: (
        <EntryEditor
          existing={entry}
          accounts={accounts}
          appRefs={appRefs}
          defaultAccountId={account.id}
        />
      )
    })
    if (draft == null) return
    setAccountEntries((prev) => {
      const index = prev.findIndex((e) => e.id === draft.entry.id)
      if (index < 0) return [...prev, draft.entry]
      const next = [...prev]
      next[index] = draft.entry
      return next
    })
    onSaveEntry(draft)
  }

  const level = alertLevelFor(account, accountEntries)

  /**
   * FR-GIFT-07: the top-up route has to be reachable from where the shortfall is
   * shown, not buried in a menu. The balance editor is offered on the way back
   * because a top-up Storefront cannot observe is a balance the user must
   * correct by hand (FR-SUB-06).
   */
  const openGiftCards = async () => {
    await Navigation.present({
      element: (
        <NavigationStack>
          <GiftCards account={account} onUpdateBalance={openEditor} />
        </NavigationStack>
      )
    })
  }

  const markCurrent = () => {
    setIsCurrent(true)
    onSetCurrent(account.id)
  }

  const openEditor = async () => {
    const updated = await Navigation.present<Account | undefined>({
      element: <AccountEditor existing={account} />
    })
    if (updated == null) return
    setAccount(updated)
    onUpdate(updated)
  }

  const openSwitchGuide = async () => {
    await Navigation.present({
      element: (
        <SwitchGuide
          account={account}
          introSeen={introSeen}
          onIntroSeen={() => {
            setIntroSeen(true)
            onSettingsChange({ ...settings, switchGuideIntroSeen: true })
          }}
          onConfirmed={markCurrent}
        />
      )
    })
  }

  const describeFailure = (reason: 'unavailable' | 'denied' | 'missing') =>
    reason === 'unavailable'
      ? i18n.authUnavailable
      : reason === 'missing'
        ? i18n.passwordMissing
        : i18n.authDenied

  /**
   * Tapping the password does the whole job in one gesture: authenticate, show
   * it, and put it on the clipboard. Splitting "reveal" and "copy" into two
   * buttons meant two Face ID prompts for what is one intention — you are about
   * to paste this into a sign-in sheet.
   *
   * Tapping again hides it, with no second prompt: the value is already in
   * hand, and re-authenticating to *stop* showing something would be theatre.
   */
  const togglePassword = async () => {
    if (revealed != null) {
      setRevealed(null)
      setStatus('')
      return
    }
    const result = await revealAndCopyPassword(account.id, i18n.authReason)
    if (result.ok) {
      setRevealed(result.password)
      setStatus(i18n.passwordCopied)
      return
    }
    setStatus(describeFailure(result.reason))
  }

  const copyEmail = async () => {
    if (account.email.trim() === '') {
      setStatus(i18n.emailMissing)
      return
    }
    await Pasteboard.setString(account.email.trim())
    setStatus(i18n.copied)
  }

  const handleDelete = async () => {
    const linkedEntries = accountEntries.length
    const linkedTF = tfItems.filter((t) => t.accountId === account.id).length
    const ok = await Dialog.confirm({
      title: i18n.deleteAccount,
      message: i18n.deleteAccountConfirm(account.alias, linkedEntries, linkedTF),
      cancelLabel: i18n.cancel,
      confirmLabel: i18n.delete
    })
    if (!ok) return
    onDelete(account.id)
    dismiss()
  }

  return (
    <List
      navigationTitle={account.alias}
      navigationBarTitleDisplayMode="inline"
      toolbar={{
        topBarTrailing: [<Button title={i18n.edit} action={openEditor} />]
      }}
    >
      <Section>
        <HStack>
          <Text font={30}>{region.flag}</Text>
          <VStack alignment="leading" spacing={2}>
            <Text fontWeight="semibold">{regionName(region)}</Text>
            <Text font="caption" foregroundStyle="secondaryLabel">
              {region.code.toUpperCase()} · {account.currency}
            </Text>
          </VStack>
          <Spacer />
          {isCurrent ? (
            <HStack spacing={4}>
              <Image
                systemName="checkmark.circle.fill"
                foregroundStyle="systemGreen"
              />
              <Text font="caption" foregroundStyle="systemGreen">
                {i18n.currentAccount}
              </Text>
            </HStack>
          ) : (
            <Button title={i18n.markAsCurrent} action={markCurrent} />
          )}
        </HStack>
      </Section>

      <Section
        header={<Text>{i18n.accountBalance}</Text>}
        footer={
          isBalanceStale(account.balanceUpdatedAt) ? (
            <Text foregroundStyle="systemOrange">{i18n.balanceStale}</Text>
          ) : (
            <Text>{i18n.balanceUpdated(daysSince(account.balanceUpdatedAt))}</Text>
          )
        }
      >
        <HStack>
          <Text>{i18n.accountBalance}</Text>
          <Spacer />
          <Text
            fontWeight="semibold"
            foregroundStyle={level === 'severe' ? 'systemRed' : 'label'}
          >
            {formatMoney(account.balance, account.currency)}
          </Text>
        </HStack>
        {level !== 'none' ? (
          <HStack>
            <Image
              systemName={
                level === 'severe'
                  ? 'exclamationmark.triangle.fill'
                  : 'exclamationmark.circle'
              }
              foregroundStyle={level === 'severe' ? 'systemRed' : 'systemOrange'}
            />
            <Text
              font="caption"
              foregroundStyle={level === 'severe' ? 'systemRed' : 'systemOrange'}
            >
              {level === 'severe' ? i18n.alertSevere : i18n.alertWarn}
            </Text>
            <Spacer />
          </HStack>
        ) : null}
        <Button action={openGiftCards}>
          <HStack>
            <Image systemName="giftcard" />
            <Text foregroundStyle="label">{i18n.giftCards}</Text>
            <Spacer />
            <Image systemName="chevron.right" foregroundStyle="tertiaryLabel" />
          </HStack>
        </Button>
        <HStack>
          <Text>{i18n.dueThisMonth}</Text>
          <Spacer />
          <Text foregroundStyle="secondaryLabel">
            {formatMoney(dueThisMonth(subscriptions), account.currency)}
          </Text>
        </HStack>
        <HStack>
          <Text>{i18n.nextBill}</Text>
          <Spacer />
          <Text foregroundStyle="secondaryLabel">
            {next == null
              ? i18n.noSubscriptions
              : `${next.title} · ${formatMoney(next.price, next.currency)}`}
          </Text>
        </HStack>
        {foreign.length > 0 ? (
          <Text font="caption" foregroundStyle="secondaryLabel">
            {i18n.otherCurrencyNote(foreign.length)}
          </Text>
        ) : null}
      </Section>

      <Section
        header={<Text>{i18n.accountEmail}</Text>}
        footer={
          status === '' ? undefined : (
            <Text foregroundStyle="secondaryLabel">{status}</Text>
          )
        }
      >
        {/* The whole row is the button — there is nothing else you would want
            to do with an account address here. */}
        <Button action={copyEmail}>
          <HStack>
            <Text foregroundStyle="label">{i18n.accountEmail}</Text>
            <Spacer />
            <Text foregroundStyle="secondaryLabel" lineLimit={1}>
              {account.email.trim() === '' ? i18n.none : account.email}
            </Text>
            <Image
              systemName="doc.on.doc"
              font="caption"
              foregroundStyle="tertiaryLabel"
            />
          </HStack>
        </Button>

        {stored ? (
          <Button action={togglePassword}>
            <HStack>
              <Text foregroundStyle="label">{i18n.accountPassword}</Text>
              <Spacer />
              <Text
                foregroundStyle="secondaryLabel"
                fontDesign={revealed == null ? undefined : 'monospaced'}
                lineLimit={1}
              >
                {/* A fixed run of dots, not one per character: the real length
                    is itself something worth not showing over someone's
                    shoulder. */}
                {revealed ?? MASK}
              </Text>
              <Image
                systemName={revealed == null ? 'faceid' : 'eye.slash'}
                font="caption"
                foregroundStyle="tertiaryLabel"
              />
            </HStack>
          </Button>
        ) : (
          <HStack>
            <Text>{i18n.accountPassword}</Text>
            <Spacer />
            <Text foregroundStyle="secondaryLabel">{i18n.passwordNotStored}</Text>
          </HStack>
        )}
      </Section>

      <Section
        header={
          <HStack>
            <Text>{i18n.entries}</Text>
            <Spacer />
            <Button title={i18n.add} action={() => editEntry()} />
          </HStack>
        }
      >
        {accountEntries.length === 0 ? (
          <Text foregroundStyle="secondaryLabel">{i18n.entriesEmpty}</Text>
        ) : (
          <ForEach
            data={rows}
            editActions="delete"
            builder={(entry) => {
              const ref = appRefs[entry.appId]
              // An in-app purchase is titled after the item ("Pro yearly"), which
              // says nothing about which app it belongs to. The icon answers that
              // at a glance; the app name is appended for the cases where two
              // apps look alike at 32pt, and omitted when it would just repeat
              // the title.
              const appName =
                ref != null && ref.name.trim() !== '' && ref.name !== entry.title
                  ? ref.name
                  : null
              return (
                <Button key={entry.id} action={() => editEntry(entry)}>
                  <HStack spacing={10}>
                    {ref?.iconUrl ? (
                      <Image
                        imageUrl={ref.iconUrl}
                        resizable
                        frame={{ width: 32, height: 32 }}
                        clipShape={{ type: 'rect', cornerRadius: 7 }}
                        placeholder={<ProgressView />}
                      />
                    ) : (
                      // Same footprint as a real icon, so rows stay aligned
                      // whether or not the app was ever looked up.
                      <Image
                        systemName="app.dashed"
                        font={22}
                        foregroundStyle="tertiaryLabel"
                        frame={{ width: 32, height: 32 }}
                      />
                    )}
                    <VStack alignment="leading" spacing={2}>
                      <Text foregroundStyle="label" lineLimit={1}>
                        {entry.title}
                      </Text>
                      <Text
                        font="caption"
                        foregroundStyle="secondaryLabel"
                        lineLimit={1}
                      >
                        {kindLabel(entry.kind)}
                        {appName != null ? ` · ${appName}` : ''}
                        {entry.kind === 'subscription' && entry.active === false
                          ? ` · ${i18n.entryPaused}`
                          : ''}
                      </Text>
                    </VStack>
                    <Spacer />
                    <Text foregroundStyle="secondaryLabel">
                      {formatMoney(entry.price, entry.currency)}
                    </Text>
                  </HStack>
                </Button>
              )
            }}
          />
        )}
      </Section>

      <Section footer={<Text>{i18n.switchAssistantSubtitle}</Text>}>
        <Button action={openSwitchGuide}>
          <HStack>
            <Image systemName="arrow.left.arrow.right" />
            <Text foregroundStyle="label">{i18n.switchAssistant}</Text>
            <Spacer />
            <Image systemName="chevron.right" foregroundStyle="tertiaryLabel" />
          </HStack>
        </Button>
      </Section>

      {account.note.trim() === '' ? null : (
        <Section header={<Text>{i18n.accountNote}</Text>}>
          <Text>{account.note}</Text>
        </Section>
      )}

      <Section>
        <Button title={i18n.deleteAccount} role="destructive" action={handleDelete} />
      </Section>
    </List>
  )
}
