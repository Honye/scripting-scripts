import { convert } from './api/fx_parse'
import type { Rates } from './api/fx_parse'
import type { IAPItem } from './api/appstore_parse'

/**
 * Cheapest and dearest storefront, over whatever the comparison screen has
 * loaded so far.
 *
 * The screen already sorts by converted price, but the two answers are still
 * not on screen: pinned storefronts are listed first and left out of that sort,
 * so the top row is usually not the cheapest, and the dearest is at the bottom
 * of 171 rows.
 *
 * Pure on purpose — no `scripting` import anywhere in this file's graph — so
 * the ranking rules can be exercised in Node. `fx.ts` was split into
 * `fx_parse.ts` for the same reason.
 */

/** What the comparison screen knows about one storefront, cut down to what ranking needs. */
export type PriceRow = {
  region: string
  price: number
  currency: string
  /** Apple's own formatted string, when it gave one. */
  formattedPrice?: string
  /** Undefined when in-app prices were never loaded — not the same as loaded-and-empty. */
  iap?: IAPItem[]
}

export type Extreme = {
  region: string
  /** The storefront's own figure. This stays the fact. */
  price: number
  currency: string
  formattedPrice?: string
  /** Converted into the base currency; this is what the ranking compared. */
  approx: number
}

export type Range = {
  low: Extreme
  high: Extreme
  /** Storefronts that could actually be ranked — fewer than those loaded. */
  sampled: number
}

type Sample = Extreme

/**
 * Ranks samples and refuses to invent a range out of nothing.
 *
 * Fewer than two storefronts is not a range, and neither is one price repeated:
 * an app that costs the same everywhere (every free app, for a start) has
 * nothing to compare, and a section saying "lowest: $0, highest: $0" would be
 * noise dressed up as a finding.
 */
function rangeOf(samples: Sample[]): Range | null {
  if (samples.length < 2) return null

  let low = samples[0]
  let high = samples[0]
  for (const sample of samples) {
    if (sample.approx < low.approx) low = sample
    if (sample.approx > high.approx) high = sample
  }

  return low.approx === high.approx ? null : { low, high, sampled: samples.length }
}

/**
 * Store prices.
 *
 * A storefront whose currency has no rate (`MRU`, `VUV` and friends are simply
 * absent from Frankfurter) is dropped rather than guessed at. Price 0 is kept:
 * an app that is free in one storefront and paid in the rest is exactly the
 * finding this is here to surface.
 */
export function storeRange(rows: PriceRow[], rates: Rates): Range | null {
  const samples: Sample[] = []
  for (const row of rows) {
    const approx = convert(row.price, row.currency, rates)
    if (approx == null) continue
    samples.push({
      region: row.region,
      price: row.price,
      currency: row.currency,
      formattedPrice: row.formattedPrice,
      approx
    })
  }
  return rangeOf(samples)
}

export type IAPRange = {
  /** The item name, matched verbatim across storefronts. */
  name: string
  range: Range
}

export type IAPComparison = {
  /** Storefronts that contributed at least one ranked in-app price. */
  sampled: number
  items: IAPRange[]
}

/**
 * In-app prices, grouped across storefronts by **exact item name**.
 *
 * The name is the only real key available, and in practice it is a good one:
 * most developers ship one name for every storefront. ChatGPT, for instance,
 * is "ChatGPT Plus" / "ChatGPT Go" / "ChatGPT Pro 100" verbatim in the US,
 * Turkey and Japan.
 *
 * What differs is the *set* of items: the US carries eight (three credit packs
 * among them), Turkey and Japan five. That is also why position is not a key —
 * slot 3 is "100 Credits" ($4.00) in the US and "ChatGPT Pro 200" (₺9,999.99)
 * in Turkey, so pairing by position would have compared a credit pack against
 * a subscription and reported it as a price range.
 *
 * The cost of using the name is that a developer who *does* translate it per
 * storefront (Bear's "Monthly Pro subscription" is "Pro 按月订阅" in China)
 * splits into groups that no longer meet. So an item's range can cover far
 * fewer storefronts than the app is sold in, and every item therefore carries
 * its own `sampled` count — the caller has to show it.
 */
export function iapRanges(
  rows: PriceRow[],
  rates: Rates,
  /** Storefronts whose item order to list in, best first — normally the pinned ones. */
  preferredOrder: string[] = []
): IAPComparison | null {
  const withIAP = rows.filter((row) => row.iap != null && row.iap.length > 0)
  if (withIAP.length < 2) return null

  const byName = new Map<string, Sample[]>()
  for (const row of withIAP) {
    for (const item of row.iap!) {
      // `parsePriceText` already returns null for a string it could not read;
      // a sample we cannot rank is left out rather than treated as zero.
      if (item.price == null) continue
      const approx = convert(item.price, row.currency, rates)
      if (approx == null) continue
      const samples = byName.get(item.name)
      const sample: Sample = {
        region: row.region,
        price: item.price,
        currency: row.currency,
        formattedPrice: item.priceText,
        approx
      }
      if (samples == null) byName.set(item.name, [sample])
      else samples.push(sample)
    }
  }

  // Listed in the order the user's own storefront lists them, so the item they
  // came to look at is near the top; names that storefront does not carry fall
  // in behind, widest coverage first.
  const lead = preferredOrder
    .map((region) => withIAP.find((row) => row.region === region))
    .find((row) => row != null)
  const leadOrder = new Map(
    (lead?.iap ?? []).map((item, index) => [item.name, index] as const)
  )

  const kept: { item: IAPRange; samples: Sample[] }[] = []
  for (const [name, samples] of byName) {
    const range = rangeOf(samples)
    if (range != null) kept.push({ item: { name, range }, samples })
  }
  if (kept.length === 0) return null

  kept.sort((a, b) => {
    const ai = leadOrder.get(a.item.name) ?? Number.POSITIVE_INFINITY
    const bi = leadOrder.get(b.item.name) ?? Number.POSITIVE_INFINITY
    return (
      ai - bi ||
      b.item.range.sampled - a.item.range.sampled ||
      a.item.name.localeCompare(b.item.name)
    )
  })

  const contributing = new Set<string>()
  for (const entry of kept) {
    for (const sample of entry.samples) contributing.add(sample.region)
  }

  return { sampled: contributing.size, items: kept.map((entry) => entry.item) }
}
