import { fetch } from 'scripting'
import { getToken } from '../storage'
import { sealBox } from '../crypto/sealedbox'

const API = 'https://api.github.com'

// The `fetch` from 'scripting' returns the host Response, which is distinct
// from the ambient DOM `Response` type. Derive the concrete type from `fetch`.
type FetchResponse = Awaited<ReturnType<typeof fetch>>

export interface Repo {
  id: number
  fullName: string
  owner: string
  name: string
  private: boolean
}

export interface SecretMeta {
  name: string
  updatedAt: string
}

interface PublicKey {
  key_id: string
  key: string
}

function headers(): Record<string, string> {
  const h: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28'
  }
  const token = getToken()
  if (token) {
    h['Authorization'] = `Bearer ${token}`
  }
  return h
}

async function errorMessage(response: FetchResponse, fallback: string): Promise<string> {
  try {
    const data = await response.json()
    return `[${response.status}] ${data?.message || fallback}`
  } catch {
    return `[${response.status}] ${fallback}`
  }
}

function mapRepo(r: any): Repo {
  return {
    id: r.id,
    fullName: r.full_name,
    owner: r.owner?.login ?? String(r.full_name).split('/')[0],
    name: r.name,
    private: !!r.private
  }
}

let accessibleReposCache: Repo[] | null = null

/**
 * Every repository the token can actually access — owner, collaborator, or
 * organization member. This is the corpus the user searches within, so results
 * are limited to repositories they have permission for (never arbitrary public
 * repos). Cached for the session; pass `force` to refetch.
 */
export async function listAccessibleRepos(force = false): Promise<Repo[]> {
  if (accessibleReposCache && !force) return accessibleReposCache
  const repos: Repo[] = []
  const perPage = 100
  let page = 1
  // Cap pages to avoid runaway loops on huge accounts.
  while (page <= 20) {
    const url = `${API}/user/repos?per_page=${perPage}&page=${page}&sort=full_name&affiliation=owner,collaborator,organization_member`
    const response = await fetch(url, { headers: headers() })
    if (!response.ok) {
      throw new Error(await errorMessage(response, 'Failed to load repositories'))
    }
    const list = (await response.json()) as any[]
    for (const r of list) repos.push(mapRepo(r))
    if (list.length < perPage) break
    page++
  }
  accessibleReposCache = repos
  return repos
}

/** Filter the accessible repositories by a free-text query (owner/name substring). */
export async function searchRepos(query: string): Promise<Repo[]> {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const repos = await listAccessibleRepos()
  return repos.filter((r) => r.fullName.toLowerCase().includes(q))
}

/** List Actions secret names + update times for a repository. */
export async function listSecrets(owner: string, repo: string): Promise<SecretMeta[]> {
  const secrets: SecretMeta[] = []
  const perPage = 100
  let page = 1
  while (page <= 20) {
    const url = `${API}/repos/${owner}/${repo}/actions/secrets?per_page=${perPage}&page=${page}`
    const response = await fetch(url, { headers: headers() })
    if (!response.ok) {
      throw new Error(await errorMessage(response, 'Failed to load secrets'))
    }
    const data = await response.json()
    const list = (data?.secrets ?? []) as any[]
    for (const s of list) {
      secrets.push({ name: s.name, updatedAt: s.updated_at })
    }
    if (list.length < perPage) break
    page++
  }
  return secrets
}

async function getRepoPublicKey(owner: string, repo: string): Promise<PublicKey> {
  const url = `${API}/repos/${owner}/${repo}/actions/secrets/public-key`
  const response = await fetch(url, { headers: headers() })
  if (!response.ok) {
    throw new Error(await errorMessage(response, 'Failed to load repository public key'))
  }
  return (await response.json()) as PublicKey
}

/**
 * Create or overwrite an Actions secret. Fetches the repo public key, encrypts
 * the value with a libsodium sealed box, then PUTs it. An optional pre-fetched
 * public key lets callers cache it across a multi-repo sync.
 */
export async function putSecret(
  owner: string,
  repo: string,
  name: string,
  value: string,
  publicKey?: PublicKey
): Promise<void> {
  const pk = publicKey ?? (await getRepoPublicKey(owner, repo))
  const encrypted = sealBox(pk.key, value)

  const url = `${API}/repos/${owner}/${repo}/actions/secrets/${encodeURIComponent(name)}`
  const response = await fetch(url, {
    method: 'PUT',
    headers: { ...headers(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ encrypted_value: encrypted, key_id: pk.key_id })
  })
  // 201 created, 204 updated
  if (response.status !== 201 && response.status !== 204) {
    throw new Error(await errorMessage(response, 'Failed to save secret'))
  }
}

export async function deleteSecret(owner: string, repo: string, name: string): Promise<void> {
  const url = `${API}/repos/${owner}/${repo}/actions/secrets/${encodeURIComponent(name)}`
  const response = await fetch(url, { method: 'DELETE', headers: headers() })
  if (response.status !== 204) {
    throw new Error(await errorMessage(response, 'Failed to delete secret'))
  }
}

/** Sync one secret value to many repos, reusing each repo's public key. */
export async function syncSecret(
  targets: Repo[],
  name: string,
  value: string,
  onProgress?: (repo: Repo, ok: boolean, error?: string) => void
): Promise<{ repo: Repo; ok: boolean; error?: string }[]> {
  const results: { repo: Repo; ok: boolean; error?: string }[] = []
  for (const target of targets) {
    try {
      await putSecret(target.owner, target.name, name, value)
      results.push({ repo: target, ok: true })
      onProgress?.(target, true)
    } catch (e) {
      const error = e instanceof Error ? e.message : String(e)
      results.push({ repo: target, ok: false, error })
      onProgress?.(target, false, error)
    }
  }
  return results
}

/** Client-side validation matching GitHub's secret name rules. */
export function isValidSecretName(name: string): boolean {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) return false
  if (/^GITHUB_/i.test(name)) return false
  return true
}
