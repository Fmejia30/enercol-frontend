import { useMemo, useState } from 'react'
import { useForm, type FieldErrors, type UseFormRegisterReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff } from 'lucide-react'
import type { AuthChallenge } from '@/modules/auth/auth-contract.ts'
import {
  ActivationProfileError,
  activationFailure,
  activationProfileBody,
  activationSchema,
  attributeLabel,
  newPasswordChallengeBody,
  passwordIndicators,
  type ActivationDraft,
} from '@/modules/auth/activation.ts'
import { rememberEntryNotice, rememberProfileNotice } from '@/modules/profile/profile-completion.ts'
import { useAuth } from '@/modules/auth/use-auth.ts'
import { updateOwnProfile } from '@/modules/users/users-api.ts'
import { isAbortError, toApiError } from '@/shared/lib/api-error.ts'
import { Alert } from '@/shared/components/ui/alert.tsx'
import { Button } from '@/shared/components/ui/button.tsx'
import { FieldError } from '@/shared/components/ui/field-error.tsx'
import { Input } from '@/shared/components/ui/input.tsx'
import { Label } from '@/shared/components/ui/label.tsx'

type Notice = { tone: 'error' | 'info'; title: string; description: string }

export function ActivationForm({ challenge }: { challenge: AuthChallenge }) {
  const { submitChallenge, cancelChallenge } = useAuth()
  const [pending, setPending] = useState(false)
  const [notice, setNotice] = useState<Notice | null>(null)
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [confirmationVisible, setConfirmationVisible] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const schema = useMemo(() => activationSchema(challenge.requiredAttributes), [challenge])
  const {
    register,
    handleSubmit,
    setFocus,
    formState: { errors },
  } = useForm<ActivationDraft>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: '',
      lastName: '',
      phoneNumber: '',
      newPassword: '',
      confirmPassword: '',
      attributes: Object.fromEntries(challenge.requiredAttributes.map((name) => [name, ''])),
    },
    mode: 'onTouched',
  })
  const indicators = passwordIndicators(password, confirmation)
  const indicatorSummary = indicators.map((item) => `${item.met ? 'Cumplido' : 'Pendiente'}: ${item.label}`).join('. ')

  async function onSubmit(values: ActivationDraft) {
    if (pending) return
    setNotice(null)
    setPending(true)
    const body = newPasswordChallengeBody(
      challenge.id,
      values.newPassword,
      values.attributes,
      challenge.requiredAttributes,
    )
    try {
      await submitChallenge({ newPassword: body.newPassword, attributes: body.attributes }, undefined, async () => {
        try {
          await updateOwnProfile(activationProfileBody(values))
        } catch (error) {
          if (isAbortError(error)) throw error
          throw new ActivationProfileError(toApiError(error))
        }
        rememberEntryNotice('Su cuenta quedó activada.')
      })
    } catch (error) {
      if (isAbortError(error)) return
      if (error instanceof ActivationProfileError) {
        rememberProfileNotice(
          'La sesión quedó activa, pero no se guardaron sus datos personales. Complételos en Mi perfil, sin volver a ingresar la contraseña temporal.',
        )
        return
      }
      const failure = activationFailure(toApiError(error))
      if (failure.returnToLogin) {
        cancelChallenge(failure.message)
        return
      }
      setNotice({ tone: 'error', title: failure.title, description: failure.message })
    } finally {
      setPending(false)
    }
  }

  function onInvalid(fieldErrors: FieldErrors<ActivationDraft>) {
    setNotice({
      tone: 'error',
      title: 'Revise los datos',
      description: 'Hay campos que necesitan corrección antes de activar la cuenta.',
    })
    const attribute = challenge.requiredAttributes.find((name) => fieldErrors.attributes?.[name])
    const target = fieldErrors.firstName
      ? 'firstName'
      : fieldErrors.lastName
        ? 'lastName'
        : fieldErrors.newPassword
          ? 'newPassword'
          : fieldErrors.confirmPassword
            ? 'confirmPassword'
            : fieldErrors.phoneNumber
              ? 'phoneNumber'
              : attribute
                ? (`attributes.${attribute}` as 'firstName')
                : null
    if (!target) return
    requestAnimationFrame(() => setFocus(target))
  }

  const passwordError = errors.newPassword?.message
  const confirmError = errors.confirmPassword?.message
  const passwordField = register('newPassword')
  const confirmationField = register('confirmPassword')

  return (
    <form className="grid gap-5 short:gap-4" noValidate onSubmit={handleSubmit(onSubmit, onInvalid)}>
      <TextField id="activation-first-name" label="Nombre" autoComplete="given-name" error={errors.firstName?.message} registration={register('firstName')} />
      <TextField id="activation-last-name" label="Apellido" autoComplete="family-name" error={errors.lastName?.message} registration={register('lastName')} />
      <TextField id="activation-phone" label="Teléfono" autoComplete="tel" error={errors.phoneNumber?.message} registration={register('phoneNumber')} />

      <div className="grid gap-2">
        <Label htmlFor="activation-password">Nueva contraseña</Label>
        <div className="relative">
          <Input
            id="activation-password"
            className="pr-12"
            type={passwordVisible ? 'text' : 'password'}
            autoComplete="new-password"
            enterKeyHint="next"
            aria-invalid={passwordError ? true : undefined}
            aria-describedby={
              passwordError
                ? 'activation-password-error activation-indicators activation-note'
                : 'activation-indicators activation-note'
            }
            {...passwordField}
            onChange={(event) => {
              setPassword(event.target.value)
              void passwordField.onChange(event)
            }}
          />
          <VisibilityToggle
            pressed={passwordVisible}
            controls="activation-password"
            label={passwordVisible ? 'Ocultar nueva contraseña' : 'Mostrar nueva contraseña'}
            onClick={() => setPasswordVisible((visible) => !visible)}
          />
        </div>
        {passwordError ? <FieldError id="activation-password-error">{passwordError}</FieldError> : null}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="activation-confirm">Confirmar contraseña</Label>
        <div className="relative">
          <Input
            id="activation-confirm"
            className="pr-12"
            type={confirmationVisible ? 'text' : 'password'}
            autoComplete="new-password"
            enterKeyHint="next"
            aria-invalid={confirmError ? true : undefined}
            aria-describedby={confirmError ? 'activation-confirm-error activation-indicators' : 'activation-indicators'}
            {...confirmationField}
            onChange={(event) => {
              setConfirmation(event.target.value)
              void confirmationField.onChange(event)
            }}
          />
          <VisibilityToggle
            pressed={confirmationVisible}
            controls="activation-confirm"
            label={confirmationVisible ? 'Ocultar confirmación' : 'Mostrar confirmación'}
            onClick={() => setConfirmationVisible((visible) => !visible)}
          />
        </div>
        {confirmError ? <FieldError id="activation-confirm-error">{confirmError}</FieldError> : null}
      </div>

      <ul id="activation-indicators" className="grid gap-1.5" aria-live="polite" aria-label={indicatorSummary}>
        {indicators.map((item) => (
          <li key={item.id} className={item.met ? 'text-sm text-energy-text' : 'text-sm text-muted'}>
            <span className="sr-only">{item.met ? 'Cumplido: ' : 'Pendiente: '}</span>
            {item.label}
          </li>
        ))}
      </ul>
      <p id="activation-note" className="text-sm leading-5 text-muted">
        La contraseña definitiva la valida el servicio de autenticación. Si no es aceptada, podrá corregirla
        aquí sin volver a ingresar la contraseña temporal.
      </p>



      {challenge.requiredAttributes.map((name) => {
        const message = errors.attributes?.[name]?.message
        const fieldId = `activation-attribute-${name}`
        return (
          <TextField
            key={name}
            id={fieldId}
            label={attributeLabel(name)}
            autoComplete="off"
            error={message}
            registration={register(`attributes.${name}`)}
          />
        )
      })}

      {notice ? (
        <Alert tone={notice.tone} title={notice.title}>
          {notice.description}
        </Alert>
      ) : null}

      <Button type="submit" className="w-full" loading={pending}>
        {pending ? 'Activando cuenta' : 'Activar cuenta'}
      </Button>
      <Button type="button" variant="secondary" disabled={pending} onClick={() => cancelChallenge()}>
        Volver al inicio de sesión
      </Button>
    </form>
  )
}

function TextField({
  id,
  label,
  autoComplete,
  error,
  registration,
}: {
  id: string
  label: string
  autoComplete: string
  error?: string
  registration: UseFormRegisterReturn
}) {
  const errorId = `${id}-error`
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        autoComplete={autoComplete}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        {...registration}
      />
      {error ? <FieldError id={errorId}>{error}</FieldError> : null}
    </div>
  )
}

function VisibilityToggle({
  pressed,
  controls,
  label,
  onClick,
}: {
  pressed: boolean
  controls: string
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-energy-text focus-visible:ring-inset focus-visible:outline-none"
      aria-controls={controls}
      aria-pressed={pressed}
      aria-label={label}
      onClick={onClick}
    >
      {pressed ? <EyeOff className="size-5" strokeWidth={1.75} aria-hidden="true" /> : <Eye className="size-5" strokeWidth={1.75} aria-hidden="true" />}
    </button>
  )
}
