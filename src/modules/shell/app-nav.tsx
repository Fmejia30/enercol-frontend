import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { LogoLockup } from '@/shared/components/brand/logo.tsx'
import { navigation } from '@/config/navigation.ts'
import { visibleWhenAllowed } from '@/modules/access/permission-requirement.ts'
import { useAuthorization } from '@/modules/access/use-authorization.ts'
import { useAuth } from '@/modules/auth/use-auth.ts'
import { toApiError } from '@/shared/lib/api-error.ts'
import { Button } from '@/shared/components/ui/button.tsx'
import { cn } from '@/shared/lib/utils.ts'

export function AppNav({ onNavigate }: { onNavigate?: () => void }) {
  const { snapshot, logout } = useAuth()
  const authorization = useAuthorization()
  const items = visibleWhenAllowed(navigation, authorization)
  const navigate = useNavigate()
  const [pending, setPending] = useState(false)
  const [logoutError, setLogoutError] = useState<string | null>(null)
  const user = snapshot.status === 'authenticated' ? snapshot.user : null

  async function onLogout() {
    if (pending) return
    setLogoutError(null)
    setPending(true)
    try {
      await logout()
      onNavigate?.()
      navigate('/login', { replace: true })
    } catch (error) {
      setLogoutError(toApiError(error).message)
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="px-5 py-5">
        <LogoLockup tone="default" />
      </div>
      <nav aria-label="Secciones" className="min-h-0 flex-1 overflow-y-auto px-3">
        <ul className="grid gap-1">
          {items.map((item) => {
            const Icon = item.icon
            if (!item.to) {
              return (
                <li key={item.label}>
                  <span className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-subtle">
                    <Icon className="size-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                    <span className="min-w-0 flex-1">{item.label}</span>
                    <span className="text-xs tracking-wide">Próximamente</span>
                  </span>
                </li>
              )
            }

            return (
              <li key={item.label}>
                <NavLink
                  to={item.to}
                  end
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold focus-visible:ring-2 focus-visible:ring-energy-text focus-visible:outline-none',
                      isActive
                        ? 'bg-sunken text-foreground'
                        : 'text-muted hover:bg-sunken hover:text-foreground',
                    )
                  }
                >
                  <Icon className="size-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                  {item.label}
                </NavLink>
              </li>
            )
          })}
        </ul>
      </nav>
      <div className="border-t border-line px-5 py-5">
        {user ? (
          <>
            <p className="text-sm font-semibold break-all">{user.email ?? 'Cuenta autenticada'}</p>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="mt-4 w-full"
              loading={pending}
              onClick={() => void onLogout()}
            >
              {pending ? 'Cerrando sesión' : 'Cerrar sesión'}
            </Button>
            {logoutError ? (
              <p className="mt-3 text-sm leading-5 text-destructive" role="alert">
                {logoutError}
              </p>
            ) : null}
          </>
        ) : (
          <>
            <p className="text-sm font-semibold">Sesión no iniciada</p>
            <p className="mt-1 text-sm leading-5 text-muted">
              {snapshot.sessionNotice ?? 'No hay una sesión activa.'}
            </p>
          </>
        )}
      </div>
    </div>
  )
}
