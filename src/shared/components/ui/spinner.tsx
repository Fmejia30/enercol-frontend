import { cn } from '@/shared/lib/utils.ts'

type SpinnerProps = {
  className?: string
}

export function Spinner({ className }: SpinnerProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      className={cn('size-4 motion-safe:animate-spin', className)}
      aria-hidden="true"
    >
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.75" opacity="0.28" />
      <path d="M14 8a6 6 0 0 0-6-6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  )
}
