import { useEffect, useId, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { appName } from '@/config/env.ts'
import { Can } from '@/modules/access/can.tsx'
import { AccountState, ProfileState, RoleBadges } from '@/modules/users/user-account.tsx'
import { accountStatuses, type UserAccount, type UserAccountDetail, type UserDirectoryResponse } from '@/modules/users/user-contract.ts'
import { replaceDirectoryUser } from '@/modules/users/user-administration.ts'
import { InviteUserDialog } from '@/modules/users/invite-user-dialog.tsx'
import { UserStatusControl } from '@/modules/users/user-status-control.tsx'
import {
  accountStatusOptions,
  canAdvance,
  canRetreat,
  currentCursor,
  directoryParams,
  formatUserDate,
  initialCursorSession,
  isDirectoryRole,
  moveCursor,
  profileLabel,
  roleFilterOptions,
  userPrimaryLabel,
  type CursorSession,
  type DirectoryFilters,
} from '@/modules/users/user-directory.ts'
import { listUsers } from '@/modules/users/users-api.ts'
import { ApiError, isAbortError, toApiError } from '@/shared/lib/api-error.ts'
import { Button } from '@/shared/components/ui/button.tsx'
import { Input } from '@/shared/components/ui/input.tsx'
import { Label } from '@/shared/components/ui/label.tsx'
import { Alert } from '@/shared/components/ui/alert.tsx'
import { Spinner } from '@/shared/components/ui/spinner.tsx'

const fieldClass =
  'h-12 w-full rounded-md border border-border bg-surface px-3 text-base text-foreground outline-none hover:border-border-strong focus-visible:border-energy-text focus-visible:ring-2 focus-visible:ring-energy-text focus-visible:ring-offset-2 focus-visible:ring-offset-background'

type RequestState = DirectoryFilters & { session: CursorSession; attempt: number }
type DirectorySnapshot = { key: string; page: UserDirectoryResponse | null; error: ApiError | null }

function requestKey(state: RequestState) {
  return [
    state.search,
    state.status,
    state.role,
    String(state.session.index),
    currentCursor(state.session) ?? '',
    String(state.attempt),
  ].join('\u0000')
}

export function UsersDirectoryPage() {
  const [params, setParams] = useSearchParams()
  const filters = readFilters(params)
  const [draftSearch, setDraftSearch] = useState(filters.search)
  const [request, setRequest] = useState<RequestState>(() => ({
    ...filters,
    session: initialCursorSession(),
    attempt: 0,
  }))
  const [snapshot, setSnapshot] = useState<DirectorySnapshot | null>(null)
  const key = requestKey(request)
  const pending = snapshot?.key !== key
  const loading = snapshot === null
  const refreshing = snapshot !== null && pending
  const page = snapshot?.page ?? null
  const error = pending ? null : (snapshot?.error ?? null)
  const searchId = useId()
  const statusId = useId()
  const roleId = useId()
  const [creating, setCreating] = useState(false)
  const [notice, setNotice] = useState<{ title: string; description: string } | null>(null)

  if (!sameFilters(request, filters)) {
    setRequest({ ...filters, session: initialCursorSession(), attempt: 0 })
  }

  useEffect(() => {
    document.title = `Usuarios · ${appName()}`
  }, [])

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const value = draftSearch.trim()
      setParams((current) => {
        if ((current.get('search') ?? '') === value) return current
        const next = new URLSearchParams(current)
        if (value) next.set('search', value)
        else next.delete('search')
        return next
      }, { replace: true })
    }, 300)
    return () => window.clearTimeout(handle)
  }, [draftSearch, setParams])

  useEffect(() => {
    const controller = new AbortController()
    const keyAtStart = requestKey(request)

    listUsers(directoryParams(request, currentCursor(request.session)), controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return
        setSnapshot({ key: keyAtStart, page: result, error: null })
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted || isAbortError(cause)) return
        setSnapshot((current) => ({
          key: keyAtStart,
          page: current?.page ?? null,
          error: toApiError(cause),
        }))
      })

    return () => controller.abort()
  }, [request])

  function updateFilter(key: 'status' | 'role', value: string) {
    setParams((current) => {
      const next = new URLSearchParams(current)
      if (value) next.set(key, value)
      else next.delete(key)
      return next
    }, { replace: true })
  }

  function clearSearch() {
    setDraftSearch('')
    setParams((current) => {
      const next = new URLSearchParams(current)
      next.delete('search')
      return next
    }, { replace: true })
  }

  function applyStatus(detail: UserAccountDetail) {
    setSnapshot((current) => {
      if (!current?.page) return current
      return { ...current, page: replaceDirectoryUser(current.page, detail) }
    })
    setNotice({
      title: detail.enabled ? 'Cuenta reactivada' : 'Cuenta deshabilitada',
      description: detail.enabled
        ? 'La cuenta puede ingresar de nuevo a EnerCol.'
        : 'La cuenta ya no puede ingresar a EnerCol. El usuario no fue eliminado.',
    })
  }

  function move(direction: 'next' | 'previous') {
    setRequest((current) => {
      const session = moveCursor(current.session, direction, page?.nextToken ?? null)
      if (!session) return current
      return { ...current, session }
    })
  }

  const users = page?.users ?? []
  const filtered = Boolean(filters.search || filters.status || filters.role)
  const failure = error ? failureCopy(error) : null

  return (
    <div className="mx-auto flex w-full max-w-6xl min-w-0 flex-col gap-8">
      <header className="flex flex-col gap-5 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-semibold tracking-[-0.03em] text-balance">Administración de usuarios</h1>
          <p className="mt-3 text-base leading-relaxed text-muted">
            Gestiona las cuentas, perfiles y permisos de acceso a EnerCol.
          </p>
        </div>
        <Can permission="users:manage">
          <Button type="button" className="w-full shrink-0 sm:w-auto" onClick={() => setCreating(true)}>
            Nuevo usuario
          </Button>
        </Can>
      </header>

      {notice ? (
        <Alert tone="info" title={notice.title}>
          {notice.description}
        </Alert>
      ) : null}

      <form
        className="grid gap-4 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)] md:items-end"
        onSubmit={(event) => event.preventDefault()}
      >
        <div className="min-w-0">
          <Label htmlFor={searchId}>Buscar por correo electrónico</Label>
          <div className="mt-2 flex gap-2">
            <Input
              id={searchId}
              value={draftSearch}
              placeholder="nombre@organizacion.com"
              autoComplete="off"
              onChange={(event) => setDraftSearch(event.target.value)}
            />
            {draftSearch ? (
              <Button type="button" variant="secondary" className="shrink-0 px-4" onClick={clearSearch}>
                Limpiar
              </Button>
            ) : null}
          </div>
        </div>
        <div className="min-w-0">
          <Label htmlFor={statusId}>Estado de cuenta</Label>
          <select
            id={statusId}
            className={`${fieldClass} mt-2`}
            value={filters.status}
            onChange={(event) => updateFilter('status', event.target.value)}
          >
            <option value="">Todos</option>
            {accountStatusOptions().map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-0">
          <Label htmlFor={roleId}>Rol funcional</Label>
          <select
            id={roleId}
            className={`${fieldClass} mt-2`}
            value={filters.role}
            onChange={(event) => updateFilter('role', event.target.value)}
          >
            <option value="">Todos</option>
            {roleFilterOptions().map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </form>

      {refreshing ? (
        <p className="flex items-center gap-2 text-sm font-semibold text-muted" role="status">
          <Spinner />
          Actualizando el listado
        </p>
      ) : null}

      {loading ? <DirectorySkeleton /> : null}

      {!loading && failure && !page ? (
        <DirectoryFailure failure={failure} onRetry={() => setRequest((current) => ({ ...current, attempt: current.attempt + 1 }))} />
      ) : null}

      {!loading && page ? (
        <section aria-busy={refreshing} className="min-w-0">
          {failure ? (
            <div className="mb-4">
              <DirectoryFailure
                failure={failure}
                onRetry={() => setRequest((current) => ({ ...current, attempt: current.attempt + 1 }))}
              />
            </div>
          ) : null}
          {users.length === 0 ? (
            <p className="border-y border-line py-10 text-sm leading-6 text-muted">
              {filtered
                ? 'Ningún usuario coincide con la búsqueda o los filtros.'
                : 'No hay usuarios en el directorio.'}
            </p>
          ) : (
            <>
              <div className="hidden min-w-0 overflow-x-auto md:block">
                <table className="w-full min-w-[52rem] border-collapse text-left">
                  <caption className="sr-only">Directorio de usuarios</caption>
                  <thead>
                    <tr className="border-b border-line text-xs font-semibold tracking-[0.12em] text-subtle uppercase">
                      <th scope="col" className="px-3 py-3 font-semibold">Usuario</th>
                      <th scope="col" className="px-3 py-3 font-semibold">Correo electrónico</th>
                      <th scope="col" className="px-3 py-3 font-semibold">Roles</th>
                      <th scope="col" className="px-3 py-3 font-semibold">Estado</th>
                      <th scope="col" className="hidden px-3 py-3 font-semibold lg:table-cell">Perfil</th>
                      <th scope="col" className="hidden px-3 py-3 font-semibold xl:table-cell">Fecha de creación</th>
                      <th scope="col" className="px-3 py-3 font-semibold">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b border-line align-top">
                        <th scope="row" className="px-3 py-4 text-sm font-semibold text-foreground">
                          {userPrimaryLabel(user)}
                          <span className="mt-1 block font-normal text-muted lg:hidden">{profileLabel(user.profileCompleted)}</span>
                        </th>
                        <td className="px-3 py-4 text-sm break-all text-muted">{user.email ?? 'Sin correo'}</td>
                        <td className="px-3 py-4"><RoleBadges roles={user.roles} /></td>
                        <td className="px-3 py-4"><AccountState user={user} /></td>
                        <td className="hidden px-3 py-4 lg:table-cell"><ProfileState completed={user.profileCompleted} /></td>
                        <td className="hidden px-3 py-4 text-sm text-muted xl:table-cell">{formatUserDate(user.createdAt)}</td>
                        <td className="px-3 py-4">
                          <UserActions userId={user.id} user={user} onUpdated={applyStatus} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <ul className="divide-y divide-line border-y border-line md:hidden">
                {users.map((user) => (
                  <li key={user.id} className="flex flex-col gap-3 py-4">
                    <div>
                      <p className="text-base font-semibold">{userPrimaryLabel(user)}</p>
                      <p className="mt-1 text-sm break-all text-muted">{user.email ?? 'Sin correo'}</p>
                    </div>
                    <RoleBadges roles={user.roles} />
                    <AccountState user={user} />
                    <p className="text-sm text-muted">Perfil {profileLabel(user.profileCompleted).toLowerCase()}</p>
                    <p className="text-sm text-muted">Creación: {formatUserDate(user.createdAt)}</p>
                    <UserActions userId={user.id} user={user} onUpdated={applyStatus} />
                  </li>
                ))}
              </ul>
            </>
          )}
          {users.length > 0 || canRetreat(request.session) ? (
            <nav aria-label="Páginas del directorio" className="mt-4 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={!canRetreat(request.session) || refreshing}
                onClick={() => move('previous')}
              >
                Anterior
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={!canAdvance(request.session, page?.nextToken ?? null) || refreshing}
                onClick={() => move('next')}
              >
                Siguiente
              </Button>
            </nav>
          ) : null}
        </section>
      ) : null}
      {creating ? (
        <InviteUserDialog
          onClose={() => setCreating(false)}
          onCreated={(message) => {
            setCreating(false)
            setNotice({ title: 'Usuario creado', description: message })
            setRequest((current) => ({ ...current, attempt: current.attempt + 1 }))
          }}
        />
      ) : null}
    </div>
  )
}

function DirectorySkeleton() {
  return (
    <div role="status" aria-busy="true" className="grid gap-3">
      <p className="text-sm font-semibold text-muted">Cargando usuarios</p>
      {Array.from({ length: 5 }, (_, index) => (
        <div key={index} className="h-14 animate-pulse rounded-md bg-sunken motion-reduce:animate-none" />
      ))}
    </div>
  )
}

function DirectoryFailure({ failure, onRetry }: { failure: { title: string; message: string }; onRetry: () => void }) {
  return (
    <div className="grid max-w-xl gap-4">
      <Alert tone="error" title={failure.title}>
        {failure.message}
      </Alert>
      <Button type="button" variant="secondary" className="w-fit" onClick={onRetry}>
        Reintentar
      </Button>
    </div>
  )
}

function DetailLink({ id }: { id: string }) {
  return (
    <Link
      to={`/app/users/${encodeURIComponent(id)}`}
      className="inline-flex h-10 items-center text-sm font-semibold text-energy-text underline decoration-energy-text/40 underline-offset-4 focus-visible:ring-2 focus-visible:ring-energy-text focus-visible:outline-none"
    >
      Ver detalle
    </Link>
  )
}

function UserActions({
  userId,
  user,
  onUpdated,
}: {
  userId: string
  user: UserAccount
  onUpdated: (user: UserAccountDetail) => void
}) {
  return (
    <div className="flex flex-col items-start gap-1">
      <DetailLink id={userId} />
      <Can permission="users:manage">
        <UserStatusControl user={user} onUpdated={onUpdated} />
      </Can>
    </div>
  )
}

function readFilters(params: URLSearchParams): DirectoryFilters {
  const status = params.get('status') ?? ''
  const role = params.get('role') ?? ''
  return {
    search: params.get('search') ?? '',
    status: accountStatuses.some((item) => item === status) ? status : '',
    role: isDirectoryRole(role) ? role : '',
  }
}

function sameFilters(request: DirectoryFilters, filters: DirectoryFilters) {
  return request.search === filters.search && request.status === filters.status && request.role === filters.role
}

function failureCopy(error: ApiError) {
  if (error.status === 403) {
    return { title: 'Sin autorización', message: error.message }
  }
  if (error.status === null) {
    return { title: 'Sin conexión', message: error.message }
  }
  return { title: 'No fue posible cargar los usuarios', message: error.message }
}
