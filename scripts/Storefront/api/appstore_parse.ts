/**
 * In-app purchase prices, scraped from the App Store product page. This is the
 * only source that has them: the iTunes Lookup API exposes no IAP fields at all.
 *
 * FR-ENT-04 makes the extraction rule mandatory, and it is worth restating why.
 * The section is titled "In-App Purchases" in the US and "App内购买" in China —
 * no space, not a translation you would guess — so **matching on the title text
 * is forbidden**. The structural markers (`$kind === 'textPair'`, and the legacy
 * `textPairs` tuple form) are identical across storefronts and are what we match.
 *
 * NFR-07: these pages are 670–780KB. Nothing here keeps a reference to the HTML
 * once the embedded JSON has been parsed.
 */
export type IAPItem = {
  name: string
  /** Apple's own formatted string, kept verbatim for display. */
  priceText: string
  /** Parsed amount, or null when the text could not be read as a number. */
  price: number | null
}

/** Desktop UA: the mobile page omits the information shelf entirely. */
export const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15'

const SCRIPT_RE =
  /<script[^>]*id="serialized-server-data"[^>]*>([\s\S]*?)<\/script>/

/**
 * Accepts a bare numeric id, an `id123456789` fragment, or any App Store URL —
 * with or without the localized slug, with or without a query string.
 *
 * The path form is tried first and anchored to a `/id…` segment. App slugs are
 * the app's own name and can contain anything, `id2048` included, so a loose
 * scan would happily return a number out of the title instead of the real id.
 */
