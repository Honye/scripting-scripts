import { fetch } from 'scripting'
import type { PlaySource } from './types'
import { cleanEpisodesInfo } from './play'

const API_HOST = 'https://frodo.douban.com/api/v2'
const API_BASE = `${API_HOST}/search/weixin`
const API_KEY = '054022eaeae0b00e0fc068c0c0a2102a'

/** Douban's frodo API only answers to its WeChat mini-program client. */
const DOUBAN_HEADERS = {
  Referer: 'https://servicewechat.com/wx2f9b06c1de1ccfca/81/page-frame.html',
  'User-Agent':
    'Mozilla/5.0 (iPhone; CPU iPhone OS 14_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.2(0x18000236) NetType/WIFI Language/en'
}

export type SearchItem = {
  id: string
  title: string
  /** "电视剧" / "电影" / "综艺" / "动漫" / etc. */
  typeName: string
  /** "tv" / "movie" / etc. */
  targetType: string
  coverUrl: string
  year: string
  /** 0 when not yet rated. */
  rating: number
  /** "8.6分 / 2020 / 日本 / 动画 奇幻 惊悚 / ..." */
  cardSubtitle: string
  /** Best-effort genre extracted from cardSubtitle, falls back to typeName. */
  genre: string
  /** True when Douban knows of at least one streaming vendor for this subject. */
  hasLinewatch: boolean
}

type RawTarget = {
  id: string
  title: string
  cover_url: string
  year?: string
  card_subtitle?: string
  rating?: { value: number }
  has_linewatch?: boolean
}

type RawResponse = {
  items?: Array<{
    type_name: string
    target_type: string
    target?: RawTarget
  }>
}

type RawVendor = {
  id?: string
  title?: string
  uri?: string
  url?: string
  icon?: string
  episodes_info?: string
  payment_desc?: string
  accessible?: boolean
}

type RawSubject = {
  vendors?: RawVendor[]
}

/** Pull a likely-genre token out of the slash-separated card_subtitle. */
function extractGenre(cardSubtitle: string, fallback: string): string {
  const parts = cardSubtitle.split('/').map((s) => s.trim()).filter(Boolean)
  // Heuristic: the first part containing CJK and not all digits/score/year/runtime is the genre cluster.
  for (const p of parts) {
    if (/^\d/.test(p)) continue
    if (/^\d+(\.\d+)?分$/.test(p)) continue
    if (/^\d{4}$/.test(p)) continue
    if (/^\d+分钟$/.test(p)) continue
    if (/[一-龥]/.test(p) && p.length <= 16) {
      return p.split(/\s+/)[0]
    }
  }
  return fallback
}

export async function searchShows(
  query: string,
  options: { start?: number; count?: number; signal?: AbortSignal } = {}
): Promise<SearchItem[]> {
  const trimmed = query.trim()
  if (!trimmed) return []
  const { start = 0, count = 20, signal } = options
  const url =
    `${API_BASE}?q=${encodeURIComponent(trimmed)}` +
    `&apiKey=${API_KEY}&start=${start}&count=${count}`
  const res = await fetch(url, { signal, headers: DOUBAN_HEADERS })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = (await res.json()) as RawResponse
  return (data.items || [])
    .filter((it) => it.target && it.target.title)
    .map((it) => {
      const t = it.target!
      const subtitle = t.card_subtitle || ''
      return {
        id: t.id,
        title: t.title,
        typeName: it.type_name,
        targetType: it.target_type,
        coverUrl: t.cover_url || '',
        year: t.year || '',
        rating: t.rating?.value || 0,
        cardSubtitle: subtitle,
        genre: extractGenre(subtitle, it.type_name || '剧集'),
        hasLinewatch: t.has_linewatch === true
      }
    })
}

/**
 * Fetch the streaming vendors Douban lists for a subject.
 * Note: a vendor's `url` is not always a web address — for 腾讯视频 / 优酷 it is a
 * `douban://` mini-program link, so anything non-http is dropped.
 */
export async function fetchPlaySources(
  doubanId: string,
  type: 'tv' | 'movie'
): Promise<PlaySource[]> {
  const url = `${API_HOST}/${type}/${encodeURIComponent(doubanId)}?apiKey=${API_KEY}`
  const res = await fetch(url, { headers: DOUBAN_HEADERS })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = (await res.json()) as RawSubject
  return (data.vendors || [])
    .filter((v) => v.id && v.title && v.accessible !== false)
    .map((v) => {
      const web = v.url && /^https?:\/\//.test(v.url) ? v.url : undefined
      return {
        id: v.id!,
        title: v.title!,
        uri: v.uri || undefined,
        url: web,
        icon: v.icon || undefined,
        episodesInfo: cleanEpisodesInfo(v.episodes_info),
        paymentDesc: v.payment_desc || undefined
      }
    })
    .filter((s) => s.uri != null || s.url != null)
}
