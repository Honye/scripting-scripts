/**
 * The locale-dependent half of the storefront table.
 *
 * Everything that is pure data or pure function lives in `regions_data.ts` and
 * is re-exported here, so call sites keep importing `'../regions'` unchanged.
 * The split exists because `workers/storefront-api` bundles the region table
 * straight out of this project, and it cannot see App-side globals like
 * `Device` — only the two functions below touch one.
 */
export * from './regions_data'

import type { Region } from './regions_data'
import { REGIONS } from './regions_data'

/** Display name in the device language; the code itself stays the identifier. */
export function regionName(region: Region): string {
  return Device.systemLocale.startsWith('zh') ? region.nameZh : region.name
}

/** Matches on code, English name and Chinese name so either language can search. */
export function searchRegions(query: string): Region[] {
  const q = query.trim().toLowerCase()
  if (q === '') return REGIONS
  return REGIONS.filter(
    (r) =>
      r.code.includes(q) ||
      r.name.toLowerCase().includes(q) ||
      r.nameZh.includes(query.trim())
  )
}
