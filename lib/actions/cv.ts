'use server'

// Mutation server actions only. For reads, use lib/queries/cv.ts.

import { createClient } from '@/lib/supabase/server'
import type { CVLanguage } from '@/types'
import type { PersonalInfoValues } from '@/lib/validation/cv'

export type CVActionResult =
  | { success: true; cvId: string }
  | { success: false; error: string }

export type SaveResult =
  | { success: true }
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

  // Initialise empty linked rows so upserts in later steps work without conflicts
  await supabase.from('cv_personal_info').insert({ cv_id: cv.id })
  await supabase.from('cv_profile').insert({ cv_id: cv.id })

  return { success: true, cvId: cv.id }
}

export async function savePersonalInfo(
  cvId: string,
  values: PersonalInfoValues
): Promise<SaveResult> {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'Inte inloggad' }

  const { error } = await supabase
    .from('cv_personal_info')
    .upsert({ cv_id: cvId, ...values }, { onConflict: 'cv_id' })

  if (error) {
    console.error('savePersonalInfo failed:', error.message)
    return { success: false, error: 'Det gick inte att spara. Försök igen.' }
  }

  // The cvs.updated_at trigger only fires on direct cvs updates, not on child
  // table writes. We touch the cvs row here so the dashboard shows the correct
  // "last edited" time. The BEFORE UPDATE trigger overwrites the value with now().
  await supabase
    .from('cvs')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', cvId)
    .eq('user_id', user.id)

  return { success: true }
}
