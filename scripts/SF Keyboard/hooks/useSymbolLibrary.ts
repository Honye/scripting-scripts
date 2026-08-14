import { useCallback, useEffect, useMemo, useState } from 'scripting'
import { RECENTS_KEY } from '../constants/categories'
import type { SymbolLibrary } from '../types'
import {
  addRecent,
  clearRecents,
  getRecents,
  prepareLibrary,
  searchSymbols,
  symbolsOfCategory,
} from '../utils/library'

/** 稳定的空数组，避免每次都造新对象 */
const EMPTY: string[] = []

export type SymbolLibraryState = {
  library: SymbolLibrary | null
  loading: boolean
  recents: string[]
  /** 当前分类 key */
  category: string
  setCategory: (key: string) => void
  /** 搜索词，为空表示不在搜索状态 */
  query: string
  setQuery: (q: string) => void
  /** 当前应该展示的图标列表 */
  visibleSymbols: string[]
  /** 分类顺序（含「最近」） */
  categoryKeys: string[]
  markUsed: (name: string) => void
  clearRecentSymbols: () => void
  reload: () => void
  setLibrary: (library: SymbolLibrary) => void
}

export function useSymbolLibrary(initialCategory?: string): SymbolLibraryState {
  const [library, setLibrary] = useState<SymbolLibrary | null>(null)
  const [loading, setLoading] = useState(true)
  const [recents, setRecents] = useState<string[]>(() => getRecents())
  const [category, setCategory] = useState(initialCategory ?? RECENTS_KEY)
  const [query, setQuery] = useState('')
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    prepareLibrary()
      .then(lib => {
        if (cancelled) return
        setLibrary(lib)
        setLoading(false)
      })
      .catch(e => {
        console.error('加载图标库失败', e)
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [reloadToken])

  const categoryKeys = useMemo(() => {
    if (!library) return [RECENTS_KEY]
    return [RECENTS_KEY, ...library.order]
  }, [library])

  // 「最近」为空时自动跳到第一个真实分类
  useEffect(() => {
    if (!library) return
    if (category === RECENTS_KEY && recents.length === 0 && library.order.length > 0) {
      setCategory(library.order[0])
    }
  }, [library])

  // 拆成三段是为了让数组的「身份」尽量稳定：
  // 每次点图标都会更新 recents，如果 visibleSymbols 跟着变，
  // 网格就会被判定成新数据而重建（还会把分页重置回第一页）。
  const searchResults = useMemo(
    () => (library && query.trim() ? searchSymbols(library, query) : EMPTY),
    [library, query]
  )
  const categorySymbols = useMemo(
    () => (library ? symbolsOfCategory(library, category, EMPTY) : EMPTY),
    [library, category]
  )
  const visibleSymbols = query.trim()
    ? searchResults
    : category === RECENTS_KEY
      ? recents
      : categorySymbols

  const markUsed = useCallback((name: string) => {
    setRecents(addRecent(name))
  }, [])

  const clearRecentSymbols = useCallback(() => {
    clearRecents()
    setRecents([])
  }, [])

  const reload = useCallback(() => {
    setReloadToken(v => v + 1)
  }, [])

  return {
    library,
    loading,
    recents,
    category,
    setCategory,
    query,
    setQuery,
    visibleSymbols,
    categoryKeys,
    markUsed,
    clearRecentSymbols,
    reload,
    setLibrary,
  }
}
