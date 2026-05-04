import { z } from 'zod'

export const registerSchema = z.object({
  fullName: z.string().min(1, 'Namn krävs'),
  email: z.string().email('Ange en giltig e-postadress'),
  password: z
    .string()
    .min(8, 'Lösenordet måste vara minst 8 tecken')
    .max(72, 'Lösenordet är för långt'),
  role: z.enum(['user', 'coach'], {
    error: () => 'Välj en roll',
  }),
  coachEmail: z
    .string()
    .email('Ange en giltig e-postadress för coachen')
    .optional()
    .or(z.literal('')),
})

export type RegisterFormValues = z.infer<typeof registerSchema>

export const loginSchema = z.object({
  email: z.string().email('Ange en giltig e-postadress'),
  password: z.string().min(1, 'Lösenord krävs'),
})

export type LoginFormValues = z.infer<typeof loginSchema>

export const forgotPasswordSchema = z.object({
  email: z.string().email('Ange en giltig e-postadress'),
})

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Lösenordet måste vara minst 8 tecken')
      .max(72, 'Lösenordet är för långt'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Lösenorden matchar inte',
    path: ['confirmPassword'],
  })

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>
