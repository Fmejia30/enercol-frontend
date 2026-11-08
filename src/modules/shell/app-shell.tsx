import { Outlet } from 'react-router-dom'
import { ThemeToggle } from '@/shared/components/theme/theme-toggle.tsx'
import { AppNav } from '@/modules/shell/app-nav.tsx'
import { MobileNav } from '@/modules/shell/mobile-nav.tsx'

export function AppShell() {
  return (
    <div className="flex h-full min-h-0 overflow-hidden bg-background text-foreground">
      <aside className="hidden w-72 shrink-0 border-r border-line bg-surface lg:flex">
        <AppNav />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-line bg-surface px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <MobileNav />
            <p className="truncate text-sm font-semibold">Espacio de trabajo</p>
          </div>
          <ThemeToggle />
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
