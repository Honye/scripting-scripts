import type { Show } from './types'

const KEY = 'shows'

export function loadShows(): Show[] {
  return Storage.get<Show[]>(KEY) ?? []
}

export function saveShows(shows: Show[]) {
  Storage.set(KEY, shows)
}
