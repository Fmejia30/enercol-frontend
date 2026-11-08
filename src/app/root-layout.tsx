import { Outlet } from 'react-router-dom'
import { SessionPending } from '@/app/session-pending.tsx'
import { useAuth } from '@/modules/auth/use-auth.ts'

export function RootLayout() {
  const { snapshot } = useAuth()

  if (snapshot.status === 'loading') return <SessionPending />

  return <Outlet />
}
