import {
  Button,
  DatePicker,
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
  Toggle,
  useState
} from 'scripting'
import { i18n } from '../i18n'
import { formatMoney, parseAmount } from '../format'
import { currencyFor, regionFor } from '../regions'
import { lookupApp } from '../api/itunes'
import { fetchIAP } from '../api/appstore'
import { AmountField } from '../components/AmountField'
import { AppLookup } from './AppLookup'
import type { AppInfo } from '../api/itunes'
import type { IAPItem } from '../api/appstore'
import type { Account, AppRef, BillingCycle, Entry, EntryKind } from '../types'

export type EntryDraft = { entry: Entry; appRef?: AppRef }

const KINDS: EntryKind[] = ['purchase', 'iap', 'subscription']
const CYCLES: BillingCycle[] = ['monthly', 'quarterly', 'yearly', 'custom']

/**
 * One form for all three kinds (FR-ENT-01). They share `app × account × price`,
 * and users ask cross-kind questions — "how much has this app cost me in total"
 * — so splitting them into three screens would only duplicate the hard parts.
 *
 * Two rules from the spec shape everything here:
 *
 *  - FR-ENT-05: a failed fetch must never block. Every network step is optional,
 *    fails quietly into hand entry, and keeps a retry within reach.
 *  - FR-ENT-07: a re-fetched price that disagrees with the stored one must ask,
 *    never overwrite. Someone who typed a price they actually paid is not
 *    corrected by today's list price.
 */
