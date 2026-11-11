import { roleLabel } from '../home/dashboard-content.ts'
import { isRole, type Role } from '../access/roles.ts'

export const profilePath = '/app/profile'

let entryNotice: string | null = null
let profileNotice: string | null = null

export function rememberEntryNotice(message: string) {
  entryNotice = message
}

export function peekEntryNotice() {
  return entryNotice
}

export function clearEntryNotice() {
  entryNotice = null
}

export function takeEntryNotice() {
  const value = entryNotice
  entryNotice = null
  return value
}

export function peekProfileNotice() {
  return profileNotice
}

export function clearProfileNotice() {
  profileNotice = null
}

export function takeProfileNotice() {
  const value = profileNotice
  profileNotice = null
  return value
}

export function rememberProfileNotice(message: string) {
  profileNotice = message
}

export function profileIsComplete(profile: { firstName: string | null; lastName: string | null }) {
  return Boolean(profile.firstName?.trim() && profile.lastName?.trim())
}

export function profileRouteDecision(
  load: 'loading' | 'ready' | 'error',
  complete: boolean,
  pathname: string,
): 'allow' | 'profile' {
  if (!pathname.startsWith('/app')) return 'allow'
  if (pathname === profilePath) return 'allow'
  if (load !== 'ready') return 'allow'
  return complete ? 'allow' : 'profile'
}

export function navigationForProfile<T extends { to?: string }>(items: readonly T[], complete: boolean) {
  if (complete) return items.filter(() => true)
  return items.filter((item) => item.to === profilePath)
}

export function userIdentity(input: {
  firstName: string | null
  lastName: string | null
  roles: readonly string[]
  loading?: boolean
}) {
  if (input.loading) {
    return { name: 'Cargando perfil', initials: '…', roleLine: '', pending: false }
  }
  const first = input.firstName?.trim() ?? ''
  const last = input.lastName?.trim() ?? ''
  const named = first.length > 0 && last.length > 0
  return {
    name: named ? `${first} ${last}` : 'Perfil pendiente',
    initials: named ? `${first.charAt(0)}${last.charAt(0)}`.toLocaleUpperCase('es') : '–',
    roleLine: roleLine(input.roles),
    pending: !named,
  }
}

function roleLine(roles: readonly string[]) {
  const labels = roles.filter((role): role is Role => isRole(role)).map((role) => roleLabel(role))
  return labels.length > 0 ? labels.join(', ') : 'Sin rol'
}
