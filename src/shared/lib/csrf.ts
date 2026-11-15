type UnauthorizedHandler = (message: string) => void

let csrfToken: string | null = null
let onUnauthorized: UnauthorizedHandler | null = null

export const CSRF_HEADER_NAME = 'X-CSRF-Token'

export function getCsrfToken() {
  return csrfToken
}

export function csrfHeaders(): Record<string, string> {
  const token = getCsrfToken()
  return token ? { [CSRF_HEADER_NAME]: token } : {}
}

export function setCsrfToken(token: string | null) {
  csrfToken = token
}

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null) {
  onUnauthorized = handler
}

export function notifyUnauthorized(message: string) {
  onUnauthorized?.(message)
}
