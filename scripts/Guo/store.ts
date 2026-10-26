import { useEffect, useState } from 'scripting'
import type { Drama, Episode, FollowEntry, HistoryEntry, Preferences, WatchStatus } from './types'

export interface LibraryState {
  version: 1
  follows: FollowEntry[]
  history: HistoryEntry[]
  recentSearches: string[]
  preferences: Preferences
}

const key = 'guo.v1.library'
const listeners = new Set<() => void>()
let snapshot: LibraryState | null = null

export const statusNames: Record<WatchStatus, string> = {
  want: '想看', watching: '在看', finished: '已看'
}

export function library(): LibraryState {
  if (!snapshot) {
    const saved = Storage.get<LibraryState>(key)
    if (saved && (saved.version !== 1 || !Array.isArray(saved.follows) || !Array.isArray(saved.history) || !Array.isArray(saved.recentSearches))) {
      throw new Error('追剧数据格式无法识别，请先保留 Scripting 中的脚本数据')
    }
    snapshot = saved || {
      version: 1, follows: [], history: [], recentSearches: [],
      preferences: { rate: 1, autoNext: true }
    }
  }
  return snapshot
}

function write(value: LibraryState) {
  if (!Storage.set(key, value)) throw new Error('保存失败，请检查 Scripting 的存储空间')
  snapshot = value
  listeners.forEach(listener => listener())
}

export function useLibrary(): LibraryState {
  const [value, setValue] = useState(library)
  useEffect(() => {
    const update = () => setValue(library())
    listeners.add(update)
    update()
    return () => { listeners.delete(update) }
  }, [])
  return value
}

export function setFollow(drama: Drama, status: WatchStatus | null) {
  const state = library()
  const follows = state.follows.filter(item => item.drama.id !== drama.id)
  if (status) follows.unshift({ drama, status, updatedAt: Date.now() })
  write({ ...state, follows })
}

export function updateMetadata(drama: Drama) {
  const state = library()
  const old = state.follows.find(item => item.drama.id === drama.id)
  if (old && JSON.stringify(old.drama) !== JSON.stringify(drama)) {
    write({ ...state, follows: state.follows.map(item => item.drama.id === drama.id ? { ...item, drama } : item) })
  }
}

export function saveProgress(drama: Drama, episode: Episode, position: number, duration: number) {
  if (!Number.isFinite(position) || position <= 0) return
  const state = library()
  const updatedAt = Date.now()
  const entry: HistoryEntry = {
    drama, episodeId: episode.id, episodeNumber: episode.number,
    position, duration: Number.isFinite(duration) && duration > 0 ? duration : 0, updatedAt
  }
  const follows = state.follows.map(item => item.drama.id === drama.id
    ? { ...item, drama, status: item.status === 'want' ? 'watching' as const : item.status, updatedAt }
    : item)
  write({
    ...state, follows,
    history: [entry, ...state.history.filter(item => item.drama.id !== drama.id)].slice(0, 100)
  })
}

export function removeHistory(id?: string) {
  const state = library()
  write({ ...state, history: id ? state.history.filter(item => item.drama.id !== id) : [] })
}

export function rememberSearch(query: string) {
  const state = library()
  const value = query.normalize('NFKC').trim()
  if (!value) return
  write({ ...state, recentSearches: [value, ...state.recentSearches.filter(item => item !== value)].slice(0, 20) })
}

export function clearSearches() {
  write({ ...library(), recentSearches: [] })
}

export function setPreferences(preferences: Preferences) {
  if (![0.75, 1, 1.25, 1.5, 2].includes(preferences.rate)) throw new Error('不支持的播放速度')
  write({ ...library(), preferences })
}

export function timeLabel(seconds: number): string {
  const value = Math.max(0, Math.floor(seconds))
  return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, '0')}`
}
