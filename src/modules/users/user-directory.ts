import { roles, type Role } from '../access/roles.ts'
import { roleLabel } from '../home/dashboard-content.ts'
import { accountStatuses, type UserAccount, type UserDirectoryQuery } from './user-contract.ts'

export const directoryPageSize = 20

export type DirectoryFilters = {
  search: string
  status: string
  role: string
}

export type CursorSession = {
  cursors: Array<string | null>
  index: number
}

const accountStatusLabels: Record<(typeof accountStatuses)[number], string> = {
  UNCONFIRMED: 'Sin confirmar',
  CONFIRMED: 'Confirmada',
  ARCHIVED: 'Archivada',
  COMPROMISED: 'Comprometida',
  UNKNOWN: 'Desconocido',
  RESET_REQUIRED: 'Restablecimiento requerido',
  FORCE_CHANGE_PASSWORD: 'Cambio de contraseña',
  EXTERNAL_PROVIDER: 'Proveedor externo',
}

const invitationLabels: Record<string, string> = {
  PENDING: 'Pendiente',
  ACCEPTED: 'Aceptada',
  EXPIRED: 'Vencida',
  CANCELLED: 'Cancelada',
}

export function initialCursorSession(): CursorSession {
  return { cursors: [null], index: 0 }
}

export function currentCursor(session: CursorSession) {
  return session.cursors[session.index] ?? null
}

export function canRetreat(session: CursorSession) {
  return session.index > 0
}

export function canAdvance(session: CursorSession, nextToken: string | null) {
  return session.index < session.cursors.length - 1 || Boolean(nextToken)
}

export function moveCursor(session: CursorSession, direction: 'next' | 'previous', nextToken: string | null) {
  if (direction === 'previous') {
    if (session.index === 0) return null
    return { cursors: session.cursors, index: session.index - 1 }
  }

  const stored = session.cursors[session.index + 1]
  if (stored) return { cursors: session.cursors, index: session.index + 1 }
  if (!nextToken) return null
  return {
    cursors: [...session.cursors.slice(0, session.index + 1), nextToken],
    index: session.index + 1,
  }
}

export function directoryParams(filters: DirectoryFilters, cursor: string | null): UserDirectoryQuery {
  const search = filters.search.trim()
  return {
    pageSize: directoryPageSize,
    ...(cursor ? { nextToken: cursor } : {}),
    ...(search ? { search } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.role ? { role: filters.role } : {}),
  }
}

export function userPrimaryLabel(user: Pick<UserAccount, 'email' | 'firstName' | 'lastName' | 'profileCompleted'>) {
  if (!user.profileCompleted) return user.email ?? 'Sin correo'
  const name = [user.firstName, user.lastName].filter((part) => part && part.trim()).join(' ')
  return name || user.email || 'Sin correo'
}

export function accountStatusLabel(status: string | null) {
  if (!status) return 'Sin estado'
  if (isKnownStatus(status)) return accountStatusLabels[status]
  return status
}

export function invitationStatusLabel(status: string | null) {
  if (!status) return null
  return invitationLabels[status] ?? status
}

export function profileLabel(completed: boolean) {
  return completed ? 'Completo' : 'Pendiente'
}

export function roleFilterOptions() {
  return roles.map((role) => ({ value: role, label: roleLabel(role) }))
}

export function accountStatusOptions() {
  return accountStatuses.map((status) => ({ value: status, label: accountStatusLabels[status] }))
}

export function formatUserDate(value: string | null) {
  if (!value) return 'Sin fecha'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium' }).format(date)
}

export function isDirectoryRole(value: string): value is Role {
  return roles.some((role) => role === value)
}

export function roleClass(role: Role) {
  if (role === 'VALIDATOR') return 'border-energy-text/40 text-energy-text'
  if (role === 'ADMINISTRATOR') return 'border-navy/30 bg-sunken text-foreground'
  return undefined
}

function isKnownStatus(status: string): status is (typeof accountStatuses)[number] {
  return accountStatuses.some((item) => item === status)
}
