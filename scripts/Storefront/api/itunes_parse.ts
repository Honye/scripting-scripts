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

export type LookupResult = {
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

export type ListResponse = {
  resultCount: number
  results: LookupResult[]
}

export function toAppInfo(result: LookupResult, region: string, fallbackId: string): AppInfo {
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
