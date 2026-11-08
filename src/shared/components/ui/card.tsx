import { type ComponentProps } from 'react'
import { cn } from '@/shared/lib/utils.ts'

function Card({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="card"
      className={cn('rounded-lg border border-line bg-surface text-foreground shadow-sm', className)}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="card-header" className={cn('grid gap-1.5 p-6', className)} {...props} />
}

function CardTitle({ className, ...props }: ComponentProps<'h2'>) {
  return (
    <h2
      data-slot="card-title"
      className={cn('text-lg font-semibold tracking-[-0.02em]', className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: ComponentProps<'p'>) {
  return (
    <p data-slot="card-description" className={cn('text-sm leading-5 text-muted', className)} {...props} />
  )
}

function CardContent({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="card-content" className={cn('px-6 pb-6', className)} {...props} />
}

function CardFooter({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div data-slot="card-footer" className={cn('flex items-center px-6 pb-6', className)} {...props} />
  )
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter }
