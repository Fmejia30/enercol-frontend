import { useLocation } from 'react-router-dom'
import { GuardOutcome } from '@/app/guard-outcome.tsx'
import { permissionGuardDecision, type PermissionRequirement } from '@/app/route-guards.ts'
import { useAuthorization } from '@/modules/access/use-authorization.ts'

export function PermissionGuard({ requirement }: { requirement: PermissionRequirement }) {
  const authorization = useAuthorization()
  const location = useLocation()

  return (
    <GuardOutcome
      decision={permissionGuardDecision(
        authorization,
        requirement,
        `${location.pathname}${location.search}${location.hash}`,
      )}
    />
  )
}
