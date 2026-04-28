import type { Show } from './types'
import { SEED_SHOWS } from './data'

const KEY = 'shows'

export function loadShows(): Show[] {
  const stored = Storage.get<Show[]>(KEY)
  if (stored == null) {
    Storage.set(KEY, SEED_SHOWS)
    return SEED_SHOWS
  }
  return stored
}

export function saveShows(shows: Show[]) {
  Storage.set(KEY, shows)
}
