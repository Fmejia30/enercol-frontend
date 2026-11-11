import { createContext, useContext } from 'react'
import type { OwnProfile } from '../users/user-contract.ts'
import type { ApiError } from '../../shared/lib/api-error.ts'

export type OwnProfileState =
  | { status: 'loading' }
  | { status: 'ready'; profile: OwnProfile }
  | { status: 'error'; error: ApiError }

export type OwnProfileContextValue = {
  state: OwnProfileState
  reload: () => void
  replace: (profile: OwnProfile) => void
}

export const OwnProfileContext = createContext<OwnProfileContextValue | null>(null)

export function useOwnProfile() {
  const value = useContext(OwnProfileContext)
  if (!value) throw new Error('useOwnProfile debe usarse dentro de OwnProfileProvider.')
  return value
}
