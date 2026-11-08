const INTERNAL_BASE = 'http://enercol.internal'

export function safeInternalPath(value: string | null | undefined, fallback = '/app'): string {
  if (typeof value !== 'string') return fallback
  const candidate = value.trim()
  if (!isInternalPath(candidate)) return fallback

  let decoded = candidate
  try {
    decoded = decodeURIComponent(candidate)
  } catch {
    return fallback
  }
  if (!isInternalPath(decoded)) return fallback

  try {
    const url = new URL(decoded, INTERNAL_BASE)
    if (url.origin !== INTERNAL_BASE) return fallback
    const path = `${url.pathname}${url.search}${url.hash}`
    if (!isInternalPath(path) || url.pathname === '/login') return fallback
    return path
  } catch {
    return fallback
  }
}

export function loginRedirect(returnPath: string): string {
  const params = new URLSearchParams({ redirect: safeInternalPath(returnPath) })
  return `/login?${params.toString()}`
}

function isInternalPath(value: string) {
  return (
    value.startsWith('/') &&
    !value.startsWith('//') &&
    !value.includes('\\') &&
    !value.includes('://') &&
    !value.includes('\0')
  )
}
