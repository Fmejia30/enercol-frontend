import { z } from 'zod'
import { roles, type Role } from '../access/roles.ts'
import type { ApiError } from '../../shared/lib/api-error.ts'
import type { UserAccount, UserAccountDetail, UserDirectoryResponse, UserUpdateBody } from './user-contract.ts'

const excludedControls = `${String.fromCharCode(0)}-${String.fromCharCode(31)}${String.fromCharCode(127)}`
export const userNamePattern = new RegExp(`^[^${excludedControls}]{1,80}$`)
export const userPhonePattern = /^\+?[0-9][0-9\s()-]{6,18}$/

const nameMessage = 'Ingrese entre 1 y 80 caracteres, sin saltos ni caracteres de control.'
const phoneMessage = 'Ingrese un teléfono de 7 a 20 caracteres. Puede incluir +, espacios, guiones o paréntesis.'
const roleMessage = 'Seleccione al menos un rol.'
const unchangedMessage = 'No hay cambios para guardar.'
const profileMessage = 'Para crear el perfil se requieren nombre, apellido y teléfono.'

export const inviteUserSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Ingrese el correo electrónico.')
    .max(320, 'El correo electrónico es demasiado largo.')
    .pipe(z.email('Ingrese un correo electrónico válido.')),
  roles: z
    .array(z.enum(roles))
    .min(1, roleMessage)
    .refine((value) => new Set(value).size === value.length, 'Seleccione cada rol una sola vez.'),
})

export type InviteUserValues = z.infer<typeof inviteUserSchema>

export type UserProfileDraft = {
  firstName: string
  lastName: string
  phoneNumber: string
  roles: Role[]
}

export type UserUpdateField = 'firstName' | 'lastName' | 'phoneNumber' | 'roles' | 'form'

export type UserUpdateResult =
  | { ok: true; body: UserUpdateBody }
  | { ok: false; field: UserUpdateField; message: string }

type PersonalField = 'firstName' | 'lastName' | 'phoneNumber'

export function userUpdateBody(
  current: Pick<UserAccount, 'firstName' | 'lastName' | 'phoneNumber' | 'roles' | 'profileCompleted'>,
  draft: UserProfileDraft,
): UserUpdateResult {
  if (draft.roles.length === 0 || draft.roles.some((role) => !roles.includes(role))) {
    return { ok: false, field: 'roles', message: roleMessage }
  }
  if (new Set(draft.roles).size !== draft.roles.length) {
    return { ok: false, field: 'roles', message: 'Seleccione cada rol una sola vez.' }
  }

  const next = {
    firstName: draft.firstName.trim(),
    lastName: draft.lastName.trim(),
    phoneNumber: draft.phoneNumber.trim(),
  }
  const previous = {
    firstName: current.firstName?.trim() ?? '',
    lastName: current.lastName?.trim() ?? '',
    phoneNumber: current.phoneNumber?.trim() ?? '',
  }
  const personalChanged = (Object.keys(next) as PersonalField[]).some((field) => next[field] !== previous[field])
  const body: UserUpdateBody = {}

  if (!current.profileCompleted && personalChanged) {
    const missing = (Object.keys(next) as PersonalField[]).find((field) => next[field].length === 0)
    if (missing) return { ok: false, field: missing, message: profileMessage }
    const invalid = invalidPersonal(next)
    if (invalid) return invalid
    body.firstName = next.firstName
    body.lastName = next.lastName
    body.phoneNumber = next.phoneNumber
  } else if (personalChanged) {
    for (const field of Object.keys(next) as PersonalField[]) {
      if (next[field] === previous[field]) continue
      const invalid = invalidPersonal({ [field]: next[field] })
      if (invalid) return invalid
      body[field] = next[field]
    }
  }

  if (!sameRoles(current.roles, draft.roles)) body.roles = [...draft.roles]
  if (body.firstName === undefined && body.lastName === undefined && body.phoneNumber === undefined && !body.roles) {
    return { ok: false, field: 'form', message: unchangedMessage }
  }
  return { ok: true, body }
}

