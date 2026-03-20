// All TypeScript types for the CV builder application.
// Keep all types here. Do not inline complex types in components.

// ─── User / Auth ────────────────────────────────────────────────────────────

export type UserRole = 'user' | 'coach' | 'admin'

export interface Profile {
  id: string
  role: UserRole
  full_name: string | null
  created_at: string
  updated_at: string
}

// ─── CV Document ─────────────────────────────────────────────────────────────

export type CVLanguage = 'sv' | 'en'
export type CVLayout = 1 | 2 | 3
export type CVStatus = 'draft' | 'complete'

export interface CV {
  id: string
  user_id: string
  title: string
  language: CVLanguage
  layout: CVLayout
  accent_color: string
  status: CVStatus
  has_been_exported: boolean
  created_at: string
  updated_at: string
  updated_by: string | null
}

// ─── CV Sections ─────────────────────────────────────────────────────────────

export interface CVPersonalInfo {
  cv_id: string
  first_name: string | null
  last_name: string | null
  headline: string | null
  phone: string | null
  email: string | null
  city: string | null
  region: string | null
  linkedin_url: string | null
  github_url: string | null
  portfolio_url: string | null
  other_url: string | null
  driving_license: string | null
  photo_url: string | null
}

export interface CVProfile {
  cv_id: string
  summary: string | null
}

export type ExperienceType = 'job' | 'internship' | 'summer' | 'volunteer'

export interface CVExperience {
  id: string
  cv_id: string
  job_title: string | null
  employer: string | null
  city: string | null
  country: string | null
  start_month: number | null
  start_year: number | null
  end_month: number | null
  end_year: number | null
  is_current: boolean
  description: string | null
  type: ExperienceType | null
  sort_order: number
}

export type EducationLevel = 'gymnasium' | 'yh' | 'hogskola' | 'kurs' | 'annat'

export interface CVEducation {
  id: string
  cv_id: string
  institution: string | null
  program: string | null
  level: EducationLevel | null
  start_year: number | null
  end_year: number | null
  is_current: boolean
  description: string | null
  sort_order: number
}

export type SkillCategory = 'technical' | 'language' | 'other'

export interface CVSkill {
  id: string
  cv_id: string
  category: SkillCategory | null
  name: string | null
  level: number | null
  sort_order: number
}

export type LanguageLevel = 'native' | 'fluent' | 'good' | 'basic'

export interface CVLanguageEntry {
  id: string
  cv_id: string
  language: string | null
  level: LanguageLevel | null
  sort_order: number
}

export interface CVHobbies {
  cv_id: string
  text: string | null
}

export interface CVVolunteering {
  id: string
  cv_id: string
  role: string | null
  organisation: string | null
  start_year: number | null
  end_year: number | null
  is_current: boolean
  description: string | null
  sort_order: number
}

export interface CVOther {
  id: string
  cv_id: string
  label: string | null
  text: string | null
  sort_order: number
}

// ─── Coach ───────────────────────────────────────────────────────────────────

export interface CoachLink {
  id: string
  coach_id: string
  user_id: string
  created_at: string
}

export interface CVComment {
  id: string
  cv_id: string
  coach_id: string
  section_type: string
  item_id: string | null
  comment: string
  is_resolved: boolean
  resolved_at: string | null
  created_at: string
}

// ─── Action Results ──────────────────────────────────────────────────────────

export type CVActionResult =
  | { success: true; cvId: string }
  | { success: false; error: string }

export type SaveResult =
  | { success: true }
  | { success: false; error: string }

// ─── ATS Validation ──────────────────────────────────────────────────────────

export type ATSErrorSeverity = 'hard' | 'soft'

export interface ATSError {
  severity: ATSErrorSeverity
  field: string | null
  message: string
}

// ─── Full CV (assembled for PDF rendering) ───────────────────────────────────

export interface FullCV {
  cv: CV
  personalInfo: CVPersonalInfo | null
  profile: CVProfile | null
  experiences: CVExperience[]
  educations: CVEducation[]
  skills: CVSkill[]
  languages: CVLanguageEntry[]
  hobbies: CVHobbies | null
  volunteering: CVVolunteering[]
  other: CVOther[]
}

// ─── AI ──────────────────────────────────────────────────────────────────────

export interface AIProfilePayload {
  language: 'sv' | 'en'
  currentSummary?: string
  // Auth flow: send cvId, server fetches data
  cvId?: string
  // Guest flow: send data directly
  guestData?: {
    headline: string | null
    experiences: Array<{
      job_title: string | null
      employer: string | null
      description: string | null
    }>
    educations: Array<{
      program: string | null
      institution: string | null
    }>
    skills: Array<{ name: string | null }>
    languages: Array<{ language: string | null; level: string | null }>
  }
}

export interface AIDescriptionPayload {
  jobTitle: string
  employer: string
  currentDescription: string
  language: 'sv' | 'en'
  cvId?: string     // auth flow: verify ownership
  isGuest?: boolean // guest flow: skip auth
}

export interface AISkillsPayload {
  language: 'sv' | 'en'
  cvId?: string
  guestData?: {
    experiences: Array<{ job_title: string | null }>
    educations: Array<{ program: string | null }>
    existingSkills: Array<{ name: string | null }>
  }
}

export interface AIResult {
  result: string
  systemPrompt?: string // dev mode: visible in expandable panel
  userPrompt?: string   // dev mode: visible in expandable panel
  error?: string
}
