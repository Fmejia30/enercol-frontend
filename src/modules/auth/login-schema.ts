import { z } from 'zod'

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Ingrese su correo electrónico.')
    .pipe(z.email('Ingrese un correo electrónico válido.')),
  password: z.string().superRefine((value, ctx) => {
    if (value.length === 0) {
      ctx.addIssue({ code: 'custom', message: 'Ingrese su contraseña.' })
      return
    }
    if (value.length < 8) {
      ctx.addIssue({
        code: 'custom',
        message: 'La contraseña debe tener al menos 8 caracteres.',
      })
    }
  }),
})

export type LoginValues = z.infer<typeof loginSchema>
