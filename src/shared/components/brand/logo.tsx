import { cn } from '@/shared/lib/utils.ts'

type LogoTone = 'inverse' | 'default'

type LogoMarkProps = {
  tone?: LogoTone
  className?: string
}

export function LogoMark({ tone = 'inverse', className }: LogoMarkProps) {
  const signal = tone === 'inverse' ? 'var(--cyan)' : 'var(--energy-text)'

  return (
    <svg viewBox="0 0 36 36" className={cn('size-9 shrink-0', className)} aria-hidden="true">
      <rect
        x="1.25"
        y="1.25"
        width="33.5"
        height="33.5"
        rx="7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="M12.5 8.5v19" fill="none" stroke="currentColor" strokeWidth="1.75" />
      <path d="M12.5 13h8" fill="none" stroke="currentColor" strokeWidth="1.75" />
      <path d="M12.5 18h11" fill="none" stroke={signal} strokeWidth="1.75" />
      <path d="M12.5 23h6.5" fill="none" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="24.75" cy="18" r="1.65" fill={signal} />
    </svg>
  )
}

type LogoLockupProps = {
  tone?: LogoTone
  compact?: boolean
  className?: string
}

export function LogoLockup({ tone = 'inverse', compact = false, className }: LogoLockupProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-3',
        tone === 'inverse' ? 'text-cloud' : 'text-foreground',
        compact && 'justify-center',
        className,
      )}
    >
      <LogoMark tone={tone} className={compact ? 'size-8' : undefined} />
      <span className={cn('text-lg font-semibold tracking-[-0.02em]', compact && 'sr-only')}>EnerCol</span>
    </div>
  )
}
