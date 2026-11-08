import { useEffect } from 'react'
import { ChallengeForm } from '@/modules/auth/challenge-form.tsx'
import { IdentityPanel } from '@/modules/auth/identity-panel.tsx'
import { LoginForm } from '@/modules/auth/login-form.tsx'
import { useAuth } from '@/modules/auth/use-auth.ts'
import { ThemeToggle } from '@/shared/components/theme/theme-toggle.tsx'
import { Alert } from '@/shared/components/ui/alert.tsx'
import { appName } from '@/config/env.ts'

function challengeCopy(name: string) {
  switch (name) {
    case 'NEW_PASSWORD_REQUIRED':
      return {
        title: 'Actualice su contraseña',
        description: 'La cuenta exige una contraseña nueva antes de entrar.',
      }
    case 'SMS_MFA':
      return {
        title: 'Código por mensaje',
        description: 'Ingrese el código que recibió por mensaje.',
      }
    case 'EMAIL_OTP':
      return {
        title: 'Código por correo',
        description: 'Ingrese el código que recibió por correo.',
      }
    case 'SOFTWARE_TOKEN_MFA':
      return {
        title: 'Código de autenticación',
        description: 'Ingrese el código de su aplicación de autenticación.',
      }
    case 'MFA_SETUP':
      return {
        title: 'Configure la autenticación',
        description: 'Complete la configuración del segundo factor para continuar.',
      }
    default:
      return {
        title: 'Verificación adicional',
        description: 'El servidor pidió un paso que esta pantalla no puede completar.',
      }
  }
}

export function LoginPage() {
  const { snapshot } = useAuth()
  const challenge = snapshot.status === 'challenge' ? snapshot.challenge : null
  const copy = challenge
    ? challengeCopy(challenge.name)
    : {
        title: 'Iniciar sesión',
        description: 'Ingrese con la cuenta asignada por su organización.',
      }

  useEffect(() => {
    document.title = `${copy.title} · ${appName()}`
  }, [copy.title])

  return (
    <>
      <a
        href="#acceso"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-surface focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:text-foreground focus:ring-2 focus:ring-energy-text focus:ring-offset-2 focus:ring-offset-background focus:outline-none"
      >
        Saltar al formulario de acceso
      </a>
      <div className="flex h-full min-h-0 flex-col overflow-y-auto bg-background lg:grid lg:h-full lg:grid-cols-[minmax(0,1.15fr)_minmax(26rem,34rem)] lg:overflow-hidden">
        <IdentityPanel />
        <section
          id="acceso"
          aria-labelledby="login-title"
          className="flex min-h-0 flex-1 flex-col lg:overflow-y-auto"
        >
          <div className="mx-auto my-auto w-full max-w-[26rem] px-5 py-8 sm:px-8 lg:px-10 lg:py-6 short:py-5">
            <div className="mb-6 flex justify-end short:mb-4">
              <ThemeToggle />
            </div>
            <header className="mb-8 short:mb-5">
              <h1
                id="login-title"
                className="text-[1.75rem] font-semibold tracking-[-0.03em] text-balance sm:text-[2rem] short:text-[1.6rem]"
              >
                {copy.title}
              </h1>
              <p className="mt-2 text-base leading-relaxed text-muted">{copy.description}</p>
            </header>
            {snapshot.status === 'unauthenticated' && snapshot.sessionNotice ? (
              <div className="mb-5">
                <Alert tone="error" title="Sesión no disponible">
                  {snapshot.sessionNotice}
                </Alert>
              </div>
            ) : null}
            {challenge ? <ChallengeForm key={challenge.id} challenge={challenge} /> : <LoginForm />}
            <p className="mt-8 flex gap-3 text-sm leading-6 text-muted short:mt-5">
              <span className="mt-2 size-1.5 shrink-0 bg-energy-text" aria-hidden="true" />
              Reservado a usuarios autorizados por su organización.
            </p>
          </div>
        </section>
      </div>
    </>
  )
}
