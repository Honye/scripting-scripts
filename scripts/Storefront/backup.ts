import { defaultSettings } from './types'
import {
  loadAccounts,
  loadAppRefs,
  loadEntries,
  loadSettings,
  loadTFItems,
  saveAccounts,
  saveAppRefs,
  saveEntries,
  saveSettings,
  saveTFItems
} from './store'
import type { Account, AppRef, Entry, Settings, TFItem } from './types'

/**
 * JSON backup (FR-DATA-01..04).
 *
 * **This module never imports `credentials.ts`** — that is how FR-DATA-02 ("the
 * export must not contain any password") is guaranteed rather than remembered.
 * `Account.hasPassword` is a boolean flag; the secret itself lives only in the
 * Keychain and has no path into this file.
 *
 * A restore therefore leaves the Keychain untouched: passwords survive it, and
 * a backup moved to another device simply arrives with none.
 */
export const BACKUP_FORMAT = 1

export type Backup = {
  format: number
  exportedAt: number
  accounts: Account[]
  entries: Entry[]
  appRefs: Record<string, AppRef>
  tfItems: TFItem[]
  settings: Settings
}

export function buildBackup(now: number = Date.now()): Backup {
  return {
    format: BACKUP_FORMAT,
    exportedAt: now,
    accounts: loadAccounts(),
    entries: loadEntries(),
    appRefs: loadAppRefs(),
    tfItems: loadTFItems(),
    settings: loadSettings()
  }
}

export type ParseResult =
  | { ok: true; value: Backup }
  | { ok: false; reason: string }

function isArrayOfObjects(value: unknown): boolean {
  return (
    Array.isArray(value) &&
    value.every((item) => item != null && typeof item === 'object')
  )
}

/**
 * FR-DATA-04: validate the whole document before anything is written. A partial
 * import is worse than a rejected one — it leaves the user with data that is
 * neither their old set nor their backup, and no way back.
 */
export function parseBackup(text: string): ParseResult {
  let raw: any
  try {
    raw = JSON.parse(text)
  } catch {
    return { ok: false, reason: 'not JSON' }
  }

  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, reason: 'not a backup object' }
  }
  if (typeof raw.format !== 'number') {
    return { ok: false, reason: 'missing format version' }
  }
  if (raw.format > BACKUP_FORMAT) {
    return { ok: false, reason: `format ${raw.format} is newer than this version` }
  }
  if (!isArrayOfObjects(raw.accounts)) {
    return { ok: false, reason: 'accounts missing or malformed' }
  }
  if (!isArrayOfObjects(raw.entries)) {
    return { ok: false, reason: 'records missing or malformed' }
  }
  if (raw.tfItems != null && !isArrayOfObjects(raw.tfItems)) {
    return { ok: false, reason: 'TestFlight items malformed' }
  }

  for (const account of raw.accounts as any[]) {
    if (typeof account.id !== 'string' || account.id === '') {
      return { ok: false, reason: 'an account has no id' }
    }
    if (typeof account.balance !== 'number' || !isFinite(account.balance)) {
      return { ok: false, reason: `account "${account.alias ?? account.id}" has no valid balance` }
    }
  }

  const ids = new Set((raw.accounts as any[]).map((a) => a.id))
  for (const entry of raw.entries as any[]) {
    if (typeof entry.id !== 'string' || entry.id === '') {
      return { ok: false, reason: 'a record has no id' }
    }
    if (!ids.has(entry.accountId)) {
      return {
        ok: false,
        reason: `record "${entry.title ?? entry.id}" points at an account that is not in this backup`
      }
    }
  }

  return {
    ok: true,
    value: {
      format: raw.format,
      exportedAt: typeof raw.exportedAt === 'number' ? raw.exportedAt : Date.now(),
      accounts: raw.accounts,
      entries: raw.entries,
      appRefs:
        raw.appRefs != null && typeof raw.appRefs === 'object' ? raw.appRefs : {},
      tfItems: raw.tfItems ?? [],
      settings: { ...defaultSettings, ...(raw.settings ?? {}) }
    }
  }
}

/** Only ever called with an already-validated backup. */
export function applyBackup(backup: Backup) {
  saveAccounts(backup.accounts)
  saveEntries(backup.entries)
  saveAppRefs(backup.appRefs)
  saveTFItems(backup.tfItems)
  saveSettings(backup.settings)
}
