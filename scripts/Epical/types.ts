export type Schedule = {
  /** 0 = Sunday ... 6 = Saturday */
  day: number
  /** "HH:mm" */
  time: string
  episodes: number
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
  /** Optional play URL (e.g. streaming link). Tapping the cover opens it in the system browser. */
  playUrl?: string
}
