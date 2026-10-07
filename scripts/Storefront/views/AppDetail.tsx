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
import { compareRemote, iapRemote } from '../api/remote'
import { iapRanges, storeRange } from '../price_range'
import { loadApiBase, loadFxBase, loadIapAuto, saveFxBase, saveIapAuto } from '../store'
import { CurrencyPicker } from '../components/CurrencyPicker'
import type { AppInfo } from '../api/itunes'
import type { Result } from '../api/http'
import type { IAPItem } from '../api/appstore'
import type { Rates } from '../api/fx'
import type { Extreme, PriceRow, Range } from '../price_range'

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

/** The wire's `Result` and this screen's `Loading` say the same thing. */
function toLoading<T>(result: Result<T>): Loading<T> {
  return result.ok
    ? { state: 'ok', value: result.value }
    : { state: 'failed', reason: result.reason }
}

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
 * When the user has configured an acceleration endpoint (`workers/storefront-api`),
 * both costs move off the device: one streaming request answers for every
 * storefront and the ~700KB pages are downloaded and parsed at the edge. It is
 * strictly an optimisation — whatever the endpoint does not deliver is fetched
 * here exactly as it would have been, so a missing or broken endpoint changes
 * how long the screen takes and nothing else.
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
  /**
   * Held while the streaming comparison is in flight, so the queue below does
   * not start downloading product pages the endpoint is already fetching. It
   * is released — and `iapEpoch` bumped — the moment that run finishes.
   */
  const remoteBusy = useRef(false)
  const [iapEpoch, setIapEpoch] = useState(0)

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

  /** The original device-side path: a small worker pool over a region list. */
  const runLocalPool = async (regions: string[], alive: () => boolean) => {
    const queue = regions.slice()
    // Stop pulling from the queue once the sheet is gone; in-flight requests
    // finish on their own.
    const worker = async () => {
      while (alive() && queue.length > 0) await loadInfo(queue.shift()!)
    }
    await Promise.all(Array.from({ length: CONCURRENCY }, worker))
  }

  useEffect(() => {
    let alive = true
    const all = rows.map((row) => row.region)

    const run = async () => {
      if (loadApiBase() != null) {
        remoteBusy.current = true
        const left = await compareRemote(appId, {
          regions: all,
          // Same policy as the local queue below, just expressed up front: the
          // endpoint can afford every storefront, but the user still decides
          // whether to make it go and fetch 171 product pages.
          iap: autoIAP ? all : pinnedRegions.filter((code) => all.includes(code)),
          isAlive: () => alive,
          onMessage: (message) => {
            if (message.type === 'region') {
              patch(message.region, { info: toLoading(message.info) })
            } else if (message.type === 'iap') {
              iapQueued.current.add(message.region)
              patch(message.region, { iap: toLoading(message.iap) })
            }
          }
        })
        remoteBusy.current = false
        // Whatever the endpoint did not deliver falls back, and the two kinds
        // fall back differently: a store price is 2–6KB, so the local pool
        // fetches it here; in-app prices are ~700KB each, so they go to the
        // queue below, which asks the endpoint one storefront at a time rather
        // than pulling those pages onto the device.
        setIapEpoch((epoch) => epoch + 1)
        if (!alive) return
        if (left.regions.length > 0) await runLocalPool(left.regions, () => alive)
        return
      }

      await runLocalPool(all, () => alive)
    }

    run()
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
    // The endpoint first when there is one — it is the same answer for a few
    // hundred bytes instead of ~700KB — and the page itself when there is not,
    // or when it did not answer.
    const result = (await iapRemote(appId, region)) ?? (await fetchIAP(appId, region))
    patch(region, { iap: toLoading(result) })
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
      // The streaming comparison already owns these; queueing them here too
      // would fetch every product page twice.
      if (remoteBusy.current) continue
      if (iapQueued.current.has(row.region)) continue
      if (!autoIAP && !pinnedRegions.includes(row.region)) continue
      iapQueued.current.add(row.region)
      iapQueue.current.push(row.region)
    }
    if (!remoteBusy.current) pumpIAP()
  }, [rows, autoIAP, iapEpoch])

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

  // The sorted list below already orders storefronts by converted price, but
  // neither end of it is on screen: pinned storefronts are listed first and
  // left out of that sort, and the dearest is at the bottom of 171 rows.
  //
  // Ranking is cross-currency, so it needs rates; without them there is nothing
  // honest to show, and the header already says the rates are unavailable.
  const priced: PriceRow[] = rows.flatMap((row) =>
    row.info.state === 'ok'
      ? [
          {
            region: row.region,
            price: row.info.value.price,
            currency: row.info.value.currency,
            formattedPrice: row.info.value.formattedPrice,
            iap: row.iap?.state === 'ok' ? row.iap.value : undefined
          }
        ]
      : []
  )
  const store = rates.state === 'ok' ? storeRange(priced, rates.value) : null
  // Pinned first, so the in-app item names come from a storefront the user
  // actually uses rather than whichever one happened to answer first.
  const iapCompared =
    rates.state === 'ok' ? iapRanges(priced, rates.value, pinnedRegions) : null

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

      {store != null || iapCompared != null ? (
        <Section
          header={
            <Text>
              {i18n.priceRangeBasis(store?.sampled ?? iapCompared?.sampled ?? 0)}
            </Text>
          }
          footer={
            iapCompared != null ? <Text>{i18n.iapRangeNote}</Text> : undefined
          }
        >
          {store != null ? <ExtremeRows range={store} base={base} /> : null}
          {iapCompared != null ? (
            <DisclosureGroup
              title={i18n.iapRangeTitle(iapCompared.items.length, iapCompared.sampled)}
            >
              {iapCompared.items.map((item) => (
                <VStack key={item.name} alignment="leading" spacing={6}>
                  <Text font="caption" foregroundStyle="secondaryLabel" lineLimit={2}>
                    {`${item.name} · ${i18n.priceRangeRegions(item.range.sampled)}`}
                  </Text>
                  <ExtremeRows range={item.range} base={base} verbatim />
                </VStack>
              ))}
            </DisclosureGroup>
          ) : null}
        </Section>
      ) : null}

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

