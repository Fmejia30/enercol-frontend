import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { ThemeToggle } from '@/shared/components/theme/theme-toggle.tsx'
import { Alert } from '@/shared/components/ui/alert.tsx'
import { AppNav } from '@/modules/shell/app-nav.tsx'
import { MobileNav } from '@/modules/shell/mobile-nav.tsx'
import { sidebarWidths } from '@/modules/shell/sidebar.ts'
import { OwnProfileProvider } from '@/modules/profile/own-profile-context.tsx'
import { clearEntryNotice, peekEntryNotice } from '@/modules/profile/profile-completion.ts'
import { cn } from '@/shared/lib/utils.ts'

export function AppShell() {
  const [collapsed, setCollapsed] = useState(false)
  const [welcome] = useState<string | null>(() => peekEntryNotice())

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
        <div className="flex min-w-0 flex-1 flex-col transition-[width] duration-200 ease-out motion-reduce:transition-none">
          <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-line bg-surface px-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-2">
              <MobileNav />
              <p className="truncate text-sm font-semibold">Espacio de trabajo</p>
            </div>
            <ThemeToggle />
          </header>
          <main className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
            {welcome ? (
              <div className="mb-6">
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
