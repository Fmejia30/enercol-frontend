import type { Authorization } from '../modules/access/authorization.ts'
import {
  meetsRequirement,
  type PermissionRequirement,
} from '../modules/access/permission-requirement.ts'
import { loginRedirect, safeInternalPath } from './return-path.ts'

export type { PermissionRequirement }

export type GuardSessionStatus = 'loading' | 'authenticated' | 'unauthenticated' | 'challenge'

export type GuardDecision =
  | { type: 'pending' }
  | { type: 'allow' }
  | { type: 'redirect'; to: string }
  | { type: 'deny' }

export function authGuardDecision(status: GuardSessionStatus, returnPath: string): GuardDecision {
  if (status === 'loading') return { type: 'pending' }
  if (status === 'authenticated') return { type: 'allow' }
  return { type: 'redirect', to: loginRedirect(returnPath) }
}

export function guestGuardDecision(
  status: GuardSessionStatus,
  requestedPath: string | null,
): GuardDecision {
  if (status === 'loading') return { type: 'pending' }
  if (status !== 'authenticated') return { type: 'allow' }
  return { type: 'redirect', to: safeInternalPath(requestedPath) }
}

export function permissionGuardDecision(
  authorization: Pick<Authorization, 'status' | 'hasPermission' | 'hasAllPermissions'>,
  requirement: PermissionRequirement,
  returnPath: string,
): GuardDecision {
  if (authorization.status === 'loading') return { type: 'pending' }
  if (authorization.status !== 'authenticated') return { type: 'redirect', to: loginRedirect(returnPath) }
  return meetsRequirement(authorization, requirement) ? { type: 'allow' } : { type: 'deny' }
}
