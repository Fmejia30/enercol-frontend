import { z } from 'zod'
import { knownRoles } from '@/modules/access/roles.ts'
import { ApiError } from '@/shared/lib/api-error.ts'

export const supportedChallenges = [
  'NEW_PASSWORD_REQUIRED',
  'SMS_MFA',
  'SOFTWARE_TOKEN_MFA',
  'EMAIL_OTP',
  'MFA_SETUP',
] as const

const rolesField = z.array(z.unknown()).transform(knownRoles)

const sessionUserSchema = z.object({
  id: z.string().min(1),
  email: z.string().nullable(),
  roles: rolesField,
})

const challengeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  requiredAttributes: z.array(z.string()),
  secretCode: z.string().min(1).optional(),
})

const sessionSchema = z.discriminatedUnion('authenticated', [
  z.object({
    authenticated: z.literal(true),
    csrfToken: z.string().min(1),
    user: sessionUserSchema,
  }),
  z.object({
    authenticated: z.literal(false),
  }),
])

const continuationSchema = z.discriminatedUnion('authenticated', [
  z.object({
    authenticated: z.literal(true),
    csrfToken: z.string().min(1),
    user: sessionUserSchema,
  }),
  z.object({
    authenticated: z.literal(false),
    challenge: challengeSchema,
  }),
])

const identitySchema = z.object({
  userId: z.string().min(1),
  roles: rolesField,
})

export type SessionUser = z.infer<typeof sessionUserSchema>
export type AuthChallenge = z.infer<typeof challengeSchema>
export type SessionResponse = z.infer<typeof sessionSchema>
export type AuthContinuation = z.infer<typeof continuationSchema>
export type IdentityProfile = z.infer<typeof identitySchema>
export type SupportedChallenge = (typeof supportedChallenges)[number]

export function isSupportedChallenge(name: string): name is SupportedChallenge {
  return supportedChallenges.some((challenge) => challenge === name)
}

export function parseSession(data: unknown): SessionResponse {
  return parse(sessionSchema, data)
}

export function parseContinuation(data: unknown): AuthContinuation {
  return parse(continuationSchema, data)
}

export function parseIdentity(data: unknown): IdentityProfile {
  return parse(identitySchema, data)
}

function parse<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data)
  if (!result.success) {
    throw new ApiError('La respuesta del servidor no tiene el formato esperado.', null)
  }
  return result.data
}
