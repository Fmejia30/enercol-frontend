import { z } from 'zod'
import { knownRoles, type Role } from '../access/roles.ts'
import { ApiError } from '../../shared/lib/api-error.ts'

export type UserRole = Role

export const accountStatuses = [
  'UNCONFIRMED',
  'CONFIRMED',
  'ARCHIVED',
  'COMPROMISED',
  'UNKNOWN',
  'RESET_REQUIRED',
  'FORCE_CHANGE_PASSWORD',
  'EXTERNAL_PROVIDER',
] as const

export const invitationStatuses = ['PENDING', 'ACCEPTED', 'EXPIRED', 'CANCELLED'] as const

const userAccountSchema = z.object({
  id: z.string().min(1),
  email: z.string().nullable(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  phoneNumber: z.string().nullable(),
  roles: z.array(z.unknown()).transform(knownRoles),
  accountStatus: z.string().nullable(),
  enabled: z.boolean(),
  profileCompleted: z.boolean(),
  invitationStatus: z.string().nullable(),
  createdAt: z.string().nullable(),
  lastModifiedAt: z.string().nullable(),
})

const userDetailSchema = userAccountSchema.extend({
  groups: z.array(z.string()),
})

const directorySchema = z.object({
  users: z.array(userAccountSchema),
  nextToken: z.string().nullable(),
})

export type UserAccount = z.infer<typeof userAccountSchema>
export type UserAccountDetail = z.infer<typeof userDetailSchema>
export type UserDirectoryResponse = z.infer<typeof directorySchema>

export type UserDirectoryQuery = {
  pageSize: number
  nextToken?: string
  search?: string
  status?: string
  role?: string
}

export function parseUserDirectory(data: unknown): UserDirectoryResponse {
  return parse(directorySchema, data)
}

const invitedUserSchema = z.object({
  id: z.string().min(1),
  email: z.string().min(1),
  roles: z.array(z.unknown()).transform(knownRoles),
  status: z.string(),
  expiresAt: z.string(),
})

export type InvitedUser = z.infer<typeof invitedUserSchema>

export type UserUpdateBody = {
  firstName?: string
  lastName?: string
  phoneNumber?: string
  roles?: UserRole[]
}

export function parseUserDetail(data: unknown): UserAccountDetail {
  return parse(userDetailSchema, data)
}

export function parseInvitedUser(data: unknown): InvitedUser {
  return parse(invitedUserSchema, data)
}

const ownProfileSchema = z.object({
  id: z.string().min(1),
  email: z.string().nullable(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  phoneNumber: z.string().nullable(),
  roles: z.array(z.unknown()).transform(knownRoles),
  profileCompleted: z.boolean(),
})

export type OwnProfile = z.infer<typeof ownProfileSchema>

export type OwnProfileBody = {
  firstName?: string
  lastName?: string
  phoneNumber?: string
}

export function parseOwnProfile(data: unknown): OwnProfile {
  return parse(ownProfileSchema, data)
}

function parse<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data)
  if (!result.success) {
    throw new ApiError('La respuesta del servidor no tiene el formato esperado.', null)
  }
  return result.data
}
