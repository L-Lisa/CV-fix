'use server'

// Migrates a guest CV (from localStorage) into the authenticated user's account.
// Called after the user signs up and confirms their email.

import { createClient } from '@/lib/supabase/server'
import type { GuestCV } from '@/lib/guest/storage'
import type { CVActionResult } from '@/types'

export async function migrateGuestCV(guestCV: GuestCV): Promise<CVActionResult> {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'Inte inloggad' }

  // 1. Create the CV record
  const { data: cv, error: cvError } = await supabase
    .from('cvs')
    .insert({
      user_id: user.id,
      title: guestCV.title,
      language: guestCV.language,
      layout: guestCV.layout,
      accent_color: guestCV.accentColor,
    })
    .select('id')
    .single()

  if (cvError || !cv) {
    console.error('migrateGuestCV: cvs insert failed:', cvError?.message)
    return { success: false, error: 'Det gick inte att spara CV:t. Försök igen.' }
  }

  const cvId = cv.id

  // 2. Personal info
  if (guestCV.personalInfo) {
    await supabase
      .from('cv_personal_info')
      .upsert({ cv_id: cvId, ...guestCV.personalInfo }, { onConflict: 'cv_id' })
  } else {
    await supabase.from('cv_personal_info').insert({ cv_id: cvId })
  }

  // 3. Profile text
  if (guestCV.profile) {
    await supabase
      .from('cv_profile')
      .upsert({ cv_id: cvId, summary: guestCV.profile }, { onConflict: 'cv_id' })
  } else {
    await supabase.from('cv_profile').insert({ cv_id: cvId })
  }

  // 4–8. Array sections — batch inserts
  const inserts: Promise<unknown>[] = []

  if (guestCV.experiences.length > 0) {
    inserts.push(
      supabase.from('cv_experiences').insert(
        guestCV.experiences.map((e, i) => ({ cv_id: cvId, sort_order: i, ...e }))
      )
    )
  }

  if (guestCV.educations.length > 0) {
    inserts.push(
      supabase.from('cv_educations').insert(
        guestCV.educations.map((e, i) => ({ cv_id: cvId, sort_order: i, ...e }))
      )
    )
  }

  if (guestCV.skills.length > 0) {
    inserts.push(
      supabase.from('cv_skills').insert(
        guestCV.skills.map((s, i) => ({ cv_id: cvId, sort_order: i, ...s }))
      )
    )
  }

  if (guestCV.languages.length > 0) {
    inserts.push(
      supabase.from('cv_languages').insert(
        guestCV.languages.map((l, i) => ({ cv_id: cvId, sort_order: i, ...l }))
      )
    )
  }

  if (guestCV.hobbies) {
    inserts.push(
      supabase.from('cv_hobbies').insert({ cv_id: cvId, text: guestCV.hobbies })
    )
  }

  if (guestCV.volunteerings.length > 0) {
    inserts.push(
      supabase.from('cv_volunteering').insert(
        guestCV.volunteerings.map((v, i) => ({ cv_id: cvId, sort_order: i, ...v }))
      )
    )
  }

  if (guestCV.others.length > 0) {
    inserts.push(
      supabase.from('cv_other').insert(
        guestCV.others.map((o, i) => ({ cv_id: cvId, sort_order: i, ...o }))
      )
    )
  }

  await Promise.all(inserts)

  return { success: true, cvId }
}
