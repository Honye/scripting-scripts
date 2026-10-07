import { USER_AGENT, parseIAP } from '../../../scripts/Storefront/api/appstore_parse'
import { toAppInfo } from '../../../scripts/Storefront/api/itunes_parse'
import type { IAPItem } from '../../../scripts/Storefront/api/appstore_parse'
import type {
  AppInfo,
  ListResponse
} from '../../../scripts/Storefront/api/itunes_parse'
import type { Result } from '../../../scripts/Storefront/api/wire'

/**
 * The two Apple endpoints, fetched with the Worker's own `fetch`.
 *
 * The parsing is not reimplemented here: `parseIAP` and `toAppInfo` are
 * imported straight out of the Scripting app, so when Apple changes the product
 * page there is one place to fix and both sides move together. This file holds
 * only what differs — the runtime's `fetch` and its options.
 */

const TIMEOUT_MS = 12000

async function get(
  url: string,
  headers?: Record<string, string>
): Promise<Result<Response>> {
  try {
    const response = await fetch(url, {
      headers,
      redirect: 'follow',
      signal: AbortSignal.timeout(TIMEOUT_MS)
    })
    if (!response.ok) {
      return { ok: false, reason: 'http', status: response.status }
    }
    return { ok: true, value: response }
  } catch (error) {
    const name = (error as { name?: string } | null)?.name
    return {
      ok: false,
      reason: name === 'TimeoutError' || name === 'AbortError' ? 'timeout' : 'network'
    }
  }
}

export async function lookupApp(
  appId: string,
  region: string
): Promise<Result<AppInfo>> {
  const response = await get(
    `https://itunes.apple.com/lookup?id=${encodeURIComponent(
      appId
    )}&country=${encodeURIComponent(region)}`
  )
  if (!response.ok) return response

  let body: ListResponse
  try {
    body = (await response.value.json()) as ListResponse
  } catch {
    return { ok: false, reason: 'parse' }
  }

  // An app that is simply not sold in this storefront comes back as a 200 with
  // an empty result set, not as an error.
  const first = body.results?.[0]
  if (body.resultCount === 0 || first == null) {
    return { ok: false, reason: 'notfound' }
  }

  return { ok: true, value: toAppInfo(first, region, appId) }
}

/**
 * The expensive one, and the reason this Worker exists: the product page is
 * 670–780KB and the answer is a few hundred bytes. Downloading it here means
 * the phone never sees the HTML.
 *
 * An empty array is a success — that is an app with no in-app purchases.
 */
export async function fetchIAP(
  appId: string,
  region: string
): Promise<Result<IAPItem[]>> {
  const response = await get(
    `https://apps.apple.com/${encodeURIComponent(
      region
    )}/app/id${encodeURIComponent(appId)}`,
    // The desktop UA is load-bearing: the mobile page omits the information
    // shelf entirely and parses to zero items.
    { 'User-Agent': USER_AGENT }
  )
  if (!response.ok) {
    return response.reason === 'http' && response.status === 404
      ? { ok: false, reason: 'notfound' }
      : response
  }

  try {
    const html = await response.value.text()
    return { ok: true, value: parseIAP(html) }
  } catch {
    // A body that dies halfway through reads as a parse failure, not a crash:
    // one bad storefront must not take the whole comparison down with it.
    return { ok: false, reason: 'parse' }
  }
}
