/**
 * Favorite apps: tags, filtering and links to accounts and records.
 *
 * Pure functions only — no Storage, no `scripting` runtime — so every rule here
 * can be asserted in Node, the same way `billing.ts` is.
 *
 * Tags are free text the user types, so equality is case-insensitive and
 * whitespace-insensitive: "Games", "games" and " games " are one tag, and the
 * spelling the user typed first is the one that is kept.
 */
import type { AppRef, Entry, EntryKind, Favorite } from './types'

/** Trimmed, inner whitespace collapsed; null when nothing is left. */
export function normalizeTag(raw: string): string | null {
  const tag = raw.trim().replace(/\s+/g, ' ')
  return tag === '' ? null : tag
}

function tagKey(tag: string): string {
  return tag.trim().replace(/\s+/g, ' ').toLowerCase()
}

export function hasTag(favorite: Favorite, tag: string): boolean {
  const key = tagKey(tag)
  return favorite.tags.some((t) => tagKey(t) === key)
}

/** Normalizes and de-duplicates a tag list, keeping the first spelling of each. */
export function cleanTags(tags: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of tags) {
    const tag = normalizeTag(raw)
    if (tag == null) continue
    const key = tag.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(tag)
  }
  return out
}

export function addTag(favorite: Favorite, tag: string): Favorite {
  return { ...favorite, tags: cleanTags([...favorite.tags, tag]) }
}

export function removeTag(favorite: Favorite, tag: string): Favorite {
  const key = tagKey(tag)
  return { ...favorite, tags: favorite.tags.filter((t) => tagKey(t) !== key) }
}

/**
 * Every tag in use, most-used first, then alphabetically. The spelling shown is
 * the first one met, so the list is stable across renders.
 */
export function allTags(favorites: Favorite[]): string[] {
  const counts = new Map<string, { tag: string; count: number }>()
  for (const favorite of favorites) {
    for (const tag of cleanTags(favorite.tags)) {
      const key = tag.toLowerCase()
      const found = counts.get(key)
      if (found == null) counts.set(key, { tag, count: 1 })
      else found.count += 1
    }
  }
  return Array.from(counts.values())
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
    .map((item) => item.tag)
}

/** Renames a tag everywhere; merges into an existing tag of the new name. */
export function renameTag(favorites: Favorite[], from: string, to: string): Favorite[] {
  const target = normalizeTag(to)
  if (target == null) return deleteTag(favorites, from)
  const key = tagKey(from)
  return favorites.map((favorite) =>
    hasTag(favorite, from)
      ? {
          ...favorite,
          tags: cleanTags(favorite.tags.map((t) => (tagKey(t) === key ? target : t)))
        }
      : favorite
  )
}

export function deleteTag(favorites: Favorite[], tag: string): Favorite[] {
  return favorites.map((favorite) =>
    hasTag(favorite, tag) ? removeTag(favorite, tag) : favorite
  )
}

export type FavoriteFilter = {
  /** Every one of these must be present — each tap narrows the list. */
  tags: string[]
  /** Only favorites with no tag at all; overrides `tags`. */
  untagged: boolean
  /** Only favorites linked to this account. */
  accountId: string | null
}

export const emptyFilter: FavoriteFilter = { tags: [], untagged: false, accountId: null }

export function isFiltering(filter: FavoriteFilter): boolean {
  return filter.tags.length > 0 || filter.untagged || filter.accountId != null
}

export function filterFavorites(favorites: Favorite[], filter: FavoriteFilter): Favorite[] {
  return favorites.filter((favorite) => {
    if (filter.accountId != null && !favorite.accountIds.includes(filter.accountId)) {
      return false
    }
    if (filter.untagged) return favorite.tags.length === 0
    return filter.tags.every((tag) => hasTag(favorite, tag))
  })
}

/** Toggles a tag in a filter; picking a tag leaves "untagged" mode. */
export function toggleFilterTag(filter: FavoriteFilter, tag: string): FavoriteFilter {
  const key = tagKey(tag)
  const on = filter.tags.some((t) => tagKey(t) === key)
  return {
    ...filter,
    untagged: false,
    tags: on ? filter.tags.filter((t) => tagKey(t) !== key) : [...filter.tags, tag]
  }
}

