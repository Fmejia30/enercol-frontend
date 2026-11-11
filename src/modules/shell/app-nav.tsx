import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { LogoLockup } from '@/shared/components/brand/logo.tsx'
import { navigation } from '@/config/navigation.ts'
import { visibleWhenAllowed } from '@/modules/access/permission-requirement.ts'
import { useAuthorization } from '@/modules/access/use-authorization.ts'
import { useAuth } from '@/modules/auth/use-auth.ts'
import { AccountPanel, RailTip } from '@/modules/shell/account-panel.tsx'
import { useOwnProfile } from '@/modules/profile/use-own-profile.ts'
import { navigationForProfile, profileIsComplete, userIdentity } from '@/modules/profile/profile-completion.ts'
import { toApiError } from '@/shared/lib/api-error.ts'
import { cn } from '@/shared/lib/utils.ts'

export function AppNav({
  collapsed = false,
  onNavigate,
  onToggleCollapse,
}: {
  collapsed?: boolean
  onNavigate?: () => void
  onToggleCollapse?: () => void
}) {
  const { snapshot, logout } = useAuth()
  const authorization = useAuthorization()
  const { state: profileState } = useOwnProfile()
  const navigate = useNavigate()
  const [pending, setPending] = useState(false)
  const [logoutError, setLogoutError] = useState<string | null>(null)
  const user = snapshot.status === 'authenticated' ? snapshot.user : null
  const profile = profileState.status === 'ready' ? profileState.profile : null
  const complete = profile ? profileIsComplete(profile) : profileState.status !== 'ready'
  const items = navigationForProfile(visibleWhenAllowed(navigation, authorization), complete)
  const identity = userIdentity({
    firstName: profile?.firstName ?? null,
    lastName: profile?.lastName ?? null,
    roles: profile?.roles ?? user?.roles ?? [],
    loading: profileState.status === 'loading',
  })

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
    <div className="flex h-full min-h-0 w-full flex-col">
      <div className={cn('flex items-center gap-2 py-5', collapsed ? 'justify-center px-2' : 'px-5')}>
        <LogoLockup tone="default" compact={collapsed} />
      </div>
      {onToggleCollapse ? (
        <div className={cn('pb-2', collapsed ? 'px-2' : 'px-3')}>
          <button
            type="button"
            className="flex h-10 w-full items-center justify-center gap-2 rounded-md text-sm font-semibold text-muted hover:bg-sunken hover:text-foreground focus-visible:ring-2 focus-visible:ring-energy-text focus-visible:outline-none"
            aria-expanded={!collapsed}
            aria-controls="navegacion-lateral"
            onClick={onToggleCollapse}
          >
            {collapsed ? (
              <PanelLeftOpen className="size-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            ) : (
              <PanelLeftClose className="size-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            )}
            <span className={cn(collapsed && 'sr-only')}>{collapsed ? 'Expandir menú' : 'Contraer menú'}</span>
          </button>
        </div>
      ) : null}
      <nav aria-label="Secciones" className={cn('min-h-0 flex-1 overflow-y-auto', collapsed ? 'px-2' : 'px-3')}>
        <ul className="grid gap-1">
          {items.map((item, index) => {
            const Icon = item.icon
            const showSection = Boolean(item.section) && items[index - 1]?.section !== item.section
            return (
              <li key={item.label}>
                {showSection ? (
                  <p className={cn('px-3 pt-5 pb-1 text-xs font-semibold tracking-[0.14em] text-subtle uppercase', collapsed && 'sr-only')}>
                    {item.section}
                  </p>
                ) : null}
                {collapsed && showSection ? <div className="mx-2 my-2 border-t border-line" aria-hidden="true" /> : null}
                <RailTip label={item.to ? item.label : `${item.label}. Próximamente`} enabled={collapsed}>
                  {item.to ? (
                    <NavLink
                      to={item.to}
                      end={item.end ?? true}
                      onClick={onNavigate}
                      aria-label={collapsed ? item.label : undefined}
                      title={collapsed ? item.label : undefined}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold focus-visible:ring-2 focus-visible:ring-energy-text focus-visible:outline-none',
                          collapsed && 'justify-center px-0',
                          isActive
                            ? 'bg-sunken text-foreground shadow-[inset_2px_0_0_0_var(--energy)]'
                            : 'text-muted hover:bg-sunken hover:text-foreground',
                        )
                      }
                    >
                      <Icon className="size-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                      <span className={cn('min-w-0 flex-1 truncate', collapsed && 'sr-only')}>{item.label}</span>
                    </NavLink>
                  ) : (
                    <span
                      className={cn(
                        'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-subtle',
                        collapsed && 'justify-center px-0',
                      )}
                      aria-label={collapsed ? `${item.label}. Próximamente` : undefined}
                      title={collapsed ? `${item.label}. Próximamente` : undefined}
                    >
                      <Icon className="size-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                      <span className={cn('min-w-0 flex-1', collapsed && 'sr-only')}>{item.label}</span>
                      <span className={cn('text-xs tracking-wide', collapsed && 'sr-only')}>Próximamente</span>
                    </span>
                  )}
                </RailTip>
              </li>
            )
          })}
        </ul>
      </nav>
      <div className={cn('border-t border-line py-4', collapsed ? 'px-2' : 'px-5')}>
        {user ? (
          <AccountPanel
            key={collapsed ? 'contraido' : 'expandido'}
            collapsed={collapsed}
            name={identity.name}
            initials={identity.initials}
            roleLine={identity.roleLine}
            busy={pending}
            logoutError={logoutError}
            onLogout={() => void onLogout()}
            onNavigate={onNavigate}
          />
        ) : (
          <p className="text-sm font-semibold">Sesión no iniciada</p>
        )}
      </div>
    </div>
  )
}
