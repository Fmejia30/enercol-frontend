import { useMemo, type ReactNode } from 'react'
import { authorizationFromAuth } from '@/modules/access/authorization.ts'
import { AuthorizationContext } from '@/modules/access/authorization-context.ts'
import { useAuth } from '@/modules/auth/use-auth.ts'

export function AuthorizationProvider({ children }: { children: ReactNode }) {
  const { snapshot } = useAuth()
  const authorization = useMemo(() => authorizationFromAuth(snapshot), [snapshot])

  return <AuthorizationContext.Provider value={authorization}>{children}</AuthorizationContext.Provider>
}
