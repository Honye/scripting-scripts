import type { Profile } from './types'

/**
 * Parses `Widget.parameter` into what the widget should show. Pure, so the
 * matching rules can be checked without a device.
 *
 * Entries are separated by commas, semicolons, `|` or newlines (full-width
 * `，` / `；` too, since that is what a Chinese keyboard types):
 *
 *   ""                         → the first account
 *   "Personal"                 → that account (alias, else Cloudflare name; case-insensitive)
 *   "Personal/my-api"          → one Worker of that account
 *   "Personal, Work"           → both accounts
 *   "Personal, Work/my-api"    → an account and a Worker, mixed freely
 *   "*"                        → every account
 *
 * Unknown names are skipped and duplicates collapse. If nothing matched at all,
 * the first account is shown rather than an empty widget — a typo should still
 * display something.
 */
export type Target = { profile: Profile; script?: string }

const SEPARATORS = /[,，;；|\n]+/

function findProfile(profiles: Profile[], name: string): Profile | undefined {
  const lower = name.toLowerCase()
  return (
    profiles.find((p) => p.alias.toLowerCase() === lower) ??
    profiles.find((p) => p.accountName.toLowerCase() === lower)
  )
}

export function parseTargets(param: string, profiles: Profile[]): Target[] {
  if (profiles.length === 0) return []

  const targets: Target[] = []
  const seen = new Set<string>()
  const add = (target: Target) => {
    const key = `${target.profile.id}/${target.script ?? ''}`
    if (seen.has(key)) return
    seen.add(key)
    targets.push(target)
  }

  const entries = param
    .split(SEPARATORS)
    .map((e) => e.trim())
    .filter((e) => e !== '')

  for (const entry of entries) {
    if (entry === '*') {
      profiles.forEach((profile) => add({ profile }))
      continue
    }
    const slash = entry.indexOf('/')
    const name = (slash >= 0 ? entry.slice(0, slash) : entry).trim()
    const script = slash >= 0 ? entry.slice(slash + 1).trim() : ''
    const profile = findProfile(profiles, name)
    if (profile == null) continue
    add(script === '' ? { profile } : { profile, script })
  }

  return targets.length > 0 ? targets : [{ profile: profiles[0] }]
}
