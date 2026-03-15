'use server'

import { createClient } from '@/lib/supabase/server'
import type { CV, CVLanguage } from '@/types'

export type CVActionResult =
  | { success: true; cvId: string }
  | { success: false; error: string }

export async function createCV(
  language: CVLanguage,
  title: string
): Promise<CVActionResult> {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Inte inloggad' }
  }

  const { data: cv, error: cvError } = await supabase
    .from('cvs')
    .insert({ user_id: user.id, language, title })
    .select('id')
    .single()

  if (cvError || !cv) {
    console.error('createCV failed:', cvError?.message)
    return { success: false, error: 'Det gick inte att skapa CV:t. Försök igen.' }
  }

  // Initialise empty linked rows so upserts work later
  await supabase.from('cv_personal_info').insert({ cv_id: cv.id })
  await supabase.from('cv_profile').insert({ cv_id: cv.id })

  return { success: true, cvId: cv.id }
}

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
