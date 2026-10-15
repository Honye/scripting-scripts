/**
 * Persistence layer. Business code calls these functions, never `Storage` /
 * `Keychain` directly.
 *
 * Plain `Storage` (no `{ shared: true }`): index.tsx and widget.tsx belong to
 * this one script and share its private domain. The password lives in the
 * Keychain; the protocol's device seed and session token also go there, under
 * the same `sgcc.` prefix (see `api/client.ts`).
 */
import type { RawAccount } from './data'

export type Dimension = 'daily' | 'monthly'

export type Preference = {
  phone: string
  smsCode: string
  dimension: Dimension
  barCount: number
  showStepProgress: boolean
  oneLevelPq: number
  twoLevelPq: number
}

export type Cache = {
  fetchedAt: number
  /** Index-aligned with the account list; `null` marks an account whose query failed. */
  list: (RawAccount | null)[]
}

export const defaultPreference: Preference = {
  phone: '',
  smsCode: '',
  dimension: 'daily',
  barCount: 7,
  showStepProgress: true,
  oneLevelPq: 2160,
  twoLevelPq: 4800
}

export const KEYCHAIN_PREFIX = 'sgcc.'

const KEY_PREFERENCE = 'preference'
const KEY_DATA = 'data'
const KEY_PASSWORD = `${KEYCHAIN_PREFIX}password`

export function loadPreference(): Preference {
  const stored = Storage.get<Partial<Preference>>(KEY_PREFERENCE) ?? {}
  return { ...defaultPreference, ...stored }
}

export function savePreference(preference: Preference) {
  Storage.set(KEY_PREFERENCE, preference)
}

export function getPassword(): string {
  try {
    return Keychain.get(KEY_PASSWORD) ?? ''
  } catch {
    return ''
  }
}

export function setPassword(password: string) {
  if (password === '') {
    Keychain.remove(KEY_PASSWORD)
  } else {
    Keychain.set(KEY_PASSWORD, password)
  }
}

export function loadCache(): Cache | null {
  return Storage.get<Cache>(KEY_DATA) ?? null
}

export function saveCache(cache: Cache) {
  Storage.set(KEY_DATA, cache)
}

export function clearCache() {
  Storage.remove(KEY_DATA)
}
