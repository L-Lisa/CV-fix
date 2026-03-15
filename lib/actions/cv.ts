'use server'

// Mutation server actions only. For reads, use lib/queries/cv.ts.

import { createClient } from '@/lib/supabase/server'
import type { CVLanguage } from '@/types'
import type {
  PersonalInfoValues,
  ExperienceValues,
  EducationValues,
  SkillValues,
  LanguageEntryValues,
  HobbiesValues,
  VolunteeringValues,
  OtherEntryValues,
} from '@/lib/validation/cv'

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

export async function saveSkills(
  cvId: string,
  skills: SkillValues[]
): Promise<SaveResult> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Inte inloggad' }

  await supabase.from('cv_skills').delete().eq('cv_id', cvId)

  if (skills.length > 0) {
    const { error } = await supabase
      .from('cv_skills')
      .insert(skills.map((s, i) => ({ cv_id: cvId, ...s, sort_order: i })))
    if (error) {
      console.error('saveSkills failed:', error.message)
      return { success: false, error: 'Det gick inte att spara. Försök igen.' }
    }
  }

  return { success: true }
}

export async function saveLanguages(
  cvId: string,
  languages: LanguageEntryValues[]
): Promise<SaveResult> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Inte inloggad' }

  await supabase.from('cv_languages').delete().eq('cv_id', cvId)

  if (languages.length > 0) {
    const { error } = await supabase
      .from('cv_languages')
      .insert(languages.map((l, i) => ({ cv_id: cvId, ...l, sort_order: i })))
    if (error) {
      console.error('saveLanguages failed:', error.message)
      return { success: false, error: 'Det gick inte att spara. Försök igen.' }
    }
  }

  return { success: true }
}

export async function saveHobbies(
  cvId: string,
  text: string
): Promise<SaveResult> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Inte inloggad' }

  const { error } = await supabase
    .from('cv_hobbies')
    .upsert({ cv_id: cvId, text }, { onConflict: 'cv_id' })

  if (error) {
    console.error('saveHobbies failed:', error.message)
    return { success: false, error: 'Det gick inte att spara. Försök igen.' }
  }

  return { success: true }
}

export async function saveVolunteerings(
  cvId: string,
  volunteerings: VolunteeringValues[]
): Promise<SaveResult> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Inte inloggad' }

  await supabase.from('cv_volunteering').delete().eq('cv_id', cvId)

  if (volunteerings.length > 0) {
    const { error } = await supabase
      .from('cv_volunteering')
      .insert(volunteerings.map((v, i) => ({ cv_id: cvId, ...v, sort_order: i })))
    if (error) {
      console.error('saveVolunteerings failed:', error.message)
      return { success: false, error: 'Det gick inte att spara. Försök igen.' }
    }
  }

  return { success: true }
}

export async function saveOthers(
  cvId: string,
  others: OtherEntryValues[]
): Promise<SaveResult> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Inte inloggad' }

  await supabase.from('cv_other').delete().eq('cv_id', cvId)

  if (others.length > 0) {
    const { error } = await supabase
      .from('cv_other')
      .insert(others.map((o, i) => ({ cv_id: cvId, ...o, sort_order: i })))
    if (error) {
      console.error('saveOthers failed:', error.message)
      return { success: false, error: 'Det gick inte att spara. Försök igen.' }
    }
  }

  return { success: true }
}

// Touch cvs.updated_at after all step-5 sections are saved
export async function touchCV(cvId: string): Promise<void> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('cvs')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', cvId)
    .eq('user_id', user.id)
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
