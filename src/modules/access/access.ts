import { rolePermissions } from './role-permissions.ts'
import type { Permission } from './permissions.ts'
import { isRole, type Role } from './roles.ts'

const authorshipRestricted = new Set<Permission>([
  'reports:validate',
  'reports:reject',
  'reports:return',
])

export function hasRole(assigned: readonly string[], role: Role) {
  return assigned.includes(role)
}

export function hasPermission(assigned: readonly string[], permission: Permission) {
  for (const role of assigned) {
    if (!isRole(role)) continue
    if (rolePermissions[role].some((granted) => granted === permission)) return true
  }
  return false
}

export function canActOnReport(input: {
  roles: readonly string[]
  actorUserId: string
  authorUserId: string
  permission: Permission
}) {
  if (!hasPermission(input.roles, input.permission)) return false
  if (!authorshipRestricted.has(input.permission)) return true

  const actor = input.actorUserId.trim()
  const author = input.authorUserId.trim()
  if (!actor || !author) return false
  return actor !== author
}

export function grantedPermissions(assigned: readonly string[]) {
  const granted = new Set<Permission>()
  for (const role of assigned) {
    if (!isRole(role)) continue
    for (const permission of rolePermissions[role]) granted.add(permission)
  }
  return granted
}
