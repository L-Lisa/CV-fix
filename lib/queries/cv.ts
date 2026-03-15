// Pure server-side read functions. Import these in Server Components.
// Do NOT import in Client Components — use server actions for mutations instead.

import { createClient } from '@/lib/supabase/server'
import type {
  CV,
  CVPersonalInfo,
  CVProfile,
  CVExperience,
  CVEducation,
  CVSkill,
  CVLanguageEntry,
  CVHobbies,
  CVVolunteering,
  CVOther,
  FullCV,
} from '@/types'

export async function listCVs(): Promise<CV[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('cvs')
    .select('*')
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('listCVs failed:', error.message)
    return []
  }

  return (data ?? []) as CV[]
}

export async function getPersonalInfo(
  cvId: string
): Promise<CVPersonalInfo | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('cv_personal_info')
    .select('*')
    .eq('cv_id', cvId)
    .single()

  if (error) return null
  return data as CVPersonalInfo
}

export async function getProfileText(cvId: string): Promise<string | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('cv_profile')
    .select('summary')
    .eq('cv_id', cvId)
    .single()

  if (error) return null
  return data?.summary ?? null
}

export async function getExperiences(cvId: string): Promise<CVExperience[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('cv_experiences')
    .select('*')
    .eq('cv_id', cvId)
    .order('sort_order', { ascending: true })

  if (error) return []
  return (data ?? []) as CVExperience[]
}

export async function getEducations(cvId: string): Promise<CVEducation[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('cv_educations')
    .select('*')
    .eq('cv_id', cvId)
    .order('sort_order', { ascending: true })

  if (error) return []
  return (data ?? []) as CVEducation[]
}

export async function getSkills(cvId: string): Promise<CVSkill[]> {
  const supabase = createClient()

  const { data } = await supabase
    .from('cv_skills')
    .select('*')
    .eq('cv_id', cvId)
    .order('sort_order', { ascending: true })

  return (data ?? []) as CVSkill[]
}

export async function getLanguageEntries(cvId: string): Promise<CVLanguageEntry[]> {
  const supabase = createClient()

  const { data } = await supabase
    .from('cv_languages')
    .select('*')
    .eq('cv_id', cvId)
    .order('sort_order', { ascending: true })

  return (data ?? []) as CVLanguageEntry[]
}

export async function getHobbies(cvId: string): Promise<CVHobbies | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('cv_hobbies')
    .select('*')
    .eq('cv_id', cvId)
    .single()

  if (error) return null
  return data as CVHobbies
}

export async function getVolunteerings(cvId: string): Promise<CVVolunteering[]> {
  const supabase = createClient()

  const { data } = await supabase
    .from('cv_volunteering')
    .select('*')
    .eq('cv_id', cvId)
    .order('sort_order', { ascending: true })

  return (data ?? []) as CVVolunteering[]
}

export async function getOthers(cvId: string): Promise<CVOther[]> {
  const supabase = createClient()

  const { data } = await supabase
    .from('cv_other')
    .select('*')
    .eq('cv_id', cvId)
    .order('sort_order', { ascending: true })

  return (data ?? []) as CVOther[]
}

// Fetches all sections for a CV in parallel using a single Supabase client.
// Individual helper functions above are still available for standalone use by
// Server Components on the edit-step pages.
export async function getFullCV(cvId: string): Promise<FullCV | null> {
  const supabase = createClient()

  const [
    cvRow,
    personalInfoRow,
    profileRow,
    experiencesRows,
    educationsRows,
    skillsRows,
    languagesRows,
    hobbiesRow,
    volunteeringsRows,
    othersRows,
  ] = await Promise.all([
    supabase.from('cvs').select('*').eq('id', cvId).single(),
    supabase.from('cv_personal_info').select('*').eq('cv_id', cvId).single(),
    supabase.from('cv_profile').select('*').eq('cv_id', cvId).single(),
    supabase.from('cv_experiences').select('*').eq('cv_id', cvId).order('sort_order', { ascending: true }),
    supabase.from('cv_educations').select('*').eq('cv_id', cvId).order('sort_order', { ascending: true }),
    supabase.from('cv_skills').select('*').eq('cv_id', cvId).order('sort_order', { ascending: true }),
    supabase.from('cv_languages').select('*').eq('cv_id', cvId).order('sort_order', { ascending: true }),
    supabase.from('cv_hobbies').select('*').eq('cv_id', cvId).single(),
    supabase.from('cv_volunteering').select('*').eq('cv_id', cvId).order('sort_order', { ascending: true }),
    supabase.from('cv_other').select('*').eq('cv_id', cvId).order('sort_order', { ascending: true }),
  ])

  if (cvRow.error || !cvRow.data) return null

  return {
    cv: cvRow.data as CV,
    personalInfo: personalInfoRow.error ? null : (personalInfoRow.data as CVPersonalInfo),
    profile: profileRow.error ? null : (profileRow.data as CVProfile),
    experiences: (experiencesRows.data ?? []) as CVExperience[],
    educations: (educationsRows.data ?? []) as CVEducation[],
    skills: (skillsRows.data ?? []) as CVSkill[],
    languages: (languagesRows.data ?? []) as CVLanguageEntry[],
    hobbies: hobbiesRow.error ? null : (hobbiesRow.data as CVHobbies),
    volunteering: (volunteeringsRows.data ?? []) as CVVolunteering[],
    other: (othersRows.data ?? []) as CVOther[],
  }
}
