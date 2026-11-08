import { useLocation } from 'react-router-dom'
import { GuardOutcome } from '@/app/guard-outcome.tsx'
import { guestGuardDecision } from '@/app/route-guards.ts'
import { useAuth } from '@/modules/auth/use-auth.ts'

export function GuestGuard() {
  const { snapshot } = useAuth()
  const location = useLocation()
  const requested = new URLSearchParams(location.search).get('redirect')

  return <GuardOutcome decision={guestGuardDecision(snapshot.status, requested)} />
}
