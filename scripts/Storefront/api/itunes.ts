import { fetchJson } from './http'
import { toAppInfo } from './itunes_parse'
import type { Result } from './http'
import type { AppInfo, ListResponse } from './itunes_parse'

/**
 * The network half of the iTunes Lookup/Search API. The `AppInfo` shape and the
 * raw-result mapper live in `itunes_parse.ts` and are re-exported here, so call
 * sites keep importing `'../api/itunes'` unchanged — see the note in
 * `appstore.ts` for why the split exists.
 */
export * from './itunes_parse'

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
