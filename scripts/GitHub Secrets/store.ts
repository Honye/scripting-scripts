import { Repo } from './api/github'

const REPOS_KEY = 'gh_secrets_repos'
const SHARED_KEY = 'gh_shared_secrets'

/** A secret value shared across several repositories, persisted locally. */
export interface SharedSecret {
  id: string
  name: string
  value: string
  repos: Repo[]
  updatedAt: string
  lastSyncedAt?: string
  lastSync?: { repoId: number; ok: boolean; error?: string }[]
}

/** The user-curated list of repositories to manage. */
export function getSavedRepos(): Repo[] {
  return Storage.get<Repo[]>(REPOS_KEY) || []
}

function save(repos: Repo[]) {
  Storage.set(REPOS_KEY, repos)
}

export function addRepo(repo: Repo): Repo[] {
  const repos = getSavedRepos()
  if (!repos.some((r) => r.id === repo.id)) {
    repos.push(repo)
    repos.sort((a, b) => a.fullName.localeCompare(b.fullName))
    save(repos)
  }
  return repos
}

export function removeRepo(id: number): Repo[] {
  const repos = getSavedRepos().filter((r) => r.id !== id)
  save(repos)
  return repos
}

export function isSaved(id: number): boolean {
  return getSavedRepos().some((r) => r.id === id)
}

/** The persisted shared secrets. */
export function getSharedSecrets(): SharedSecret[] {
  return Storage.get<SharedSecret[]>(SHARED_KEY) || []
}

export function getSharedSecret(id: string): SharedSecret | undefined {
  return getSharedSecrets().find((s) => s.id === id)
}

/** Insert or replace a shared secret (matched by id). Returns the new list. */
export function upsertSharedSecret(secret: SharedSecret): SharedSecret[] {
  const list = getSharedSecrets()
  const index = list.findIndex((s) => s.id === secret.id)
  if (index >= 0) {
    list[index] = secret
  } else {
    list.push(secret)
  }
  list.sort((a, b) => a.name.localeCompare(b.name))
  Storage.set(SHARED_KEY, list)
  return list
}

export function removeSharedSecret(id: string): SharedSecret[] {
  const list = getSharedSecrets().filter((s) => s.id !== id)
  Storage.set(SHARED_KEY, list)
  return list
}
