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
}
