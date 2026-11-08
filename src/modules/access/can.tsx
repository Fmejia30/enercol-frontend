import { type ReactNode } from 'react'
import { meetsRequirement } from '@/modules/access/permission-requirement.ts'
import type { Permission } from '@/modules/access/permissions.ts'
import { useAuthorization } from '@/modules/access/use-authorization.ts'

type CanProps = {
  children: ReactNode
  match?: 'all' | 'any'
} & (
  | { permission: Permission; permissions?: never }
  | { permissions: readonly Permission[]; permission?: never }
)

export function Can({ children, permission, permissions, match }: CanProps) {
  const authorization = useAuthorization()
  const required = permissions ?? (permission === undefined ? [] : [permission])
  if (!meetsRequirement(authorization, { permissions: required, match })) return null
  return children
}
