import { cva, type VariantProps } from 'class-variance-authority'
import { type ComponentProps } from 'react'
import { cn } from '@/shared/lib/utils.ts'

const badgeVariants = cva(
  'inline-flex items-center gap-2 rounded-sm border px-2.5 py-1 text-xs font-semibold tracking-wide',
  {
    variants: {
      tone: {
        neutral: 'border-line bg-surface text-foreground',
        signal: 'border-white/20 bg-transparent text-cloud',
        danger: 'border-transparent bg-destructive-surface text-destructive',
        success: 'border-transparent bg-success-surface text-success',
        warning: 'border-transparent bg-warning-surface text-warning',
        info: 'border-transparent bg-info-surface text-energy-text',
        draft: 'border-transparent bg-draft-surface text-draft',
      },
    },
    defaultVariants: {
      tone: 'neutral',
    },
  },
)

type BadgeProps = ComponentProps<'span'> & VariantProps<typeof badgeVariants>

function Badge({ className, tone, children, ...props }: BadgeProps) {
  return (
    <span data-slot="badge" className={cn(badgeVariants({ tone }), className)} {...props}>
      {tone === 'signal' ? <span className="size-1.5 bg-cyan" aria-hidden="true" /> : null}
      {children}
    </span>
  )
}

export { Badge }
