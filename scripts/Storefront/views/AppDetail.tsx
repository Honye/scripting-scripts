import {
  Button,
  DisclosureGroup,
  HStack,
  Image,
  List,
  Navigation,
  ProgressView,
  Section,
  Spacer,
  Text,
  Toggle,
  VStack,
  useEffect,
  useRef,
  useState
} from 'scripting'
import { i18n } from '../i18n'
import { formatApprox, formatMoney } from '../format'
import { REGIONS, regionFor, regionName } from '../regions'
import { lookupApp } from '../api/itunes'
import { fetchIAP } from '../api/appstore'
import { convert, defaultFxBase, fetchRates } from '../api/fx'
import { loadFxBase, loadIapAuto, saveFxBase, saveIapAuto } from '../store'
import { CurrencyPicker } from '../components/CurrencyPicker'
import type { AppInfo } from '../api/itunes'
import type { IAPItem } from '../api/appstore'
import type { Rates } from '../api/fx'

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
 * Parallel lookups. Measured: all storefronts at 6 concurrent requests come back
 * in ~13s without throttling; one at a time takes over a minute.
 */
const CONCURRENCY = 6

/** Product pages are ~700KB each; two at a time keeps memory and the radio calm. */
const IAP_CONCURRENCY = 2

/**
 * Cross-storefront price comparison (FR-ENT-08, FR-ENT-10), over every
 * storefront.
 *
 * Two different costs, so two different loading strategies:
 *
 *  - The iTunes lookup is a small JSON document, so every storefront is fetched
 *    up front through a small worker pool.
 *  - In-app prices require the full product page — 670–780KB each (NFR-07) —
 *    so they queue behind the lookups, two at a time. Pinned storefronts always
 *    auto-load; the rest only while the user's "auto-load" switch is on (there
 *    is no API to tell Wi-Fi from cellular, so the user decides).
 *
 * Each storefront's own price stays the primary figure. The `≈` line below it is
 * a display-only conversion into the user's chosen base currency; it is what
 * orders the list, and nothing else. In-app prices get the same `≈` line when
 * `parsePriceText` could read Apple's localized string; when it could not, the
 * string is shown alone rather than guessed at.
 */
