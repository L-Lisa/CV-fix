import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getParticipantCVs } from '@/lib/queries/coach'
import { formatDate } from '@/lib/utils/format'
import { Button } from '@/components/ui/button'
import type { CV } from '@/types'

function CVCard({ cv }: { cv: CV }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="font-medium text-gray-900 truncate">{cv.title}</p>
        <p className="text-sm text-gray-500 mt-0.5">
          Uppdaterad {formatDate(cv.updated_at)} ·{' '}
          <span
            className={
              cv.status === 'complete' ? 'text-green-600' : 'text-amber-600'
            }
          >
            {cv.status === 'complete' ? 'Komplett' : 'Utkast'}
          </span>
          {cv.has_been_exported && (
            <span className="ml-2 text-gray-400">· Exporterat</span>
          )}
        </p>
      </div>
      <Link href={`/coach/cv/${cv.id}`} className="shrink-0">
        <Button variant="outline" size="sm">
          Granska
        </Button>
      </Link>
    </div>
  )
}

export default async function ParticipantPage({
  params,
}: {
  params: { userId: string }
}) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Verify coach role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'coach') redirect('/dashboard')

  // Verify this participant is actually linked to this coach
  const { data: link } = await supabase
    .from('coach_links')
    .select('id')
    .eq('coach_id', user.id)
    .eq('user_id', params.userId)
    .single()

  if (!link) notFound()

  // Get participant profile and CVs in parallel
  const [{ data: participantProfile }, cvs] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', params.userId).single(),
    getParticipantCVs(params.userId),
  ])

  const participantName = participantProfile?.full_name ?? 'Deltagare'

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/coach/dashboard"
          className="text-sm text-gray-400 hover:text-gray-700"
        >
          ← Tillbaka
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          {participantName}
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {cvs.length} {cvs.length === 1 ? 'CV' : 'CV:n'}
        </p>
      </div>

      {cvs.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-lg p-12 text-center">
          <p className="text-gray-500">Deltagaren har inga CV:n än.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {cvs.map((cv) => (
            <CVCard key={cv.id} cv={cv} />
          ))}
        </div>
      )}
    </div>
  )
}
