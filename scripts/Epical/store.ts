import type { Show } from './types'
import { startOfDay } from './data'

const KEY = 'shows'

export function loadShows(): Show[] {
  const shows = Storage.get<Show[]>(KEY) ?? []
  // Shows saved before the aired anchor existed: assume everything before today
  // was watched, which matches what they displayed. Persist it right away so
  // the anchor stays fixed and the aired count advances only with the date.
  if (!shows.some((s) => s.airedAt == null)) return shows
  const today = startOfDay(Date.now())
  const migrated = shows.map((s) =>
    s.airedAt == null ? { ...s, airedEps: s.watchedEps, airedAt: today } : s
  )
  saveShows(migrated)
  return migrated
}

export function saveShows(shows: Show[]) {
  Storage.set(KEY, shows)
}
