const TOKEN_KEY = 'gh_secrets_token'

export function getToken(): string {
  return Storage.get<string>(TOKEN_KEY) || ''
}

export function setToken(token: string) {
  const value = token.trim()
  if (value) {
    Storage.set(TOKEN_KEY, value)
  } else {
    Storage.remove(TOKEN_KEY)
  }
}

export function hasToken(): boolean {
  return getToken().length > 0
}
