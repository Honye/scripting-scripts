/**
 * Password storage and the biometric gate in front of it.
 *
 * Design rules (spec NFR-01, FR-ACC-06/07):
 *  - **Every path to plaintext goes through `LocalAuth` first.** There is no
 *    function here that returns or copies a password without authenticating,
 *    and no branch reaches plaintext when `LocalAuth.isAvailable` is false —
 *    deliberately no bypass, per FR-ACC-07.
 *  - `copyPassword` writes straight to the pasteboard and returns nothing, for
 *    callers that only need the clipboard. `revealPassword` and
 *    `revealAndCopyPassword` do hand the plaintext back, because the UI has to
 *    render it; those callers must not persist or log it.
 *  - Nothing here is ever imported by widget.tsx (may run while locked) or by
 *    the backup module (exports must not contain passwords).
 *
 * `accessibility: 'unlocked_this_device'` rather than `'passcode'`: the stricter
 * option makes iOS delete every stored password the moment the user removes
 * their device passcode, with no way to recover them.
 */
const ACCESSIBILITY = 'unlocked_this_device' as const

/** Face ID failing over to the device passcode is the standard iOS experience. */
const USE_BIOMETRICS_ONLY = false

export type CredentialFailure = 'unavailable' | 'denied' | 'missing'

export type RevealResult =
  | { ok: true; password: string }
  | { ok: false; reason: CredentialFailure }

export type CopyResult = { ok: true } | { ok: false; reason: CredentialFailure }

function keyOf(accountId: string): string {
  return `account_pwd_${accountId}`
}

/** Whether a password exists, without reading it. */
export function hasPassword(accountId: string): boolean {
  return Keychain.contains(keyOf(accountId))
}

export function setPassword(accountId: string, password: string): boolean {
  return Keychain.set(keyOf(accountId), password, {
    accessibility: ACCESSIBILITY
  })
}

/** Must also be called when an account is deleted, or the entry is orphaned. */
export function clearPassword(accountId: string) {
  Keychain.remove(keyOf(accountId))
}

async function authenticate(reason: string): Promise<boolean> {
  if (!LocalAuth.isAvailable) return false
  try {
    return await LocalAuth.authenticate(reason, USE_BIOMETRICS_ONLY)
  } catch {
    return false
  }
}

export async function revealPassword(
  accountId: string,
  reason: string
): Promise<RevealResult> {
  if (!LocalAuth.isAvailable) return { ok: false, reason: 'unavailable' }
  if (!hasPassword(accountId)) return { ok: false, reason: 'missing' }
  if (!(await authenticate(reason))) return { ok: false, reason: 'denied' }

  const password = Keychain.get(keyOf(accountId))
  if (password == null) return { ok: false, reason: 'missing' }
  return { ok: true, password }
}

/**
 * One authentication, both outcomes: the password comes back for display and is
 * on the pasteboard by the time this resolves.
 *
 * It exists so that revealing and copying cannot drift apart into two separate
 * Face ID prompts for what the user experiences as a single action.
 */
export async function revealAndCopyPassword(
  accountId: string,
  reason: string
): Promise<RevealResult> {
  const result = await revealPassword(accountId, reason)
  if (!result.ok) return result
  await Pasteboard.setString(result.password)
  return result
}

/** Copies without handing the plaintext back to the caller. */
export async function copyPassword(
  accountId: string,
  reason: string
): Promise<CopyResult> {
  const result = await revealPassword(accountId, reason)
  if (!result.ok) return { ok: false, reason: result.reason }
  await Pasteboard.setString(result.password)
  return { ok: true }
}
