import type { Authorization } from './authorization.ts'
import type { Permission } from './permissions.ts'

export type PermissionRequirement = {
  permissions: readonly Permission[]
  match?: 'all' | 'any'
}

export function meetsRequirement(
  authorization: Pick<Authorization, 'status' | 'hasPermission' | 'hasAllPermissions'>,
  requirement: PermissionRequirement,
) {
  if (authorization.status !== 'authenticated' || requirement.permissions.length === 0) return false
  if (requirement.match === 'any') {
    return requirement.permissions.some((permission) => authorization.hasPermission(permission))
  }
  return authorization.hasAllPermissions(requirement.permissions)
}

export function visibleWhenAllowed<T extends { requirement?: PermissionRequirement }>(
  items: readonly T[],
  authorization: Pick<Authorization, 'status' | 'hasPermission' | 'hasAllPermissions'>,
) {
  return items.filter((item) => item.requirement === undefined || meetsRequirement(authorization, item.requirement))
}
