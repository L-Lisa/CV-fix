'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { SaveResult } from '@/types'
import type {
  PersonalInfoValues,
  ProfileTextValues,
  ExperienceValues,
  EducationValues,
  Step5Values,
} from '@/lib/validation/cv'

// ─── Access verification helper ──────────────────────────────────────────────

async function verifyCoachAccess(
  coachId: string,
  cvId: string
): Promise<{ ok: true; ownerId: string } | { ok: false; error: string }> {
  const supabase = createClient()

  const [profileResult, cvResult] = await Promise.all([
    supabase.from('profiles').select('role').eq('id', coachId).single(),
    supabase.from('cvs').select('user_id').eq('id', cvId).single(),
  ])

  if (profileResult.data?.role !== 'coach') {
    return { ok: false, error: 'Åtkomst nekad' }
  }
  if (!cvResult.data) {
    return { ok: false, error: 'CV:t hittades inte' }
  }

  const { data: link } = await supabase
    .from('coach_links')
    .select('id')
    .eq('coach_id', coachId)
    .eq('user_id', cvResult.data.user_id)
    .single()

  if (!link) {
    return { ok: false, error: 'Åtkomst nekad' }
  }

  return { ok: true, ownerId: cvResult.data.user_id }
}

// Stamps updated_by on the cvs row after a coach edit.
// Uses admin client — coaches have UPDATE policy on cvs but the row is owned
// by the participant, so we bypass RLS here intentionally.
async function stampCoachEdit(cvId: string, coachId: string): Promise<void> {
  const admin = createAdminClient()
  await admin
    .from('cvs')
    .update({ updated_by: coachId, updated_at: new Date().toISOString() })
    .eq('id', cvId)
}

// ─── Coach edit actions ───────────────────────────────────────────────────────

export async function addComment(
  cvId: string,
  sectionType: string,
  itemId: string | null,
  comment: string
): Promise<SaveResult> {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'Inte inloggad' }

  // Verify the caller is a coach
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'coach') {
    return { success: false, error: 'Åtkomst nekad' }
  }

  const { error } = await supabase.from('cv_comments').insert({
    cv_id: cvId,
    coach_id: user.id,
    section_type: sectionType,
    item_id: itemId,
    comment,
  })

  if (error) {
    console.error('addComment failed:', error.message)
    return { success: false, error: 'Det gick inte att spara kommentaren. Försök igen.' }
  }

  return { success: true }
}

export async function coachSavePersonalInfo(
  cvId: string,
  values: PersonalInfoValues
): Promise<SaveResult> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Inte inloggad' }

  const access = await verifyCoachAccess(user.id, cvId)
  if (!access.ok) return { success: false, error: access.error }

  // coaches have UPDATE on cv_personal_info — no admin needed
  const { error } = await supabase
    .from('cv_personal_info')
    .update(values)
    .eq('cv_id', cvId)

  if (error) {
    console.error('coachSavePersonalInfo failed:', error.message)
    return { success: false, error: 'Det gick inte att spara. Försök igen.' }
  }

  await stampCoachEdit(cvId, user.id)
  return { success: true }
}

export async function coachSaveProfileText(
  cvId: string,
  values: ProfileTextValues
): Promise<SaveResult> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Inte inloggad' }

  const access = await verifyCoachAccess(user.id, cvId)
  if (!access.ok) return { success: false, error: access.error }

  const { error } = await supabase
    .from('cv_profile')
    .update({ summary: values.summary })
    .eq('cv_id', cvId)

  if (error) {
    console.error('coachSaveProfileText failed:', error.message)
    return { success: false, error: 'Det gick inte att spara. Försök igen.' }
  }

  await stampCoachEdit(cvId, user.id)
  return { success: true }
}

// Array sections require DELETE + INSERT which coaches don't have via RLS.
// We use the admin client for the write, with explicit access verification above.

