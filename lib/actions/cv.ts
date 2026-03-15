'use server'

// Mutation server actions only. For reads, use lib/queries/cv.ts.

import { createClient } from '@/lib/supabase/server'
import type { CVLanguage } from '@/types'
import type { PersonalInfoValues, ExperienceValues, EducationValues } from '@/lib/validation/cv'

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

export async function saveProfileText(
  cvId: string,
  summary: string
): Promise<SaveResult> {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'Inte inloggad' }

  const { error } = await supabase
    .from('cv_profile')
    .upsert({ cv_id: cvId, summary }, { onConflict: 'cv_id' })

  if (error) {
    console.error('saveProfileText failed:', error.message)
    return { success: false, error: 'Det gick inte att spara. Försök igen.' }
  }

  await supabase
    .from('cvs')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', cvId)
    .eq('user_id', user.id)

  return { success: true }
}

export async function saveExperiences(
  cvId: string,
  experiences: ExperienceValues[]
): Promise<SaveResult> {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'Inte inloggad' }

  // Replace strategy: delete all existing rows, then insert the new list.
  // Simpler and safer than diffing individual rows for a small collection.
  const { error: deleteError } = await supabase
    .from('cv_experiences')
    .delete()
    .eq('cv_id', cvId)

  if (deleteError) {
    console.error('saveExperiences delete failed:', deleteError.message)
    return { success: false, error: 'Det gick inte att spara. Försök igen.' }
  }

  if (experiences.length > 0) {
    const rows = experiences.map((exp, i) => ({
      cv_id: cvId,
      ...exp,
      sort_order: i,
    }))

    const { error: insertError } = await supabase
      .from('cv_experiences')
      .insert(rows)

    if (insertError) {
      console.error('saveExperiences insert failed:', insertError.message)
      return { success: false, error: 'Det gick inte att spara. Försök igen.' }
    }
  }

  await supabase
    .from('cvs')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', cvId)
    .eq('user_id', user.id)

  return { success: true }
}

export async function saveEducations(
  cvId: string,
  educations: EducationValues[]
): Promise<SaveResult> {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'Inte inloggad' }

  const { error: deleteError } = await supabase
    .from('cv_educations')
    .delete()
    .eq('cv_id', cvId)

  if (deleteError) {
    console.error('saveEducations delete failed:', deleteError.message)
    return { success: false, error: 'Det gick inte att spara. Försök igen.' }
  }

  if (educations.length > 0) {
    const rows = educations.map((edu, i) => ({
      cv_id: cvId,
      ...edu,
      sort_order: i,
    }))

    const { error: insertError } = await supabase
      .from('cv_educations')
      .insert(rows)

    if (insertError) {
      console.error('saveEducations insert failed:', insertError.message)
      return { success: false, error: 'Det gick inte att spara. Försök igen.' }
    }
  }

  await supabase
    .from('cvs')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', cvId)
    .eq('user_id', user.id)

  return { success: true }
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
