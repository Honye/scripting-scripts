export type Schedule = {
  /** 0 = Sunday ... 6 = Saturday */
  day: number
  /** "HH:mm" */
  time: string
  episodes: number
}

/** A place the show can be watched: a streaming vendor from Douban, or the user's own link. */
export type PlaySource = {
  /** Vendor id from Douban, e.g. "iqiyi" | "qq" | "youku" | "bilibili" | "miguvideo". */
  id: string
  /** Display name, e.g. "爱奇艺". */
  title: string
  /** App deep link (custom scheme). Preferred when opening. */
  uri?: string
  /** Web fallback. Only kept when it is an http(s) URL. */
  url?: string
  /** Remote vendor icon URL. */
  icon?: string
  /** e.g. "36集全" */
  episodesInfo?: string
  /** e.g. "VIP免费观看" */
  paymentDesc?: string
}

export type Show = {
  id: number
  title: string
  genre: string
  /** Hex color with no alpha, e.g. "#c0392b" */
  color: string
  schedules: Schedule[]
  totalEps: number
  watchedEps: number
  /** Optional remote poster URL (e.g. from Douban). When absent the gradient + initials fallback is used. */
  coverUrl?: string
  /** Optional play URL entered by hand. Surfaced as the "custom link" play source. */
  playUrl?: string
  /** True if the series is marked finished; hidden from calendar & widget. */
  completed?: boolean
  /** Douban subject id, kept so play sources can be refreshed later. */
  doubanId?: string
  /** Douban subject type; decides which detail endpoint to hit. */
  doubanType?: 'tv' | 'movie'
  /** Play sources discovered from Douban, in the order returned. */
  sources?: PlaySource[]
  /** Id of the preferred source; `CUSTOM_SOURCE_ID` selects `playUrl`. Falls back to the first source. */
  defaultSourceId?: string
  /** Epoch ms of the last successful source fetch. */
  sourcesUpdatedAt?: number
}
