import { useEffect, useId, useState } from 'react'
import { appName } from '@/config/env.ts'
import { ownProfileReadFailure } from '@/modules/profile/own-profile.ts'
import { OwnProfileForm } from '@/modules/profile/own-profile-form.tsx'
import { useOwnProfile } from '@/modules/profile/use-own-profile.ts'
import { clearProfileNotice, peekProfileNotice } from '@/modules/profile/profile-completion.ts'
import { RoleBadges, ProfileState } from '@/modules/users/user-account.tsx'
import { Button } from '@/shared/components/ui/button.tsx'
import { Alert } from '@/shared/components/ui/alert.tsx'
import { Input } from '@/shared/components/ui/input.tsx'
import { Label } from '@/shared/components/ui/label.tsx'

export function ProfilePage() {
  const emailId = useId()
  const { state, reload, replace } = useOwnProfile()
  const [notice, setNotice] = useState<string | null>(null)
  const [attention] = useState<string | null>(() => peekProfileNotice())
  const profile = state.status === 'ready' ? state.profile : null
  const failure = state.status === 'error' ? ownProfileReadFailure(state.error) : null
  const formKey = profile
    ? [profile.profileCompleted, profile.firstName, profile.lastName, profile.phoneNumber].join('\u0000')
    : 'empty'

  useEffect(() => {
    document.title = `Mi perfil · ${appName()}`
    if (!attention) return
    const timer = window.setTimeout(() => clearProfileNotice(), 0)
    return () => window.clearTimeout(timer)
  }, [attention])

  return (
    <div className="mx-auto flex w-full max-w-3xl min-w-0 flex-col gap-8">
      <header className="border-b border-line pb-6">
        <h1 className="text-3xl font-semibold tracking-[-0.03em] text-balance">Mi perfil</h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted">
          Consulte y complete sus datos personales. El correo y los roles los asigna su organización.
        </p>
      </header>

      {attention ? (
        <Alert tone="error" title="Falta guardar el perfil">
          {attention}
        </Alert>
      ) : null}

      {notice ? (
        <Alert tone="info" title="Perfil actualizado">
          {notice}
        </Alert>
      ) : null}

      {state.status === 'loading' ? (
        <p className="text-sm font-semibold text-muted" role="status">
          Cargando perfil
        </p>
      ) : null}

      {state.status === 'error' && failure ? (
        <div className="grid max-w-xl gap-4">
          <Alert tone="error" title={failure.title}>
            {failure.message}
          </Alert>
          <Button type="button" variant="secondary" className="w-fit" onClick={reload}>
            Reintentar
          </Button>
        </div>
      ) : null}

      {profile ? (
        <div className="grid gap-8">
          <section className="grid gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <ProfileState completed={profile.profileCompleted} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={emailId}>Correo electrónico</Label>
              <Input id={emailId} value={profile.email ?? 'Sin correo'} readOnly aria-readonly="true" />
            </div>
            <div>
              <h2 className="text-xs font-semibold tracking-[0.14em] text-subtle uppercase">Roles</h2>
              <div className="mt-3">
                <RoleBadges roles={profile.roles} />
              </div>
            </div>
          </section>
          <section className="grid gap-5 border-t border-line pt-6">
            <h2 className="text-lg font-semibold">Datos personales</h2>
            <OwnProfileForm
              key={formKey}
              profile={profile}
              onUpdated={(next) => {
                replace(next)
                setNotice(
                  next.profileCompleted
                    ? 'Sus datos personales quedaron registrados.'
                    : 'La solicitud se guardó, pero el perfil sigue pendiente.',
                )
              }}
            />
          </section>
        </div>
      ) : null}
    </div>
  )
}
