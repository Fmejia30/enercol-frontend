import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  THEME_STORAGE_KEY,
  applyTheme,
  isThemePreference,
  type ResolvedTheme,
  type ThemePreference,
} from '@/config/theme.ts'
import { ThemeContext, type ThemeContextValue } from '@/shared/theme/theme-context.ts'

function readPreference(): ThemePreference {
  const value = document.documentElement.dataset.themePreference
  return isThemePreference(value) ? value : 'system'
}

function readResolved(): ResolvedTheme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(readPreference)
  const [resolved, setResolved] = useState<ResolvedTheme>(readResolved)

  useEffect(() => {
    if (preference !== 'system') return
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => setResolved(applyTheme('system'))
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [preference])

  const value = useMemo<ThemeContextValue>(
    () => ({
      preference,
      resolved,
      setPreference: (next) => {
        try {
          localStorage.setItem(THEME_STORAGE_KEY, next)
        } catch {
          /* La preferencia sigue aplicándose en esta visita. */
        }
        setPreferenceState(next)
        setResolved(applyTheme(next))
      },
    }),
    [preference, resolved],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