export function AppDetail({
  appId,
  pinnedRegions,
  accountRegions
}: {
  appId: string
  /** Shown first, in this order: the search storefront and account storefronts. */
  pinnedRegions: string[]
  /** Marked in the header so the user can tell where they can actually buy. */
  accountRegions: string[]
}) {
  const [rows, setRows] = useState<RegionState[]>(() => {
    const known = new Set(REGIONS.map((r) => r.code))
    const pinned = pinnedRegions.filter((code) => known.has(code))
    const rest = REGIONS.map((r) => r.code).filter((code) => !pinned.includes(code))
    return [...pinned, ...rest].map((region) => ({
      region,
      info: { state: 'loading' }
    }))
  })
  const [base, setBase] = useState(() => loadFxBase() ?? defaultFxBase())
  const [rates, setRates] = useState<Loading<Rates>>({ state: 'loading' })
  const baseRef = useRef(base)
  const [autoIAP, setAutoIAP] = useState(() => loadIapAuto())
  const aliveRef = useRef(true)
  /** Regions waiting for an IAP fetch, and every region ever put in that line. */
  const iapQueue = useRef<string[]>([])
  const iapQueued = useRef(new Set<string>())
  const iapActive = useRef(0)

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
    let alive = true
    const queue = rows.map((row) => row.region)
    // Stop pulling from the queue once the sheet is gone; in-flight requests
    // finish on their own.
    const worker = async () => {
      while (alive && queue.length > 0) await loadInfo(queue.shift()!)
    }
    Promise.all(Array.from({ length: CONCURRENCY }, worker))
    return () => {
      alive = false
    }
  }, [])

  const loadRates = async (currency: string) => {
    setRates({ state: 'loading' })
    const result = await fetchRates(currency)
    // A slow answer for a base the user has already moved away from is stale.
    if (baseRef.current !== currency) return
    setRates(
      result.ok
        ? { state: 'ok', value: result.value }
        : { state: 'failed', reason: result.reason }
    )
  }

  useEffect(() => {
    baseRef.current = base
    loadRates(base)
  }, [base])

  const pickBase = async () => {
    const picked = await Navigation.present<string | undefined>({
      element: <CurrencyPicker selected={base} />
    })
    if (picked == null || picked === base) return
    saveFxBase(picked)
    setBase(picked)
  }

  const loadIAP = async (region: string) => {
    patch(region, { iap: { state: 'loading' } })
    const result = await fetchIAP(appId, region)
    patch(region, {
      iap: result.ok
        ? { state: 'ok', value: result.value }
        : { state: 'failed', reason: result.reason }
    })
  }

  const pumpIAP = () => {
    while (
      aliveRef.current &&
      iapActive.current < IAP_CONCURRENCY &&
      iapQueue.current.length > 0
    ) {
      const region = iapQueue.current.shift()!
      iapActive.current += 1
      loadIAP(region).finally(() => {
        iapActive.current -= 1
        pumpIAP()
      })
    }
  }

  useEffect(
    () => () => {
      aliveRef.current = false
    },
    []
  )

  // Rows arrive one lookup at a time, so re-scan on every change and queue each
  // storefront that carries the app the moment its lookup succeeds.
  useEffect(() => {
    if (!autoIAP) {
      // Switched off: drop what has not started yet so those rows fall back to
      // the manual button, and can be queued again if switched back on.
      iapQueue.current = iapQueue.current.filter((region) => {
        if (pinnedRegions.includes(region)) return true
        iapQueued.current.delete(region)
        return false
      })
    }
    for (const row of rows) {
      if (row.info.state !== 'ok' || row.iap != null) continue
      if (iapQueued.current.has(row.region)) continue
      if (!autoIAP && !pinnedRegions.includes(row.region)) continue
      iapQueued.current.add(row.region)
      iapQueue.current.push(row.region)
    }
    pumpIAP()
  }, [rows, autoIAP])

  /** A manual tap (or retry) jumps the line instead of fetching the page twice. */
  const requestIAP = (region: string) => {
    iapQueued.current.add(region)
    iapQueue.current = iapQueue.current.filter((r) => r !== region)
    loadIAP(region)
  }

  const toggleAutoIAP = (value: boolean) => {
    saveIapAuto(value)
    setAutoIAP(value)
  }

  // `presentApp` rejects when a modal is already open — a stray tap must not
  // become an unhandled rejection.
  const openInAppStore = async () => {
    try {
      await AppStore.presentApp(appId)
    } catch {
      // Already showing; nothing useful to say.
    }
  }

  const approxOf = (row: RegionState): number | null =>
    row.info.state === 'ok' && row.info.value.price > 0 && rates.state === 'ok'
      ? convert(row.info.value.price, row.info.value.currency, rates.value)
      : null

  // Any storefront that answered can name the app; they all describe the same one.
  const known = rows.find((row) => row.info.state === 'ok')
  const app = known?.info.state === 'ok' ? known.info.value : null

  const pinned = new Set(pinnedRegions)
  const accounts = new Set(accountRegions)
  const done = rows.filter((row) => row.info.state !== 'loading').length
  const others = rows.filter((row) => !pinned.has(row.region))

  // Free first (0), then cheapest converted, then whatever could not be
  // converted; ties by name so the order is stable while rows arrive.
  const sortKey = (row: RegionState) =>
    row.info.state === 'ok' && row.info.value.price === 0
      ? 0
      : (approxOf(row) ?? Number.POSITIVE_INFINITY)
  const available = others
    .filter((row) => row.info.state === 'ok')
    .sort(
      (a, b) =>
        sortKey(a) - sortKey(b) ||
        regionName(regionFor(a.region)).localeCompare(regionName(regionFor(b.region)))
    )
  const failed = others.filter(
    (row) => row.info.state === 'failed' && row.info.reason !== 'notfound'
  )
  const unavailable = others.filter(
    (row) => row.info.state === 'failed' && row.info.reason === 'notfound'
  )

  const section = (row: RegionState) => (
    <RegionSection
      key={row.region}
      row={row}
      isAccount={accounts.has(row.region)}
      base={base}
      rates={rates.state === 'ok' ? rates.value : null}
      approx={approxOf(row)}
      onRetry={() => loadInfo(row.region)}
      onLoadIAP={() => requestIAP(row.region)}
    />
  )

  return (
    <List navigationTitle={app?.name ?? appId} navigationBarTitleDisplayMode="inline">
      <Section
        footer={
          <Text>
            {(rates.state === 'ok' ? i18n.fxRatesFrom(rates.value.date) + '\n\n' : '') +
              i18n.iapAutoLoadNote}
          </Text>
        }
      >
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
        <Button action={pickBase}>
          <HStack>
            <Image systemName="dollarsign.arrow.circlepath" />
            <Text foregroundStyle="label">{i18n.fxBase}</Text>
            <Spacer />
            {rates.state === 'loading' ? <ProgressView /> : null}
            <Text foregroundStyle="secondaryLabel">{base}</Text>
          </HStack>
        </Button>
        <Toggle title={i18n.iapAutoLoad} value={autoIAP} onChanged={toggleAutoIAP} />
        {rates.state === 'failed' ? (
          <HStack>
            <Text foregroundStyle="secondaryLabel">{i18n.fxUnavailable}</Text>
            <Spacer />
            <Button title={i18n.retry} action={() => loadRates(base)} />
          </HStack>
        ) : null}
      </Section>

      {done < rows.length ? (
        <Section>
          <HStack>
            <ProgressView />
            <Text foregroundStyle="secondaryLabel">
              {i18n.loadedCount(done, rows.length)}
            </Text>
            <Spacer />
          </HStack>
        </Section>
      ) : null}

      {rows.filter((row) => pinned.has(row.region)).map(section)}
      {available.map(section)}
      {failed.map(section)}

      {unavailable.length > 0 ? (
        <Section>
          <DisclosureGroup title={i18n.notAvailableIn(unavailable.length)}>
            <Text font="caption" foregroundStyle="secondaryLabel">
              {unavailable
                .map((row) => {
                  const region = regionFor(row.region)
                  return `${region.flag} ${regionName(region)}`
                })
                .join('   ')}
            </Text>
          </DisclosureGroup>
        </Section>
      ) : null}
    </List>
  )
}

