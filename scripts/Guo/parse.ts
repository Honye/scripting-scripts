import type { CatalogCursor, CatalogPage, Drama, DramaDetail, Episode } from './types'

export type Row = Record<string, unknown>

export function object(value: unknown): Row {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Row
    : {}
}

export function list(value: unknown): unknown[] {
  if (Array.isArray(value)) return value
  const row = object(value)
  for (const key of ['list', 'items', 'data']) {
    if (Array.isArray(row[key])) return row[key] as unknown[]
  }
  return []
}

export function string(row: Row, ...keys: string[]): string {
  for (const key of keys) {
    const value = row[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
    if (typeof value === 'number' && Number.isSafeInteger(value)) return String(value)
  }
  return ''
}

export function numericID(value: string): boolean {
  return /^[0-9]{1,32}$/.test(value)
}

export function parseJSON(text: string): unknown {
  let output = ''
  let inString = false
  let escaped = false
  for (let index = 0; index < text.length; index++) {
    const char = text[index]
    if (inString) {
      output += char
      if (escaped) escaped = false
      else if (char === '\\') escaped = true
      else if (char === '"') inString = false
    } else if (char === '"') {
      inString = true
      output += char
    } else if (char === '-' || /[0-9]/.test(char)) {
      const token = text.slice(index).match(/^-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/)?.[0]
      if (!token) throw new Error('接口 JSON 数字无效')
      output += /^-?\d{16,}$/.test(token) ? JSON.stringify(token) : token
      index += token.length - 1
    } else {
      output += char
    }
  }
  return JSON.parse(output)
}

export function routerData(html: string): Row {
  const marker = /(?:window\.)?_ROUTER_DATA\s*=\s*/.exec(html)
  if (!marker) throw new Error('红果页面数据不可用，请稍后重试')
  const start = marker.index + marker[0].length
  if (html[start] !== '{') throw new Error('红果页面格式已变化')
  let depth = 0
  let inString = false
  let escaped = false
  for (let index = start; index < html.length; index++) {
    const char = html[index]
    if (inString) {
      if (escaped) escaped = false
      else if (char === '\\') escaped = true
      else if (char === '"') inString = false
    } else if (char === '"') inString = true
    else if (char === '{') depth++
    else if (char === '}' && --depth === 0) {
      return object(parseJSON(html.slice(start, index + 1)))
    }
  }
  throw new Error('红果页面数据不完整')
}

export function loader(data: Row, ...prefixes: string[]): Row {
  const rows = object(data.loaderData)
  for (const prefix of prefixes) {
    const exact = object(rows[prefix])
    if (Object.keys(exact).length) return exact
  }
  for (const prefix of prefixes) {
    for (const key of Object.keys(rows)) {
      if (key.startsWith(prefix.replace(/\$$/, ''))) {
        const page = object(rows[key])
        if (Object.keys(page).length) return page
      }
    }
  }
  return {}
}

export function parseDrama(value: unknown, category = '短剧'): Drama | null {
  const row = object(value)
  const nested = object(row.video_data)
  const data = Object.keys(nested).length ? nested : row
  const sourceId = string(data, 'series_id_str', 'series_id') || string(row, 'series_id_str', 'series_id', 'keyword')
  if (!numericID(sourceId)) return null
  const tags = list(data.tags).filter((tag): tag is string => typeof tag === 'string')
  for (const item of list(data.category_list)) {
    const name = string(object(item), 'name')
    if (name && !tags.includes(name)) tags.push(name)
  }
  try {
    for (const item of list(JSON.parse(string(data, 'category_schema') || '[]'))) {
      const name = string(object(item), 'name')
      if (name && !tags.includes(name)) tags.push(name)
    }
  } catch {}
  const episodeCount = Math.max(0, Number(string(data, 'episode_cnt')) || 0)
  return {
    id: `hongguo:${sourceId}`,
    source: 'hongguo',
    sourceId,
    title: string(data, 'series_title', 'series_name', 'title') || string(row, 'series_name', 'name') || sourceId,
    cover: string(data, 'series_cover', 'cover') || string(row, 'series_cover'),
    description: string(data, 'series_intro', 'video_desc') || string(row, 'series_intro'),
    category: string(data, 'category_name', 'categoryName') || tags[0] || category,
    episodeCount,
    remark: string(data, 'episode_right_text') || (episodeCount ? `共 ${episodeCount} 集` : ''),
    tags
  }
}

export function mergeDramas(...groups: Drama[][]): Drama[] {
  const items = new Map<string, Drama>()
  for (const group of groups) {
    for (const item of group) {
      const old = items.get(item.id)
      items.set(item.id, old ? {
        ...old,
        ...item,
        title: item.title === item.sourceId ? old.title : item.title,
        cover: item.cover || old.cover,
        description: item.description || old.description,
        episodeCount: item.episodeCount || old.episodeCount,
        tags: item.tags.length ? item.tags : old.tags
      } : item)
    }
  }
  return Array.from(items.values())
}

export function dramas(rows: unknown, category?: string): Drama[] {
  return mergeDramas(list(rows).map(row => parseDrama(row, category)).filter((row): row is Drama => row !== null))
}

export function parseCatalog(result: Row, previous: CatalogCursor | null, category: string): CatalogPage {
  const data = object(result.data)
  if (!Array.isArray(data.video_data)) throw new Error('红果分类数据格式异常')
  const items = dramas(data.video_data, category)
  if (data.video_data.length && !items.length) throw new Error('红果分类没有可识别的剧集')
  if (typeof data.has_more !== 'boolean') throw new Error('红果分页标记无效')
  const offset = Number(string(data, 'next_offset'))
  const signature = items.map(item => item.id).sort().join(',')
  if (data.has_more && (!items.length || !Number.isSafeInteger(offset) || offset <= (previous?.offset || 0) || offset > 1000000 || signature === previous?.signature)) {
    throw new Error('红果分页没有前进，请刷新后重试')
  }
  const session = string(data, 'session_id')
  if (session.length > 4096 || /[\r\n\x00]/.test(session)) throw new Error('红果分页会话无效')
  return {
    items,
    next: data.has_more ? { transport: 'app', offset, session, page: 1, signature } : null
  }
}

export function parseAppDetail(result: Row, expected: Drama): DramaDetail {
  const data = object(object(result.data).video_data)
  const drama = parseDrama(data)
  if (!drama || drama.sourceId !== expected.sourceId) throw new Error('红果返回了其他剧集的详情')
  const episodes: Episode[] = list(data.video_list).map(value => {
    const row = object(value)
    const id = string(row, 'vid')
    const number = Number(string(row, 'vid_index'))
    const seriesId = string(row, 'series_id_str', 'series_id')
    if (!numericID(id) || !Number.isSafeInteger(number) || number < 1 || (seriesId && seriesId !== expected.sourceId)) {
      throw new Error('红果分集信息无效')
    }
    return { id, number, title: `第 ${number} 集` }
  }).sort((a, b) => a.number - b.number)
  if (!episodes.length || drama.episodeCount > episodes.length || new Set(episodes.map(item => item.id)).size !== episodes.length || episodes.some((item, index) => item.number !== index + 1)) {
    throw new Error('红果未返回完整连续的分集')
  }
  return { drama: mergeDramas([expected], [drama])[0], episodes }
}

export function parseWebDetail(html: string, expected: Drama): DramaDetail {
  const page = loader(routerData(html), 'detail_page', 'detail_')
  const data = object(page.seriesDetail)
  const returnedID = string(data, 'series_id_str', 'series_id')
  if (!returnedID || returnedID !== expected.sourceId) throw new Error('红果网页未返回所请求的剧集')
  const parsed = parseDrama(data)
  const episodes = list(data.vid_list).map((value, index) => {
    const id = typeof value === 'string' ? value : Number.isSafeInteger(value) ? String(value) : ''
    if (!numericID(id)) throw new Error('红果网页分集 ID 无效')
    return { id, number: index + 1, title: `第 ${index + 1} 集` }
  })
  if (!episodes.length || new Set(episodes.map(item => item.id)).size !== episodes.length || (parsed && parsed.episodeCount > episodes.length)) {
    throw new Error('红果网页没有返回完整的分集')
  }
  return { drama: parsed ? mergeDramas([expected], [parsed])[0] : expected, episodes }
}

export function isHTTP(value: string): boolean {
  return /^https?:\/\/[^\s/?#@]+(?::\d+)?(?:[/?#][^\s]*)?$/i.test(value)
}

export function encrypted(row: Row): boolean {
  const info = object(row.encrypt_info)
  return Boolean(string(info, 'spade_a') || info.encrypt === true || info.encrypt === 1 || info.encrypt === '1' || string(info, 'encryption_method').toLowerCase().includes('cenc') || string(row, 'spade_a'))
}

export function mediaAddresses(row: Row, decode: (value: string) => string): string[] {
  const addresses: string[] = []
  function add(value: unknown) {
    if (Array.isArray(value)) return value.forEach(add)
    if (typeof value !== 'string' || value.length > 8192) return
    let address = value.trim()
    if (!isHTTP(address)) {
      try { address = decode(address).trim() } catch { return }
    }
    if (isHTTP(address) && !addresses.includes(address)) addresses.push(address)
  }
  for (const key of ['main_url', 'backup_url', 'backup_url_1', 'backup_url_2', 'backup_urls', 'url_list']) add(row[key])
  return addresses
}

export function errorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (error.name === 'TimeoutError') return '请求超时，请检查网络后重试'
    if (error.name === 'AbortError') return '请求已取消'
    return error.message
  }
  return String(error)
}
