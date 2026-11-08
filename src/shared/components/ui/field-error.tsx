import { type ReactNode } from 'react'

type FieldErrorProps = {
  id: string
  children: ReactNode
}

export function FieldError({ id, children }: FieldErrorProps) {
  return (
    <p id={id} data-slot="field-error" className="text-sm leading-5 text-destructive">
      {children}
    </p>
  )
}
