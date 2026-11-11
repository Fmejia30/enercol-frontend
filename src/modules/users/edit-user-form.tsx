import { useId, useState } from 'react'
import { Controller, useForm, type FieldErrors, type UseFormRegisterReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  editUserSchema,
  updateFailure,
  userUpdateBody,
  type UserProfileDraft,
} from '@/modules/users/user-administration.ts'
import type { UserAccountDetail } from '@/modules/users/user-contract.ts'
import { UserRolePicker } from '@/modules/users/user-role-picker.tsx'
import { updateUser } from '@/modules/users/users-api.ts'
import { isAbortError, toApiError } from '@/shared/lib/api-error.ts'
import { Alert } from '@/shared/components/ui/alert.tsx'
import { Button } from '@/shared/components/ui/button.tsx'
import { FieldError } from '@/shared/components/ui/field-error.tsx'
import { Input } from '@/shared/components/ui/input.tsx'
import { Label } from '@/shared/components/ui/label.tsx'

type EditUserFormProps = {
  user: UserAccountDetail
  onUpdated: (user: UserAccountDetail) => void
}

export function EditUserForm({ user, onUpdated }: EditUserFormProps) {
  const baseId = useId()
  const [pending, setPending] = useState(false)
  const [notice, setNotice] = useState<{ title: string; message: string } | null>(null)
  const schema = editUserSchema(user)
  const {
    register,
    control,
    handleSubmit,
    setFocus,
    formState: { errors },
  } = useForm<UserProfileDraft>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
      phoneNumber: user.phoneNumber ?? '',
      roles: user.roles,
    },
    mode: 'onTouched',
  })

  async function onSubmit(values: UserProfileDraft) {
    if (pending) return
    const change = userUpdateBody(user, values)
    if (!change.ok) {
      setNotice({ title: 'Sin cambios', message: change.message })
      return
    }
    setNotice(null)
    setPending(true)
    const controller = new AbortController()
    try {
      onUpdated(await updateUser(user.id, change.body, controller.signal))
    } catch (cause) {
      if (controller.signal.aborted || isAbortError(cause)) return
      setNotice(updateFailure(toApiError(cause)))
    } finally {
      if (!controller.signal.aborted) setPending(false)
    }
  }

  function onInvalid(fieldErrors: FieldErrors<UserProfileDraft>) {
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
    <form className="grid gap-5 border-t border-line pt-6" noValidate onSubmit={handleSubmit(onSubmit, onInvalid)}>
      <div>
        <h2 className="text-lg font-semibold">Datos de la cuenta</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          El correo y el identificador permanecen sin cambios. Solo se envían los campos modificados.
        </p>
      </div>
      <div className="grid gap-2">
        <Label htmlFor={`${baseId}-email`}>Correo electrónico</Label>
        <Input id={`${baseId}-email`} value={user.email ?? 'Sin correo'} readOnly aria-readonly="true" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
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
      </div>
      <TextField
        id={`${baseId}-phone`}
        label="Teléfono"
        autoComplete="tel"
        error={errors.phoneNumber?.message}
        registration={register('phoneNumber')}
      />
      {!user.profileCompleted ? (
        <p className="text-sm leading-6 text-muted">
          El perfil está pendiente. Si completa datos personales, nombre, apellido y teléfono se guardan juntos.
        </p>
      ) : null}
      <Controller
        name="roles"
        control={control}
        render={({ field }) => (
          <div className="grid gap-2">
            <UserRolePicker
              legend="Roles"
              value={field.value}
              invalid={Boolean(errors.roles?.message)}
              describedBy={errors.roles?.message ? `${baseId}-roles-error` : undefined}
              onChange={field.onChange}
            />
            {errors.roles?.message ? <FieldError id={`${baseId}-roles-error`}>{errors.roles.message}</FieldError> : null}
          </div>
        )}
      />
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
