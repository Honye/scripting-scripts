import {
  Button,
  HStack,
  Image,
  List,
  Navigation,
  ProgressView,
  Section,
  Spacer,
  Text,
  VStack,
  useEffect,
  useState
} from 'scripting'
import { i18n } from '../i18n'
import { formatMoney } from '../format'
import { DEFAULT_REGION, regionFor, regionName } from '../regions'
import { lookupApp } from '../api/itunes'
import { fetchIAP } from '../api/appstore'
import { RegionPicker } from '../components/RegionPicker'
import type { AppInfo } from '../api/itunes'
import type { IAPItem } from '../api/appstore'
import type { Region } from '../regions'

type Loading<T> =
  | { state: 'loading' }
  | { state: 'ok'; value: T }
  | { state: 'failed'; reason: string }

type RegionState = {
  region: string
  info: Loading<AppInfo>
  /** Undefined until the user asks for it — see the note on page weight below. */
  iap?: Loading<IAPItem[]>
}

/**
 * Cross-storefront price comparison (FR-ENT-08, FR-ENT-10).
 *
 * Two different costs, so two different loading strategies:
 *
 *  - The iTunes lookup is a small JSON document, so every storefront is fetched
 *    up front, one after another.
 *  - In-app prices require the full product page — 670–780KB each (NFR-07) —
 *    so they are fetched only for the storefront the user actually asks about,
 *    never speculatively and never in parallel.
 *
 * Prices are always displayed in each storefront's own currency. There is no
 * conversion anywhere in this file, and that is a product decision (FR-SUB-04),
 * not a missing feature: an exchange rate we cannot keep fresh would turn a
 * factual comparison into a misleading one.
 */
export function AppDetail({
  appId,
  initialRegions
}: {
  appId: string
  initialRegions: string[]
}) {
  const [rows, setRows] = useState<RegionState[]>(() =>
    (initialRegions.length > 0 ? initialRegions : [DEFAULT_REGION]).map(
      (region) => ({ region, info: { state: 'loading' } })
    )
  )

  const patch = (region: string, change: Partial<RegionState>) =>
    setRows((prev) =>
      prev.map((row) => (row.region === region ? { ...row, ...change } : row))
    )

  const loadInfo = async (region: string) => {
    patch(region, { info: { state: 'loading' } })
    const result = await lookupApp(appId, region)
    patch(region, {
      info: result.ok
        ? { state: 'ok', value: result.value }
        : { state: 'failed', reason: result.reason }
    })
  }

  useEffect(() => {
    // Sequential on purpose: a handful of storefronts firing at once on a phone
    // network is how you get spurious timeouts.
    const run = async () => {
      for (const row of rows) await loadInfo(row.region)
    }
    run()
  }, [])

  const loadIAP = async (region: string) => {
    patch(region, { iap: { state: 'loading' } })
    const result = await fetchIAP(appId, region)
    patch(region, {
      iap: result.ok
        ? { state: 'ok', value: result.value }
        : { state: 'failed', reason: result.reason }
    })
  }

  const addRegion = async () => {
    const picked = await Navigation.present<Region | undefined>({
      element: <RegionPicker selected="" />
    })
    if (picked == null) return
    if (rows.some((row) => row.region === picked.code)) return
    setRows((prev) => [...prev, { region: picked.code, info: { state: 'loading' } }])
    loadInfo(picked.code)
  }

  const removeRegion = (region: string) =>
    setRows((prev) => prev.filter((row) => row.region !== region))

  // `presentApp` rejects when a modal is already open — a stray tap must not
  // become an unhandled rejection.
  const openInAppStore = async () => {
    try {
      await AppStore.presentApp(appId)
    } catch {
      // Already showing; nothing useful to say.
    }
  }

  // Any storefront that answered can name the app; they all describe the same one.
  const known = rows.find((row) => row.info.state === 'ok')
  const app = known?.info.state === 'ok' ? known.info.value : null

  return (
    <List navigationTitle={app?.name ?? appId} navigationBarTitleDisplayMode="inline">
      <Section>
        <HStack spacing={12}>
          {app?.iconUrl ? (
            <Image
              imageUrl={app.iconUrl}
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
            />
          )}
          <VStack alignment="leading" spacing={3}>
            <Text fontWeight="semibold" lineLimit={2}>
              {app?.name ?? appId}
            </Text>
            {app?.sellerName ? (
              <Text font="caption" foregroundStyle="secondaryLabel" lineLimit={1}>
                {app.sellerName}
              </Text>
            ) : null}
            <Text font="caption2" foregroundStyle="tertiaryLabel">
              {appId}
            </Text>
          </VStack>
          <Spacer />
        </HStack>
        <Button action={openInAppStore}>
          <HStack>
            <Image systemName="arrow.up.forward.app" />
            <Text foregroundStyle="label">{i18n.openInAppStore}</Text>
            <Spacer />
          </HStack>
        </Button>
      </Section>

      {rows.map((row) => (
        <RegionSection
          key={row.region}
          row={row}
          canRemove={rows.length > 1}
          onRetry={() => loadInfo(row.region)}
          onLoadIAP={() => loadIAP(row.region)}
          onRemove={() => removeRegion(row.region)}
        />
      ))}

      <Section footer={<Text>{i18n.compareNoConversion}</Text>}>
        <Button action={addRegion}>
          <HStack>
            <Image systemName="plus.circle" />
            <Text foregroundStyle="label">{i18n.addRegion}</Text>
            <Spacer />
          </HStack>
        </Button>
      </Section>
    </List>
  )
}

