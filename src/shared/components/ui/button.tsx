import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { type ComponentProps, type MouseEvent } from 'react'
import { Spinner } from '@/shared/components/ui/spinner.tsx'
import { cn } from '@/shared/lib/utils.ts'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-md border text-base font-semibold whitespace-nowrap transition-colors duration-150 motion-reduce:transition-none focus-visible:ring-2 focus-visible:ring-energy-text focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        primary:
          'border-transparent bg-energy text-on-solid hover:bg-energy-hover active:bg-energy-active',
        secondary: 'border-border bg-surface text-foreground hover:bg-sunken active:bg-sunken',
        ghost:
          'border-transparent bg-transparent text-energy-text hover:bg-energy-text/10 active:bg-energy-text/15',
        destructive:
          'border-transparent bg-destructive-fill text-on-solid hover:bg-destructive-fill-hover active:bg-destructive-fill-hover',
      },
      size: {
        default: 'h-12 px-4',
        sm: 'h-10 px-3 text-sm',
        icon: 'size-12',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  },
)

type ButtonProps = ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    loading?: boolean
  }

function Button({
  asChild = false,
  loading = false,
  variant,
  size,
  className,
  children,
  disabled,
  type,
  onClick,
  ...props
}: ButtonProps) {
  const isInactive = Boolean(disabled) || loading
  const classes = cn(
    buttonVariants({ variant, size }),
    disabled && !loading && 'border-transparent bg-disabled text-disabled-foreground',
    loading && 'cursor-progress',
    className,
  )

  if (asChild) {
    return (
      <Slot className={classes} {...props}>
        {children}
      </Slot>
    )
  }

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    if (isInactive) {
      event.preventDefault()
      return
    }
    onClick?.(event)
  }

  return (
    <button
      type={type ?? 'button'}
      {...props}
      className={classes}
      disabled={disabled && !loading ? true : undefined}
      aria-disabled={isInactive || undefined}
      aria-busy={loading || undefined}
      onClick={handleClick}
    >
      {loading ? <Spinner /> : null}
      {children}
    </button>
  )
}

export { Button }
