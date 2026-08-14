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

/**
 * 分类、搜索词、待删除长度放在同一个 state 里。
 * 切分类时这三样要一起变，拆成三个 useState 的话一次交互会触发多次
 * 重渲染，每次都要重建网格 —— 这是「点了分类之后卡一下」的来源之一。
 */
type Selection = {
  category: string
  query: string
  /** 搜索词是从输入框取的，插入图标名之前要先删掉这么多个字符 */
  pendingDelete: number
}

export type SymbolLibraryState = {
  library: SymbolLibrary | null
  loading: boolean
  recents: string[]
  /** 当前分类 key */
  category: string
  /** 切换分类：会一并清掉搜索状态，只触发一次更新 */
  setCategory: (key: string) => void
  /** 搜索词，为空表示不在搜索状态 */
  query: string
  setQuery: (query: string) => void
  /** 从输入框取词搜索 */
  setSearchFromInput: (token: string) => void
  clearSearch: () => void
  pendingDelete: number
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
  const [selection, setSelection] = useState<Selection>(() => ({
    category: initialCategory ?? RECENTS_KEY,
    query: '',
    pendingDelete: 0,
  }))
  const [reloadToken, setReloadToken] = useState(0)

  const { category, query, pendingDelete } = selection

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

  const setCategory = useCallback((key: string) => {
    setSelection(prev =>
      prev.category === key && prev.query === '' && prev.pendingDelete === 0
        ? prev
        : { category: key, query: '', pendingDelete: 0 }
    )
  }, [])

  const setQuery = useCallback((next: string) => {
    setSelection(prev =>
      prev.query === next && prev.pendingDelete === 0
        ? prev
        : { ...prev, query: next, pendingDelete: 0 }
    )
  }, [])

  const setSearchFromInput = useCallback((token: string) => {
    setSelection(prev => ({ ...prev, query: token, pendingDelete: token.length }))
  }, [])

  const clearSearch = useCallback(() => {
    setSelection(prev =>
      prev.query === '' && prev.pendingDelete === 0
        ? prev
        : { ...prev, query: '', pendingDelete: 0 }
    )
  }, [])

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
    setSearchFromInput,
    clearSearch,
    pendingDelete,
    visibleSymbols,
    categoryKeys,
    markUsed,
    clearRecentSymbols,
    reload,
    setLibrary,
  }
}
