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

  const visibleSymbols = useMemo(() => {
    if (!library) return []
    if (query.trim()) return searchSymbols(library, query)
    return symbolsOfCategory(library, category, recents)
  }, [library, category, query, recents])

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