export function EntryEditor({
  existing,
  accounts,
  appRefs,
  defaultAccountId,
  defaultKind
}: {
  existing?: Entry
  accounts: Account[]
  appRefs: Record<string, AppRef>
  defaultAccountId?: string
  defaultKind?: EntryKind
}) {
  const dismiss = Navigation.useDismiss()
  const editing = existing != null

  const [id] = useState(existing?.id ?? UUID.string())
  const [kind, setKind] = useState<EntryKind>(
    existing?.kind ?? defaultKind ?? 'subscription'
  )
  const [appId, setAppId] = useState(existing?.appId ?? '')
  const [appRef, setAppRef] = useState<AppRef | undefined>(
    existing != null ? appRefs[existing.appId] : undefined
  )
  const [accountId, setAccountId] = useState(
    existing?.accountId ?? defaultAccountId ?? accounts[0]?.id ?? ''
  )
  const [title, setTitle] = useState(existing?.title ?? '')
  const [price, setPrice] = useState(existing != null ? String(existing.price) : '')
  const [currency, setCurrency] = useState(existing?.currency ?? '')
  const [priceSource, setPriceSource] = useState<'fetched' | 'manual'>(
    existing?.priceSource ?? 'manual'
  )
  const [purchasedAt, setPurchasedAt] = useState(existing?.purchasedAt ?? Date.now())
  const [cycle, setCycle] = useState<BillingCycle>(existing?.cycle ?? 'monthly')
  const [customCycleDays, setCustomCycleDays] = useState(
    String(existing?.customCycleDays ?? 30)
  )
  const [nextBillingAt, setNextBillingAt] = useState(
    existing?.nextBillingAt ?? Date.now()
  )
  const [active, setActive] = useState(existing?.active ?? true)
  const [note, setNote] = useState(existing?.note ?? '')

  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('')
  const [iapItems, setIapItems] = useState<IAPItem[] | null>(null)

  const account = accounts.find((a) => a.id === accountId)
  // The account's region decides which storefront we read prices from, and its
  // currency is the sensible default for a charge billed to it (FR-SUB-02).
  const region = account?.region ?? 'us'
  const effectiveCurrency =
    currency !== '' ? currency : (account?.currency ?? currencyFor(region))

  const parsedPrice = price.trim() === '' ? 0 : parseAmount(price)
  const priceInvalid = parsedPrice == null
  const canSave =
    title.trim() !== '' && accountId !== '' && !priceInvalid && !busy

  const editPrice = (value: string) => {
    setPrice(value)
    // FR-ENT-06: the moment a human touches the number it stops being Apple's.
    setPriceSource('manual')
  }

  /**
   * Applies a freshly fetched amount. Asks first whenever it disagrees with a
   * value already on the record (FR-ENT-07).
   */
  const applyFetchedPrice = async (amount: number, currencyCode: string) => {
    const current = parseAmount(price)
    if (current != null && price.trim() !== '' && current !== amount) {
      const update = await Dialog.confirm({
        title: i18n.priceChangedTitle,
        message: i18n.priceChangedBody(
          formatMoney(current, effectiveCurrency),
          formatMoney(amount, currencyCode)
        ),
        cancelLabel: i18n.priceChangedKeep,
        confirmLabel: i18n.priceChangedUpdate
      })
      if (!update) return
    }
    setPrice(String(amount))
    if (currencyCode !== '') setCurrency(currencyCode)
    setPriceSource('fetched')
  }

  const applyApp = (info: AppInfo) => {
    setAppId(info.appId)
    setAppRef({
      appId: info.appId,
      name: info.name,
      iconUrl: info.iconUrl,
      bundleId: info.bundleId,
      fetchedRegion: info.region,
      fetchedAt: Date.now()
    })
    setIapItems(null)
    if (title.trim() === '') setTitle(info.name)
  }

  const pickApp = async () => {
    const picked = await Navigation.present<AppInfo | undefined>({
      element: <AppLookup accountRegions={[region]} mode="select" />
    })
    if (picked == null) return
    applyApp(picked)
    // A paid app's own price is the price of a `purchase`; for the other kinds
    // the number lives inside the app, so fetching it here would be wrong.
    if (kind === 'purchase' && picked.price > 0) {
      await applyFetchedPrice(picked.price, picked.currency)
    }
  }

  /** FR-ENT-02: refresh the store price for a paid app. */
  const refetchAppPrice = async () => {
    if (appId === '') {
      setStatus(i18n.selectAppFirst)
      return
    }
    setBusy(true)
    setStatus('')
    const found = await lookupApp(appId, region)
    setBusy(false)
    if (!found.ok) {
      setStatus(i18n.fetchFailedManual)
      return
    }
    applyApp(found.value)
    await applyFetchedPrice(found.value.price, found.value.currency)
  }

  /** FR-ENT-03: read the app's in-app items so one can be picked as this entry. */
  const loadIAPItems = async () => {
    if (appId === '') {
      setStatus(i18n.selectAppFirst)
      return
    }
    setBusy(true)
    setStatus('')
    const found = await fetchIAP(appId, region)
    setBusy(false)
    if (!found.ok) {
      // FR-ENT-05: say so once, then get out of the way.
      setStatus(i18n.fetchFailedManual)
      return
    }
    setIapItems(found.value)
    if (found.value.length === 0) setStatus(i18n.noIAP)
  }

  const chooseIAPItem = async (item: IAPItem) => {
    setTitle(item.name)
    if (item.price != null) {
      await applyFetchedPrice(item.price, account?.currency ?? effectiveCurrency)
    }
    setIapItems(null)
  }

  const handleSave = () => {
    const entry: Entry = {
      id,
      kind,
      appId,
      accountId,
      title: title.trim(),
      price: parsedPrice ?? 0,
      currency: effectiveCurrency,
      priceSource,
      purchasedAt: kind === 'subscription' ? existing?.purchasedAt : purchasedAt,
      cycle: kind === 'subscription' ? cycle : undefined,
      customCycleDays:
        kind === 'subscription' && cycle === 'custom'
          ? Math.max(1, parseAmount(customCycleDays) ?? 30)
          : undefined,
      nextBillingAt: kind === 'subscription' ? nextBillingAt : undefined,
      active: kind === 'subscription' ? active : undefined,
      note: note.trim()
    }
    dismiss({ entry, appRef } as EntryDraft)
  }

  return (
    <NavigationStack>
      <Form
        navigationTitle={editing ? i18n.editEntry : i18n.newEntry}
        navigationBarTitleDisplayMode="inline"
        toolbar={{
          topBarLeading: [<Button title={i18n.cancel} action={() => dismiss()} />],
          topBarTrailing: [
            <Button title={i18n.save} action={handleSave} disabled={!canSave} />
          ]
        }}
      >
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
        </Section>

        <Section
          header={<Text>{i18n.entryApp}</Text>}
          footer={status === '' ? undefined : <Text>{status}</Text>}
        >
          <Button action={pickApp}>
            <HStack spacing={10}>
              {appRef?.iconUrl ? (
                <Image
                  imageUrl={appRef.iconUrl}
                  resizable
                  frame={{ width: 32, height: 32 }}
                  clipShape={{ type: 'rect', cornerRadius: 7 }}
                  placeholder={<ProgressView />}
                />
              ) : (
                <Image systemName="magnifyingglass" foregroundStyle="systemBlue" />
              )}
              <Text foregroundStyle="label" lineLimit={1}>
                {appRef?.name ?? i18n.entryAppPick}
              </Text>
              <Spacer />
              {busy ? <ProgressView /> : null}
            </HStack>
          </Button>

          {appId !== '' && kind === 'purchase' ? (
            <Button title={i18n.fetchPrice} action={refetchAppPrice} disabled={busy} />
          ) : null}
          {appId !== '' && kind !== 'purchase' ? (
            <Button title={i18n.pickIAPItem} action={loadIAPItems} disabled={busy} />
          ) : null}

          {iapItems != null
            ? iapItems.map((item, index) => (
                <Button
                  key={`${index}-${item.name}`}
                  action={() => chooseIAPItem(item)}
                >
                  <HStack>
                    <Text foregroundStyle="label" lineLimit={1}>
                      {item.name}
                    </Text>
                    <Spacer />
                    <Text foregroundStyle="secondaryLabel">{item.priceText}</Text>
                  </HStack>
                </Button>
              ))
            : null}
        </Section>

        <Section header={<Text>{i18n.entryTitle}</Text>}>
          <TextField
            title={i18n.entryTitle}
            prompt={
              kind === 'purchase'
                ? i18n.entryTitlePromptPurchase
                : i18n.entryTitlePromptIAP
            }
            value={title}
            onChanged={setTitle}
          />
        </Section>

        <Section header={<Text>{i18n.entryAccount}</Text>}>
          <Picker
            title={i18n.entryAccount}
            value={accountId}
            onChanged={(value: string) => {
              setAccountId(value)
              // Following the account is the documented default (FR-SUB-02);
              // an explicitly chosen currency is left alone.
              if (priceSource !== 'manual' || currency === '') setCurrency('')
            }}
          >
            {accounts.map((item) => (
              <Text key={item.id} tag={item.id}>
                {`${regionFor(item.region).flag} ${item.alias}`}
              </Text>
            ))}
          </Picker>
        </Section>

        <Section
          header={<Text>{i18n.entryPrice}</Text>}
          footer={
            <Text>
              {priceSource === 'fetched'
                ? i18n.priceSourceFetched
                : i18n.priceSourceManual}
            </Text>
          }
        >
          <AmountField
            title={i18n.entryPrice}
            currency={effectiveCurrency}
            value={price}
            onChanged={editPrice}
            invalid={priceInvalid}
          />
        </Section>

        {kind === 'subscription' ? (
          <Section
            header={<Text>{i18n.kindSubscription}</Text>}
            footer={<Text>{i18n.entryPausedNote}</Text>}
          >
            <Picker
              title={i18n.entryCycle}
              value={cycle}
              onChanged={(value: string) => setCycle(value as BillingCycle)}
            >
              {CYCLES.map((value) => (
                <Text key={value} tag={value}>
                  {cycleLabel(value)}
                </Text>
              ))}
            </Picker>
            {cycle === 'custom' ? (
              <HStack>
                <Text>{i18n.cycleCustomDays}</Text>
                <Spacer />
                <TextField
                  title={i18n.cycleCustomDays}
                  labelsHidden
                  prompt="30"
                  value={customCycleDays}
                  onChanged={setCustomCycleDays}
                  keyboardType="numberPad"
                  multilineTextAlignment="trailing"
                  frame={{ maxWidth: 80 }}
                />
              </HStack>
            ) : null}
            <DatePicker
              title={i18n.entryNextBilling}
              value={nextBillingAt}
              onChanged={setNextBillingAt}
              displayedComponents={['date']}
            />
            <Toggle
              title={i18n.entryActive}
              value={active}
              onChanged={setActive}
            />
          </Section>
        ) : (
          <Section>
            <DatePicker
              title={i18n.entryPurchasedAt}
              value={purchasedAt}
              onChanged={setPurchasedAt}
              displayedComponents={['date']}
            />
          </Section>
        )}

        <Section header={<Text>{i18n.accountNote}</Text>}>
          <TextField
            title={i18n.accountNote}
            prompt={i18n.optional}
            value={note}
            onChanged={setNote}
            axis="vertical"
          />
        </Section>
      </Form>
    </NavigationStack>
  )
}

export function kindLabel(kind: EntryKind): string {
  return kind === 'purchase'
    ? i18n.kindPurchase
    : kind === 'iap'
      ? i18n.kindIAP
      : i18n.kindSubscription
}

export function cycleLabel(cycle: BillingCycle): string {
  switch (cycle) {
    case 'monthly':
      return i18n.cycleMonthly
    case 'quarterly':
      return i18n.cycleQuarterly
    case 'yearly':
      return i18n.cycleYearly
    default:
      return i18n.cycleCustom
  }
}
