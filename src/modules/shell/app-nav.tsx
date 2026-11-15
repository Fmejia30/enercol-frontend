import { NavLink } from 'react-router-dom'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { LogoLockup } from '@/shared/components/brand/logo.tsx'
import { navigation } from '@/config/navigation.ts'
import { visibleWhenAllowed } from '@/modules/access/permission-requirement.ts'
import { useAuthorization } from '@/modules/access/use-authorization.ts'
import { useOwnProfile } from '@/modules/profile/use-own-profile.ts'
import { navigationForProfile, profileIsComplete } from '@/modules/profile/profile-completion.ts'
import { RailTip } from '@/modules/shell/account-panel.tsx'
import { UserMenu } from '@/modules/shell/user-menu.tsx'
import { cn } from '@/shared/lib/utils.ts'

export function AppNav({
  collapsed = false,
  onNavigate,
  onToggleCollapse,
  showAccount = false,
}: {
  collapsed?: boolean
  onNavigate?: () => void
  onToggleCollapse?: () => void
  showAccount?: boolean
}) {
  const authorization = useAuthorization()
  const { state: profileState } = useOwnProfile()
  const profile = profileState.status === 'ready' ? profileState.profile : null
  const complete = profile ? profileIsComplete(profile) : profileState.status !== 'ready'
  const items = navigationForProfile(visibleWhenAllowed(navigation, authorization), complete)

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <div className={cn('flex items-center py-4', collapsed ? 'justify-center px-2' : 'px-4')}>
        <LogoLockup tone="default" compact={collapsed} />
      </div>
      {onToggleCollapse ? (
        <div className={cn('pb-2', collapsed ? 'px-2' : 'px-3')}>
          <button
            type="button"
            className="flex h-9 w-full items-center justify-center gap-2 rounded-md text-sm font-semibold text-muted hover:bg-sunken hover:text-foreground focus-visible:ring-2 focus-visible:ring-energy-text focus-visible:outline-none"
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
        <ul className="grid gap-0.5">
          {items.map((item, index) => {
            const Icon = item.icon
            const showSection = Boolean(item.section) && items[index - 1]?.section !== item.section
            return (
              <li key={item.label}>
                {showSection ? (
                  <p className={cn('px-3 pt-4 pb-1 text-xs font-semibold text-subtle', collapsed && 'sr-only')}>
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
                          'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold focus-visible:ring-2 focus-visible:ring-energy-text focus-visible:outline-none',
                          collapsed && 'justify-center px-0',
                          isActive
                            ? 'bg-accent-soft text-foreground shadow-[inset_2px_0_0_0_var(--energy)]'
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
                        'flex items-center gap-3 rounded-md px-3 py-2 text-sm text-subtle',
                        collapsed && 'justify-center px-0',
                      )}
                      aria-label={collapsed ? `${item.label}. Próximamente` : undefined}
                      title={collapsed ? `${item.label}. Próximamente` : undefined}
                    >
                      <Icon className="size-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                      <span className={cn('min-w-0 flex-1', collapsed && 'sr-only')}>{item.label}</span>
                      <span className={cn('text-xs', collapsed && 'sr-only')}>Próximamente</span>
                    </span>
                  )}
                </RailTip>
              </li>
            )
          })}
        </ul>
      </nav>
      {showAccount ? (
        <div className="border-t border-line px-3 py-3">
          <UserMenu onNavigate={onNavigate} />
        </div>
      ) : null}
    </div>
  )
}
