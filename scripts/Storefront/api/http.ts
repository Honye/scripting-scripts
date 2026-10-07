import { AbortController, fetch } from 'scripting'
import type { Failure, Result } from './wire'

/**
 * The only network entry point.
 *
 * These functions never throw. Every failure comes back as a `Failure` value, so
 * spec FR-ENT-05 ("a failed fetch must never block the user") is enforced by the
 * type system rather than by remembering to write try/catch at each call site.
 *
 * The host allowlist is the structural home of NFR-02: nothing but Apple's own
 * endpoints — plus one read-only exchange-rate API that is sent nothing but a
 * currency code — can be reached from here. Third-party gift-card links are
 * opened with `Safari.openURL` and never travel through this module.
 *
 * `allowHost` is the one escape hatch, and it is deliberately per-call rather
 * than a module-level setting: the user's own acceleration endpoint is reachable
 * only from the call sites that mean to reach it, and the allowlist stays
 * readable at the point of use. It is still hop-checked across redirects.
 */
export type { Failure, Result } from './wire'

const ALLOWED_HOSTS = [
  'itunes.apple.com',
  'apps.apple.com',
  'testflight.apple.com',
  'api.frankfurter.dev'
]

const DEFAULT_TIMEOUT_MS = 10000

export type FetchOptions = {
  timeoutMs?: number
  headers?: Record<string, string>
  /** One extra host to permit for this call only, e.g. the user's Worker. */
  allowHost?: string
}

function isAllowed(url: string, extra?: string): boolean {
  const match = url.match(/^https:\/\/([^/?#]+)/i)
  if (!match) return false
  const host = match[1].toLowerCase()
  return ALLOWED_HOSTS.includes(host) || (extra != null && host === extra.toLowerCase())
}

export async function fetchText(
  url: string,
  options?: FetchOptions
): Promise<Result<string>> {
  if (!isAllowed(url, options?.allowHost)) return { ok: false, reason: 'blocked' }

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
          handleRedirect: async (next) =>
            isAllowed(next.url, options?.allowHost) ? next : null
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
  options?: FetchOptions
): Promise<Result<T>> {
  const text = await fetchText(url, options)
  if (!text.ok) return text
  try {
    return { ok: true, value: JSON.parse(text.value) as T }
  } catch {
    return { ok: false, reason: 'parse' }
  }
}

/**
 * Reads a newline-delimited response one line at a time, handing each to
 * `onLine` as it arrives.
 *
 * This is what keeps the comparison screen filling in storefront by storefront
 * when the work happens on the Worker: a single aggregated response would be
 * cheaper still, but the user would stare at a spinner for the whole run.
 *
 * `onLine` is given the raw line, blanks already dropped; it is never given a
 * partial one. A throwing `onLine` aborts the read as a `parse` failure — the
 * caller has usually already consumed the lines that did arrive, which is the
 * point: partial progress is kept, not discarded.
 */
export async function fetchLines(
  url: string,
  onLine: (line: string) => void,
  options?: FetchOptions
): Promise<Result<void>> {
  if (!isAllowed(url, options?.allowHost)) return { ok: false, reason: 'blocked' }

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
    return await Promise.race([
      (async (): Promise<Result<void>> => {
        const response = await fetch(url, {
          signal: controller.signal,
          headers: options?.headers,
          timeout: timeoutMs / 1000,
          handleRedirect: async (next) =>
            isAllowed(next.url, options?.allowHost) ? next : null
        })
        if (!response.ok) {
          return { ok: false, reason: 'http', status: response.status }
        }

        // Split on the newline *byte*: a 0x0A can never occur inside a
        // multi-byte UTF-8 sequence, so a chunk boundary landing mid-character
        // cannot corrupt a line the way decoding each chunk separately would.
        const reader = response.body.getReader()
        let buffer = new Uint8Array(0)
        const decode = (bytes: Uint8Array): string =>
          bytes.length === 0
            ? ''
            : (Data.fromUint8Array(bytes)?.toDecodedString('utf8') ?? '')
        const drain = (final: boolean) => {
          let cut = buffer.indexOf(0x0a)
          while (cut >= 0) {
            const line = decode(buffer.subarray(0, cut)).trim()
            buffer = buffer.slice(cut + 1)
            if (line !== '') onLine(line)
            cut = buffer.indexOf(0x0a)
          }
          if (final) {
            const last = decode(buffer).trim()
            if (last !== '') onLine(last)
          }
        }

        for (;;) {
          const chunk = await reader.read()
          if (chunk.done) break
          if (chunk.value != null && chunk.value.length > 0) {
            const next = new Uint8Array(buffer.length + chunk.value.length)
            next.set(buffer)
            next.set(chunk.value, buffer.length)
            buffer = next
            drain(false)
          }
        }
        drain(true)
        return { ok: true, value: undefined }
      })(),
      timeout
    ])
  } catch {
    return { ok: false, reason: 'network' }
  } finally {
    if (timer != null) clearTimeout(timer)
  }
}
