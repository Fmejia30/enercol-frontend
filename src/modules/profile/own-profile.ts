import { z } from 'zod'
import type { ApiError } from '../../shared/lib/api-error.ts'
import { userNamePattern, userPhonePattern } from '../users/user-administration.ts'
import type { OwnProfile, OwnProfileBody } from '../users/user-contract.ts'

const nameMessage = 'Ingrese entre 1 y 80 caracteres, sin saltos ni caracteres de control.'
const phoneMessage = 'Ingrese un teléfono de 7 a 20 caracteres. Puede incluir +, espacios, guiones o paréntesis.'
const unchangedMessage = 'No hay cambios para guardar.'
const firstNameMessage = 'Ingrese su nombre.'
const lastNameMessage = 'Ingrese su apellido.'

export type OwnProfileDraft = {
  firstName: string
  lastName: string
  phoneNumber: string
}

export type OwnProfileField = keyof OwnProfileDraft | 'form'

export type OwnProfileResult =
  | { ok: true; body: OwnProfileBody }
  | { ok: false; field: OwnProfileField; message: string }

type PersonalField = keyof OwnProfileDraft

export function ownProfileBody(
  current: Pick<OwnProfile, 'firstName' | 'lastName' | 'phoneNumber' | 'profileCompleted'>,
  draft: OwnProfileDraft,
): OwnProfileResult {
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
  const changed = (Object.keys(next) as PersonalField[]).filter((field) => next[field] !== previous[field])

  if (!current.profileCompleted) {
    if (!next.firstName) return { ok: false, field: 'firstName', message: firstNameMessage }
    if (!next.lastName) return { ok: false, field: 'lastName', message: lastNameMessage }
    const invalid = invalidPersonal({
      firstName: next.firstName,
      lastName: next.lastName,
      ...(next.phoneNumber ? { phoneNumber: next.phoneNumber } : {}),
    })
    if (invalid) return invalid
    const body: OwnProfileBody = { firstName: next.firstName, lastName: next.lastName }
    if (next.phoneNumber) body.phoneNumber = next.phoneNumber
    return { ok: true, body }
  }

  if (changed.length === 0) return { ok: false, field: 'form', message: unchangedMessage }
  const body: OwnProfileBody = {}
  for (const field of changed) {
    const invalid = invalidPersonal({ [field]: next[field] })
    if (invalid) return invalid
    body[field] = next[field]
  }
  return { ok: true, body }
}

export function ownProfileSchema(
  current: Pick<OwnProfile, 'firstName' | 'lastName' | 'phoneNumber' | 'profileCompleted'>,
) {
  return z
    .object({
      firstName: z.string(),
      lastName: z.string(),
      phoneNumber: z.string(),
    })
    .superRefine((draft, ctx) => {
      const result = ownProfileBody(current, draft)
      if (result.ok || result.field === 'form') return
      ctx.addIssue({ code: 'custom', message: result.message, path: [result.field] })
    })
}

export function ownProfileReadFailure(error: ApiError) {
  if (error.status === 401) return { title: 'Sesión no válida', message: error.message }
  if (error.status === 503) return { title: 'Perfil no disponible', message: error.message }
  if (error.status === null) return { title: 'Sin conexión', message: error.message }
  return { title: 'No fue posible consultar el perfil', message: error.message }
}

export function ownProfileUpdateFailure(error: ApiError) {
  if (error.status === 400) return { title: 'Datos no válidos', message: error.message }
  if (error.status === 401) return { title: 'Sesión no válida', message: error.message }
  if (error.status === 503) return { title: 'No fue posible actualizar el perfil', message: error.message }
  if (error.status === null) return { title: 'Sin conexión', message: error.message }
  return { title: 'No fue posible actualizar el perfil', message: error.message }
}

function invalidPersonal(values: Partial<Record<PersonalField, string>>): OwnProfileResult | null {
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
