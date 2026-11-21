/**
 * Settings shared between the Scripting app (index.tsx) and the Safari
 * userscript (browser.tsx). They run in separate runtimes, so the settings
 * live in a JSON file under the Safari browser data root, which both can read.
 *
 * browser.tsx can't import (the Scripting build compiles it alone as
 * CommonJS), so it carries its own copy of the types and normalisation —
 * keep the two in sync.
 */

import { DEFAULT_STYLE, isColorString } from './qr'
import type { DotShape, EyeShape, QRStyle } from './qr'

export type { DotShape, EyeShape, QRStyle } from './qr'
export { DEFAULT_STYLE } from './qr'

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
  qrcode: { enabled: boolean; style: QRStyle }
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

export const DOT_SHAPES: { id: DotShape; label: string }[] = [
  { id: 'square', label: '方块' },
  { id: 'dot', label: '圆点' },
  { id: 'rounded', label: '圆角' },
  { id: 'diamond', label: '菱形' }
]

export const EYE_SHAPES: { id: EyeShape; label: string }[] = [
  { id: 'square', label: '方形' },
  { id: 'rounded', label: '圆角' },
  { id: 'circle', label: '圆形' }
]

export interface ColorPreset {
  id: string
  label: string
  fg: string
  fg2: string | null
  bg: string
}

// Gradient ends are kept dark enough to scan on white.
export const COLOR_PRESETS: ColorPreset[] = [
  { id: 'classic', label: '经典黑', fg: '#000000', fg2: null, bg: '#FFFFFF' },
  { id: 'ocean', label: '深海蓝', fg: '#0B3D91', fg2: null, bg: '#FFFFFF' },
  { id: 'grape', label: '葡萄紫', fg: '#5B2A86', fg2: null, bg: '#FFFFFF' },
  { id: 'forest', label: '墨绿', fg: '#1E5631', fg2: null, bg: '#FFFFFF' },
  { id: 'wine', label: '酒红', fg: '#7B1E2B', fg2: null, bg: '#FFFFFF' },
  { id: 'night', label: '暗夜', fg: '#FFFFFF', fg2: null, bg: '#1C1C1E' },
  { id: 'sunset', label: '日落', fg: '#E0314B', fg2: '#E88A1A', bg: '#FFFFFF' },
  { id: 'aurora', label: '极光', fg: '#0090D0', fg2: '#0052B4', bg: '#FFFFFF' },
  { id: 'neon', label: '霓虹', fg: '#8E2DE2', fg2: '#4A00E0', bg: '#FFFFFF' },
  { id: 'lime', label: '青柠', fg: '#0E7C70', fg2: '#1FA055', bg: '#FFFFFF' }
]

const DEFAULT_KEYS: HoldKey[] = ['AltLeft']

export const DEFAULT_SETTINGS: Settings = {
  qrcode: { enabled: true, style: DEFAULT_STYLE },
  textSelect: { enabled: true, keys: DEFAULT_KEYS }
}

function settingsDir(): string {
  return `${FileManager.safariBrowserDirectory}/browser-script`
}

function settingsPath(): string {
  return `${settingsDir()}/settings.json`
}

function normalizeStyle(raw: unknown): QRStyle {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, any>
  return {
    dot: DOT_SHAPES.some((d) => d.id === r.dot) ? r.dot : DEFAULT_STYLE.dot,
    eye: EYE_SHAPES.some((e) => e.id === r.eye) ? r.eye : DEFAULT_STYLE.eye,
    fg: isColorString(r.fg) ? r.fg : DEFAULT_STYLE.fg,
    fg2: isColorString(r.fg2) ? r.fg2 : null,
    bg: isColorString(r.bg) ? r.bg : DEFAULT_STYLE.bg
  }
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
          : DEFAULT_SETTINGS.qrcode.enabled,
      style: normalizeStyle(r.qrcode?.style)
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
    console.error('[Browser Script] load settings failed', e)
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
