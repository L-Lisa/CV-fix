// Pure server-side read functions for coach features.
// Import these in Server Components only.

import { createClient } from '@/lib/supabase/server'
import { validateCV } from '@/lib/ats/validate'
import type {
  Profile,
  CV,
  CVComment,
  CVPersonalInfo,
  CVProfile,
  CVExperience,
  CVEducation,
  FullCV,
} from '@/types'

export interface ATSStats {
  hard: number
  soft: number
}

// Fetches the four sections needed for ATS validation and returns error counts.
// Intentionally omits skills/languages/hobbies/volunteering/other — validateCV
// does not check those, so we avoid unnecessary queries.
export async function getATSStats(cvId: string): Promise<ATSStats> {
  const supabase = createClient()

  const [cvResult, piResult, profileResult, expResult, eduResult] = await Promise.all([
    supabase.from('cvs').select('*').eq('id', cvId).single(),
    supabase.from('cv_personal_info').select('*').eq('cv_id', cvId).single(),
    supabase.from('cv_profile').select('*').eq('cv_id', cvId).single(),
    supabase.from('cv_experiences').select('*').eq('cv_id', cvId).order('sort_order'),
    supabase.from('cv_educations').select('*').eq('cv_id', cvId).order('sort_order'),
  ])

  if (!cvResult.data) return { hard: 0, soft: 0 }

  const fullCV: FullCV = {
    cv: cvResult.data as CV,
    personalInfo: (piResult.data ?? null) as CVPersonalInfo | null,
    profile: (profileResult.data ?? null) as CVProfile | null,
    experiences: (expResult.data ?? []) as CVExperience[],
    educations: (eduResult.data ?? []) as CVEducation[],
    skills: [],
    languages: [],
    hobbies: null,
    volunteering: [],
    other: [],
  }

  const { hard, soft } = validateCV(fullCV)
  return { hard: hard.length, soft: soft.length }
}

// Returns all participant profiles linked to the given coach.
export async function getLinkedParticipants(coachId: string): Promise<Profile[]> {
  const supabase = createClient()

  const { data: links, error: linksError } = await supabase
    .from('coach_links')
    .select('user_id')
    .eq('coach_id', coachId)

  if (linksError || !links?.length) return []

  const userIds = links.map((l) => l.user_id)

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .in('id', userIds)
    .order('full_name', { ascending: true })

  if (error) {
    console.error('getLinkedParticipants failed:', error.message)
    return []
  }

  return (data ?? []) as Profile[]
}

// Returns all CVs belonging to a specific participant.
export async function getParticipantCVs(userId: string): Promise<CV[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('cvs')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('getParticipantCVs failed:', error.message)
    return []
  }

  return (data ?? []) as CV[]
}

// Returns all comments on a CV, ordered by creation time.
export async function getCommentsForCV(cvId: string): Promise<CVComment[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('cv_comments')
    .select('*')
    .eq('cv_id', cvId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('getCommentsForCV failed:', error.message)
    return []
  }

  return (data ?? []) as CVComment[]
}