/**
 * The two ends of a range, sharing one price block with `RegionSection` so a
 * figure reads the same wherever it appears: the storefront's own formatting is
 * the fact, the `\u2248` line below it is the conversion that did the ranking.
 */
function ExtremeRows({
  range,
  base,
  verbatim = false
}: {
  range: Range
  base: string
  /**
   * In-app prices carry Apple's own formatted string, which already has this
   * storefront's symbol, separators and magnitude words — "Rp 349ribu" is 349
   * thousand rupiah. Re-rendering the parsed number instead both loses the
   * grouping and, before the parser learned those words, printed "Rp 349.00".
   * Store prices have no such string for the paid case, so they keep being
   * formatted from the number.
   */
  verbatim?: boolean
}) {
  return (
    <>
      <ExtremeRow
        label={i18n.priceLowest}
        icon="arrow.down"
        at={range.low}
        base={base}
        verbatim={verbatim}
      />
      <ExtremeRow
        label={i18n.priceHighest}
        icon="arrow.up"
        at={range.high}
        base={base}
        verbatim={verbatim}
      />
    </>
  )
}

function ExtremeRow({
  label,
  icon,
  at,
  base,
  verbatim
}: {
  label: string
  icon: string
  at: Extreme
  base: string
  verbatim: boolean
}) {
  const region = regionFor(at.region)

  return (
    <HStack>
      <Image systemName={icon} font="caption" foregroundStyle="secondaryLabel" />
      <Text font="caption" foregroundStyle="secondaryLabel">
        {label}
      </Text>
      <Text lineLimit={1}>
        {region.flag} {regionName(region)}
      </Text>
      <Spacer />
      <VStack alignment="trailing" spacing={2}>
        <Text fontWeight="semibold">
          {verbatim
            ? (at.formattedPrice ?? formatMoney(at.price, at.currency))
            : at.price === 0
              ? (at.formattedPrice ?? i18n.freePrice)
              : formatMoney(at.price, at.currency)}
        </Text>
        {at.currency !== base ? (
          <Text font="caption" foregroundStyle="secondaryLabel">
            {formatApprox(at.approx, base)}
          </Text>
        ) : null}
      </VStack>
    </HStack>
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
