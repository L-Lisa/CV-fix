import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getLinkedParticipants, getParticipantCVs } from '@/lib/queries/coach'
import { formatDate } from '@/lib/utils/format'
import { Button } from '@/components/ui/button'
import type { CV, Profile } from '@/types'

function ParticipantCard({
  participant,
  cvs,
}: {
  participant: Profile
  cvs: CV[]
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="font-medium text-gray-900">
            {participant.full_name ?? 'Namnlös användare'}
          </p>
          <p className="text-sm text-gray-500 mt-0.5">
            {cvs.length} {cvs.length === 1 ? 'CV' : 'CV:n'}
          </p>
        </div>
        <Link href={`/coach/participant/${participant.id}`}>
          <Button variant="outline" size="sm">
            Visa CV:n
          </Button>
        </Link>
      </div>

      {cvs.length > 0 && (
        <div className="space-y-2 border-t border-gray-100 pt-3">
          {cvs.slice(0, 3).map((cv) => (
            <div key={cv.id} className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-sm text-gray-700 truncate">{cv.title}</p>
                <p className="text-xs text-gray-400">
                  Uppdaterad {formatDate(cv.updated_at)}
                </p>
              </div>
              <Link href={`/coach/cv/${cv.id}`} className="ml-4 shrink-0">
                <Button variant="outline" size="sm">
                  Granska
                </Button>
              </Link>
            </div>
          ))}
          {cvs.length > 3 && (
            <Link
              href={`/coach/participant/${participant.id}`}
              className="text-xs text-gray-400 hover:text-gray-700"
            >
              + {cvs.length - 3} till
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

export default async function CoachDashboardPage() {
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

  const participants = await getLinkedParticipants(user.id)

  // Fetch CVs for all participants in parallel
  const cvsByParticipant = await Promise.all(
    participants.map((p) => getParticipantCVs(p.id))
  )

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          Mina deltagare
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {participants.length} deltagare kopplade till dig
        </p>
      </div>

      {participants.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-lg p-12 text-center">
          <p className="text-gray-500">
            Inga deltagare är kopplade till dig ännu.
          </p>
          <p className="text-sm text-gray-400 mt-1">
            Deltagare kopplas när de registrerar sig med din e-postadress.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {participants.map((participant, i) => (
            <ParticipantCard
              key={participant.id}
              participant={participant}
              cvs={cvsByParticipant[i]}
            />
          ))}
        </div>
      )}
    </div>
  )
}
