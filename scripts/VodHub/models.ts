
export interface VideoItem {
  id: number
  name: string
  pic: string
  remarks: string
  score: string
  type: string
}

export interface VideoDetail extends VideoItem {
  director: string
  actor: string
  year: string
  area: string
  lang: string
  class: string
  content: string // Description
  playList: PlayGroup[]
}

export interface PlayGroup {
  name: string // e.g. "m3u8"
  urls: Episode[]
}

export interface Episode {
  name: string
  url: string
}

export interface Category {
  id?: number | string
  name: string
  subtabs?: Category[]
  hours?: string // For "Latest" tab
}

export interface PaginatedResult<T> {
  list: T[]
  total: number
  page: number
  pagecount: number
}
