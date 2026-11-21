/**
 * Settings shared between the Scripting app (index.tsx) and the Safari
 * userscript (browser.tsx). They run in separate runtimes, so the settings
 * live in a JSON file under the Safari browser data root, which both can read.
 *
 * browser.tsx keeps its own copy of the path, defaults and normalisation
 * (it must stay import-free) — keep the two in sync.
 */

/**
 * A key that must be held to force text selection. ⌥ and ⌘ are told apart
 * left/right (KeyboardEvent.code names); ⌃ and ⇧ match either side.
 */
export type HoldKey =
  | 'AltLeft'
  | 'AltRight'
  | 'MetaLeft'
  | 'MetaRight'
  | 'Control'
  | 'Shift'

export interface Settings {
  qrcode: { enabled: boolean }
  /** `keys` is never empty: all of them must be held together. */
  textSelect: { enabled: boolean; keys: HoldKey[] }
}

export const HOLD_KEYS: { key: HoldKey; label: string; short: string }[] = [
  { key: 'AltLeft', label: '左 ⌥ Option', short: '左⌥' },
  { key: 'AltRight', label: '右 ⌥ Option', short: '右⌥' },
  { key: 'MetaLeft', label: '左 ⌘ Command', short: '左⌘' },
  { key: 'MetaRight', label: '右 ⌘ Command', short: '右⌘' },
  { key: 'Control', label: '⌃ Control', short: '⌃' },
  { key: 'Shift', label: '⇧ Shift', short: '⇧' }
]

const DEFAULT_KEYS: HoldKey[] = ['AltLeft']

export const DEFAULT_SETTINGS: Settings = {
  qrcode: { enabled: true },
  textSelect: { enabled: true, keys: DEFAULT_KEYS }
}

function settingsDir(): string {
  return `${FileManager.safariBrowserDirectory}/browser-qrcode`
}

function settingsPath(): string {
  return `${settingsDir()}/settings.json`
}

/** Fills anything missing or invalid with the defaults. */
export function normalizeSettings(raw: unknown): Settings {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, any>
  const valid = new Set<string>(HOLD_KEYS.map((k) => k.key))
  // Keep HOLD_KEYS order so labels read the same way every time.
  const picked = Array.isArray(r.textSelect?.keys)
    ? HOLD_KEYS.map((k) => k.key).filter(
        (k) => valid.has(k) && r.textSelect.keys.includes(k)
      )
    : []
  return {
    qrcode: {
      enabled:
        typeof r.qrcode?.enabled === 'boolean'
          ? r.qrcode.enabled
          : DEFAULT_SETTINGS.qrcode.enabled
    },
    textSelect: {
      enabled:
        typeof r.textSelect?.enabled === 'boolean'
          ? r.textSelect.enabled
          : DEFAULT_SETTINGS.textSelect.enabled,
      keys: picked.length > 0 ? picked : [...DEFAULT_KEYS]
    }
  }
}

export async function loadSettings(): Promise<Settings> {
  try {
    const path = settingsPath()
    if (!(await FileManager.exists(path))) return normalizeSettings(null)
    return normalizeSettings(JSON.parse(await FileManager.readAsString(path)))
  } catch (e) {
    console.error('[Browser QRCode] load settings failed', e)
    return normalizeSettings(null)
  }
}

export async function saveSettings(settings: Settings): Promise<void> {
  const dir = settingsDir()
  if (!(await FileManager.exists(dir))) {
    await FileManager.createDirectory(dir, true)
  }
  await FileManager.writeAsString(
    settingsPath(),
    JSON.stringify(normalizeSettings(settings), null, 2)
  )
}

/** e.g. `左⌥ + 右⌘` */
export function comboLabel(keys: HoldKey[]): string {
  return HOLD_KEYS.filter((k) => keys.includes(k.key))
    .map((k) => k.short)
    .join(' + ')
}
