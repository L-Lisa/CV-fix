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

export async function getProfileText(
  cvId: string
): Promise<string | null> {
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

export async function getFullCV(cvId: string): Promise<FullCV | null> {
  const supabase = createClient()

  const [
    cvRow,
    personalInfo,
    profileRow,
    experiences,
    educations,
    skills,
    languages,
    hobbies,
    volunteerings,
    others,
  ] = await Promise.all([
    supabase.from('cvs').select('*').eq('id', cvId).single(),
    getPersonalInfo(cvId),
    supabase.from('cv_profile').select('*').eq('cv_id', cvId).single(),
    getExperiences(cvId),
    getEducations(cvId),
    getSkills(cvId),
    getLanguageEntries(cvId),
    getHobbies(cvId),
    getVolunteerings(cvId),
    getOthers(cvId),
  ])

  if (cvRow.error || !cvRow.data) return null

  return {
    cv: cvRow.data as CV,
    personalInfo,
    profile: profileRow.data ? (profileRow.data as CVProfile) : null,
    experiences,
    educations,
    skills,
    languages,
    hobbies,
    volunteering: volunteerings,
    other: others,
  }
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
