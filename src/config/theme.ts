export const THEME_STORAGE_KEY = 'enercol-theme'

export const themePreferences = ['light', 'dark', 'system'] as const

export type ThemePreference = (typeof themePreferences)[number]
export type ResolvedTheme = 'light' | 'dark'

export function isThemePreference(value: string | null | undefined): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system'
}

export function resolveTheme(preference: ThemePreference): ResolvedTheme {
  if (preference !== 'system') return preference
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function applyTheme(preference: ThemePreference) {
  const resolved = resolveTheme(preference)
  const root = document.documentElement
  root.dataset.theme = resolved
  root.dataset.themePreference = preference
  root.style.colorScheme = resolved
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', resolved === 'dark' ? '#101118' : '#F5F7FA')
  return resolved
}
