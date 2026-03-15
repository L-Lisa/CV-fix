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
