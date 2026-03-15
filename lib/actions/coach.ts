'use server'

import { createClient } from '@/lib/supabase/server'
import type { SaveResult } from '@/types'

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
