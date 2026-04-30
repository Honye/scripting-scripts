import { fetch } from 'scripting'

const API_BASE = 'https://frodo.douban.com/api/v2/search/weixin'
const API_KEY = '054022eaeae0b00e0fc068c0c0a2102a'

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
}

type RawTarget = {
  id: string
  title: string
  cover_url: string
  year?: string
  card_subtitle?: string
  rating?: { value: number }
}

type RawResponse = {
  items?: Array<{
    type_name: string
    target_type: string
    target?: RawTarget
  }>
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
  const res = await fetch(url, {
    signal,
    headers: {
      Referer: 'https://servicewechat.com/wx2f9b06c1de1ccfca/81/page-frame.html',
      'User-Agent':
        'Mozilla/5.0 (iPhone; CPU iPhone OS 14_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.2(0x18000236) NetType/WIFI Language/en'
    }
  })
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
        genre: extractGenre(subtitle, it.type_name || '剧集')
      }
    })
}
