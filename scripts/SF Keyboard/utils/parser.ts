import { CATEGORIES, UNCATEGORIZED_KEY, findCategoryKeyByLabel } from '../constants/categories'
import { pick } from '../constants/i18n'
import type { ParseResult } from '../types'
import { parsePlist, type PlistValue } from './plist'

const KNOWN_KEYS = new Set(CATEGORIES.map(c => c.key))

/** 一个符号名看起来是否合法（SF Symbols 只用小写字母、数字和点，少量带斜杠） */
export function looksLikeSymbolName(name: string): boolean {
  if (!name) return false
  if (name.length > 80) return false
  return /^[a-z0-9][a-z0-9._\-]*$/i.test(name)
}

function emptyResult(format: string): ParseResult {
  return { symbols: {}, labels: {}, total: 0, format }
}

function push(result: ParseResult, category: string, name: string) {
  const key = category || UNCATEGORIZED_KEY
  const list = result.symbols[key] || (result.symbols[key] = [])
  list.push(name)
}

/** 归一化分类名：优先匹配已知 key，其次匹配英文名，最后原样保留 */
function normalizeCategory(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return UNCATEGORIZED_KEY
  const lower = trimmed.toLowerCase()
  if (KNOWN_KEYS.has(lower)) return lower
  const matched = findCategoryKeyByLabel(trimmed)
  if (matched) return matched
  return lower.replace(/\s+/g, '_')
}

/** 去重 + 统计 */
function finalize(result: ParseResult): ParseResult {
  let total = 0
  const seen = new Set<string>()
  for (const key of Object.keys(result.symbols)) {
    const unique: string[] = []
    for (const name of result.symbols[key]) {
      const id = `${key}/${name}`
      if (seen.has(id)) continue
      seen.add(id)
      unique.push(name)
    }
    if (unique.length === 0) {
      delete result.symbols[key]
      continue
    }
    result.symbols[key] = unique
    total += unique.length
  }
  result.total = total
  return result
}

// ---------------------------------------------------------------- 文本

/**
 * 纯文本：每行一个符号名。
 * 支持两种分类写法：
 *   `# 分类名` / `[分类名]`  —— 之后的行都归入该分类
 *   `分类名: 符号名`         —— 单行指定
 */
export function parseTextSource(text: string): ParseResult {
  const result = emptyResult('txt')
  let current = UNCATEGORIZED_KEY

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('//')) continue

    const section = line.match(/^(?:#+\s*|\[)([^\]]+?)\]?$/)
    if (section && !looksLikeSymbolName(line)) {
      current = normalizeCategory(section[1])
      continue
    }

    const pair = line.match(/^([^:,]+)\s*[:,]\s*(.+)$/)
    if (pair) {
      const left = pair[1].trim()
      const right = pair[2].trim()
      // `分类: 符号` 或 `符号, 分类` 都尽量兼容
      if (looksLikeSymbolName(right) && !looksLikeSymbolName(left)) {
        push(result, normalizeCategory(left), right)
        continue
      }
      if (looksLikeSymbolName(left)) {
        push(result, normalizeCategory(right), left)
        continue
      }
    }

    if (looksLikeSymbolName(line)) push(result, current, line)
  }

  return finalize(result)
}

/** CSV：第一列符号名，第二列分类（有表头会自动跳过） */
export function parseCsvSource(text: string): ParseResult {
  const result = emptyResult('csv')
  const lines = text.split(/\r?\n/)
  let start = 0
  const head = (lines[0] || '').toLowerCase()
  if (head.includes('name') || head.includes('symbol')) start = 1

  for (let i = start; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    const cells = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''))
    const name = cells[0]
    if (!looksLikeSymbolName(name)) continue
    const categories = cells.slice(1).filter(Boolean)
    if (categories.length === 0) push(result, UNCATEGORIZED_KEY, name)
    else for (const c of categories) push(result, normalizeCategory(c), name)
  }

  return finalize(result)
}

// ---------------------------------------------------------------- JSON

export function parseJsonSource(text: string): ParseResult {
  const result = emptyResult('json')
  const json = JSON.parse(text)
  collectFromJson(json, result)
  return finalize(result)
}

