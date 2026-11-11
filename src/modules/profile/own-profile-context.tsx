import { useEffect, useState, type ReactNode } from 'react'
import { useAuth } from '@/modules/auth/use-auth.ts'
import { OwnProfileContext, type OwnProfileState } from '@/modules/profile/use-own-profile.ts'
import { readOwnProfile } from '@/modules/users/users-api.ts'
import { isAbortError, toApiError } from '@/shared/lib/api-error.ts'

export function OwnProfileProvider({ children }: { children: ReactNode }) {
  const { snapshot } = useAuth()
  const userId = snapshot.status === 'authenticated' ? snapshot.user.id : null
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState<OwnProfileState>({ status: 'loading' })

  useEffect(() => {
    if (!userId) return
    const controller = new AbortController()
    readOwnProfile(controller.signal)
      .then((profile) => {
        if (controller.signal.aborted) return
        setState({ status: 'ready', profile })
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted || isAbortError(cause)) return
        setState({ status: 'error', error: toApiError(cause) })
      })
    return () => controller.abort()
  }, [userId, attempt])

  return (
    <OwnProfileContext.Provider
      value={{
        state,
        reload: () => setAttempt((value) => value + 1),
        replace: (profile) => setState({ status: 'ready', profile }),
      }}
    >
      {children}
    </OwnProfileContext.Provider>
  )
}
