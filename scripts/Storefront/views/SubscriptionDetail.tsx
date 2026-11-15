import {
  Button,
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
  useState
} from 'scripting'
import { i18n } from '../i18n'
import { daysUntil, formatDate, formatMoney } from '../format'
import { regionFor } from '../regions'
import { EntryEditor, cycleLabel } from './EntryEditor'
import type { EntryDraft } from './EntryEditor'
import type { Account, AppRef, Entry } from '../types'

/**
 * Read-only view of one subscription, opened from an icon on the calendar.
 *
 * Editing goes through the regular `EntryEditor` rather than inline fields:
 * that form already owns the price-change prompt and the fetch fallbacks, and a
 * second copy of those rules would drift. Each save is reported straight up
 * through `onSaved`, so the calendar behind this sheet is current even if the
 * sheet is swiped away instead of closed with the button.
 */
export function SubscriptionDetail({
  entry: initialEntry,
  accounts,
  appRefs: initialRefs,
  chargeAt,
  onSaved
}: {
  entry: Entry
  accounts: Account[]
  appRefs: Record<string, AppRef>
  /** The calendar day the icon sat on; shown when it is not the next charge. */
  chargeAt?: number
  onSaved: (draft: EntryDraft) => void
}) {
  const dismiss = Navigation.useDismiss()
  const [entry, setEntry] = useState(initialEntry)
  const [appRefs, setAppRefs] = useState(initialRefs)

  const ref = appRefs[entry.appId]
  const account = accounts.find((a) => a.id === entry.accountId)
  const region = account != null ? regionFor(account.region) : null
  const comparable = account != null && account.currency === entry.currency
  const short = comparable && account!.balance < entry.price
  const paused = entry.active === false
  const appName =
    ref != null && ref.name.trim() !== '' && ref.name !== entry.title
      ? ref.name
      : null

  const showChargeDay =
    chargeAt != null &&
    entry.nextBillingAt != null &&
    daysUntil(chargeAt, entry.nextBillingAt) !== 0

  const cycleText =
    entry.cycle === 'custom'
      ? i18n.everyNDays(Math.max(1, entry.customCycleDays ?? 30))
      : cycleLabel(entry.cycle ?? 'monthly')

  const edit = async () => {
    const draft = await Navigation.present<EntryDraft | undefined>({
      element: (
        <EntryEditor existing={entry} accounts={accounts} appRefs={appRefs} />
      )
    })
    if (draft == null) return
    setEntry(draft.entry)
    if (draft.appRef != null) {
      const appRef = draft.appRef
      setAppRefs((prev) => ({ ...prev, [appRef.appId]: appRef }))
    }
    onSaved(draft)
  }

  const row = (
    label: string,
    value: string,
    color: 'label' | 'systemRed' = 'label'
  ) => (
    <HStack>
      <Text>{label}</Text>
      <Spacer />
      <Text foregroundStyle={color === 'label' ? 'secondaryLabel' : color}>
        {value}
      </Text>
    </HStack>
  )

  return (
    <NavigationStack>
      <List
        navigationTitle={i18n.subscriptionDetail}
        navigationBarTitleDisplayMode="inline"
        toolbar={{
          topBarLeading: [
            <Button title={i18n.done} action={() => dismiss()} />
          ],
          topBarTrailing: [<Button title={i18n.edit} action={edit} />]
        }}
      >
        <Section>
          <HStack spacing={14}>
            {ref?.iconUrl ? (
              <Image
                imageUrl={ref.iconUrl}
                resizable
                frame={{ width: 60, height: 60 }}
                clipShape={{ type: 'rect', cornerRadius: 13 }}
                placeholder={<ProgressView />}
              />
            ) : (
              <Image
                systemName="app.dashed"
                font={40}
                foregroundStyle="tertiaryLabel"
                frame={{ width: 60, height: 60 }}
              />
            )}
            <VStack alignment="leading" spacing={4}>
              <Text font="headline" lineLimit={2}>
                {entry.title}
              </Text>
              {appName != null ? (
                <Text
                  font="subheadline"
                  foregroundStyle="secondaryLabel"
                  lineLimit={1}
                >
                  {appName}
                </Text>
              ) : null}
              {paused ? (
                <Text font="caption" foregroundStyle="systemOrange">
                  {i18n.entryPaused}
                </Text>
              ) : null}
            </VStack>
          </HStack>
        </Section>

        <Section>
          {row(i18n.entryPrice, formatMoney(entry.price, entry.currency))}
          {row(i18n.entryCycle, cycleText)}
          {showChargeDay
            ? row(i18n.chargeOn, formatDate(chargeAt!, i18n.dateLocale))
            : null}
          {entry.nextBillingAt != null
            ? row(
                i18n.entryNextBilling,
                `${formatDate(entry.nextBillingAt, i18n.dateLocale)} · ${i18n.dueIn(
                  daysUntil(entry.nextBillingAt)
                )}`
              )
            : null}
        </Section>

        <Section
          footer={
            short && !paused ? (
              <Text foregroundStyle="systemRed">{i18n.alertSevere}</Text>
            ) : undefined
          }
        >
          {row(
            i18n.entryAccount,
            account != null ? `${region?.flag ?? ''} ${account.alias}` : '—'
          )}
          {account != null
            ? row(
                i18n.accountBalance,
                formatMoney(account.balance, account.currency),
                short && !paused ? 'systemRed' : 'label'
              )
            : null}
        </Section>

        {entry.note.trim() === '' ? null : (
          <Section header={<Text>{i18n.accountNote}</Text>}>
            <Text>{entry.note}</Text>
          </Section>
        )}
      </List>
    </NavigationStack>
  )
}