export function parseAppId(input: string): string | null {
  const trimmed = input.trim()
  if (/^\d{6,}$/.test(trimmed)) return trimmed

  const path = trimmed.match(/\/id(\d{6,})(?:[/?#]|$)/)
  if (path != null) return path[1]

  const loose = trimmed.match(/\bid(\d{6,})\b/)
  return loose != null ? loose[1] : null
}

/** The region segment of an App Store URL, when it has one. */
export function parseAppRegion(input: string): string | null {
  const match = input.trim().match(/^https?:\/\/apps\.apple\.com\/([a-z]{2})\//i)
  return match != null ? match[1].toLowerCase() : null
}

/**
 * Compact-notation magnitude words, and the one storefront that uses them.
 *
 * Indonesia writes prices short: "Rp 349ribu" is 349 thousand, "Rp 1,889juta"
 * is 1.889 million. Read literally those are 349 and 1.889 — three orders of
 * magnitude out, which in a price comparison means Indonesia looks like the
 * cheapest storefront on earth.
 *
 * Scanned across all 171 storefronts (ChatGPT, which carries items from ~$8 to
 * ~$500): Indonesia is the only one. Everything else that looked suspicious was
 * a trailing currency word — "499,00 Kč", "179,00 kr", "99,99 zł", "2 599,99
 * lei", "132.000đ" — which the separator rule below already reads correctly.
 * So this table stays deliberately short rather than guessing at CLDR at large.
 *
 * The keys must not collide with anything that can sit against a number in some
 * other storefront. That is why the single-letter forms are left out: Malaysia
 * writes "RM 89.90", so treating a bare `M` as "million" would be catastrophic
 * exactly where it is hardest to notice.
 */
const MAGNITUDES: [RegExp, number][] = [
  [/(\d)[\s\u00A0]*(?:ribu|rb)\b/iu, 1e3],
  [/(\d)[\s\u00A0]*(?:juta|jt)\b/iu, 1e6]
]

/**
 * Reads a localized price string into a number.
 *
 * Separators are the whole problem: "$2.99" is two decimals, "Rp 39.000" is
 * thirty-nine thousand, and "€1.234,56" uses both marks in the opposite roles.
 * The rule that covers all three: whichever separator appears last is the
 * decimal mark, and then only if exactly two digits follow it.
 *
 * Compact notation needs the opposite rule, which is why it is handled apart:
 * "Rp 1,889juta" has no grouping to disambiguate, so its single separator is a
 * decimal mark however many digits trail it. Applying the general rule there
 * would read 1889 and multiply it to 1.889 **billion**.
 */
export function parsePriceText(text: string): number | null {
  let multiplier = 1
  for (const [pattern, scale] of MAGNITUDES) {
    if (pattern.test(text)) {
      multiplier = scale
      break
    }
  }

  const digits = text.replace(/[^\d.,]/g, '')
  if (digits === '') return null

  const lastDot = digits.lastIndexOf('.')
  const lastComma = digits.lastIndexOf(',')
  const cut = Math.max(lastDot, lastComma)

  let normalized: string
  if (cut >= 0 && (multiplier > 1 || digits.length - cut - 1 === 2)) {
    normalized =
      digits.slice(0, cut).replace(/[.,]/g, '') + '.' + digits.slice(cut + 1)
  } else {
    normalized = digits.replace(/[.,]/g, '')
  }

  const value = Number(normalized) * multiplier
  return isFinite(value) ? value : null
}

/**
 * Collects both structural encodings Apple currently ships side by side, so the
 * parser survives either one being dropped.
 */
function collectPairs(node: unknown, out: [string, string][]) {
  if (node == null || typeof node !== 'object') return

  if (Array.isArray(node)) {
    for (const child of node) collectPairs(child, out)
    return
  }

  const record = node as Record<string, unknown>

  if (
    record.$kind === 'textPair' &&
    typeof record.leadingText === 'string' &&
    typeof record.trailingText === 'string'
  ) {
    out.push([record.leadingText, record.trailingText])
  }

  if (Array.isArray(record.textPairs)) {
    for (const pair of record.textPairs) {
      if (
        Array.isArray(pair) &&
        typeof pair[0] === 'string' &&
        typeof pair[1] === 'string'
      ) {
        out.push([pair[0], pair[1]])
      }
    }
  }

  for (const value of Object.values(record)) collectPairs(value, out)
}

/** Exported so the parse can be exercised against a saved page without network. */
export function parseIAP(html: string): IAPItem[] {
  const match = html.match(SCRIPT_RE)
  if (match == null) return []

  let root: unknown
  try {
    root = JSON.parse(match[1])
  } catch {
    return []
  }

  // Narrow to the information shelf when it is where we expect it — walking a
  // 500KB object graph is avoidable work — and fall back to the whole tree only
  // if Apple has moved it.
  const shelf = (root as any)?.data?.[0]?.data?.shelfMapping?.information?.items
  const pairs: [string, string][] = []
  collectPairs(shelf ?? root, pairs)

  // A name can genuinely appear twice: every one of the 165 storefronts that
  // carries ChatGPT lists "ChatGPT Plus" at both its real price and a tier
  // roughly ten times higher (AED 79.99 / AED 799.99, £19.99 / £200.00), and
  // the shelf carries nothing but the name and the price to tell them apart.
  //
  // Keeping whichever came first — what this did before — is not a rule, it is
  // Apple's per-storefront popularity ordering: the real £19.99 comes first in
  // the UK and the inflated R$ 999,90 comes first in Brazil. Comparing those
  // two storefronts then compares different products.
  //
  // The lowest wins instead. It is a choice, not a certainty about which SKU is
  // which — but it is the same choice in every storefront, which is the property
  // a cross-storefront comparison actually needs.
  const byName = new Map<string, IAPItem>()
  for (const [name, priceText] of pairs) {
    const item: IAPItem = { name, priceText, price: parsePriceText(priceText) }
    const kept = byName.get(name)
    if (kept == null) {
      byName.set(name, item)
      continue
    }
    // An unreadable price cannot win, and cannot lose to one either.
    if (item.price != null && (kept.price == null || item.price < kept.price)) {
      byName.set(name, item)
    }
  }
  return Array.from(byName.values())
}