export async function coachSaveExperiences(
  cvId: string,
  experiences: ExperienceValues[]
): Promise<SaveResult> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Inte inloggad' }

  const access = await verifyCoachAccess(user.id, cvId)
  if (!access.ok) return { success: false, error: access.error }

  const admin = createAdminClient()
  const { error: deleteError } = await admin
    .from('cv_experiences')
    .delete()
    .eq('cv_id', cvId)

  if (deleteError) {
    console.error('coachSaveExperiences delete failed:', deleteError.message)
    return { success: false, error: 'Det gick inte att spara. Försök igen.' }
  }

  if (experiences.length > 0) {
    const { error: insertError } = await admin
      .from('cv_experiences')
      .insert(experiences.map((e, i) => ({ cv_id: cvId, sort_order: i, ...e })))

    if (insertError) {
      console.error('coachSaveExperiences insert failed:', insertError.message)
      return { success: false, error: 'Det gick inte att spara. Försök igen.' }
    }
  }

  await stampCoachEdit(cvId, user.id)
  return { success: true }
}

export async function coachSaveEducations(
  cvId: string,
  educations: EducationValues[]
): Promise<SaveResult> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Inte inloggad' }

  const access = await verifyCoachAccess(user.id, cvId)
  if (!access.ok) return { success: false, error: access.error }

  const admin = createAdminClient()
  const { error: deleteError } = await admin
    .from('cv_educations')
    .delete()
    .eq('cv_id', cvId)

  if (deleteError) {
    console.error('coachSaveEducations delete failed:', deleteError.message)
    return { success: false, error: 'Det gick inte att spara. Försök igen.' }
  }

  if (educations.length > 0) {
    const { error: insertError } = await admin
      .from('cv_educations')
      .insert(educations.map((e, i) => ({ cv_id: cvId, sort_order: i, ...e })))

    if (insertError) {
      console.error('coachSaveEducations insert failed:', insertError.message)
      return { success: false, error: 'Det gick inte att spara. Försök igen.' }
    }
  }

  await stampCoachEdit(cvId, user.id)
  return { success: true }
}

export async function coachSaveStep5(
  cvId: string,
  values: Step5Values
): Promise<SaveResult> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Inte inloggad' }

  const access = await verifyCoachAccess(user.id, cvId)
  if (!access.ok) return { success: false, error: access.error }

  const admin = createAdminClient()

  const deletes = await Promise.all([
    admin.from('cv_skills').delete().eq('cv_id', cvId),
    admin.from('cv_languages').delete().eq('cv_id', cvId),
    admin.from('cv_volunteering').delete().eq('cv_id', cvId),
    admin.from('cv_other').delete().eq('cv_id', cvId),
  ])

  const deleteError = deletes.find((r) => r.error)?.error
  if (deleteError) {
    console.error('coachSaveStep5 delete failed:', deleteError.message)
    return { success: false, error: 'Det gick inte att spara. Försök igen.' }
  }

  const inserts: PromiseLike<unknown>[] = []

  if (values.skills.length > 0) {
    inserts.push(admin.from('cv_skills').insert(values.skills.map((s, i) => ({ cv_id: cvId, sort_order: i, ...s }))))
  }
  if (values.languages.length > 0) {
    inserts.push(admin.from('cv_languages').insert(values.languages.map((l, i) => ({ cv_id: cvId, sort_order: i, ...l }))))
  }
  if (values.volunteerings.length > 0) {
    inserts.push(admin.from('cv_volunteering').insert(values.volunteerings.map((v, i) => ({ cv_id: cvId, sort_order: i, ...v }))))
  }
  if (values.others.length > 0) {
    inserts.push(admin.from('cv_other').insert(values.others.map((o, i) => ({ cv_id: cvId, sort_order: i, ...o }))))
  }

  // cv_hobbies uses upsert (single row per CV)
  inserts.push(
    admin.from('cv_hobbies').upsert({ cv_id: cvId, text: values.hobbies || null }, { onConflict: 'cv_id' })
  )

  await Promise.all(inserts)
  await stampCoachEdit(cvId, user.id)
  return { success: true }
}

export async function resolveComment(commentId: string): Promise<SaveResult> {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'Inte inloggad' }

  const { error } = await supabase
    .from('cv_comments')
    .update({ is_resolved: true, resolved_at: new Date().toISOString() })
    .eq('id', commentId)
    .eq('coach_id', user.id)

  if (error) {
    console.error('resolveComment failed:', error.message)
    return { success: false, error: 'Det gick inte att uppdatera kommentaren. Försök igen.' }
  }

  return { success: true }
}
