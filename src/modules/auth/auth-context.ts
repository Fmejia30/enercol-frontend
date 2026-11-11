import { createContext } from 'react'
import type { LoginValues } from '@/modules/auth/login-schema.ts'
import type { ChallengeSubmission } from '@/modules/auth/auth-api.ts'
import type { AuthChallenge, IdentityProfile, SessionUser } from '@/modules/auth/auth-contract.ts'

export type AuthSnapshot =
  | { status: 'loading'; sessionNotice: null }
  | { status: 'unauthenticated'; sessionNotice: string | null }
  | {
      status: 'authenticated'
      user: SessionUser
      identity: IdentityProfile
      sessionNotice: null
    }
  | { status: 'challenge'; challenge: AuthChallenge; sessionNotice: null }

export type AuthContextValue = {
  snapshot: AuthSnapshot
  login: (values: LoginValues, signal?: AbortSignal) => Promise<void>
  submitChallenge: (submission: ChallengeSubmission, signal?: AbortSignal, beforePublish?: () => Promise<void>) => Promise<void>
  cancelChallenge: (notice?: string) => void
  logout: (signal?: AbortSignal) => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
