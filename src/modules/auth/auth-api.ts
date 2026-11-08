import type { LoginValues } from '@/modules/auth/login-schema.ts'
import {
  parseContinuation,
  parseIdentity,
  parseSession,
  type AuthContinuation,
  type IdentityProfile,
  type SessionResponse,
} from '@/modules/auth/auth-contract.ts'
import { api } from '@/shared/lib/api.ts'

export type ChallengeSubmission = {
  code?: string
  newPassword?: string
  attributes?: Record<string, string>
}

export function readSession(signal?: AbortSignal) {
  return request('/auth/session', undefined, signal, parseSession)
}

export function signIn(values: LoginValues, signal?: AbortSignal) {
  return request(
    '/auth/login',
    { email: values.email, password: values.password },
    signal,
    parseContinuation,
  )
}

export function answerChallenge(
  challengeId: string,
  submission: ChallengeSubmission,
  signal?: AbortSignal,
) {
  const body: {
    challengeId: string
    code?: string
    newPassword?: string
    attributes?: Record<string, string>
  } = { challengeId }
  if (submission.code) body.code = submission.code
  if (submission.newPassword) body.newPassword = submission.newPassword
  if (submission.attributes && Object.keys(submission.attributes).length > 0) {
    body.attributes = submission.attributes
  }
  return request('/auth/challenge', body, signal, parseContinuation)
}

export function readIdentity(signal?: AbortSignal) {
  return request('/identity/me', undefined, signal, parseIdentity)
}

export async function endSession(signal?: AbortSignal) {
  await api.post('/auth/logout', undefined, { signal })
}

async function request<T>(
  url: string,
  body: unknown,
  signal: AbortSignal | undefined,
  parse: (data: unknown) => T,
): Promise<T> {
  const response =
    body === undefined
      ? await api.get<unknown>(url, { signal })
      : await api.post<unknown>(url, body, { signal })
  return parse(response.data)
}

export type { AuthContinuation, IdentityProfile, SessionResponse }
