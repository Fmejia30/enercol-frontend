import { useContext } from 'react'
import { ThemeContext } from '@/shared/theme/theme-context.ts'

export function useTheme() {
  const value = useContext(ThemeContext)
  if (!value) throw new Error('useTheme debe usarse dentro de ThemeProvider.')
  return value
}
