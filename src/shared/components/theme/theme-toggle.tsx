import { Monitor, Moon, Sun } from 'lucide-react'
import { type KeyboardEvent } from 'react'
import { themePreferences, type ThemePreference } from '@/config/theme.ts'
import { useTheme } from '@/shared/theme/use-theme.ts'
import { cn } from '@/shared/lib/utils.ts'

const options: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'dark', label: 'Oscuro', icon: Moon },
  { value: 'system', label: 'Sistema', icon: Monitor },
]

export function ThemeToggle({ className }: { className?: string }) {
  const { preference, setPreference } = useTheme()

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const current = themePreferences.indexOf(preference)
    const forward = event.key === 'ArrowRight' || event.key === 'ArrowDown'
    const backward = event.key === 'ArrowLeft' || event.key === 'ArrowUp'
    if (!forward && !backward) return
    event.preventDefault()
    const nextIndex = forward
      ? (current + 1) % themePreferences.length
      : (current - 1 + themePreferences.length) % themePreferences.length
    const next = themePreferences[nextIndex]
    if (!next) return
    setPreference(next)
    event.currentTarget.querySelector<HTMLButtonElement>(`[data-value="${next}"]`)?.focus()
  }

  return (
    <div
      role="radiogroup"
      aria-label="Apariencia"
      className={cn('inline-flex rounded-md border border-border bg-surface p-1', className)}
      onKeyDown={onKeyDown}
    >
      {options.map((option) => {
        const selected = preference === option.value
        const Icon = option.icon
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            data-value={option.value}
            aria-checked={selected}
            aria-label={option.label}
            tabIndex={selected ? 0 : -1}
            className={cn(
              'flex size-10 items-center justify-center rounded-sm transition-colors duration-150 motion-reduce:transition-none focus-visible:ring-2 focus-visible:ring-energy-text focus-visible:outline-none',
              selected
                ? 'bg-energy text-on-solid'
                : 'text-muted hover:bg-sunken hover:text-foreground',
            )}
            onClick={() => setPreference(option.value)}
          >
            <Icon className="size-4" strokeWidth={1.75} aria-hidden="true" />
          </button>
        )
      })}
    </div>
  )
}
