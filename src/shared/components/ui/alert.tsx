import { AlertCircle, Info } from 'lucide-react'
import { type ReactNode } from 'react'
import { cn } from '@/shared/lib/utils.ts'

type AlertTone = 'error' | 'info'

type AlertProps = {
  tone: AlertTone
  title: string
  children: ReactNode
  className?: string
}

const tones: Record<AlertTone, string> = {
  error: 'border-destructive bg-destructive-surface',
  info: 'border-energy-text bg-info-surface',
}

const titleTones: Record<AlertTone, string> = {
  error: 'text-destructive',
  info: 'text-energy-text',
}

export function Alert({ tone, title, children, className }: AlertProps) {
  const Icon = tone === 'error' ? AlertCircle : Info

  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      data-slot="alert"
      className={cn('flex gap-3 rounded-lg border px-3.5 py-3', tones[tone], className)}
    >
      <Icon className={cn('mt-0.5 size-4 shrink-0', titleTones[tone])} strokeWidth={1.75} aria-hidden="true" />
      <div className="min-w-0">
        <p className={cn('text-sm font-semibold', titleTones[tone])}>{title}</p>
        <div className="mt-1 text-sm leading-5 text-foreground">{children}</div>
      </div>
    </div>
  )
}
