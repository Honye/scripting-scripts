import { RECENTS_KEY, UNCATEGORIZED_KEY } from '../constants/categories'
import { BUILTIN_ORDER, BUILTIN_SYMBOLS } from '../constants/symbols'
import type { ParseResult, SymbolLibrary } from '../types'

export const LIBRARY_VERSION = 1

const DIR = `${FileManager.appGroupDocumentsDirectory}/SFKeyboard`
const LIBRARY_FILE = `${DIR}/library.json`
const RECENTS_STORAGE_KEY = 'sfkb.recents'
const VALIDATED_FLAG_KEY = 'sfkb.validated'
const MAX_RECENTS = 48

const SHARED = { shared: true }

// ---------------------------------------------------------------- 内置库

export function buildBuiltinLibrary(): SymbolLibrary {
  const symbols: Record<string, string[]> = {}
  for (const key of BUILTIN_ORDER) {
    const list = BUILTIN_SYMBOLS[key]
    if (list && list.length) symbols[key] = dedupe(list)
  }
  return {
    version: LIBRARY_VERSION,
    source: '内置',
    updatedAt: Date.now(),
    order: BUILTIN_ORDER.filter(k => symbols[k] != null),
    symbols,
  }
}

function dedupe(list: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const name of list) {
    if (seen.has(name)) continue
    seen.add(name)
    out.push(name)
  }
  return out
}

// ---------------------------------------------------------------- 读写

export async function loadLibrary(): Promise<SymbolLibrary> {
  try {
    if (await FileManager.exists(LIBRARY_FILE)) {
      const text = await FileManager.readAsString(LIBRARY_FILE)
      const parsed = JSON.parse(text) as SymbolLibrary
      if (parsed && parsed.symbols && Array.isArray(parsed.order)) {
        return normalizeLibrary(parsed)
      }
    }
  } catch (e) {
    console.error('读取图标库失败，回退到内置数据', e)
  }
  return buildBuiltinLibrary()
}

export async function saveLibrary(library: SymbolLibrary): Promise<void> {
  if (!(await FileManager.exists(DIR))) {
    await FileManager.createDirectory(DIR, true)
  }
  await FileManager.writeAsString(LIBRARY_FILE, JSON.stringify(library))
}

export async function deleteLibraryFile(): Promise<void> {
  try {
    if (await FileManager.exists(LIBRARY_FILE)) await FileManager.remove(LIBRARY_FILE)
  } catch (e) {
    console.error('删除图标库文件失败', e)
  }
  Storage.remove(VALIDATED_FLAG_KEY, SHARED)
}

/** 去掉空分类、补齐 order */
export function normalizeLibrary(library: SymbolLibrary): SymbolLibrary {
  const symbols: Record<string, string[]> = {}
  for (const key of Object.keys(library.symbols)) {
    const list = library.symbols[key]
    if (Array.isArray(list) && list.length) symbols[key] = dedupe(list)
  }
  const order = library.order.filter(k => symbols[k] != null)
  for (const key of Object.keys(symbols)) {
    if (!order.includes(key)) order.push(key)
  }
  // 「其他」永远排在最后
  const rest = order.filter(k => k !== UNCATEGORIZED_KEY)
  if (order.includes(UNCATEGORIZED_KEY)) rest.push(UNCATEGORIZED_KEY)
  return { ...library, symbols, order: rest }
}

// ---------------------------------------------------------------- 校验

/**
 * 过滤掉当前系统不存在的符号。
 * 这样内置列表即使包含新系统才有的名字，在旧系统上也不会出现空白格。
 */
export function validateLibrary(library: SymbolLibrary): {
  library: SymbolLibrary
  removed: number
} {
  const cache = new Map<string, boolean>()
  const symbols: Record<string, string[]> = {}
  let removed = 0

  for (const key of Object.keys(library.symbols)) {
    const kept: string[] = []
    for (const name of library.symbols[key]) {
      let ok = cache.get(name)
      if (ok === undefined) {
        try {
          ok = UIImage.fromSFSymbol(name) != null
        } catch {
          ok = false
        }
        cache.set(name, ok)
      }
      if (ok) kept.push(name)
      else removed++
    }
    if (kept.length) symbols[key] = kept
  }

  return {
    library: normalizeLibrary({ ...library, symbols }),
    removed,
  }
}

