import { fetchText } from './http'
import type { Result } from './http'

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
const USER_AGENT =
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
 * Reads a localized price string into a number.
 *
 * Separators are the whole problem: "$2.99" is two decimals, "Rp 39.000" is
 * thirty-nine thousand, and "€1.234,56" uses both marks in the opposite roles.
 * The rule that covers all three: whichever separator appears last is the
 * decimal mark, and then only if exactly two digits follow it.
 */
export function parsePriceText(text: string): number | null {
  const digits = text.replace(/[^\d.,]/g, '')
  if (digits === '') return null

  const lastDot = digits.lastIndexOf('.')
  const lastComma = digits.lastIndexOf(',')
  const cut = Math.max(lastDot, lastComma)

  let normalized: string
  if (cut >= 0 && digits.length - cut - 1 === 2) {
    normalized =
      digits.slice(0, cut).replace(/[.,]/g, '') + '.' + digits.slice(cut + 1)
  } else {
    normalized = digits.replace(/[.,]/g, '')
  }

  const value = Number(normalized)
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

  const seen = new Set<string>()
  const items: IAPItem[] = []
  for (const [name, priceText] of pairs) {
    if (seen.has(name)) continue
    seen.add(name)
    items.push({ name, priceText, price: parsePriceText(priceText) })
  }
  return items
}

/**
 * Returns an empty array for an app that genuinely has no in-app purchases —
 * that is a successful answer, not a failure. Only a request or parse problem
 * comes back as a `Failure`, and per FR-ENT-05 the caller must fall back to
 * manual entry rather than block on either outcome.
 */
export async function fetchIAP(
  appId: string,
  region: string
): Promise<Result<IAPItem[]>> {
  const url = `https://apps.apple.com/${encodeURIComponent(
    region
  )}/app/id${encodeURIComponent(appId)}`

  // No Accept-Language: the in-app purchase names are the developer's own
  // per-storefront strings, not page chrome, and are unaffected by it (verified
  // against the China storefront). The extraction is structural for the same
  // reason — the page's language must not matter.
  const response = await fetchText(url, {
    headers: { 'User-Agent': USER_AGENT }
  })
  if (!response.ok) {
    return response.reason === 'http' && response.status === 404
      ? { ok: false, reason: 'notfound' }
      : response
  }

  return { ok: true, value: parseIAP(response.value) }
}
