import {
  Button,
  Form,
  HStack,
  Image,
  Navigation,
  NavigationStack,
  Picker,
  ProgressView,
  Section,
  Spacer,
  Text,
  TextField,
  VStack,
  Widget,
  useEffect,
  useState
} from 'scripting'
import { i18n } from '../i18n'
import { parseAmount } from '../format'
import { regionFor } from '../regions'
import { lookupApp } from '../api/itunes'
import { parseAppId, parseAppRegion } from '../api/appstore'
import { AmountField } from '../components/AmountField'
import { kindLabel } from './EntryEditor'
import {
  getCurrentAccountId,
  loadAccounts,
  loadAppRefs,
  loadEntries,
  saveAppRefs,
  saveEntries
} from '../store'
import type { AppInfo } from '../api/itunes'
import type { Entry, EntryKind } from '../types'

const KINDS: EntryKind[] = ['purchase', 'iap', 'subscription']

/**
 * The share-sheet surface (FR-SHARE-01..06).
 *
 * FR-SHARE-05 caps this at three taps, which is what shapes the screen: every
 * field arrives with a usable default, the app metadata fills itself in, and
 * Save is reachable immediately. Nothing here may block on the network — a
 * lookup that fails still leaves a saveable record (FR-ENT-05).
 *
 * This runs as its own process, separate from `index.tsx`, and both write
 * `entries`. Storage is therefore re-read at the moment of saving rather than
 * held from when the screen opened, so a record added in the main app while
 * this sheet sat open does not get overwritten.
 */
