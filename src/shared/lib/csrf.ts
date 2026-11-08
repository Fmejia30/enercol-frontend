type UnauthorizedHandler = (message: string) => void

let csrfToken: string | null = null
let onUnauthorized: UnauthorizedHandler | null = null

export function getCsrfToken() {
  return csrfToken
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
