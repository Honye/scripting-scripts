import { fetchJson } from './http'
import type { Result } from './http'

/**
 * The official, unauthenticated iTunes Lookup API.
 *
 * It carries **no in-app-purchase fields at all** — that is why `appstore.ts`
 * exists. What it does give reliably is the app name, icon and store price, and
 * both the name and the price are localized by `country`, so the region a lookup
 * was made in has to travel with the result.
 */
export type AppInfo = {
  appId: string
  name: string
  iconUrl: string
  bundleId?: string
  sellerName?: string
  version?: string
  /** Store price in `currency`; 0 for a free app. */
  price: number
  currency: string
  /** Apple's own formatted string, e.g. "$4.99" / "免费". Display only. */
  formattedPrice?: string
  /** The storefront this was read from. */
  region: string
}

type LookupResult = {
  trackId?: number
  trackName?: string
  artworkUrl512?: string
  artworkUrl100?: string
  artworkUrl60?: string
  bundleId?: string
  artistName?: string
  version?: string
  price?: number
  currency?: string
  formattedPrice?: string
}

type ListResponse = {
  resultCount: number
  results: LookupResult[]
}

function toAppInfo(result: LookupResult, region: string, fallbackId: string): AppInfo {
  return {
    appId: result.trackId != null ? String(result.trackId) : fallbackId,
    name: result.trackName ?? fallbackId,
    iconUrl:
      result.artworkUrl512 ?? result.artworkUrl100 ?? result.artworkUrl60 ?? '',
    bundleId: result.bundleId,
    sellerName: result.artistName,
    version: result.version,
    price: result.price ?? 0,
    currency: result.currency ?? '',
    formattedPrice: result.formattedPrice,
    region
  }
}

export async function lookupApp(
  appId: string,
  region: string
): Promise<Result<AppInfo>> {
  const url = `https://itunes.apple.com/lookup?id=${encodeURIComponent(
    appId
  )}&country=${encodeURIComponent(region)}`

  const response = await fetchJson<ListResponse>(url)
  if (!response.ok) return response

  const first = response.value.results?.[0]
  // An app that is simply not sold in this storefront comes back as a 200 with
  // an empty result set, not as an error.
  if (response.value.resultCount === 0 || first == null) {
    return { ok: false, reason: 'notfound' }
  }

  return { ok: true, value: toAppInfo(first, region, appId) }
}

/**
 * Search by name. Results — and their prices — are storefront-specific, so the
 * region is part of the query rather than a display detail.
 *
 * Note that the endpoint is fuzzy: a nonsense term still returns matches, so an
 * empty result list is rare and never means "no such app".
 */
export async function searchApps(
  term: string,
  region: string,
  limit: number = 25
): Promise<Result<AppInfo[]>> {
  const query = term.trim()
  if (query === '') return { ok: true, value: [] }

  const url =
    `https://itunes.apple.com/search?term=${encodeURIComponent(query)}` +
    `&entity=software&country=${encodeURIComponent(region)}&limit=${limit}`

  const response = await fetchJson<ListResponse>(url)
  if (!response.ok) return response

  return {
    ok: true,
    value: (response.value.results ?? [])
      .filter((result) => result.trackId != null)
      .map((result) => toAppInfo(result, region, ''))
  }
}
