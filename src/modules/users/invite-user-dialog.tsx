import { useId, useState } from 'react'
import { Controller, useForm, type FieldErrors } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { invitationStatusLabel, formatUserDate } from '@/modules/users/user-directory.ts'
import { inviteFailure, inviteUserSchema, type InviteUserValues } from '@/modules/users/user-administration.ts'
import { createUser } from '@/modules/users/users-api.ts'
import { UserDialog } from '@/modules/users/user-dialog.tsx'
import { UserRolePicker } from '@/modules/users/user-role-picker.tsx'
import { isAbortError, toApiError } from '@/shared/lib/api-error.ts'
import { Alert } from '@/shared/components/ui/alert.tsx'
import { Button } from '@/shared/components/ui/button.tsx'
import { FieldError } from '@/shared/components/ui/field-error.tsx'
import { Input } from '@/shared/components/ui/input.tsx'
import { Label } from '@/shared/components/ui/label.tsx'

type InviteUserDialogProps = {
  onClose: () => void
  onCreated: (message: string) => void
}

export function InviteUserDialog({ onClose, onCreated }: InviteUserDialogProps) {
  const baseId = useId()
  const emailId = `${baseId}-email`
  const emailErrorId = `${baseId}-email-error`
  const rolesErrorId = `${baseId}-roles-error`
  const [pending, setPending] = useState(false)
  const [notice, setNotice] = useState<{ title: string; message: string } | null>(null)
  const {
    register,
    control,
    handleSubmit,
    setError,
    setFocus,
    formState: { errors },
  } = useForm<InviteUserValues>({
    resolver: zodResolver(inviteUserSchema),
    defaultValues: { email: '', roles: [] },
    mode: 'onTouched',
  })

  async function onSubmit(values: InviteUserValues) {
    if (pending) return
    setNotice(null)
    setPending(true)
    const controller = new AbortController()
    try {
      const invited = await createUser(
        { email: values.email.trim().toLowerCase(), roles: values.roles },
        controller.signal,
      )
      const expiry = formatUserDate(invited.expiresAt)
      const invitation = invitationStatusLabel(invited.status) ?? 'Pendiente'
      onCreated(
        `Se creó la cuenta de ${invited.email}. Cognito enviará la invitación. El usuario todavía no ha completado su registro. La invitación está ${invitation.toLowerCase()} y vence el ${expiry}.`,
      )
    } catch (cause) {
      if (controller.signal.aborted || isAbortError(cause)) return
      const failure = inviteFailure(toApiError(cause))
      if (failure.field === 'email') setError('email', { message: failure.message })
      setNotice(failure)
    } finally {
      if (!controller.signal.aborted) setPending(false)
    }
  }

  function onInvalid(fieldErrors: FieldErrors<InviteUserValues>) {
    const target = fieldErrors.email ? 'email' : null
    if (target) requestAnimationFrame(() => setFocus(target))
  }

  const emailError = errors.email?.message
  const rolesError = errors.roles?.message

  return (
    <UserDialog
      title="Nuevo usuario"
      description="La cuenta queda invitada. Cognito envía el acceso y el usuario todavía no queda registrado."
      busy={pending}
      onClose={onClose}
    >
      <form className="grid gap-5" noValidate onSubmit={handleSubmit(onSubmit, onInvalid)}>
        <div className="grid gap-2">
          <Label htmlFor={emailId}>Correo electrónico</Label>
          <Input
            id={emailId}
            type="email"
            inputMode="email"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="nombre@organizacion.com"
            aria-invalid={emailError ? true : undefined}
            aria-describedby={emailError ? emailErrorId : undefined}
            {...register('email')}
          />
          {emailError ? <FieldError id={emailErrorId}>{emailError}</FieldError> : null}
        </div>
        <Controller
          name="roles"
          control={control}
          render={({ field }) => (
            <div className="grid gap-2">
              <UserRolePicker
                legend="Roles"
                value={field.value}
                invalid={Boolean(rolesError)}
                describedBy={rolesError ? rolesErrorId : undefined}
                onChange={field.onChange}
              />
              {rolesError ? <FieldError id={rolesErrorId}>{rolesError}</FieldError> : null}
            </div>
          )}
        />
        {notice ? (
          <Alert tone="error" title={notice.title}>
            {notice.message}
          </Alert>
        ) : null}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" disabled={pending} onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={pending}>
            {pending ? 'Creando usuario' : 'Crear usuario'}
          </Button>
        </div>
      </form>
    </UserDialog>
  )
}
