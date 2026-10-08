import { fetchSnapshot } from './api/usage'
import { deliverAlerts } from './alerts'
import { getToken, loadAlertState, putSnapshot, saveAlertState } from './store'
import type { Result } from './api/http'
import type { Profile, UsageSnapshot } from './types'

/**
 * The fetch → cache → alert sequence, shared by the app and the widget so both
 * raise exactly the same notifications.
 */
export async function refreshProfile(
  profile: Profile,
  timeoutMs = 10000
): Promise<Result<UsageSnapshot>> {
  const token = getToken(profile.id)
  if (token == null || token === '') {
    return { ok: false, reason: 'api', message: 'No token saved' }
  }
  const res = await fetchSnapshot(profile, token, Date.now(), timeoutMs)
  if (!res.ok) return res

  putSnapshot(res.value)
  // Re-read right before writing: another surface may have alerted meanwhile.
  const state = await deliverAlerts(profile, res.value, loadAlertState())
  saveAlertState(state)
  return res
}
