/**
 * The wire contract between this app and `workers/storefront-api`.
 *
 * Both sides import this file — the Worker bundles it straight out of the
 * Scripting project — so the protocol has exactly one definition. Nothing here
 * may reference the `'scripting'` runtime or App-side globals.
 */
import type { IAPItem } from './appstore_parse'
import type { AppInfo } from './itunes_parse'

/**
 * `notfound` means the request itself succeeded and the thing simply is not
 * there — an app id that no storefront carries, a dead TestFlight code. It is
 * a different message to the user than `network`, so it is a different value.
 *
 * The Worker answers with these same values rather than HTTP status codes:
 * `AppDetail` buckets storefronts on `reason === 'notfound'` and `i18n
 * .fetchError` writes the user-facing line from it, so the discriminant has to
 * survive the trip.
 */
export type Failure = {
  ok: false
  reason: 'timeout' | 'network' | 'http' | 'blocked' | 'parse' | 'notfound'
  status?: number
}

export type Result<T> = { ok: true; value: T } | Failure

/** Bumped only on a breaking change; `/v1/health` reports what it speaks. */
export const COMPARE_PROTOCOL = 1

/** First line of a `/v1/compare` stream: what this response set out to do. */
export type MetaMsg = {
  type: 'meta'
  protocol: number
  appId: string
  /** Storefronts this response will report a lookup for. */
  regions: string[]
  /** Storefronts this response will report in-app prices for. */
  iap: string[]
}

/** One storefront's iTunes lookup. Emitted as soon as it lands. */
export type RegionInfoMsg = {
  type: 'region'
  region: string
  info: Result<AppInfo>
}

/**
 * One storefront's in-app prices. A separate message from `region` on purpose:
 * the product page is ~700KB at the origin and lands much later than the
 * lookup, and the UI already renders the two independently.
 */
export type RegionIapMsg = {
  type: 'iap'
  region: string
  iap: Result<IAPItem[]>
}

/** Everything asked for was delivered. */
export type DoneMsg = { type: 'done' }

/**
 * The Worker ran out of its per-invocation budget (Cloudflare caps subrequests
 * and CPU per request, and a full comparison is 342 origin fetches). What is
 * listed here was *not* fetched; the client re-requests exactly these.
 */
export type PartialMsg = {
  type: 'partial'
  regions: string[]
  iap: string[]
}

export type CompareMsg =
  | MetaMsg
  | RegionInfoMsg
  | RegionIapMsg
  | DoneMsg
  | PartialMsg

/** `/v1/health` — also how the settings screen's "test connection" reports. */
export type HealthResponse = {
  ok: true
  protocol: number
  budget: { lookups: number; iap: number }
}
