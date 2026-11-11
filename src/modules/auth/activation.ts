import { z } from 'zod'
import type { ApiError } from '../../shared/lib/api-error.ts'
import type { AuthContinuation } from './auth-contract.ts'
import { userNamePattern, userPhonePattern } from '../users/user-administration.ts'

export const activationTitle = 'Activa tu cuenta'
export const activationDescription =
  'Indique su nombre y establezca una contraseña personal para completar la activación de su cuenta y comenzar a utilizar EnerCol.'

const passwordPolicyMessage = 'La contraseña no cumple la política de seguridad'
const invalidActivationMessage = 'La solicitud de activación no es válida'
const unavailableMessage = 'No fue posible completar la autenticación. Inténtelo más tarde.'

export type ActivationFailure = {
  kind: 'retry' | 'attributes' | 'expired' | 'unavailable' | 'generic'
  title: string
  message: string
  returnToLogin: boolean
}

const nameMessage = 'Ingrese entre 1 y 80 caracteres, sin saltos ni caracteres de control.'
const phoneMessage = 'Ingrese un teléfono de 7 a 20 caracteres. Puede incluir +, espacios, guiones o paréntesis.'

export type ActivationDraft = {
  firstName: string
  lastName: string
  phoneNumber: string
  newPassword: string
  confirmPassword: string
  attributes: Record<string, string>
}

export function activationSchema(requiredAttributes: readonly string[]) {
  return z
    .object({
      firstName: z.string(),
      lastName: z.string(),
      phoneNumber: z.string(),
      newPassword: z
        .string()
        .min(1, 'Ingrese la nueva contraseña.')
        .max(256, 'La contraseña admite hasta 256 caracteres.'),
      confirmPassword: z.string(),
      attributes: z.record(z.string(), z.string()),
    })
    .superRefine((value, context) => {
      const firstName = value.firstName.trim()
      const lastName = value.lastName.trim()
      const phoneNumber = value.phoneNumber.trim()
      if (!firstName) {
        context.addIssue({ code: 'custom', path: ['firstName'], message: 'Ingrese su nombre.' })
      } else if (!userNamePattern.test(firstName)) {
        context.addIssue({ code: 'custom', path: ['firstName'], message: nameMessage })
      }
      if (!lastName) {
        context.addIssue({ code: 'custom', path: ['lastName'], message: 'Ingrese su apellido.' })
      } else if (!userNamePattern.test(lastName)) {
        context.addIssue({ code: 'custom', path: ['lastName'], message: nameMessage })
      }
      if (phoneNumber && (phoneNumber.length < 7 || phoneNumber.length > 20 || !userPhonePattern.test(phoneNumber))) {
        context.addIssue({ code: 'custom', path: ['phoneNumber'], message: phoneMessage })
      }
      if (value.newPassword !== value.confirmPassword) {
        context.addIssue({
          code: 'custom',
          path: ['confirmPassword'],
          message: 'La confirmación no coincide con la nueva contraseña.',
        })
      }
      for (const name of requiredAttributes) {
        const entry = value.attributes[name]?.trim() ?? ''
        if (!entry) {
          context.addIssue({
            code: 'custom',
            path: ['attributes', name],
            message: 'Ingrese este dato para continuar.',
          })
        } else if (entry.length > 2048) {
          context.addIssue({
            code: 'custom',
            path: ['attributes', name],
            message: 'El dato admite hasta 2048 caracteres.',
          })
        }
      }
    })
}

export function passwordIndicators(password: string, confirmation: string) {
  return [
    { id: 'entered', met: password.length > 0, label: 'Nueva contraseña ingresada' },
    { id: 'match', met: password.length > 0 && password === confirmation, label: 'La confirmación coincide' },
  ]
}

export function attributeLabel(name: string) {
  const bare = name.startsWith('userAttributes.') ? name.slice('userAttributes.'.length) : name
  const labels: Record<string, string> = {
    email: 'Correo electrónico',
    phone_number: 'Teléfono',
    name: 'Nombre',
    given_name: 'Nombre',
    family_name: 'Apellido',
  }
  return labels[bare] ?? 'Dato solicitado'
}

export function activationProfileBody(values: Pick<ActivationDraft, 'firstName' | 'lastName' | 'phoneNumber'>) {
  const body: { firstName: string; lastName: string; phoneNumber?: string } = {
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
  }
  const phoneNumber = values.phoneNumber.trim()
  if (phoneNumber) body.phoneNumber = phoneNumber
  return body
}

export class ActivationProfileError extends Error {
  readonly failure: ApiError

  constructor(failure: ApiError) {
    super(failure.message)
    this.name = 'ActivationProfileError'
    this.failure = failure
  }
}

export async function finishActivation(
  input: ActivationDraft,
  challengeId: string,
  requiredAttributes: readonly string[],
  deps: {
    answer: (body: ReturnType<typeof newPasswordChallengeBody>) => Promise<AuthContinuation>
    saveProfile: (body: ReturnType<typeof activationProfileBody>) => Promise<unknown>
  },
) {
  const continuation = await deps.answer(
    newPasswordChallengeBody(challengeId, input.newPassword, input.attributes, requiredAttributes),
  )
  if (!continuation.authenticated) return { kind: 'challenge' as const }
  try {
    await deps.saveProfile(activationProfileBody(input))
    return { kind: 'entered' as const }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No fue posible guardar sus datos personales.'
    return { kind: 'profile-pending' as const, message, sessionActive: true as const }
  }
}

export async function retryOwnProfile(save: () => Promise<unknown>) {
  await save()
  return { repeatedChallenge: false }
}

export function newPasswordChallengeBody(
  challengeId: string,
  newPassword: string,
  attributes: Record<string, string>,
  requiredAttributes: readonly string[],
) {
  const body: { challengeId: string; newPassword: string; attributes?: Record<string, string> } = {
    challengeId,
    newPassword,
  }
  if (requiredAttributes.length === 0) return body
  const selected: Record<string, string> = {}
  for (const name of requiredAttributes) {
    selected[name] = attributes[name]?.trim() ?? ''
  }
  body.attributes = selected
  return body
}

export function activationFailure(error: ApiError): ActivationFailure {
  const message = publicMessage(error.message)
  if (error.status === 400 && message === passwordPolicyMessage) {
    return { kind: 'retry', title: 'Contraseña no aceptada', message, returnToLogin: false }
  }
  if (error.status === 400) {
    return {
      kind: 'attributes',
      title: 'Datos no válidos',
      message: message || invalidActivationMessage,
      returnToLogin: false,
    }
  }
  if (error.status === 401) {
    const expired = message.includes('expiró')
      ? `${message} Use de nuevo su contraseña temporal.`
      : 'El proceso de activación expiró. Inicie sesión de nuevo con su contraseña temporal.'
    return { kind: 'expired', title: 'Activación no disponible', message: expired, returnToLogin: true }
  }
  if (error.status === 503 || message === unavailableMessage) {
    return { kind: 'unavailable', title: 'Servicio no disponible', message: message || unavailableMessage, returnToLogin: false }
  }
  if (error.status === null) {
    return { kind: 'unavailable', title: 'Sin conexión', message, returnToLogin: false }
  }
  return {
    kind: 'generic',
    title: 'No fue posible activar la cuenta',
    message: message || 'No fue posible completar la activación. Inténtelo de nuevo.',
    returnToLogin: false,
  }
}

function publicMessage(message: string) {
  if (/cognito|amazonaws|exception|accesskey|secret/i.test(message)) {
    return 'No fue posible completar la activación. Inténtelo de nuevo.'
  }
  return message
}
