/**
 * Thin persistence layer over `Storage`, following the repo convention: business
 * code calls these domain functions, never `Storage` directly.
 *
 * Plain `Storage` (no `{ shared: true }`) is deliberate — index.tsx, widget.tsx
 * and intent.tsx belong to one script and share its private domain.
 */
import { defaultSettings } from './types'
import type { Account, AppRef, Entry, Settings, TFItem } from './types'

const KEY_ACCOUNTS = 'accounts'
const KEY_APP_REFS = 'appRefs'
const KEY_ENTRIES = 'entries'
const KEY_TF_ITEMS = 'tfItems'
const KEY_CURRENT_ACCOUNT = 'currentAccountId'
const KEY_SETTINGS = 'settings'

/** Sorted here so every surface — app, widget, intent — sees the same order. */
export function loadAccounts(): Account[] {
  const accounts = Storage.get<Account[]>(KEY_ACCOUNTS) ?? []
  return accounts.sort((a: Account, b: Account) => a.sortIndex - b.sortIndex)
}

export function saveAccounts(accounts: Account[]) {
  Storage.set(KEY_ACCOUNTS, accounts)
}

export function loadAppRefs(): Record<string, AppRef> {
  return Storage.get<Record<string, AppRef>>(KEY_APP_REFS) ?? {}
}

export function saveAppRefs(refs: Record<string, AppRef>) {
  Storage.set(KEY_APP_REFS, refs)
}

export function loadEntries(): Entry[] {
  return Storage.get<Entry[]>(KEY_ENTRIES) ?? []
}

export function saveEntries(entries: Entry[]) {
  Storage.set(KEY_ENTRIES, entries)
}

export function loadTFItems(): TFItem[] {
  return Storage.get<TFItem[]>(KEY_TF_ITEMS) ?? []
}

export function saveTFItems(items: TFItem[]) {
  Storage.set(KEY_TF_ITEMS, items)
}

export function getCurrentAccountId(): string | null {
  return Storage.get<string>(KEY_CURRENT_ACCOUNT) ?? null
}

export function setCurrentAccountId(id: string | null) {
  if (id) {
    Storage.set(KEY_CURRENT_ACCOUNT, id)
  } else {
    Storage.remove(KEY_CURRENT_ACCOUNT)
  }
}

export function loadSettings(): Settings {
  const stored = Storage.get<Partial<Settings>>(KEY_SETTINGS)
  return { ...defaultSettings, ...(stored ?? {}) }
}

export function saveSettings(settings: Settings) {
  Storage.set(KEY_SETTINGS, settings)
}

const KEY_FX_BASE = 'fxBase'

/** Base currency for the app comparison's `≈` prices; null until the user picks one. */
export function loadFxBase(): string | null {
  return Storage.get<string>(KEY_FX_BASE) ?? null
}

export function saveFxBase(currency: string) {
  Storage.set(KEY_FX_BASE, currency)
}

const KEY_IAP_AUTO = 'iapAutoLoad'

/**
 * Whether the app comparison fetches in-app prices for every storefront on its
 * own. Off by default — it can cost 100MB+ per app; pinned storefronts load
 * regardless of this.
 */
export function loadIapAuto(): boolean {
  return Storage.get<boolean>(KEY_IAP_AUTO) ?? false
}

export function saveIapAuto(value: boolean) {
  Storage.set(KEY_IAP_AUTO, value)
}
