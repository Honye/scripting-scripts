import type { Show } from './types'

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