/** Drops filter tags no favorite carries any more, e.g. after a rename. */
export function pruneFilter(filter: FavoriteFilter, tags: string[]): FavoriteFilter {
  const live = new Set(tags.map(tagKey))
  const kept = filter.tags.filter((t) => live.has(tagKey(t)))
  return kept.length === filter.tags.length ? filter : { ...filter, tags: kept }
}

/** Newest first; name breaks ties so the order never jitters. */
export function sortFavorites(
  favorites: Favorite[],
  appRefs: Record<string, AppRef>
): Favorite[] {
  return [...favorites].sort(
    (a, b) =>
      b.createdAt - a.createdAt ||
      (appRefs[a.appId]?.name ?? a.appId).localeCompare(appRefs[b.appId]?.name ?? b.appId)
  )
}

const KIND_ORDER: Record<EntryKind, number> = { subscription: 0, iap: 1, purchase: 2 }

/**
 * Records belonging to a favorite: every record of the same app, plus those
 * linked by hand. Subscriptions first — they are the ones still costing money —
 * then in-app purchases, then the purchase of the app itself.
 */
export function linkedEntries(favorite: Favorite, entries: Entry[]): Entry[] {
  const manual = new Set(favorite.entryIds)
  return entries
    .filter((e) => e.appId === favorite.appId || manual.has(e.id))
    .sort(
      (a, b) =>
        KIND_ORDER[a.kind] - KIND_ORDER[b.kind] ||
        (b.purchasedAt ?? 0) - (a.purchasedAt ?? 0) ||
        a.title.localeCompare(b.title)
    )
}

/** Whether a record is linked only by hand, and can therefore be unlinked. */
export function isManualLink(favorite: Favorite, entry: Entry): boolean {
  return entry.appId !== favorite.appId && favorite.entryIds.includes(entry.id)
}

/**
 * Accounts that have records for this app but are not linked to it — almost
 * certainly accounts that own it, offered as a one-tap addition.
 */
export function suggestedAccountIds(favorite: Favorite, entries: Entry[]): string[] {
  const linked = new Set(favorite.accountIds)
  const out: string[] = []
  for (const entry of linkedEntries(favorite, entries)) {
    if (!linked.has(entry.accountId) && !out.includes(entry.accountId)) {
      out.push(entry.accountId)
    }
  }
  return out
}

export function unlinkAccount(favorites: Favorite[], accountId: string): Favorite[] {
  return favorites.map((f) =>
    f.accountIds.includes(accountId)
      ? { ...f, accountIds: f.accountIds.filter((id) => id !== accountId) }
      : f
  )
}

export function unlinkEntry(favorites: Favorite[], entryId: string): Favorite[] {
  return favorites.map((f) =>
    f.entryIds.includes(entryId)
      ? { ...f, entryIds: f.entryIds.filter((id) => id !== entryId) }
      : f
  )
}

export function newFavorite(appId: string, now: number = Date.now()): Favorite {
  return { appId, tags: [], accountIds: [], entryIds: [], note: '', createdAt: now }
}

/**
 * Coerces whatever a backup holds into well-formed favorites, dropping links to
 * accounts and records that are not in the same backup rather than rejecting
 * the whole file over a dangling id. Returns null when the shape is wrong.
 */
export function sanitizeFavorites(
  raw: unknown,
  accountIds: Set<string>,
  entryIds: Set<string>
): Favorite[] | null {
  if (raw == null) return []
  if (!Array.isArray(raw)) return null
  const seen = new Set<string>()
  const out: Favorite[] = []
  for (const item of raw as any[]) {
    if (item == null || typeof item !== 'object') return null
    if (typeof item.appId !== 'string' || item.appId === '') return null
    if (seen.has(item.appId)) continue
    seen.add(item.appId)
    const strings = (value: unknown): string[] =>
      Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : []
    out.push({
      appId: item.appId,
      tags: cleanTags(strings(item.tags)),
      accountIds: strings(item.accountIds).filter((id) => accountIds.has(id)),
      entryIds: strings(item.entryIds).filter((id) => entryIds.has(id)),
      note: typeof item.note === 'string' ? item.note : '',
      createdAt: typeof item.createdAt === 'number' ? item.createdAt : 0
    })
  }
  return out
}
