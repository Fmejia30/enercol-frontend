import { type ComponentProps } from 'react'
import { cn } from '@/shared/lib/utils.ts'

function Input({ className, type = 'text', ...props }: ComponentProps<'input'>) {
  return (
    <input
      type={type}
      className={cn(
        'h-12 w-full min-w-0 rounded-md border border-border bg-surface px-3.5 text-base text-foreground transition-[border-color,box-shadow] duration-150 outline-none placeholder:text-subtle motion-reduce:transition-none hover:border-border-strong focus-visible:border-energy-text focus-visible:ring-2 focus-visible:ring-energy-text focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-not-allowed disabled:border-line disabled:bg-sunken disabled:text-subtle disabled:hover:border-line aria-invalid:border-destructive aria-invalid:hover:border-destructive aria-invalid:focus-visible:border-destructive aria-invalid:focus-visible:ring-destructive',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
