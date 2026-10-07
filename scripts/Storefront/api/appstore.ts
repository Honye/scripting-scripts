import { fetchText } from './http'
import { USER_AGENT, parseIAP } from './appstore_parse'
import type { Result } from './http'
import type { IAPItem } from './appstore_parse'

/**
 * The network half of the App Store product-page scrape. Everything that only
 * reads a string — the id/region/price parsers and `parseIAP` itself — lives in
 * `appstore_parse.ts` and is re-exported here, so call sites keep importing
 * `'../api/appstore'` unchanged.
 *
 * The split exists so `workers/storefront-api` can bundle the exact same parser
 * this app uses: that module must never touch the `'scripting'` runtime, and
 * this one does.
 */
export * from './appstore_parse'

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
