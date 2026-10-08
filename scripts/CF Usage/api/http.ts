import { AbortController, fetch } from 'scripting'

/**
 * The only network entry point (adapted from Storefront's `api/http.ts`).
 *
 * Never throws: every failure comes back as a `Failure` value, so the widget —
 * which must always reach `Widget.present` — cannot be taken down by a network
 * hiccup. The allowlist means the API token can only ever be sent to
 * Cloudflare's own API host, redirects included.
 */
export type Failure = {
  ok: false
  reason: 'timeout' | 'network' | 'http' | 'blocked' | 'parse' | 'api'
  status?: number
  /** Cloudflare's own error text when the response carried one. */
  message?: string
}

export type Result<T> = { ok: true; value: T } | Failure

const ALLOWED_HOSTS = ['api.cloudflare.com']
const DEFAULT_TIMEOUT_MS = 10000

export type RequestOptions = {
  method?: 'GET' | 'POST'
  token: string
  body?: unknown
  timeoutMs?: number
}

function isAllowed(url: string): boolean {
  const match = url.match(/^https:\/\/([^/?#]+)/i)
  return match != null && ALLOWED_HOSTS.includes(match[1].toLowerCase())
}

/** Pulls `errors[0].message` out of a Cloudflare v4 or GraphQL error body. */
export function errorMessage(body: any): string | undefined {
  const first = Array.isArray(body?.errors) ? body.errors[0] : undefined
  if (first == null) return undefined
  if (typeof first === 'string') return first
  if (typeof first.message === 'string') return first.message
  return undefined
}

export async function requestJson<T>(
  url: string,
  options: RequestOptions
): Promise<Result<T>> {
  if (!isAllowed(url)) return { ok: false, reason: 'blocked' }

  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const controller = new AbortController()
  let timer: number | undefined
  const timeout = new Promise<Failure>((resolve) => {
    timer = setTimeout(() => {
      controller.abort()
      resolve({ ok: false, reason: 'timeout' })
    }, timeoutMs)
  })

  const headers: Record<string, string> = {
    Authorization: `Bearer ${options.token}`,
    Accept: 'application/json'
  }
  if (options.body !== undefined) headers['Content-Type'] = 'application/json'

  try {
    return await Promise.race([
      (async (): Promise<Result<T>> => {
        const response = await fetch(url, {
          method: options.method ?? 'GET',
          headers,
          body:
            options.body === undefined
              ? undefined
              : JSON.stringify(options.body),
          signal: controller.signal,
          timeout: timeoutMs / 1000,
          handleRedirect: async (next) => (isAllowed(next.url) ? next : null)
        })
        const text = await response.text()
        let json: any
        try {
          json = JSON.parse(text)
        } catch {
          return response.ok
            ? { ok: false, reason: 'parse' }
            : { ok: false, reason: 'http', status: response.status }
        }
        if (!response.ok) {
          return {
            ok: false,
            reason: 'http',
            status: response.status,
            message: errorMessage(json)
          }
        }
        return { ok: true, value: json as T }
      })(),
      timeout
    ])
  } catch {
    return { ok: false, reason: 'network' }
  } finally {
    if (timer != null) clearTimeout(timer)
  }
}