export function QuickAdd({ input }: { input: string | null }) {
  const dismiss = Navigation.useDismiss()

  const [accounts] = useState(() => loadAccounts())
  const appId = input != null ? parseAppId(input) : null
  const sharedRegion = input != null ? parseAppRegion(input) : null

  const [accountId, setAccountId] = useState(() => {
    const current = getCurrentAccountId()
    const accountList = loadAccounts()
    return accountList.find((a) => a.id === current)?.id ?? accountList[0]?.id ?? ''
  })
  const [kind, setKind] = useState<EntryKind>('purchase')
  const [title, setTitle] = useState('')
  const [price, setPrice] = useState('')
  const [info, setInfo] = useState<AppInfo | null>(null)
  const [loading, setLoading] = useState(appId != null)
  const [notice, setNotice] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const account = accounts.find((a) => a.id === accountId)
  const region = sharedRegion ?? account?.region ?? 'us'
  const currency = info?.currency !== '' && info != null
    ? info.currency
    : (account?.currency ?? '')

  useEffect(() => {
    if (appId == null) return
    const run = async () => {
      const found = await lookupApp(appId, region)
      setLoading(false)
      if (!found.ok) {
        // FR-ENT-05 again: say it once, then get out of the way.
        setNotice(i18n.quickAddOffline)
        return
      }
      setInfo(found.value)
      setTitle(found.value.name)
      if (found.value.price > 0) {
        setPrice(String(found.value.price))
        setKind('purchase')
      } else {
        // A free app shared from the App Store is almost never a "paid app"
        // record; it is the subscription or the in-app purchase inside it.
        setKind('subscription')
      }
    }
    run()
  }, [])

  const save = async () => {
    if (appId == null || account == null) return
    setSaving(true)

    // Re-read rather than trusting a snapshot taken when the sheet opened.
    const entries = loadEntries()
    const duplicate = entries.find(
      (e) => e.appId === appId && e.accountId === accountId
    )

    let replaceId: string | null = null
    if (duplicate != null) {
      // FR-SHARE-06: never silently do either one.
      const update = await Dialog.confirm({
        title: i18n.quickAddDuplicateTitle,
        message: i18n.quickAddDuplicateBody(duplicate.title, account.alias),
        cancelLabel: i18n.quickAddDuplicateAdd,
        confirmLabel: i18n.quickAddDuplicateUpdate
      })
      if (update) replaceId = duplicate.id
    }

    const entry: Entry = {
      id: replaceId ?? UUID.string(),
      kind,
      appId,
      accountId,
      title: title.trim() !== '' ? title.trim() : (info?.name ?? appId),
      price: parseAmount(price) ?? 0,
      currency,
      priceSource: info != null && price === String(info.price) ? 'fetched' : 'manual',
      purchasedAt: kind === 'subscription' ? undefined : Date.now(),
      cycle: kind === 'subscription' ? 'monthly' : undefined,
      nextBillingAt: kind === 'subscription' ? Date.now() : undefined,
      active: kind === 'subscription' ? true : undefined,
      note: ''
    }

    const next =
      replaceId != null
        ? entries.map((e) => (e.id === replaceId ? entry : e))
        : [...entries, entry]
    saveEntries(next)

    if (info != null) {
      const refs = loadAppRefs()
      refs[info.appId] = {
        appId: info.appId,
        name: info.name,
        iconUrl: info.iconUrl,
        bundleId: info.bundleId,
        fetchedRegion: info.region,
        fetchedAt: Date.now()
      }
      saveAppRefs(refs)
    }

    Widget.reloadAll()
    setSaving(false)
    setSaved(true)
    dismiss()
  }

  const fatal =
    input == null
      ? i18n.quickAddNoInput
      : appId == null
        ? i18n.quickAddBadUrl
        : accounts.length === 0
          ? i18n.quickAddNoAccounts
          : null

  if (fatal != null) {
    // FR-SHARE-03: an unusable input gets a plain explanation, never a silent exit.
    return (
      <NavigationStack>
        <Form
          navigationTitle={i18n.quickAdd}
          navigationBarTitleDisplayMode="inline"
          toolbar={{
            topBarTrailing: [<Button title={i18n.close} action={() => dismiss()} />]
          }}
        >
          <Section>
            <HStack spacing={10}>
              <Image
                systemName="exclamationmark.triangle"
                foregroundStyle="systemOrange"
              />
              <Text>{fatal}</Text>
            </HStack>
          </Section>
        </Form>
      </NavigationStack>
    )
  }

  return (
    <NavigationStack>
      <Form
        navigationTitle={i18n.quickAdd}
        navigationBarTitleDisplayMode="inline"
        toolbar={{
          topBarLeading: [<Button title={i18n.cancel} action={() => dismiss()} />],
          topBarTrailing: [
            <Button
              title={saved ? i18n.quickAddSaved : i18n.save}
              action={save}
              disabled={saving || loading}
            />
          ]
        }}
      >
        <Section footer={notice === '' ? undefined : <Text>{notice}</Text>}>
          <HStack spacing={10}>
            {info?.iconUrl ? (
              <Image
                imageUrl={info.iconUrl}
                resizable
                frame={{ width: 44, height: 44 }}
                clipShape={{ type: 'rect', cornerRadius: 10 }}
                placeholder={<ProgressView />}
              />
            ) : (
              <Image systemName="app.dashed" font={32} foregroundStyle="tertiaryLabel" />
            )}
            <VStack alignment="leading" spacing={2}>
              <Text fontWeight="semibold" lineLimit={1}>
                {info?.name ?? (loading ? i18n.quickAddLoading : appId)}
              </Text>
              <Text font="caption" foregroundStyle="secondaryLabel">
                {regionFor(region).flag} {info?.sellerName ?? appId}
              </Text>
            </VStack>
            <Spacer />
            {loading ? <ProgressView /> : null}
          </HStack>
        </Section>

        <Section>
          <Picker
            title={i18n.kind}
            value={kind}
            onChanged={(value: string) => setKind(value as EntryKind)}
            pickerStyle="segmented"
          >
            {KINDS.map((value) => (
              <Text key={value} tag={value}>
                {kindLabel(value)}
              </Text>
            ))}
          </Picker>
          <Picker
            title={i18n.entryAccount}
            value={accountId}
            onChanged={setAccountId}
          >
            {accounts.map((item) => (
              <Text key={item.id} tag={item.id}>
                {`${regionFor(item.region).flag} ${item.alias}`}
              </Text>
            ))}
          </Picker>
        </Section>

        <Section>
          <TextField
            title={i18n.entryTitle}
            prompt={i18n.entryTitlePromptIAP}
            value={title}
            onChanged={setTitle}
          />
          <AmountField
            title={i18n.entryPrice}
            currency={currency}
            value={price}
            onChanged={setPrice}
          />
        </Section>
      </Form>
    </NavigationStack>
  )
}
