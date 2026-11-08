import { useLocation } from 'react-router-dom'
import { GuardOutcome } from '@/app/guard-outcome.tsx'
import { authGuardDecision } from '@/app/route-guards.ts'
import { useAuth } from '@/modules/auth/use-auth.ts'

export function AuthGuard() {
  const { snapshot } = useAuth()
  const location = useLocation()

  return (
    <GuardOutcome
      decision={authGuardDecision(snapshot.status, `${location.pathname}${location.search}${location.hash}`)}
    />
  )
}
