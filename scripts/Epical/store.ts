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

/** What every Epical widget lists: today's airings, or aired episodes not yet watched. */
export type WidgetMode = 'today' | 'unwatched'

const WIDGET_MODE_KEY = 'widgetMode'

export function loadWidgetMode(): WidgetMode {
  return Storage.get<string>(WIDGET_MODE_KEY) === 'unwatched'
    ? 'unwatched'
    : 'today'
}

export function saveWidgetMode(mode: WidgetMode) {
  Storage.set(WIDGET_MODE_KEY, mode)
}
