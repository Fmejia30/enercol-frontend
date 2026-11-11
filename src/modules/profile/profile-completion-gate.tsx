import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useOwnProfile } from '@/modules/profile/use-own-profile.ts'
import { profileIsComplete, profilePath, profileRouteDecision } from '@/modules/profile/profile-completion.ts'

export function ProfileCompletionGate() {
  const location = useLocation()
  const { state } = useOwnProfile()
  const complete = state.status === 'ready' && profileIsComplete(state.profile)
  const decision = profileRouteDecision(state.status, complete, location.pathname)
  if (decision === 'profile') return <Navigate to={profilePath} replace />
  return <Outlet />
}
