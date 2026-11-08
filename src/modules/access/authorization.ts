import {
  canActOnReport as actorCanActOnReport,
  grantedPermissions,
  hasPermission as actorHasPermission,
  hasRole as actorHasRole,
} from './access.ts'
import { permissions, type Permission } from './permissions.ts'
import { knownRoles, type Role } from './roles.ts'

export type AuthorizationStatus = 'loading' | 'authenticated' | 'unauthenticated'

export type Authorization = {
  status: AuthorizationStatus
  roles: readonly Role[]
  permissions: readonly Permission[]
  hasRole: (role: Role) => boolean
  hasAnyRole: (roles: readonly Role[]) => boolean
  hasPermission: (permission: Permission) => boolean
  hasAllPermissions: (permissions: readonly Permission[]) => boolean
  canActOnReport: (authorUserId: string, permission: Permission) => boolean
}

type AuthView =
  | { status: 'loading' }
  | { status: 'unauthenticated' }
  | { status: 'challenge' }
  | { status: 'authenticated'; identity: { userId: string; roles: readonly string[] } }

export function authorizationFromAuth(snapshot: AuthView): Authorization {
  if (snapshot.status !== 'authenticated') {
    return closed(snapshot.status === 'loading' ? 'loading' : 'unauthenticated')
  }

  const assigned = knownRoles(snapshot.identity.roles)
  const granted = grantedPermissions(assigned)
  const effective = permissions.filter((permission) => granted.has(permission))
  const actorUserId = snapshot.identity.userId

  return {
    status: 'authenticated',
    roles: assigned,
    permissions: effective,
    hasRole: (role) => actorHasRole(assigned, role),
    hasAnyRole: (requested) => requested.some((role) => actorHasRole(assigned, role)),
    hasPermission: (permission) => isListed(permission) && actorHasPermission(assigned, permission),
    hasAllPermissions: (requested) =>
      requested.every((permission) => isListed(permission) && granted.has(permission)),
    canActOnReport: (authorUserId, permission) =>
      isListed(permission) &&
      actorCanActOnReport({
        roles: assigned,
        actorUserId,
        authorUserId,
        permission,
      }),
  }
}

function closed(status: 'loading' | 'unauthenticated'): Authorization {
  return {
    status,
    roles: [],
    permissions: [],
    hasRole: () => false,
    hasAnyRole: () => false,
    hasPermission: () => false,
    hasAllPermissions: () => false,
    canActOnReport: () => false,
  }
}

function isListed(permission: Permission) {
  return permissions.some((listed) => listed === permission)
}
