import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { ThemeToggle } from '@/shared/components/theme/theme-toggle.tsx'
import { Alert } from '@/shared/components/ui/alert.tsx'
import { AppNav } from '@/modules/shell/app-nav.tsx'
import { MobileNav } from '@/modules/shell/mobile-nav.tsx'
import { pageCrumb } from '@/modules/shell/page-crumb.ts'
import { sidebarWidths } from '@/modules/shell/sidebar.ts'
import { UserMenu } from '@/modules/shell/user-menu.tsx'
import { OwnProfileProvider } from '@/modules/profile/own-profile-context.tsx'
import { clearEntryNotice, peekEntryNotice } from '@/modules/profile/profile-completion.ts'
import { cn } from '@/shared/lib/utils.ts'

export function AppShell() {
  const [collapsed, setCollapsed] = useState(false)
  const [welcome] = useState<string | null>(() => peekEntryNotice())
  const { pathname } = useLocation()
  const crumb = pageCrumb(pathname)

  useEffect(() => {
    if (!welcome) return
    const timer = window.setTimeout(() => clearEntryNotice(), 0)
    return () => window.clearTimeout(timer)
  }, [welcome])

  return (
    <OwnProfileProvider>
      <div className="flex h-full min-h-0 overflow-hidden bg-background text-foreground">
        <aside
          id="navegacion-lateral"
          style={{ width: collapsed ? sidebarWidths.collapsed : sidebarWidths.expanded }}
          className={cn(
            'hidden shrink-0 border-r border-line bg-surface transition-[width] duration-200 ease-out motion-reduce:transition-none lg:flex',
          )}
        >
          <AppNav collapsed={collapsed} onToggleCollapse={() => setCollapsed((value) => !value)} />
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-line bg-surface px-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <MobileNav />
              <div className="min-w-0">
                <p className="truncate text-xs text-muted">{crumb.section}</p>
                <p className="truncate text-sm font-semibold">{crumb.title}</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <ThemeToggle />
              <UserMenu />
            </div>
          </header>
          <main className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
            {welcome ? (
              <div className="mx-auto mb-6 w-full max-w-6xl">
                <Alert tone="info" title="Cuenta activada">
                  {welcome}
                </Alert>
              </div>
            ) : null}
            <Outlet />
          </main>
        </div>
      </div>
    </OwnProfileProvider>
  )
}
