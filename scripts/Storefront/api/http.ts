import { AbortController, fetch } from 'scripting'

/**
 * The only network entry point.
 *
 * These functions never throw. Every failure comes back as a `Failure` value, so
 * spec FR-ENT-05 ("a failed fetch must never block the user") is enforced by the
 * type system rather than by remembering to write try/catch at each call site.
 *
 * The host allowlist is the structural home of NFR-02: nothing but Apple's own
 * endpoints can be reached from here. Third-party gift-card links are opened
 * with `Safari.openURL` and never travel through this module.
 */
export type Failure = {
  ok: false
  /**
   * `notfound` means the request itself succeeded and the thing simply is not
   * there — an app id that no storefront carries, a dead TestFlight code. It is
   * a different message to the user than `network`, so it is a different value.
   */
  reason: 'timeout' | 'network' | 'http' | 'blocked' | 'parse' | 'notfound'
  status?: number
}

export type Result<T> = { ok: true; value: T } | Failure

const ALLOWED_HOSTS = [
  'itunes.apple.com',
  'apps.apple.com',
  'testflight.apple.com'
]

const DEFAULT_TIMEOUT_MS = 10000

function isAllowed(url: string): boolean {
  const match = url.match(/^https:\/\/([^/?#]+)/i)
  if (!match) return false
  return ALLOWED_HOSTS.includes(match[1].toLowerCase())
}

export async function fetchText(
  url: string,
  options?: { timeoutMs?: number; headers?: Record<string, string> }
): Promise<Result<string>> {
  if (!isAllowed(url)) return { ok: false, reason: 'blocked' }

  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const controller = new AbortController()
  let timer: number | undefined
  const timeout = new Promise<Failure>((resolve) => {
    timer = setTimeout(() => {
      controller.abort()
      resolve({ ok: false, reason: 'timeout' })
    }, timeoutMs)
  })

  try {
    const race = await Promise.race([
      (async (): Promise<Result<string>> => {
        const response = await fetch(url, {
          signal: controller.signal,
          headers: options?.headers,
          // The native timeout actually tears the download down. The race below
          // exists only to tell a timeout apart from any other failure, since a
          // rejected fetch does not say which it was.
          timeout: timeoutMs / 1000,
          // Redirects are followed by default, so the allowlist has to be
          // re-checked here too — otherwise an Apple URL that 302s elsewhere
          // would walk straight past NFR-02.
          handleRedirect: async (next) => (isAllowed(next.url) ? next : null)
        })
        if (!response.ok) {
          return { ok: false, reason: 'http', status: response.status }
        }
        return { ok: true, value: await response.text() }
      })(),
      timeout
    ])
    return race
  } catch {
    return { ok: false, reason: 'network' }
  } finally {
    if (timer != null) clearTimeout(timer)
  }
}

export async function fetchJson<T>(
  url: string,
  options?: { timeoutMs?: number; headers?: Record<string, string> }
): Promise<Result<T>> {
  const text = await fetchText(url, options)
  if (!text.ok) return text
  try {
    return { ok: true, value: JSON.parse(text.value) as T }
  } catch {
    return { ok: false, reason: 'parse' }
  }
}
