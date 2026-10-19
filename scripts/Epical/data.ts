import type { Schedule, Show } from './types'

export const TIME_OPTIONS = [
  '08:00', '10:00', '12:00', '14:00', '16:00', '17:00',
  '18:00', '19:00', '20:00', '20:30', '21:00', '22:00', '23:00'
]

/** Hex palette used to colorize new shows. Cycles for autoassignment. */
export const COLOR_PALETTE = [
  '#c0392b', '#8e44ad', '#d35400', '#27ae60', '#2980b9',
  '#a93226', '#7d3c98', '#1a5276', '#1e8449', '#6e2f7a',
  '#0e6655', '#b7950b', '#7b241c', '#1f618d', '#117a65'
]

export function getTodayIndex(): number {
  return new Date().getDay()
}

export function nextColor(existingCount: number): string {
  return COLOR_PALETTE[existingCount % COLOR_PALETTE.length]
}

/** True when the show is unfinished and airs on `day` (0 = Sunday ... 6 = Saturday). */
export function airsOnDay(show: Show, day: number): boolean {
  return !show.completed && show.schedules.some((sc) => sc.day === day)
}

/** Air time on `day`, or a sentinel that sorts last. */
export function timeForDay(show: Show, day: number): string {
  return show.schedules.find((sc) => sc.day === day)?.time ?? '99:99'
}

/**
 * Shows airing on `day`, in the user's manual order. Shows never dragged on that
 * day come after the ordered ones, sorted by air time.
 */
export function showsForDay(shows: Show[], day: number): Show[] {
  return shows
    .filter((s) => airsOnDay(s, day))
    .sort((a, b) => {
      const ao = a.dayOrder?.[day]
      const bo = b.dayOrder?.[day]
      if (ao != null && bo != null) return ao - bo
      if (ao != null) return -1
      if (bo != null) return 1
      return timeForDay(a, day).localeCompare(timeForDay(b, day))
    })
}

/** Rewrites every show's position for `day` from `orderedIds`. Other days are untouched. */
export function withDayOrder(
  shows: Show[],
  day: number,
  orderedIds: number[]
): Show[] {
  const rank = new Map(orderedIds.map((id, i) => [id, i]))
  return shows.map((s) =>
    rank.has(s.id)
      ? { ...s, dayOrder: { ...s.dayOrder, [day]: rank.get(s.id)! } }
      : s
  )
}

/** Local midnight of the day containing `t`. */
export function startOfDay(t: number): number {
  const d = new Date(t)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

/** Epoch ms of an "HH:mm" airing on the local day starting at `dayStart`. */
function slotTime(dayStart: number, time: string): number {
  const [h, m] = time.split(':').map(Number)
  const d = new Date(dayStart)
  d.setHours(h, m, 0, 0)
  return d.getTime()
}

/** Episodes aired by airings in the half-open window (from, to]. */
function airedBetween(show: Show, from: number, to: number): number {
  let n = 0
  // Step by calendar day rather than a fixed 24h so DST shifts don't skip a day.
  const d = new Date(startOfDay(from))
  while (d.getTime() <= to) {
    const dayStart = d.getTime()
    for (const sc of show.schedules) {
      if (sc.day !== d.getDay()) continue
      const slot = slotTime(dayStart, sc.time)
      if (slot > from && slot <= to) n += sc.episodes
    }
    d.setDate(d.getDate() + 1)
  }
  return n
}

/**
 * Episodes aired as of `t`, derived from the confirmed anchor and the schedule.
 * Depends only on `t`, never on watch progress.
 */
export function airedEpsAt(show: Show, t: number): number {
  const anchor = show.airedAt ?? startOfDay(Date.now())
  const base = show.airedEps ?? show.watchedEps
  const aired =
    t >= anchor
      ? base + airedBetween(show, anchor, t)
      : Math.max(0, base - airedBetween(show, t, anchor))
  // totalEps of 0 means the length is unknown, so leave it uncapped.
  return show.totalEps > 0 ? Math.min(aired, show.totalEps) : aired
}

/** Episode numbers released by `schedule`'s airing on `date`, or null once the show has fully aired. */
export function episodeRangeOn(
  show: Show,
  schedule: Schedule,
  date: Date
): { start: number; end: number } | null {
  const slot = slotTime(startOfDay(date.getTime()), schedule.time)
  const start = airedEpsAt(show, slot - 1) + 1
  let end = start + schedule.episodes - 1
  if (show.totalEps > 0) {
    if (start > show.totalEps) return null
    end = Math.min(end, show.totalEps)
  }
  return { start, end }
}

/** The date of weekday `day` (0 = Sunday) in the current week. */
export function dateForWeekday(day: number): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + day - d.getDay())
  return d
}
