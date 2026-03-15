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

// ─── Step 3: Work experience ──────────────────────────────────────────────────

export const experienceSchema = z.object({
  job_title: z.string().min(1, 'Jobbtitel krävs'),
  employer: z.string().min(1, 'Arbetsgivare krävs'),
  city: z.string().max(80).optional().or(z.literal('')),
  country: z.string().max(80).optional().or(z.literal('')),
  start_month: z.number().int().min(1).max(12),
  start_year: z.number().int().min(1900).max(2100),
  end_month: z.number().int().min(1).max(12).nullable(),
  end_year: z.number().int().min(1900).max(2100).nullable(),
  is_current: z.boolean(),
  description: z.string().max(2000).optional().or(z.literal('')),
  type: z.enum(['job', 'internship', 'summer', 'volunteer']).nullable(),
}).refine(
  (d) => d.is_current || (d.end_month !== null && d.end_year !== null),
  { message: 'Ange slutdatum eller markera som pågående', path: ['end_year'] }
).refine(
  (d) => {
    if (d.is_current || d.end_year === null) return true
    if (d.end_year !== d.start_year) return d.end_year > d.start_year
    return (d.end_month ?? 0) >= d.start_month
  },
  { message: 'Slutdatum kan inte vara före startdatum', path: ['end_year'] }
)

export const experiencesSchema = z.object({
  experiences: z.array(experienceSchema),
})

export type ExperienceValues = z.infer<typeof experienceSchema>
export type ExperiencesValues = z.infer<typeof experiencesSchema>

// ─── Step 4: Education ────────────────────────────────────────────────────────

export const educationSchema = z.object({
  institution: z.string().min(1, 'Skola / organisation krävs'),
  program: z.string().min(1, 'Program / utbildning krävs'),
  level: z.enum(['gymnasium', 'yh', 'hogskola', 'kurs', 'annat']).nullable(),
  start_year: z.number().int().min(1900).max(2100),
  end_year: z.number().int().min(1900).max(2100).nullable(),
  is_current: z.boolean(),
  description: z.string().max(1000).optional().or(z.literal('')),
}).refine(
  (d) => d.is_current || d.end_year !== null,
  { message: 'Ange slutår eller markera som pågående', path: ['end_year'] }
).refine(
  (d) => {
    if (d.is_current || d.end_year === null) return true
    return d.end_year >= d.start_year
  },
  { message: 'Slutår kan inte vara före startår', path: ['end_year'] }
)

export const educationsSchema = z.object({
  educations: z.array(educationSchema),
})

export type EducationValues = z.infer<typeof educationSchema>
export type EducationsValues = z.infer<typeof educationsSchema>

// ─── Step 5: Skills ───────────────────────────────────────────────────────────

export const skillSchema = z.object({
  category: z.enum(['technical', 'language', 'other']).nullable(),
  name: z.string().min(1, 'Namn krävs'),
  level: z.number().int().min(1).max(5).nullable(),
})

export const skillsSchema = z.object({
  skills: z.array(skillSchema),
})

export type SkillValues = z.infer<typeof skillSchema>
export type SkillsValues = z.infer<typeof skillsSchema>

// ─── Step 5: Languages ────────────────────────────────────────────────────────

export const languageEntrySchema = z.object({
  language: z.string().min(1, 'Språk krävs'),
  level: z.enum(['native', 'fluent', 'good', 'basic']).nullable(),
})

export const languagesSchema = z.object({
  languages: z.array(languageEntrySchema),
})

export type LanguageEntryValues = z.infer<typeof languageEntrySchema>
export type LanguagesValues = z.infer<typeof languagesSchema>

// ─── Step 5: Hobbies ─────────────────────────────────────────────────────────

export const hobbiesSchema = z.object({
  text: z.string().max(500).optional().or(z.literal('')),
})

export type HobbiesValues = z.infer<typeof hobbiesSchema>

// ─── Step 5: Volunteering ─────────────────────────────────────────────────────

export const volunteeringSchema = z.object({
  role: z.string().min(1, 'Roll krävs'),
  organisation: z.string().min(1, 'Organisation krävs'),
  start_year: z.number().int().min(1900).max(2100),
  end_year: z.number().int().min(1900).max(2100).nullable(),
  is_current: z.boolean(),
  description: z.string().max(1000).optional().or(z.literal('')),
}).refine(
  (d) => d.is_current || d.end_year !== null,
  { message: 'Ange slutår eller markera som pågående', path: ['end_year'] }
)

export const volunteeringsSchema = z.object({
  volunteerings: z.array(volunteeringSchema),
})

export type VolunteeringValues = z.infer<typeof volunteeringSchema>
export type VolunteeringsValues = z.infer<typeof volunteeringsSchema>

// ─── Step 5: Other ────────────────────────────────────────────────────────────

export const otherEntrySchema = z.object({
  label: z.string().min(1, 'Etikett krävs'),
  text: z.string().min(1, 'Text krävs'),
})

export const othersSchema = z.object({
  others: z.array(otherEntrySchema),
})

export type OtherEntryValues = z.infer<typeof otherEntrySchema>
export type OthersValues = z.infer<typeof othersSchema>

// ─── Step 5 combined (used by guest mode and SkillsLanguagesForm) ──────────────

export interface Step5Values {
  skills: SkillValues[]
  languages: LanguageEntryValues[]
  hobbies: string
  volunteerings: VolunteeringValues[]
  others: OtherEntryValues[]
}
