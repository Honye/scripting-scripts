import { fetch } from 'scripting'
import type { ScriptInfo } from './db'

const TOKEN_KEY = 'github_token'

export function getToken(): string {
  return Storage.get<string>(TOKEN_KEY) || ''
}

export function setToken(token: string) {
  if (token) {
    Storage.set(TOKEN_KEY, token)
  } else {
    Storage.remove(TOKEN_KEY)
  }
}

function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json'
  }
  const token = getToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return headers
}

interface GitHubContent {
  name: string
  path: string
  type: 'file' | 'dir'
}

/**
 * Parse user input to extract owner and repo.
 * Supports:
 *   - owner/repo
 *   - https://github.com/owner/repo
 *   - https://github.com/owner/repo/...
 */
export function parseRepoInput(
  input: string
): { owner: string; repo: string } | null {
  input = input.trim()

  // Full GitHub URL
  const urlRegex = /^https?:\/\/github\.com\/([^/]+)\/([^/]+)/
  const urlMatch = input.match(urlRegex)
  if (urlMatch) {
    return { owner: urlMatch[1], repo: urlMatch[2].replace(/\.git$/, '') }
  }

  // owner/repo format
  const shortRegex = /^([^/]+)\/([^/]+)$/
  const shortMatch = input.match(shortRegex)
  if (shortMatch) {
    return { owner: shortMatch[1], repo: shortMatch[2].replace(/\.git$/, '') }
  }

  return null
}

/**
 * Fetch script.json content for a given script directory.
 */
async function fetchScriptJson(
  owner: string,
  repo: string,
  scriptDir: string
): Promise<{ color?: string; icon?: string } | null> {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/scripts/${scriptDir}/script.json`
  try {
    const response = await fetch(url, {
      headers: getHeaders()
    })
    if (!response.ok) return null

    const data = await response.json()
    const { content, encoding } = data
    let json: string | null = null
    if (encoding === 'base64') {
      json =
        Data.fromBase64String(content.replace(/\n/g, ''))?.toRawString() || null
    } else {
      json = content
    }
    if (json) {
      return JSON.parse(json)
    }
  } catch {
    // ignore
  }
  return null
}

/**
 * Fetch first-level subdirectory names under the `scripts` directory of a GitHub repo,
 * along with color and icon from each directory's script.json.
 */
export async function fetchScriptDirs(
  owner: string,
  repo: string
): Promise<ScriptInfo[]> {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/scripts`
  const response = await fetch(url, {
    headers: getHeaders()
  })

  if (!response.ok) {
    const data = await response.json()
    throw new Error(
      `[${response.status}] ${data.message || 'Failed to fetch scripts directory'}`
    )
  }

  const contents: GitHubContent[] = await response.json()
  const dirs = contents.filter((item) => item.type === 'dir')

  const results: ScriptInfo[] = []
  for (const dir of dirs) {
    const info = await fetchScriptJson(owner, repo, dir.name)
    results.push({
      name: dir.name,
      color: info?.color || null,
      icon: info?.icon || null
    })
  }

  return results
}
