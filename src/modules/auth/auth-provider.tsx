import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  answerChallenge,
  endSession,
  readIdentity,
  readSession,
  signIn,
  type ChallengeSubmission,
} from '@/modules/auth/auth-api.ts'
import { AuthContext, type AuthContextValue, type AuthSnapshot } from '@/modules/auth/auth-context.ts'
import type { LoginValues } from '@/modules/auth/login-schema.ts'
import { isAbortError, toApiError } from '@/shared/lib/api-error.ts'
import { setCsrfToken, setUnauthorizedHandler } from '@/shared/lib/csrf.ts'

const initialSnapshot: AuthSnapshot = { status: 'loading', sessionNotice: null }

export function AuthProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<AuthSnapshot>(initialSnapshot)
  const snapshotRef = useRef(snapshot)
  const pendingTask = useRef<Promise<void> | null>(null)

  useEffect(() => {
    snapshotRef.current = snapshot
  }, [snapshot])

  useEffect(() => {
    const controller = new AbortController()
    setUnauthorizedHandler((message) => {
      if (snapshotRef.current.status !== 'authenticated') return
      setCsrfToken(null)
      const next: AuthSnapshot = {
        status: 'unauthenticated',
        sessionNotice: message || 'La sesión ya no es válida.',
      }
      snapshotRef.current = next
      setSnapshot(next)
    })

    void restore(controller.signal, setSnapshot, snapshotRef)

    return () => {
      controller.abort()
      setUnauthorizedHandler(null)
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      snapshot,
      login: (values, signal) =>
        share(pendingTask, async () => {
          if (snapshotRef.current.status === 'unauthenticated' && snapshotRef.current.sessionNotice) {
            const cleared: AuthSnapshot = { status: 'unauthenticated', sessionNotice: null }
            snapshotRef.current = cleared
            setSnapshot(cleared)
          }
          const continuation = await signIn(values, signal)
          if (signal?.aborted) return
          await adoptContinuation(continuation, signal, setSnapshot, snapshotRef)
        }),
      submitChallenge: (submission, signal) =>
        share(pendingTask, async () => {
          const current = snapshotRef.current
          if (current.status !== 'challenge') return
          const continuation = await answerChallenge(current.challenge.id, submission, signal)
          if (signal?.aborted) return
          await adoptContinuation(continuation, signal, setSnapshot, snapshotRef)
        }),
      cancelChallenge: () => {
        if (snapshotRef.current.status !== 'challenge') return
        setCsrfToken(null)
        const next: AuthSnapshot = { status: 'unauthenticated', sessionNotice: null }
        snapshotRef.current = next
        setSnapshot(next)
      },
      logout: async (signal) => {
        await endSession(signal)
        if (signal?.aborted) return
        setCsrfToken(null)
        const next: AuthSnapshot = { status: 'unauthenticated', sessionNotice: null }
        snapshotRef.current = next
        setSnapshot(next)
      },
    }),
    [snapshot],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

async function restore(
  signal: AbortSignal,
  setSnapshot: (snapshot: AuthSnapshot) => void,
  snapshotRef: { current: AuthSnapshot },
) {
  try {
    const session = await readSession(signal)
    if (signal.aborted) return
    if (!session.authenticated) {
      setCsrfToken(null)
      publish({ status: 'unauthenticated', sessionNotice: null }, setSnapshot, snapshotRef)
      return
    }
    setCsrfToken(session.csrfToken)
    const identity = await readIdentity(signal)
    if (signal.aborted) return
    if (identity.userId !== session.user.id) {
      setCsrfToken(null)
      publish(
        {
          status: 'unauthenticated',
          sessionNotice: 'La identidad no coincide con la sesión.',
        },
        setSnapshot,
        snapshotRef,
      )
      return
    }
    publish(
      {
        status: 'authenticated',
        user: session.user,
        identity,
        sessionNotice: null,
      },
      setSnapshot,
      snapshotRef,
    )
  } catch (error) {
    if (signal.aborted || isAbortError(error)) return
    setCsrfToken(null)
    publish(
      {
        status: 'unauthenticated',
        sessionNotice: toApiError(error).message,
      },
      setSnapshot,
      snapshotRef,
    )
  }
}

function publish(
  next: AuthSnapshot,
  setSnapshot: (snapshot: AuthSnapshot) => void,
  snapshotRef: { current: AuthSnapshot },
) {
  snapshotRef.current = next
  setSnapshot(next)
}

async function adoptContinuation(
  continuation: Awaited<ReturnType<typeof signIn>>,
  signal: AbortSignal | undefined,
  setSnapshot: (snapshot: AuthSnapshot) => void,
  snapshotRef: { current: AuthSnapshot },
) {
  if (!continuation.authenticated) {
    setCsrfToken(null)
    const next: AuthSnapshot = {
      status: 'challenge',
      challenge: continuation.challenge,
      sessionNotice: null,
    }
    snapshotRef.current = next
    setSnapshot(next)
    return
  }

  setCsrfToken(continuation.csrfToken)
  try {
    const identity = await readIdentity(signal)
    if (signal?.aborted) return
    if (identity.userId !== continuation.user.id) {
      setCsrfToken(null)
      const next: AuthSnapshot = {
        status: 'unauthenticated',
        sessionNotice: 'La identidad no coincide con la sesión.',
      }
      snapshotRef.current = next
      setSnapshot(next)
      return
    }
    const next: AuthSnapshot = {
      status: 'authenticated',
      user: continuation.user,
      identity,
      sessionNotice: null,
    }
    snapshotRef.current = next
    setSnapshot(next)
  } catch (error) {
    if (signal?.aborted || isAbortError(error)) return
    setCsrfToken(null)
    const next: AuthSnapshot = { status: 'unauthenticated', sessionNotice: null }
    snapshotRef.current = next
    setSnapshot(next)
    throw toApiError(error)
  }
}

function share(pendingTask: { current: Promise<void> | null }, task: () => Promise<void>) {
  if (pendingTask.current) return pendingTask.current
  const run = task().finally(() => {
    pendingTask.current = null
  })
  pendingTask.current = run
  return run
}

export type { ChallengeSubmission, LoginValues }
