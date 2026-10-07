import { jsonResponse, ndjsonResponse } from './compare'
import { readCached, writeCached } from './cache'
import { fetchIAP } from './upstream'
import { REGIONS } from '../../../scripts/Storefront/regions_data'
import { COMPARE_PROTOCOL } from '../../../scripts/Storefront/api/wire'
import type { IAPItem } from '../../../scripts/Storefront/api/appstore_parse'
import type {
  HealthResponse,
  Result
} from '../../../scripts/Storefront/api/wire'

export type Env = {
  MAX_LOOKUPS?: string
  MAX_IAP?: string
}

const KNOWN_REGIONS = new Set(REGIONS.map((region) => region.code))
const ALL_REGIONS = REGIONS.map((region) => region.code)

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, OPTIONS',
  'access-control-allow-headers': 'content-type'
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...CORS }
  })
}

function bad(message: string): Response {
  return json({ ok: false, error: message }, 400)
}

function budgetOf(env: Env) {
  const read = (value: string | undefined, fallback: number) => {
    const parsed = Number(value)
    return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback
  }
  return { lookups: read(env.MAX_LOOKUPS, 40), iap: read(env.MAX_IAP, 3) }
}

/**
 * App ids are digits and storefronts come from a closed list of 171 codes.
 *
 * This is the only thing standing between a public, unauthenticated Worker and
 * an open proxy: every URL it fetches is built from these two values, so if
 * neither can be free text, no caller can aim it at an arbitrary host.
 */
function readAppId(url: URL): string | null {
  const id = url.searchParams.get('id')?.trim() ?? ''
  return /^\d{6,}$/.test(id) ? id : null
}

/** `null` means "the parameter was absent"; `[]` means "explicitly none". */
function readRegions(url: URL, name: string): string[] | null | 'invalid' {
  const raw = url.searchParams.get(name)
  if (raw == null) return null
  const trimmed = raw.trim()
  if (trimmed === '' || trimmed === 'none') return []
  if (trimmed === 'all') return ALL_REGIONS

  const codes = trimmed
    .split(',')
    .map((code) => code.trim().toLowerCase())
    .filter((code) => code !== '')
  if (codes.some((code) => !KNOWN_REGIONS.has(code))) return 'invalid'
  // De-duplicated, and in the caller's order — the client pins storefronts by
  // putting them first and expects those answers first.
  return Array.from(new Set(codes))
}

async function handleIap(url: URL, ctx: ExecutionContext): Promise<Response> {
  const appId = readAppId(url)
  if (appId == null) return bad('id must be a numeric App Store id')

  const region = url.searchParams.get('region')?.trim().toLowerCase() ?? ''
  if (!KNOWN_REGIONS.has(region)) return bad('region must be a storefront code')

  const cached = await readCached<IAPItem[]>('iap', appId, region)
  if (cached != null) return json(cached)

  const result: Result<IAPItem[]> = await fetchIAP(appId, region)
  writeCached(ctx, 'iap', appId, region, result)
  return json(result)
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS })
    }
    if (request.method !== 'GET') {
      return json({ ok: false, error: 'method not allowed' }, 405)
    }

    const url = new URL(request.url)

    if (url.pathname === '/v1/health' || url.pathname === '/') {
      const body: HealthResponse = {
        ok: true,
        protocol: COMPARE_PROTOCOL,
        budget: budgetOf(env)
      }
      return json(body)
    }

    if (url.pathname === '/v1/iap') return handleIap(url, ctx)

    if (url.pathname === '/v1/compare') {
      const appId = readAppId(url)
      if (appId == null) return bad('id must be a numeric App Store id')

      const regions = readRegions(url, 'regions')
      if (regions === 'invalid') return bad('regions contains an unknown storefront')

      const iap = readRegions(url, 'iap')
      if (iap === 'invalid') return bad('iap contains an unknown storefront')

      // `regions` and `iap` are independent lists: a client that already holds
      // every store price asks for `regions=none&iap=<the rest>` rather than
      // making the Worker re-send a hundred lookups it does not need.
      //
      // `iap=all` is the exception, and means "the storefronts I am asking
      // about" — otherwise a three-storefront comparison would order up all 171
      // product pages.
      const wanted = regions ?? ALL_REGIONS
      const wantsAllIap = url.searchParams.get('iap')?.trim().toLowerCase() === 'all'
      const params = {
        appId,
        regions: wanted,
        iap: wantsAllIap ? wanted : (iap ?? []),
        budget: budgetOf(env)
      }

      return url.searchParams.get('format') === 'json'
        ? jsonResponse(params, ctx)
        : ndjsonResponse(params, ctx)
    }

    return json({ ok: false, error: 'not found' }, 404)
  }
}
