import type { GuardDecision } from '@/app/route-guards.ts'
import { ForbiddenPage } from '@/app/forbidden-page.tsx'
import { SessionPending } from '@/app/session-pending.tsx'
import { Navigate, Outlet } from 'react-router-dom'

export function GuardOutcome({ decision }: { decision: GuardDecision }) {
  if (decision.type === 'pending') return <SessionPending />
  if (decision.type === 'redirect') return <Navigate to={decision.to} replace />
  if (decision.type === 'deny') return <ForbiddenPage />
  return <Outlet />
}
