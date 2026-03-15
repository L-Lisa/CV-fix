// Guest mode — CV data lives entirely in localStorage.
// No auth required. Data is lost if the user clears their browser storage.

import type {
  PersonalInfoValues,
  ExperienceValues,
  EducationValues,
  SkillValues,
  LanguageEntryValues,
  VolunteeringValues,
  OtherEntryValues,
} from '@/lib/validation/cv'
import type { FullCV, CV, CVPersonalInfo, CVProfile, CVExperience, CVEducation, CVSkill, CVLanguageEntry, CVHobbies, CVVolunteering, CVOther } from '@/types'

export interface GuestCV {
  title: string
  language: 'sv' | 'en'
  layout: 1 | 2 | 3
  accentColor: string
  personalInfo: PersonalInfoValues | null
  profile: string | null
  experiences: ExperienceValues[]
  educations: EducationValues[]
  skills: SkillValues[]
  languages: LanguageEntryValues[]
  hobbies: string
  volunteerings: VolunteeringValues[]
  others: OtherEntryValues[]
}

const STORAGE_KEY = 'guestCV'

const DEFAULT_GUEST_CV: GuestCV = {
  title: 'Mitt CV',
  language: 'sv',
  layout: 1,
  accentColor: '#2563eb',
  personalInfo: null,
  profile: null,
  experiences: [],
  educations: [],
  skills: [],
  languages: [],
  hobbies: '',
  volunteerings: [],
  others: [],
}

export function loadGuestCV(): GuestCV {
  if (typeof window === 'undefined') return DEFAULT_GUEST_CV
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? { ...DEFAULT_GUEST_CV, ...JSON.parse(stored) } : DEFAULT_GUEST_CV
  } catch {
    return DEFAULT_GUEST_CV
  }
}

export function saveGuestCV(cv: GuestCV): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cv))
}

export function clearGuestCV(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}

export function hasGuestCV(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(STORAGE_KEY) !== null
}

// Assembles a FullCV shape from guest data for PDF rendering and ATS validation.
// IDs are synthetic — only used as React keys inside PDF layout components.
export function assembleGuestFullCV(guest: GuestCV): FullCV {
  const cvId = 'guest'

  const cv: CV = {
    id: cvId,
    user_id: '',
    title: guest.title,
    language: guest.language,
    layout: guest.layout,
    accent_color: guest.accentColor,
    status: 'draft',
    has_been_exported: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    updated_by: null,
  }

  const personalInfo: CVPersonalInfo | null = guest.personalInfo
    ? {
        cv_id: cvId,
        photo_url: null,
        ...guest.personalInfo,
        // optional fields that may be absent from PersonalInfoValues
        driving_license: guest.personalInfo.driving_license ?? null,
        linkedin_url: guest.personalInfo.linkedin_url ?? null,
        github_url: guest.personalInfo.github_url ?? null,
        portfolio_url: guest.personalInfo.portfolio_url ?? null,
        other_url: guest.personalInfo.other_url ?? null,
        city: guest.personalInfo.city ?? null,
        region: guest.personalInfo.region ?? null,
        headline: guest.personalInfo.headline ?? null,
      }
    : null

  const profile: CVProfile | null = guest.profile
    ? { cv_id: cvId, summary: guest.profile }
    : null

  const experiences: CVExperience[] = guest.experiences.map((e, i) => ({
    ...e,
    id: `exp-${i}`,
    cv_id: cvId,
    sort_order: i,
    country: e.country ?? null,
    city: e.city ?? null,
    type: e.type ?? null,
    description: e.description ?? null,
    end_month: e.end_month,
    end_year: e.end_year,
  }))

  const educations: CVEducation[] = guest.educations.map((e, i) => ({
    ...e,
    id: `edu-${i}`,
    cv_id: cvId,
    sort_order: i,
    description: e.description ?? null,
    end_year: e.end_year,
    level: e.level,
  }))

  const skills: CVSkill[] = guest.skills.map((s, i) => ({
    id: `skill-${i}`,
    cv_id: cvId,
    sort_order: i,
    category: s.category ?? null,
    level: s.level ?? null,
    name: s.name,
  }))

  const languages: CVLanguageEntry[] = guest.languages.map((l, i) => ({
    id: `lang-${i}`,
    cv_id: cvId,
    sort_order: i,
    language: l.language,
    level: l.level ?? null,
  }))

  const hobbies: CVHobbies | null = guest.hobbies
    ? { cv_id: cvId, text: guest.hobbies }
    : null

  const volunteering: CVVolunteering[] = guest.volunteerings.map((v, i) => ({
    id: `vol-${i}`,
    cv_id: cvId,
    sort_order: i,
    description: v.description ?? null,
    end_year: v.end_year,
    role: v.role,
    organisation: v.organisation,
    start_year: v.start_year,
    is_current: v.is_current,
  }))

  const other: CVOther[] = guest.others.map((o, i) => ({
    id: `other-${i}`,
    cv_id: cvId,
    sort_order: i,
    label: o.label,
    text: o.text,
  }))

  return { cv, personalInfo, profile, experiences, educations, skills, languages, hobbies, volunteering, other }
}
