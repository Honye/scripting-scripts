import { readCached, writeCached } from './cache'
import { fetchIAP, lookupApp } from './upstream'
import type { IAPItem } from '../../../scripts/Storefront/api/appstore_parse'
import type { AppInfo } from '../../../scripts/Storefront/api/itunes_parse'
import type { CompareMsg, Result } from '../../../scripts/Storefront/api/wire'
import { COMPARE_PROTOCOL } from '../../../scripts/Storefront/api/wire'

/** Lookups are small JSON; the origin tolerates them wide. */
const LOOKUP_CONCURRENCY = 20

/** Product pages are ~700KB each, and each one costs real CPU to parse. */
const IAP_CONCURRENCY = 4

export type CompareParams = {
  appId: string
  regions: string[]
  iap: string[]
  budget: { lookups: number; iap: number }
}

/**
 * Runs `task` over `items`, `limit` at a time, in completion order.
 *
 * A throwing task is contained rather than propagated. The stream this feeds
 * has no way to report a mid-flight crash — it would simply stop, costing the
 * client the `partial` message and its whole round — so one storefront that
 * misbehaves must not end the other hundred and seventy.
 */
async function pool<T>(
  items: T[],
  limit: number,
  task: (item: T) => Promise<void>
): Promise<void> {
  const queue = items.slice()
  const worker = async () => {
    for (;;) {
      const item = queue.shift()
      if (item === undefined) return
      try {
        await task(item)
      } catch {
        // The task is responsible for emitting its own failure message.
      }
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, worker)
  )
}

/**
 * Walks one app across storefronts and emits a message per answer.
 *
 * Two passes on purpose. Lookups go out first and complete in a second or two,
 * so the phone can paint every storefront's store price while the in-app pages
 * — which are three orders of magnitude larger — are still downloading here.
 *
 * Neither pass may exceed its budget: Cloudflare caps both subrequests and CPU
 * per invocation, so whatever does not fit comes back as `partial` and the
 * client asks again for exactly those storefronts. Cache hits are free on both
 * counts and never consume budget.
 */
export async function runCompare(
  params: CompareParams,
  ctx: ExecutionContext,
  emit: (message: CompareMsg) => void
): Promise<void> {
  const { appId, regions, budget } = params

  emit({
    type: 'meta',
    protocol: COMPARE_PROTOCOL,
    appId,
    regions,
    iap: params.iap
  })

  // --- Pass 1: store prices -------------------------------------------------

  /** Storefronts this request learned do not carry the app at all. */
  const notCarried = new Set<string>()
  const missingLookups: string[] = []

  const cachedLookups = await Promise.all(
    regions.map(async (region) => ({
      region,
      hit: await readCached<AppInfo>('lookup', appId, region)
    }))
  )
  for (const { region, hit } of cachedLookups) {
    if (hit == null) {
      missingLookups.push(region)
      continue
    }
    if (!hit.ok && hit.reason === 'notfound') notCarried.add(region)
    emit({ type: 'region', region, info: hit })
  }

  const doLookups = missingLookups.slice(0, budget.lookups)
  const skippedLookups = missingLookups.slice(budget.lookups)

  await pool(doLookups, LOOKUP_CONCURRENCY, async (region) => {
    const info = await lookupApp(appId, region).catch(
      (): Result<AppInfo> => ({ ok: false, reason: 'network' })
    )
    writeCached(ctx, 'lookup', appId, region, info)
    if (!info.ok && info.reason === 'notfound') notCarried.add(region)
    emit({ type: 'region', region, info })
  })

  // --- Pass 2: in-app prices ------------------------------------------------

  // A storefront that does not carry the app has no product page either, so
  // asking for one would spend budget to learn what pass 1 already said. Only
  // a *known* absence is skipped: the client is free to ask for in-app prices
  // without re-requesting a lookup it already holds, and an unknown storefront
  // is simply attempted.
  const wantIap = params.iap.filter(
    (region) => !notCarried.has(region) && !skippedLookups.includes(region)
  )
  const missingIap: string[] = []

  const cachedIap = await Promise.all(
    wantIap.map(async (region) => ({
      region,
      hit: await readCached<IAPItem[]>('iap', appId, region)
    }))
  )
  for (const { region, hit } of cachedIap) {
    if (hit == null) missingIap.push(region)
    else emit({ type: 'iap', region, iap: hit })
  }

  const doIap = missingIap.slice(0, budget.iap)
  const skippedIap = missingIap.slice(budget.iap)

  await pool(doIap, IAP_CONCURRENCY, async (region) => {
    const iap = await fetchIAP(appId, region).catch(
      (): Result<IAPItem[]> => ({ ok: false, reason: 'network' })
    )
    writeCached(ctx, 'iap', appId, region, iap)
    emit({ type: 'iap', region, iap })
  })

  // Storefronts whose lookup was deferred keep their in-app request pending
  // too, so the next round asks for both together.
  const deferredIap = params.iap.filter((region) => skippedLookups.includes(region))
  const pendingIap = [...skippedIap, ...deferredIap]

  if (skippedLookups.length === 0 && pendingIap.length === 0) {
    emit({ type: 'done' })
  } else {
    emit({ type: 'partial', regions: skippedLookups, iap: pendingIap })
  }
}

export function ndjsonResponse(
  params: CompareParams,
  ctx: ExecutionContext
): Response {
  const { readable, writable } = new TransformStream()
  const writer = writable.getWriter()
  const encoder = new TextEncoder()

  // Not awaited: the response has to start flowing now, which is the entire
  // reason for streaming. Errors are swallowed into a closed stream — the
  // client treats a short read as "these storefronts did not arrive" and falls
  // back to fetching them itself.
  void (async () => {
    try {
      await runCompare(params, ctx, (message) => {
        void writer.write(encoder.encode(JSON.stringify(message) + '\n'))
      })
    } finally {
      await writer.close().catch(() => {})
    }
  })()

  return new Response(readable, {
    headers: {
      'content-type': 'application/x-ndjson; charset=utf-8',
      'cache-control': 'no-store',
      'access-control-allow-origin': '*'
    }
  })
}

/** Non-streaming fallback: the same messages, collected into one array. */
export async function jsonResponse(
  params: CompareParams,
  ctx: ExecutionContext
): Promise<Response> {
  const messages: CompareMsg[] = []
  await runCompare(params, ctx, (message) => messages.push(message))
  return new Response(JSON.stringify(messages), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'access-control-allow-origin': '*'
    }
  })
}
