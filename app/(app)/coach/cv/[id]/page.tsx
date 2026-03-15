import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getFullCV } from '@/lib/queries/cv'
import { getCommentsForCV } from '@/lib/queries/coach'
import CoachCVPageClient from '@/components/coach/CoachCVPageClient'

export default async function CoachCVPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Verify coach role
  const { data: coachProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (coachProfile?.role !== 'coach') redirect('/dashboard')

  const [fullCV, comments] = await Promise.all([
    getFullCV(params.id),
    getCommentsForCV(params.id),
  ])

  if (!fullCV) notFound()

  // Verify this coach is linked to the CV's owner
  const { data: link } = await supabase
    .from('coach_links')
    .select('id')
    .eq('coach_id', user.id)
    .eq('user_id', fullCV.cv.user_id)
    .single()

  if (!link) notFound()

  const { personalInfo: pi } = fullCV
  const fullName = [pi?.first_name, pi?.last_name].filter(Boolean).join(' ')

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/coach/participant/${fullCV.cv.user_id}`}
          className="text-sm text-gray-400 hover:text-gray-700"
        >
          ← Tillbaka
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">{fullCV.cv.title}</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Granskar CV · {fullName || 'Namnlös'}
        </p>
      </div>

      <CoachCVPageClient
        cvId={params.id}
        fullCV={fullCV}
        comments={comments}
      />
    </div>
  )
}
