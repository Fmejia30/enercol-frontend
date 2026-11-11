import { useMemo, useState } from 'react'
import { useForm, type FieldErrors } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { AuthChallenge } from '@/modules/auth/auth-contract.ts'
import { isSupportedChallenge } from '@/modules/auth/auth-contract.ts'
import { useAuth } from '@/modules/auth/use-auth.ts'
import { isAbortError, toApiError } from '@/shared/lib/api-error.ts'
import { Alert } from '@/shared/components/ui/alert.tsx'
import { Button } from '@/shared/components/ui/button.tsx'
import { FieldError } from '@/shared/components/ui/field-error.tsx'
import { Input } from '@/shared/components/ui/input.tsx'
import { Label } from '@/shared/components/ui/label.tsx'

type ChallengeValues = {
  code: string
  newPassword: string
  confirmPassword: string
  attributes: Record<string, string>
}

type Notice = { title: string; description: string }

const codeChallenges = new Set(['SMS_MFA', 'SOFTWARE_TOKEN_MFA', 'EMAIL_OTP', 'MFA_SETUP'])

export function ChallengeForm({ challenge }: { challenge: AuthChallenge }) {
  const { submitChallenge, cancelChallenge } = useAuth()
  const [pending, setPending] = useState(false)
  const [notice, setNotice] = useState<Notice | null>(null)
  const schema = useMemo(() => challengeSchema(), [])
  const supported = isSupportedChallenge(challenge.name)

  const {
    register,
    handleSubmit,
    setFocus,
    formState: { errors },
  } = useForm<ChallengeValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      code: '',
      newPassword: '',
      confirmPassword: '',
      attributes: Object.fromEntries(challenge.requiredAttributes.map((name) => [name, ''])),
    },
    mode: 'onTouched',
  })

  async function onSubmit(values: ChallengeValues) {
    if (pending || !supported) return
    setNotice(null)
    setPending(true)
    try {
      await submitChallenge(submissionFrom(values))
    } catch (error) {
      if (isAbortError(error)) return
      setNotice({
        title: 'No fue posible continuar',
        description: toApiError(error).message,
      })
    } finally {
      setPending(false)
    }
  }

  function onInvalid(fieldErrors: FieldErrors<ChallengeValues>) {
    setNotice({
      title: 'Revise los datos',
      description: 'Hay campos que necesitan corrección antes de continuar.',
    })
    const attribute = challenge.requiredAttributes.find((name) => fieldErrors.attributes?.[name])
    const target = fieldErrors.newPassword
      ? 'newPassword'
      : fieldErrors.confirmPassword
        ? 'confirmPassword'
        : attribute
          ? (`attributes.${attribute}` as 'newPassword')
          : fieldErrors.code
            ? 'code'
            : null
    if (!target) return
    requestAnimationFrame(() => setFocus(target))
  }

  if (!supported || !codeChallenges.has(challenge.name)) {
    return (
      <div className="grid gap-5">
        <Alert tone="error" title="Verificación no disponible">
          El servidor solicitó el desafío {challenge.name}. Esta pantalla no envía una respuesta para ese
          paso.
        </Alert>
        <Button type="button" variant="secondary" onClick={() => cancelChallenge()}>
          Volver al inicio de sesión
        </Button>
      </div>
    )
  }

  const codeError = errors.code?.message

  return (
    <form className="grid gap-5 short:gap-4" noValidate onSubmit={handleSubmit(onSubmit, onInvalid)}>
      {challenge.name === 'MFA_SETUP' && challenge.secretCode ? (
        <div className="grid gap-2">
          <p className="text-sm font-semibold">Secreto de configuración</p>
          <p className="font-mono text-sm break-all text-foreground">{challenge.secretCode}</p>
          <p className="text-sm leading-5 text-muted">
            Regístrelo en su aplicación de autenticación e ingrese el código que genere. Se muestra una
            sola vez.
          </p>
        </div>
      ) : null}

      <div className="grid gap-2">
        <Label htmlFor="challenge-code">Código</Label>
        <Input
          id="challenge-code"
          inputMode="text"
          autoComplete="one-time-code"
          maxLength={32}
          aria-invalid={codeError ? true : undefined}
          aria-describedby={codeError ? 'challenge-code-error' : undefined}
          {...register('code')}
        />
        {codeError ? <FieldError id="challenge-code-error">{codeError}</FieldError> : null}
      </div>

      {notice ? (
        <Alert tone="error" title={notice.title}>
          {notice.description}
        </Alert>
      ) : null}

      <Button type="submit" className="w-full" loading={pending}>
        {pending ? 'Verificando' : 'Continuar'}
      </Button>
      <Button type="button" variant="secondary" disabled={pending} onClick={() => cancelChallenge()}>
        Volver al inicio de sesión
      </Button>
    </form>
  )
}

function challengeSchema() {
  return z.object({
    code: z.string().trim().min(1, 'Ingrese el código.').max(32, 'El código admite hasta 32 caracteres.'),
    newPassword: z.string(),
    confirmPassword: z.string(),
    attributes: z.record(z.string(), z.string()),
  })
}

function submissionFrom(values: ChallengeValues) {
  return { code: values.code.trim() }
}
