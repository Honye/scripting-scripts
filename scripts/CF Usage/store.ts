/**
 * Persistence layer. Business code calls these domain functions, never
 * `Storage` / `Keychain` directly.
 *
 * Plain `Storage` (no `{ shared: true }`): index.tsx and widget.tsx belong to
 * this one script and share its private domain.
 *
 * Tokens live in the Keychain with the default `first_unlock_this_device`
 * accessibility. Unlike Storefront's passwords there is no biometric gate in
 * front of them: the widget has to call the API on its own to raise alerts, and
 * the token is meant to be a read-only analytics token.
 */
import { defaultLimits, defaultThresholds } from './types'
import type { AlertState, Profile, UsageSnapshot } from './types'

const KEY_PROFILES = 'profiles'
const KEY_SNAPSHOTS = 'snapshots'
const KEY_ALERTS = 'alertState'

const tokenKey = (profileId: string) => `token.${profileId}`

export function loadProfiles(): Profile[] {
  const stored = Storage.get<Profile[]>(KEY_PROFILES) ?? []
  return stored
    .map(
      (p: Profile): Profile => ({
        ...p,
        limits: { ...defaultLimits, ...(p.limits ?? {}) },
        thresholds: p.thresholds ?? defaultThresholds,
        watched: p.watched ?? [],
        billingDay: p.billingDay ?? 1
      })
    )
    .sort((a: Profile, b: Profile) => a.sortIndex - b.sortIndex)
}

export function saveProfiles(profiles: Profile[]) {
  Storage.set(KEY_PROFILES, profiles)
}

export function loadSnapshots(): Record<string, UsageSnapshot> {
  return Storage.get<Record<string, UsageSnapshot>>(KEY_SNAPSHOTS) ?? {}
}

export function saveSnapshots(snapshots: Record<string, UsageSnapshot>) {
  Storage.set(KEY_SNAPSHOTS, snapshots)
}

/** Read-modify-write so the app and the widget do not clobber each other's profiles. */
export function putSnapshot(snapshot: UsageSnapshot) {
  const all = loadSnapshots()
  all[snapshot.profileId] = snapshot
  saveSnapshots(all)
}

export function loadAlertState(): AlertState {
  return Storage.get<AlertState>(KEY_ALERTS) ?? {}
}

export function saveAlertState(state: AlertState) {
  Storage.set(KEY_ALERTS, state)
}

export function getToken(profileId: string): string | null {
  try {
    return Keychain.get(tokenKey(profileId))
  } catch {
    return null
  }
}

export function setToken(profileId: string, token: string): boolean {
  return Keychain.set(tokenKey(profileId), token)
}

/** Drops everything stored for a profile, token included. */
export function forgetProfile(profileId: string) {
  try {
    Keychain.remove(tokenKey(profileId))
  } catch {
    // Already gone.
  }
  const snapshots = loadSnapshots()
  delete snapshots[profileId]
  saveSnapshots(snapshots)
  const alerts = loadAlertState()
  delete alerts[profileId]
  saveAlertState(alerts)
}
