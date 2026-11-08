import * as LabelPrimitive from '@radix-ui/react-label'
import { type ComponentProps } from 'react'
import { cn } from '@/shared/lib/utils.ts'

function Label({ className, ...props }: ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn('text-sm leading-none font-semibold text-foreground', className)}
      {...props}
    />
  )
}

export { Label }