function RegionSection({
  row,
  canRemove,
  onRetry,
  onLoadIAP,
  onRemove
}: {
  row: RegionState
  canRemove: boolean
  onRetry: () => void
  onLoadIAP: () => void
  onRemove: () => void
}) {
  const region = regionFor(row.region)

  return (
    <Section
      header={
        <HStack>
          <Text>{region.flag}</Text>
          <Text>{regionName(region)}</Text>
          <Spacer />
          {canRemove ? (
            <Button title={i18n.removeRegion} action={onRemove} />
          ) : null}
        </HStack>
      }
    >
      {row.info.state === 'loading' ? (
        <ProgressView />
      ) : row.info.state === 'failed' ? (
        <HStack>
          <Text foregroundStyle="secondaryLabel">
            {i18n.fetchError(row.info.reason)}
          </Text>
          <Spacer />
          <Button title={i18n.retry} action={onRetry} />
        </HStack>
      ) : (
        <HStack>
          <Text>{i18n.storePrice}</Text>
          <Spacer />
          <Text fontWeight="semibold">
            {row.info.value.price === 0
              ? (row.info.value.formattedPrice ?? i18n.freePrice)
              : formatMoney(row.info.value.price, row.info.value.currency)}
          </Text>
        </HStack>
      )}

      {row.info.state === 'ok' ? <IAPRows iap={row.iap} onLoad={onLoadIAP} /> : null}
    </Section>
  )
}

function IAPRows({
  iap,
  onLoad
}: {
  iap: Loading<IAPItem[]> | undefined
  onLoad: () => void
}) {
  if (iap == null) {
    return <Button title={i18n.loadIAP} action={onLoad} />
  }
  if (iap.state === 'loading') {
    return (
      <HStack>
        <ProgressView />
        <Text foregroundStyle="secondaryLabel">{i18n.loadingIAP}</Text>
        <Spacer />
      </HStack>
    )
  }
  if (iap.state === 'failed') {
    return (
      <HStack>
        <Text foregroundStyle="secondaryLabel">{i18n.fetchError(iap.reason)}</Text>
        <Spacer />
        <Button title={i18n.retry} action={onLoad} />
      </HStack>
    )
  }
  if (iap.value.length === 0) {
    return <Text foregroundStyle="secondaryLabel">{i18n.noIAP}</Text>
  }
  return (
    <>
      {iap.value.map((item, index) => (
        <HStack key={`${index}-${item.name}`}>
          <Text lineLimit={1}>{item.name}</Text>
          <Spacer />
          {/* Apple's own formatted string: it already carries the correct
              symbol and separators for this storefront. */}
          <Text foregroundStyle="secondaryLabel">{item.priceText}</Text>
        </HStack>
      ))}
    </>
  )
}