export function isValidated(): boolean {
  return Storage.get<boolean>(VALIDATED_FLAG_KEY, SHARED) === true
}

export function markValidated() {
  Storage.set(VALIDATED_FLAG_KEY, true, SHARED)
}

/**
 * 首次运行时准备图标库：读取 -> 校验 -> 落盘。
 * 已经校验过就直接返回，避免每次打开键盘都跑一遍。
 */
export async function prepareLibrary(): Promise<SymbolLibrary> {
  const library = await loadLibrary()
  if (isValidated()) return library

  const { library: validated } = validateLibrary(library)
  try {
    await saveLibrary(validated)
    markValidated()
  } catch (e) {
    console.error('保存校验后的图标库失败', e)
  }
  return validated
}

// ---------------------------------------------------------------- 导入

export type ImportMode = 'replace' | 'merge'

/** 把解析结果合入现有图标库 */
export function applyImport(
  current: SymbolLibrary,
  result: ParseResult,
  mode: ImportMode,
  sourceName: string
): SymbolLibrary {
  const symbols: Record<string, string[]> =
    mode === 'replace' ? {} : { ...current.symbols }

  for (const key of Object.keys(result.symbols)) {
    const incoming = result.symbols[key]
    symbols[key] = mode === 'replace' ? dedupe(incoming) : dedupe([...(symbols[key] || []), ...incoming])
  }

  const order = mode === 'replace' ? [] : [...current.order]
  for (const key of BUILTIN_ORDER) {
    if (symbols[key] && !order.includes(key)) order.push(key)
  }
  for (const key of Object.keys(symbols)) {
    if (!order.includes(key)) order.push(key)
  }

  return normalizeLibrary({
    version: LIBRARY_VERSION,
    source: sourceName,
    updatedAt: Date.now(),
    order,
    symbols,
    customLabels: { ...(current.customLabels || {}), ...result.labels },
  })
}

// ---------------------------------------------------------------- 最近使用

export function getRecents(): string[] {
  const stored = Storage.get<string[]>(RECENTS_STORAGE_KEY, SHARED)
  return Array.isArray(stored) ? stored : []
}

export function addRecent(name: string): string[] {
  const next = [name, ...getRecents().filter(n => n !== name)].slice(0, MAX_RECENTS)
  Storage.set(RECENTS_STORAGE_KEY, next, SHARED)
  return next
}

export function clearRecents() {
  Storage.remove(RECENTS_STORAGE_KEY, SHARED)
}

// ---------------------------------------------------------------- 查询

export function symbolsOfCategory(
  library: SymbolLibrary,
  categoryKey: string,
  recents: string[]
): string[] {
  if (categoryKey === RECENTS_KEY) return recents
  return library.symbols[categoryKey] || []
}

export function allSymbols(library: SymbolLibrary): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  for (const key of library.order) {
    for (const name of library.symbols[key] || []) {
      if (seen.has(name)) continue
      seen.add(name)
      out.push(name)
    }
  }
  return out
}

export function countSymbols(library: SymbolLibrary): number {
  return allSymbols(library).length
}

/**
 * 搜索：先匹配前缀，再匹配包含，最后匹配「点分词」的任意片段。
 */
export function searchSymbols(
  library: SymbolLibrary,
  query: string,
  limit = 200
): string[] {
  const q = query.trim().toLowerCase().replace(/\s+/g, '.')
  if (!q) return []

  const prefix: string[] = []
  const contains: string[] = []
  const fuzzy: string[] = []

  for (const name of allSymbols(library)) {
    if (name.startsWith(q)) prefix.push(name)
    else if (name.includes(q)) contains.push(name)
    else if (q.split('.').every(part => part.length > 0 && name.includes(part))) fuzzy.push(name)
    if (prefix.length >= limit) break
  }

  return [...prefix, ...contains, ...fuzzy].slice(0, limit)
}
