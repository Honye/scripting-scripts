import type { Result } from '../../../scripts/Storefront/api/wire'

/**
 * Cache of *parsed* results, never of the upstream bodies.
 *
 * That distinction is the whole point. A cached in-app-purchase entry is a few
 * hundred bytes and costs nothing to read back, where the page it came from is
 * ~700KB to fetch and 5–15ms of CPU to parse — and this Worker only gets 10ms
 * of CPU per invocation on the free plan. Cache reads also do not count against
 * the subrequest budget, so a warm cache lets one invocation answer for far
 * more storefronts than the budget alone would allow.
 *
 * `notfound` is cached like any other answer: most storefronts do not carry any
 * given app, so "not here" is the majority result and the one most worth not
 * re-deriving.
 */

const TTL = {
  lookup: 60 * 60 * 6,
  iap: 60 * 60 * 24
} as const

export type Kind = keyof typeof TTL

/**
 * Bump when the shared parser changes what it returns for the same page, so a
 * fix is not shadowed for up to a day by entries parsed with the old rules.
 * (v2: Indonesian compact notation — "Rp 349ribu" is 349 thousand, not 349 —
 * and duplicate in-app names now resolve to the lowest price.)
 */
const PARSER_VERSION = 'v2'

/**
 * Cache keys have to be URLs. This namespace is never served — it exists only
 * to give each (kind, app, storefront) triple a stable address.
 */
function keyFor(kind: Kind, appId: string, region: string): Request {
  return new Request(
    `https://storefront-api.invalid/${PARSER_VERSION}/${kind}/${appId}/${region}`
  )
}

export async function readCached<T>(
  kind: Kind,
  appId: string,
  region: string
): Promise<Result<T> | null> {
  const hit = await caches.default.match(keyFor(kind, appId, region))
  if (hit == null) return null
  try {
    return (await hit.json()) as Result<T>
  } catch {
    return null
  }
}

export function writeCached<T>(
  ctx: ExecutionContext,
  kind: Kind,
  appId: string,
  region: string,
  value: Result<T>
): void {
  // Transient failures must not be remembered — only answers Apple actually
  // gave us. A timeout cached for six hours would be a bug that looks like a
  // storefront outage.
  if (!value.ok && value.reason !== 'notfound') return

  const body = new Response(JSON.stringify(value), {
    headers: {
      'content-type': 'application/json',
      'cache-control': `public, max-age=${TTL[kind]}`
    }
  })
  ctx.waitUntil(caches.default.put(keyFor(kind, appId, region), body))
}
