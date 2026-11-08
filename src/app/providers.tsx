import { type ReactNode } from 'react'
import { AuthorizationProvider } from '@/modules/access/authorization-provider.tsx'
import { AuthProvider } from '@/modules/auth/auth-provider.tsx'
import { ThemeProvider } from '@/shared/theme/theme-provider.tsx'

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AuthorizationProvider>{children}</AuthorizationProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