function collectFromJson(json: any, result: ParseResult, category?: string) {
  if (Array.isArray(json)) {
    for (const item of json) {
      if (typeof item === 'string') {
        if (looksLikeSymbolName(item)) push(result, category || UNCATEGORIZED_KEY, item)
      } else if (item && typeof item === 'object') {
        // [{ name, category }] 结构
        const name = item.name ?? item.symbol ?? item.id
        if (typeof name === 'string' && looksLikeSymbolName(name)) {
          const cats = item.categories ?? item.category ?? category
          if (Array.isArray(cats)) {
            for (const c of cats) push(result, normalizeCategory(String(c)), name)
          } else {
            push(result, cats ? normalizeCategory(String(cats)) : UNCATEGORIZED_KEY, name)
          }
        } else {
          collectFromJson(item, result, category)
        }
      }
    }
    return
  }

  if (json && typeof json === 'object') {
    // 官方 name_availability.plist 转成 JSON 后的形态
    if (json.symbols && typeof json.symbols === 'object') {
      collectFromJson(json.symbols, result, category)
      return
    }
    for (const key of Object.keys(json)) {
      const value = json[key]
      if (Array.isArray(value)) {
        if (looksLikeSymbolName(key) && value.every((v: any) => typeof v === 'string')) {
          // { "symbolName": ["category", ...] } —— symbol_categories 的结构
          const asCategories = value.filter((v: string) => !looksLikeSymbolName(v) || !v.includes('.'))
          if (asCategories.length === value.length && value.length <= 6) {
            for (const c of value) push(result, normalizeCategory(c), key)
            continue
          }
        }
        collectFromJson(value, result, normalizeCategory(key))
      } else if (typeof value === 'string') {
        // { "symbolName": "1.0" } —— name_availability 的结构
        if (looksLikeSymbolName(key)) push(result, category || UNCATEGORIZED_KEY, key)
      } else if (value && typeof value === 'object') {
        collectFromJson(value, result, normalizeCategory(key))
      }
    }
  }
}

// ---------------------------------------------------------------- plist

/**
 * 解析 SF Symbols.app 的 plist。已知的三种结构：
 *  - symbol_categories.plist : { "airplane": ["transportation", "maps"], ... }
 *  - name_availability.plist : { "symbols": { "airplane": "1.0" }, "year_to_release": {...} }
 *  - categories.plist        : [ { "key": "weather", "label": "Weather", "icon": "cloud.sun" }, ... ]
 */
export function parsePlistSource(bytes: Uint8Array): ParseResult {
  const value = parsePlist(bytes)
  const result = emptyResult('plist')

  // categories.plist：只提供分类的显示名
  if (Array.isArray(value)) {
    let looksLikeCategories = false
    for (const item of value) {
      if (item && typeof item === 'object' && !Array.isArray(item)) {
        const dict = item as Record<string, PlistValue>
        if (typeof dict.key === 'string') {
          looksLikeCategories = true
          const key = normalizeCategory(dict.key)
          const label = typeof dict.label === 'string' ? dict.label : dict.key
          result.labels[key] = label
        }
      } else if (typeof item === 'string' && looksLikeSymbolName(item)) {
        push(result, UNCATEGORIZED_KEY, item)
      }
    }
    if (looksLikeCategories) return finalize(result)
    return finalize(result)
  }

  if (value && typeof value === 'object') {
    const dict = value as Record<string, PlistValue>

    // name_availability.plist
    if (dict.symbols && typeof dict.symbols === 'object' && !Array.isArray(dict.symbols)) {
      for (const name of Object.keys(dict.symbols as Record<string, PlistValue>)) {
        if (looksLikeSymbolName(name)) push(result, UNCATEGORIZED_KEY, name)
      }
      return finalize(result)
    }

    // symbol_categories.plist
    for (const name of Object.keys(dict)) {
      const v = dict[name]
      if (!looksLikeSymbolName(name)) continue
      if (Array.isArray(v)) {
        const cats = v.filter(c => typeof c === 'string') as string[]
        if (cats.length === 0) push(result, UNCATEGORIZED_KEY, name)
        else for (const c of cats) push(result, normalizeCategory(c), name)
      } else if (typeof v === 'string') {
        push(result, UNCATEGORIZED_KEY, name)
      }
    }
  }

  return finalize(result)
}

// ---------------------------------------------------------------- 统一入口

/** 合并多个解析结果 */
export function mergeResults(results: ParseResult[]): ParseResult {
  const merged = emptyResult(results.map(r => r.format).join('+') || 'empty')
  for (const r of results) {
    for (const key of Object.keys(r.symbols)) {
      for (const name of r.symbols[key]) push(merged, key, name)
    }
    Object.assign(merged.labels, r.labels)
  }
  return finalize(merged)
}

/**
 * 读取并解析一个源文件。根据扩展名分派，扩展名不认识时按内容猜。
 */
export async function parseSourceFile(path: string): Promise<ParseResult> {
  const lower = path.toLowerCase()

  if (lower.endsWith('.plist')) {
    const data = await FileManager.readAsData(path)
    const bytes = data.toUint8Array()
    if (!bytes) throw new Error(pick('文件为空', 'The file is empty'))
    return parsePlistSource(bytes)
  }

  const text = await FileManager.readAsString(path)
  if (lower.endsWith('.json')) return parseJsonSource(text)
  if (lower.endsWith('.csv') || lower.endsWith('.tsv')) return parseCsvSource(text)
  if (lower.endsWith('.txt') || lower.endsWith('.md')) return parseTextSource(text)

  const head = text.slice(0, 200).trim()
  if (head.startsWith('{') || head.startsWith('[')) {
    try {
      return parseJsonSource(text)
    } catch {
      /* 落到文本解析 */
    }
  }
  if (head.startsWith('<?xml') || head.startsWith('<plist')) {
    const data = await FileManager.readAsData(path)
    const bytes = data.toUint8Array()
    if (!bytes) throw new Error(pick('文件为空', 'The file is empty'))
    return parsePlistSource(bytes)
  }
  if (head.includes(',')) return parseCsvSource(text)
  return parseTextSource(text)
}
