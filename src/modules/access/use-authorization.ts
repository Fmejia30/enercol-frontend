import { useContext } from 'react'
import { AuthorizationContext } from '@/modules/access/authorization-context.ts'

export function useAuthorization() {
  const authorization = useContext(AuthorizationContext)
  if (!authorization) throw new Error('useAuthorization debe usarse dentro de AuthorizationProvider.')
  return authorization
}
