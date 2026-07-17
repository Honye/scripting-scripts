import { fetch } from 'scripting'

export interface TelegraphItem {
  id: number
  /** 秒级时间戳 */
  time: number
  title: string
  content: string
  level: string
  isImportant: boolean
  url: string
}

export async function fetchTelegraph(limit = 20): Promise<TelegraphItem[]> {
  const url = `https://api.xtoors.com/api/cls/telegraph?limit=${limit}`
  const { data } = await fetch(url).then((resp) => resp.json())
  return data.items
}

/** 按正则排除条目,正则非法时不过滤 */
export function filterItems(items: TelegraphItem[], exclude: string) {
  if (!exclude) return items
  try {
    const regexp = new RegExp(exclude, 'i')
    return items.filter((item) => !regexp.test(item.title || item.content))
  } catch {
    return items
  }
}

export function formatTime(seconds: number) {
  const date = new Date(seconds * 1000)
  return `${`${date.getHours()}`.padStart(2, '0')}:${`${date.getMinutes()}`.padStart(2, '0')}`
}
