import { createContext } from 'react'
import { type ResolvedTheme, type ThemePreference } from '@/config/theme.ts'

export type ThemeContextValue = {
  preference: ThemePreference
  resolved: ResolvedTheme
  setPreference: (preference: ThemePreference) => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)
