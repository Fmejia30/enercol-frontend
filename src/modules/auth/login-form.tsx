import { useEffect, useId, useRef, useState } from 'react'
import { useForm, type FieldErrors } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff } from 'lucide-react'
import { Alert } from '@/shared/components/ui/alert.tsx'
import { Button } from '@/shared/components/ui/button.tsx'
import { FieldError } from '@/shared/components/ui/field-error.tsx'
import { Input } from '@/shared/components/ui/input.tsx'
import { Label } from '@/shared/components/ui/label.tsx'
import { loginSchema, type LoginValues } from '@/modules/auth/login-schema.ts'
import { useAuth } from '@/modules/auth/use-auth.ts'
import { isAbortError, toApiError } from '@/shared/lib/api-error.ts'

type FormNotice = {
  tone: 'error' | 'info'
  title: string
  description: string
}

export function LoginForm() {
  const baseId = useId()
  const emailId = `${baseId}-email`
  const passwordId = `${baseId}-password`
  const emailErrorId = `${baseId}-email-error`
  const passwordErrorId = `${baseId}-password-error`
  const { login } = useAuth()
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [notice, setNotice] = useState<FormNotice | null>(null)
  const [pending, setPending] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const {
    register,
    handleSubmit,
    setFocus,
    watch,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onTouched',
  })

  useEffect(() => {
    const subscription = watch(() => {
      setNotice((current) => (current ? null : current))
    })
    return () => subscription.unsubscribe()
  }, [watch])

  useEffect(() => {
    return () => abortRef.current?.abort()
  }, [])

  async function onSubmit(values: LoginValues) {
    if (pending) return
    setNotice(null)
    setPending(true)
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    try {
      await login(values, controller.signal)
    } catch (error) {
      if (controller.signal.aborted || isAbortError(error)) return
      setNotice({
        tone: 'error',
        title: 'No fue posible iniciar sesión',
        description: toApiError(error).message,
      })
    } finally {
      if (!controller.signal.aborted) setPending(false)
    }
  }

  function onInvalid(fieldErrors: FieldErrors<LoginValues>) {
    setNotice({
      tone: 'error',
      title: 'Revise los datos',
      description: 'Hay campos que necesitan corrección antes de continuar.',
    })

    const target = fieldErrors.email ? 'email' : fieldErrors.password ? 'password' : null
    if (!target) return
    requestAnimationFrame(() => setFocus(target))
  }

  const emailError = errors.email?.message
  const passwordError = errors.password?.message

  return (
    <form className="grid gap-5 short:gap-4" noValidate onSubmit={handleSubmit(onSubmit, onInvalid)}>
      <div className="grid gap-2">
        <Label htmlFor={emailId}>Correo electrónico</Label>
        <Input
          id={emailId}
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="next"
          placeholder="nombre@organizacion.com"
          aria-invalid={emailError ? true : undefined}
          aria-describedby={emailError ? emailErrorId : undefined}
          {...register('email')}
        />
        {emailError ? <FieldError id={emailErrorId}>{emailError}</FieldError> : null}
      </div>

      <div className="grid gap-2">
        <Label htmlFor={passwordId}>Contraseña</Label>
        <div className="relative">
          <Input
            id={passwordId}
            className="pr-12"
            type={passwordVisible ? 'text' : 'password'}
            autoComplete="current-password"
            enterKeyHint="go"
            aria-invalid={passwordError ? true : undefined}
            aria-describedby={passwordError ? passwordErrorId : undefined}
            {...register('password')}
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-muted focus-visible:ring-2 focus-visible:ring-energy-text focus-visible:ring-inset focus-visible:outline-none hover:text-foreground"
            aria-controls={passwordId}
            aria-pressed={passwordVisible}
            aria-label={passwordVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            onClick={() => setPasswordVisible((visible) => !visible)}
          >
            {passwordVisible ? (
              <EyeOff className="size-5" strokeWidth={1.75} aria-hidden="true" />
            ) : (
              <Eye className="size-5" strokeWidth={1.75} aria-hidden="true" />
            )}
          </button>
        </div>
        {passwordError ? <FieldError id={passwordErrorId}>{passwordError}</FieldError> : null}
      </div>

      {notice ? (
        <Alert tone={notice.tone} title={notice.title}>
          {notice.description}
        </Alert>
      ) : null}

      <Button type="submit" className="w-full" loading={pending}>
        {pending ? 'Verificando' : 'Iniciar sesión'}
      </Button>
    </form>
  )
}