export function editUserSchema(
  current: Pick<UserAccount, 'firstName' | 'lastName' | 'phoneNumber' | 'roles' | 'profileCompleted'>,
) {
  return z
    .object({
      firstName: z.string(),
      lastName: z.string(),
      phoneNumber: z.string(),
      roles: z.array(z.enum(roles)),
    })
    .superRefine((draft, ctx) => {
      const result = userUpdateBody(current, draft)
      if (result.ok || result.field === 'form') return
      ctx.addIssue({
        code: 'custom',
        message: result.message,
        path: [result.field],
      })
    })
}

export function replaceDirectoryUser(page: UserDirectoryResponse, detail: UserAccountDetail): UserDirectoryResponse {
  return {
    ...page,
    users: page.users.map((user) => (user.id === detail.id ? accountFromDetail(detail) : user)),
  }
}

export function accountFromDetail(detail: UserAccountDetail): UserAccount {
  return {
    id: detail.id,
    email: detail.email,
    firstName: detail.firstName,
    lastName: detail.lastName,
    phoneNumber: detail.phoneNumber,
    roles: detail.roles,
    accountStatus: detail.accountStatus,
    enabled: detail.enabled,
    profileCompleted: detail.profileCompleted,
    invitationStatus: detail.invitationStatus,
    createdAt: detail.createdAt,
    lastModifiedAt: detail.lastModifiedAt,
  }
}

export function inviteFailure(error: ApiError) {
  if (error.status === 409) return { title: 'Correo ya registrado', message: error.message, field: 'email' as const }
  if (error.status === 403) return { title: 'Sin autorización', message: error.message, field: null }
  if (error.status === 503) return { title: 'Invitación no disponible', message: error.message, field: null }
  if (error.status === 400) return { title: 'Datos no válidos', message: error.message, field: null }
  if (error.status === null) return { title: 'Sin conexión', message: error.message, field: null }
  return { title: 'No fue posible crear el usuario', message: error.message, field: null }
}

export function updateFailure(error: ApiError) {
  if (error.status === 403) return { title: 'Sin autorización', message: error.message }
  if (error.status === 404) return { title: 'Usuario no encontrado', message: error.message }
  if (error.status === 400) return { title: 'Datos no válidos', message: error.message }
  if (error.status === 503) return { title: 'Actualización no disponible', message: error.message }
  if (error.status === null) return { title: 'Sin conexión', message: error.message }
  return { title: 'No fue posible actualizar el usuario', message: error.message }
}

export function statusFailure(error: ApiError) {
  if (error.status === 403) return { title: 'Acción no permitida', message: error.message }
  if (error.status === 404) return { title: 'Usuario no encontrado', message: error.message }
  if (error.status === 503) return { title: 'Cambio de estado no disponible', message: error.message }
  if (error.status === null) return { title: 'Sin conexión', message: error.message }
  return { title: 'No fue posible actualizar el estado', message: error.message }
}

function invalidPersonal(values: Partial<Record<PersonalField, string>>): UserUpdateResult | null {
  if (values.firstName !== undefined && !userNamePattern.test(values.firstName)) {
    return { ok: false, field: 'firstName', message: nameMessage }
  }
  if (values.lastName !== undefined && !userNamePattern.test(values.lastName)) {
    return { ok: false, field: 'lastName', message: nameMessage }
  }
  if (values.phoneNumber !== undefined && !phoneOk(values.phoneNumber)) {
    return { ok: false, field: 'phoneNumber', message: phoneMessage }
  }
  return null
}

function phoneOk(value: string) {
  return value.length >= 7 && value.length <= 20 && userPhonePattern.test(value)
}

function sameRoles(current: readonly Role[], next: readonly Role[]) {
  const left = [...current].sort()
  const right = [...next].sort()
  return left.length === right.length && left.every((role, index) => role === right[index])
}
