import type { AbortSignal } from 'scripting'

export type WatchStatus = 'want' | 'watching' | 'finished'

export interface Drama {
  id: string
  source: string
  sourceId: string
  title: string
  cover: string
  description: string
  category: string
  episodeCount: number
  remark: string
  tags: string[]
}

export interface Episode {
  id: string
  number: number
  title: string
}

export interface DramaDetail {
  drama: Drama
  episodes: Episode[]
}

export interface Category {
  id: string
  title: string
  route: string
  scene: string
}

export interface CatalogCursor {
  transport: 'app' | 'web'
  offset: number
  session: string
  page: number
  signature: string
}

export interface CatalogPage {
  items: Drama[]
  next: CatalogCursor | null
  warning?: string
}

export interface SearchResult {
  items: Drama[]
  warning?: string
}

export interface MediaVariant {
  url: string
  headers: Record<string, string>
  quality?: number
  decryptionKey?: string
  origin?: 'app' | 'web' | 'backup'
}

export interface MediaSource extends MediaVariant {
  alternatives?: MediaVariant[]
}

export interface DramaProvider {
  id: string
  name: string
  categories: Category[]
  catalog(category: Category, cursor: CatalogCursor | null, signal?: AbortSignal): Promise<CatalogPage>
  search(keyword: string, signal?: AbortSignal): Promise<SearchResult>
  suggestions(keyword: string, signal?: AbortSignal): Promise<string[]>
  detail(drama: Drama, signal?: AbortSignal): Promise<DramaDetail>
  resolve(drama: Drama, episode: Episode, signal?: AbortSignal): Promise<MediaSource>
  pageURL(drama: Drama, episode?: Episode): string
}

export interface FollowEntry {
  drama: Drama
  status: WatchStatus
  updatedAt: number
}

export interface HistoryEntry {
  drama: Drama
  episodeId: string
  episodeNumber: number
  position: number
  duration: number
  updatedAt: number
}

export interface Preferences {
  rate: number
  autoNext: boolean
}
