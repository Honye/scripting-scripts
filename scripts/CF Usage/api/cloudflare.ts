import { errorMessage, requestJson } from './http'
import type { Result } from './http'

/**
 * Cloudflare REST + GraphQL wrappers. Required token permissions:
 *  - Account › Account Analytics › Read  (GraphQL usage data)
 *  - Account › Workers Scripts › Read    (Worker list)
 */
const API = 'https://api.cloudflare.com/client/v4'
export const GRAPHQL_URL = `${API}/graphql`

type Envelope<T> = {
  success: boolean
  result: T
  errors?: { code: number; message: string }[]
  result_info?: {
    page: number
    per_page: number
    total_pages?: number
    count: number
  }
}

export type CFAccount = { id: string; name: string }
export type CFWorker = { id: string; modified_on?: string }

async function rest<T>(
  path: string,
  token: string,
  timeoutMs?: number
): Promise<Result<T>> {
  const res = await requestJson<Envelope<T>>(`${API}${path}`, {
    token,
    timeoutMs
  })
  if (!res.ok) return res
  if (!res.value.success) {
    return { ok: false, reason: 'api', message: errorMessage(res.value) }
  }
  return { ok: true, value: res.value.result }
}

/**
 * User-owned tokens verify at `/user/tokens/verify`; account-owned tokens do
 * not, so a failure there falls through to listing accounts — if that works the
 * token is usable regardless of who owns it.
 */
export async function verifyToken(token: string): Promise<Result<CFAccount[]>> {
  const verified = await rest<{ status: string }>('/user/tokens/verify', token)
  if (verified.ok && verified.value.status !== 'active') {
    return {
      ok: false,
      reason: 'api',
      message: `Token status: ${verified.value.status}`
    }
  }
  return listAccounts(token)
}

export async function listAccounts(
  token: string
): Promise<Result<CFAccount[]>> {
  const res = await rest<CFAccount[]>('/accounts?per_page=50', token)
  if (!res.ok) return res
  return { ok: true, value: res.value.map((a) => ({ id: a.id, name: a.name })) }
}

export async function listWorkers(
  token: string,
  accountId: string
): Promise<Result<CFWorker[]>> {
  return rest<CFWorker[]>(`/accounts/${accountId}/workers/scripts`, token)
}

export type GraphQLResponse<T> = {
  data: T | null
  errors: { message: string; path?: string[] }[] | null
}

/**
 * GraphQL answers 200 even for a rejected query, with the reason in `errors`.
 * Any error with no usable data is surfaced as a failure carrying the message,
 * which is what `Diagnostics` shows and what the field fallback keys on.
 */
export async function graphql<T>(
  token: string,
  query: string,
  variables: Record<string, unknown>,
  timeoutMs?: number
): Promise<Result<T>> {
  const res = await requestJson<GraphQLResponse<T>>(GRAPHQL_URL, {
    method: 'POST',
    token,
    body: { query, variables },
    timeoutMs
  })
  if (!res.ok) return res
  const { data, errors } = res.value
  if (errors != null && errors.length > 0) {
    return {
      ok: false,
      reason: 'api',
      message: errors.map((e) => e.message).join('; ')
    }
  }
  if (data == null) return { ok: false, reason: 'parse' }
  return { ok: true, value: data }
}
