// Pure server-side read functions for coach features.
// Import these in Server Components only.

import { createClient } from '@/lib/supabase/server'
import type { Profile, CV, CVComment } from '@/types'

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
