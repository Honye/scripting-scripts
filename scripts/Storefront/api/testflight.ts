import { fetchText } from './http'
import type { Result } from './http'
import type { TFStatus } from '../types'

/**
 * TestFlight slot detection.
 *
 * Unlike the App Store product page, the join page is **not localized**:
 * `Accept-Language` of en-US, zh-CN, ja-JP and tr-TR all return the identical
 * English "This beta is full." (verified). Text matching is therefore safe here,
 * and is used only as a secondary signal behind a server-rendered boolean.
 *
 * The page ships an inline `var showSteps = <bool> && (isIOS || false);` that
 * Apple's own page uses to decide whether to render the join instructions. It is
 * the closest thing to a machine-readable answer the page has, so it leads.
 */
export type TFDetection = {
  status: TFStatus
  appName?: string
  iconUrl?: string
}

const SHOW_STEPS_RE = /var\s+showSteps\s*=\s*(true|false)\b/
const TITLE_RE = /<title>\s*Join the (.+?) beta\s*-\s*TestFlight\s*-\s*Apple\s*<\/title>/i
const STATUS_SPAN_RE = /<span>([^<]*)<\/span>/
const ICON_RE = /background-image:\s*url\(([^)]+)\)/

/** Accepts a full join URL or a bare code. */
export function parseJoinCode(input: string): string | null {
  const trimmed = input.trim()
  if (/^[A-Za-z0-9]{6,12}$/.test(trimmed)) return trimmed
  const match = trimmed.match(
    /^https?:\/\/testflight\.apple\.com\/join\/([A-Za-z0-9]+)/i
  )
  return match != null ? match[1] : null
}

export function joinUrlFor(code: string): string {
  return `https://testflight.apple.com/join/${code}`
}

export function parseTF(html: string): TFDetection {
  const title = html.match(TITLE_RE)
  const appName = title != null ? decodeEntities(title[1].trim()) : undefined

  const statusIndex = html.indexOf('beta-status')
  const block = statusIndex >= 0 ? html.slice(statusIndex, statusIndex + 800) : ''
  const icon = block.match(ICON_RE)
  const iconUrl = icon != null ? icon[1].trim() : undefined
  const span = block.match(STATUS_SPAN_RE)
  const statusText = (span != null ? span[1] : '').toLowerCase()

  const steps = html.match(SHOW_STEPS_RE)
  if (steps != null && steps[1] === 'true') {
    return { status: 'open', appName, iconUrl }
  }

  if (steps != null && steps[1] === 'false') {
    if (statusText.includes('full')) return { status: 'full', appName, iconUrl }
    // "This beta isn't accepting any new testers right now."
    if (statusText.includes('accepting')) {
      return { status: 'closed', appName, iconUrl }
    }
  }

  // Apple changed something. Reporting `unknown` lets the caller keep the last
  // status it knew rather than overwrite a true value with a guess.
  return { status: 'unknown', appName, iconUrl }
}

function decodeEntities(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/gi, "'")
}

/**
 * A dead or revoked code answers 404, which is a definite `invalid` rather than
 * a network problem — the only case where a failed request still yields a real
 * status.
 */
export async function checkTF(
  joinUrl: string,
  timeoutMs?: number
): Promise<Result<TFDetection>> {
  const response = await fetchText(joinUrl, { timeoutMs })
  if (!response.ok) {
    if (response.reason === 'http' && response.status === 404) {
      return { ok: true, value: { status: 'invalid' } }
    }
    return response
  }
  return { ok: true, value: parseTF(response.value) }
}
