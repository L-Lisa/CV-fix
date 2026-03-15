// Pure server-side read functions. Import these in Server Components.
// Do NOT import in Client Components — use server actions for mutations instead.

import { createClient } from '@/lib/supabase/server'
import type { CV, CVPersonalInfo, CVExperience } from '@/types'

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
