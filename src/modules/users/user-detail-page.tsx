import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { appName } from '@/config/env.ts'
import { Can } from '@/modules/access/can.tsx'
import { AccountState, ProfileState, RoleBadges } from '@/modules/users/user-account.tsx'
import { EditUserForm } from '@/modules/users/edit-user-form.tsx'
import type { UserAccountDetail } from '@/modules/users/user-contract.ts'
import { formatUserDate, invitationStatusLabel, userPrimaryLabel } from '@/modules/users/user-directory.ts'
import { UserStatusControl } from '@/modules/users/user-status-control.tsx'
import { readUser } from '@/modules/users/users-api.ts'
import { ApiError, isAbortError, toApiError } from '@/shared/lib/api-error.ts'
import { Alert } from '@/shared/components/ui/alert.tsx'
import { Button } from '@/shared/components/ui/button.tsx'

type DetailSnapshot = { key: string; user: UserAccountDetail | null; error: ApiError | null }
type DetailNotice = { title: string; description: string }

export function UserDetailPage() {
  const { userId = '' } = useParams()
  const [attempt, setAttempt] = useState(0)
  const [snapshot, setSnapshot] = useState<DetailSnapshot | null>(null)
  const [notice, setNotice] = useState<DetailNotice | null>(null)
  const key = `${userId}\u0000${attempt}`
  const current = snapshot?.key === key ? snapshot : null
  const loading = current === null
  const user = current?.user ?? null
  const error = current?.error ?? null

  useEffect(() => {
    document.title = `Usuario · ${appName()}`
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    const keyAtStart = `${userId}\u0000${attempt}`
    readUser(userId, controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return
        setSnapshot({ key: keyAtStart, user: result, error: null })
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted || isAbortError(cause)) return
        setSnapshot({ key: keyAtStart, user: null, error: toApiError(cause) })
      })
    return () => controller.abort()
  }, [userId, attempt])

  function applyUser(next: UserAccountDetail, confirmation: DetailNotice) {
    setSnapshot({ key, user: next, error: null })
    setNotice(confirmation)
  }

  const failure = error ? failureCopy(error) : null

  return (
    <div className="mx-auto flex w-full max-w-3xl min-w-0 flex-col gap-8">
      <div>
        <Link
          to="/app/users"
          className="text-sm font-semibold text-energy-text underline decoration-energy-text/40 underline-offset-4 focus-visible:ring-2 focus-visible:ring-energy-text focus-visible:outline-none"
        >
          Volver al directorio
        </Link>
        <h1 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-balance">
          {user ? userPrimaryLabel(user) : 'Detalle de usuario'}
        </h1>
      </div>

      {notice ? (
        <Alert tone="info" title={notice.title}>
          {notice.description}
        </Alert>
      ) : null}

      {loading ? (
        <p className="text-sm font-semibold text-muted" role="status">
          Cargando usuario
        </p>
      ) : null}

      {!loading && failure ? (
        <div className="grid max-w-xl gap-4">
          <Alert tone="error" title={failure.title}>
            {failure.message}
          </Alert>
          <Button type="button" variant="secondary" className="w-fit" onClick={() => setAttempt((value) => value + 1)}>
            Reintentar
          </Button>
        </div>
      ) : null}

      {!loading && user ? (
        <UserRecord
          user={user}
          onUpdated={(next) =>
            applyUser(next, {
              title: 'Usuario actualizado',
              description: 'Los cambios quedaron registrados en la cuenta.',
            })
          }
          onStatusUpdated={(next) =>
            applyUser(next, {
              title: next.enabled ? 'Cuenta reactivada' : 'Cuenta deshabilitada',
              description: next.enabled
                ? 'La cuenta puede ingresar de nuevo a EnerCol.'
                : 'La cuenta ya no puede ingresar a EnerCol. El usuario no fue eliminado.',
            })
          }
        />
      ) : null}
    </div>
  )
}

function UserRecord({
  user,
  onUpdated,
  onStatusUpdated,
}: {
  user: UserAccountDetail
  onUpdated: (user: UserAccountDetail) => void
  onStatusUpdated: (user: UserAccountDetail) => void
}) {
  const invitation = invitationStatusLabel(user.invitationStatus)
  const fields = [
    ['Creación', formatUserDate(user.createdAt)],
    ['Última modificación', formatUserDate(user.lastModifiedAt)],
  ]
  const formKey = [user.lastModifiedAt, user.firstName, user.lastName, user.phoneNumber, user.roles.join('|')].join('\u0000')

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-wrap gap-3">
          <AccountState user={user} />
          <ProfileState completed={user.profileCompleted} />
        </div>
        <Can permission="users:manage">
          <UserStatusControl user={user} onUpdated={onStatusUpdated} />
        </Can>
      </div>
      <div>
        <h2 className="text-xs font-semibold tracking-[0.14em] text-subtle uppercase">Roles actuales</h2>
        <div className="mt-3">
          <RoleBadges roles={user.roles} />
        </div>
      </div>
      <dl className="grid gap-4 sm:grid-cols-2">
        {fields.map(([label, value]) => (
          <div key={label} className="border-b border-line pb-3">
            <dt className="text-xs font-semibold tracking-[0.12em] text-subtle uppercase">{label}</dt>
            <dd className="mt-1 text-sm break-all text-foreground">{value}</dd>
          </div>
        ))}
        {invitation ? (
          <div className="border-b border-line pb-3">
            <dt className="text-xs font-semibold tracking-[0.12em] text-subtle uppercase">Invitación</dt>
            <dd className="mt-1 text-sm text-foreground">{invitation}</dd>
          </div>
        ) : null}
      </dl>
      <Can permission="users:manage">
        <EditUserForm key={formKey} user={user} onUpdated={onUpdated} />
      </Can>
    </div>
  )
}

function failureCopy(error: ApiError) {
  if (error.status === 403) return { title: 'Sin autorización', message: error.message }
  if (error.status === 404) return { title: 'Usuario no encontrado', message: error.message }
  if (error.status === null) return { title: 'Sin conexión', message: error.message }
  return { title: 'No fue posible consultar el usuario', message: error.message }
}
