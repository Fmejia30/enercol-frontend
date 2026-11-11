import { useId, useState } from 'react'
import { useForm, type FieldErrors, type UseFormRegisterReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ownProfileBody, ownProfileSchema, ownProfileUpdateFailure, type OwnProfileDraft } from '@/modules/profile/own-profile.ts'
import type { OwnProfile } from '@/modules/users/user-contract.ts'
import { updateOwnProfile } from '@/modules/users/users-api.ts'
import { isAbortError, toApiError } from '@/shared/lib/api-error.ts'
import { Alert } from '@/shared/components/ui/alert.tsx'
import { Button } from '@/shared/components/ui/button.tsx'
import { FieldError } from '@/shared/components/ui/field-error.tsx'
import { Input } from '@/shared/components/ui/input.tsx'
import { Label } from '@/shared/components/ui/label.tsx'

type OwnProfileFormProps = {
  profile: OwnProfile
  onUpdated: (profile: OwnProfile) => void
}

export function OwnProfileForm({ profile, onUpdated }: OwnProfileFormProps) {
  const baseId = useId()
  const [pending, setPending] = useState(false)
  const [notice, setNotice] = useState<{ title: string; message: string } | null>(null)
  const {
    register,
    handleSubmit,
    setFocus,
    formState: { errors },
  } = useForm<OwnProfileDraft>({
    resolver: zodResolver(ownProfileSchema(profile)),
    defaultValues: {
      firstName: profile.firstName ?? '',
      lastName: profile.lastName ?? '',
      phoneNumber: profile.phoneNumber ?? '',
    },
    mode: 'onTouched',
  })

  async function onSubmit(values: OwnProfileDraft) {
    if (pending) return
    const change = ownProfileBody(profile, values)
    if (!change.ok) {
      setNotice({ title: 'Sin cambios', message: change.message })
      return
    }
    setNotice(null)
    setPending(true)
    const controller = new AbortController()
    try {
      onUpdated(await updateOwnProfile(change.body, controller.signal))
    } catch (cause) {
      if (controller.signal.aborted || isAbortError(cause)) return
      setNotice(ownProfileUpdateFailure(toApiError(cause)))
    } finally {
      if (!controller.signal.aborted) setPending(false)
    }
  }

  function onInvalid(fieldErrors: FieldErrors<OwnProfileDraft>) {
    const target = fieldErrors.firstName
      ? 'firstName'
      : fieldErrors.lastName
        ? 'lastName'
        : fieldErrors.phoneNumber
          ? 'phoneNumber'
          : null
    if (target) requestAnimationFrame(() => setFocus(target))
  }

  return (
    <form className="grid gap-5" noValidate onSubmit={handleSubmit(onSubmit, onInvalid)}>
      <TextField
        id={`${baseId}-first-name`}
        label="Nombre"
        autoComplete="given-name"
        error={errors.firstName?.message}
        registration={register('firstName')}
      />
      <TextField
        id={`${baseId}-last-name`}
        label="Apellido"
        autoComplete="family-name"
        error={errors.lastName?.message}
        registration={register('lastName')}
      />
      <TextField
        id={`${baseId}-phone`}
        label="Teléfono"
        autoComplete="tel"
        error={errors.phoneNumber?.message}
        registration={register('phoneNumber')}
      />
      {!profile.profileCompleted ? (
        <p className="text-sm leading-6 text-muted">
          Nombre y apellido son necesarios para continuar. El teléfono puede quedar vacío.
        </p>
      ) : null}
      {notice ? (
        <Alert tone="error" title={notice.title}>
          {notice.message}
        </Alert>
      ) : null}
      <Button type="submit" className="w-full sm:w-fit" loading={pending}>
        {pending ? 'Guardando' : 'Guardar cambios'}
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