function RegionSection({
  row,
  isAccount,
  base,
  rates,
  approx,
  onRetry,
  onLoadIAP
}: {
  row: RegionState
  isAccount: boolean
  base: string
  rates: Rates | null
  approx: number | null
  onRetry: () => void
  onLoadIAP: () => void
}) {
  const region = regionFor(row.region)

  return (
    <Section
      header={
        <HStack>
          <Text>{region.flag}</Text>
          <Text>{regionName(region)}</Text>
          {isAccount ? <Image systemName="person.crop.circle" /> : null}
          <Spacer />
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
          <VStack alignment="trailing" spacing={2}>
            <Text fontWeight="semibold">
              {row.info.value.price === 0
                ? (row.info.value.formattedPrice ?? i18n.freePrice)
                : formatMoney(row.info.value.price, row.info.value.currency)}
            </Text>
            {approx != null && row.info.value.currency !== base ? (
              <Text font="caption" foregroundStyle="secondaryLabel">
                {formatApprox(approx, base)}
              </Text>
            ) : null}
          </VStack>
        </HStack>
      )}

      {row.info.state === 'ok' ? (
        <IAPRows
          iap={row.iap}
          currency={row.info.value.currency}
          base={base}
          rates={rates}
          onLoad={onLoadIAP}
        />
      ) : null}
    </Section>
  )
}

function IAPRows({
  iap,
  currency,
  base,
  rates,
  onLoad
}: {
  iap: Loading<IAPItem[]> | undefined
  /** The storefront's currency — every in-app price on its page is in it. */
  currency: string
  base: string
  rates: Rates | null
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
      {iap.value.map((item, index) => {
        const approx =
          rates != null && item.price != null && item.price > 0 && currency !== base
            ? convert(item.price, currency, rates)
            : null
        return (
          <HStack key={`${index}-${item.name}`}>
            <Text lineLimit={1}>{item.name}</Text>
            <Spacer />
            <VStack alignment="trailing" spacing={2}>
              {/* Apple's own formatted string: it already carries the correct
                  symbol and separators for this storefront. */}
              <Text foregroundStyle="secondaryLabel">{item.priceText}</Text>
              {approx != null ? (
                <Text font="caption" foregroundStyle="tertiaryLabel">
                  {formatApprox(approx, base)}
                </Text>
              ) : null}
            </VStack>
          </HStack>
        )
      })}
    </>
  )
}
