import { z } from 'zod'

// ─── Step 1: Personal Info ────────────────────────────────────────────────────

export const personalInfoSchema = z.object({
  first_name: z.string().min(1, 'Förnamn krävs'),
  last_name: z.string().min(1, 'Efternamn krävs'),
  headline: z.string().max(100).optional().or(z.literal('')),
  phone: z.string().min(5, 'Telefonnummer krävs'),
  email: z.string().email('Ange en giltig e-postadress'),
  city: z.string().max(80).optional().or(z.literal('')),
  region: z.string().max(80).optional().or(z.literal('')),
  linkedin_url: z
    .string()
    .url('Ogiltig URL')
    .optional()
    .or(z.literal('')),
  github_url: z
    .string()
    .url('Ogiltig URL')
    .optional()
    .or(z.literal('')),
  portfolio_url: z
    .string()
    .url('Ogiltig URL')
    .optional()
    .or(z.literal('')),
  other_url: z
    .string()
    .url('Ogiltig URL')
    .optional()
    .or(z.literal('')),
  driving_license: z.string().max(80).optional().or(z.literal('')),
})

export type PersonalInfoValues = z.infer<typeof personalInfoSchema>

// ─── Step 2: Profile text ─────────────────────────────────────────────────────

export const profileTextSchema = z.object({
  summary: z.string().min(1, 'Profiltext krävs').max(2000),
})

export type ProfileTextValues = z.infer<typeof profileTextSchema>
