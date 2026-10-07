import { fetchJson, fetchLines } from './http'
import { apiHost, loadApiBase } from '../store'
import { COMPARE_PROTOCOL } from './wire'
import type { Result } from './http'
import type { IAPItem } from './appstore_parse'
import type { CompareMsg, HealthResponse } from './wire'

/**
 * Client for the user's own `workers/storefront-api` deployment.
 *
 * The endpoint is optional and this module is never load-bearing: every entry
 * point reports what it could *not* deliver, and the caller finishes the job
 * the original way. A comparison must come out the same whether the Worker is
 * configured, misconfigured, or offline — only faster.
 */

/** Long: one round can be 40 storefront lookups plus three product pages. */
const COMPARE_TIMEOUT_MS = 60000

/**
 * A free-plan Worker can only spend so many subrequests and so much CPU per
 * request, so a full comparison takes several rounds; a paid one finishes in
 * the first. Store prices are done in four or five either way.
 *
 * In-app prices are the ones that can outlast this cap, at one ~700KB page
 * each. That is deliberate: what is left over goes to the caller's own
 * per-storefront queue, which asks the same endpoint for one storefront at a
 * time — no slower, but it starts filling rows immediately instead of holding
 * the screen until the batch loop gives up.
 */
const MAX_ROUNDS = 8

export type CompareOptions = {
  /** Storefronts to compare, in the order the caller wants them answered. */
  regions: string[]
  /** Subset of `regions` to also fetch in-app prices for. */
  iap: string[]
  onMessage: (message: CompareMsg) => void
  /** Checked between rounds so a dismissed screen stops asking for more. */
  isAlive?: () => boolean
}

export type CompareOutcome = {
  /** Storefronts with no store price yet — the caller must fetch these. */
  regions: string[]
  /** Storefronts with no in-app prices yet. */
  iap: string[]
}

function query(base: string, path: string, params: Record<string, string>): string {
  const search = Object.entries(params)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&')
  return `${base}${path}?${search}`
}

/**
 * Pulls one app's prices from the Worker, looping while it reports leftovers.
 *
 * Returns what never arrived. A truncated stream — a dropped connection, or a
 * Worker that ran out of CPU mid-flight — is not a special case: whatever was
 * not seen is simply still outstanding, and the messages that did arrive are
 * already on screen.
 */
export async function compareRemote(
  appId: string,
  options: CompareOptions
): Promise<CompareOutcome> {
  const base = loadApiBase()
  if (base == null) return { regions: options.regions, iap: options.iap }
  const host = apiHost(base)

  let pending: CompareOutcome = { regions: options.regions, iap: options.iap }

  for (let round = 0; round < MAX_ROUNDS; round += 1) {
    if (pending.regions.length === 0 && pending.iap.length === 0) break
    if (options.isAlive?.() === false) break

    const gotRegions = new Set<string>()
    const gotIap = new Set<string>()
    /** Storefronts that do not carry the app; they have no product page. */
    const absent = new Set<string>()
    /**
     * Held on an object rather than in locals: these are written from inside
     * the line callback, and a plain `let` would be narrowed to its initial
     * value at every read below.
     */
    const end: { reported: CompareOutcome | null; incompatible: boolean } = {
      reported: null,
      incompatible: false
    }

    // Only what is still outstanding. The two lists are independent, so a
    // storefront whose store price already arrived is not re-requested merely
    // because its in-app prices have not.
    const url = query(base, '/v1/compare', {
      id: appId,
      regions: pending.regions.join(','),
      iap: pending.iap.join(',')
    })

    const stream = await fetchLines(
      url,
      (line) => {
        let message: CompareMsg
        try {
          message = JSON.parse(line) as CompareMsg
        } catch {
          return
        }
        switch (message.type) {
          case 'meta':
            // A Worker speaking a protocol we do not know is not worth
            // guessing at, and asking it again will not change its mind: the
            // caller falls back to fetching everything itself.
            if (message.protocol !== COMPARE_PROTOCOL) end.incompatible = true
            return
          case 'region':
            gotRegions.add(message.region)
            if (!message.info.ok && message.info.reason === 'notfound') {
              absent.add(message.region)
            }
            break
          case 'iap':
            gotIap.add(message.region)
            break
          case 'partial':
            end.reported = { regions: message.regions, iap: message.iap }
            return
          case 'done':
            end.reported = { regions: [], iap: [] }
            return
        }
        options.onMessage(message)
      },
      { allowHost: host, timeoutMs: COMPARE_TIMEOUT_MS }
    )

    const next: CompareOutcome = {
      regions: pending.regions.filter((region) => !gotRegions.has(region)),
      // Dropping the storefronts that do not carry the app matters more than it
      // looks: for most apps that is the majority of the 171, and asking for a
      // product page that cannot exist would spend the endpoint's whole budget
      // collecting 404s.
      iap: pending.iap.filter(
        (region) => !gotIap.has(region) && !absent.has(region)
      )
    }

    if (end.incompatible) return pending

    // No progress and no explicit `partial` means the endpoint is not going to
    // work — a wrong URL, a 404, a protocol we do not speak. Stop asking.
    if (!stream.ok && gotRegions.size === 0 && gotIap.size === 0) return next
    const reported = end.reported
    if (
      reported == null &&
      next.regions.length === pending.regions.length &&
      next.iap.length === pending.iap.length
    ) {
      return next
    }
    // `done` is the endpoint saying it has nothing further to give. Anything
    // still outstanding at that point never arrived, and asking again would
    // only get the same answer.
    if (reported != null && reported.regions.length === 0 && reported.iap.length === 0) {
      return next
    }

    pending = next
  }

  return pending
}

/**
 * One storefront's in-app prices. `null` means "no endpoint configured or it
 * did not answer" — distinct from a `Failure`, which is the Worker telling us
 * Apple said no, and which the caller can show as-is.
 */
export async function iapRemote(
  appId: string,
  region: string
): Promise<Result<IAPItem[]> | null> {
  const base = loadApiBase()
  if (base == null) return null

  const result = await fetchJson<Result<IAPItem[]>>(
    query(base, '/v1/iap', { id: appId, region }),
    { allowHost: apiHost(base), timeoutMs: 30000 }
  )
  if (!result.ok) return null

  const body = result.value
  return body != null && typeof body === 'object' && 'ok' in body ? body : null
}

/** Settings screen's "test connection". */
export async function checkHealth(base: string): Promise<Result<HealthResponse>> {
  const normalized = base.trim().replace(/\/+$/, '')
  const result = await fetchJson<HealthResponse>(`${normalized}/v1/health`, {
    allowHost: apiHost(normalized),
    timeoutMs: 15000
  })
  if (!result.ok) return result
  return result.value?.ok === true
    ? result
    : { ok: false, reason: 'parse' }
}
