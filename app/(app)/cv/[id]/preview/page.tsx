import { notFound } from 'next/navigation'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getFullCV } from '@/lib/queries/cv'
import { getCommentsForCV } from '@/lib/queries/coach'
import { validateCV } from '@/lib/ats/validate'
import ATSPanel from '@/components/cv/ATSPanel'
import LayoutPicker from '@/components/cv/LayoutPicker'
import LanguageToggle from '@/components/cv/LanguageToggle'
import CoachCommentsPanel from '@/components/cv/CoachCommentsPanel'
import KeywordMatchPanel from '@/components/cv/KeywordMatchPanel'
import { Button } from '@/components/ui/button'

// PDFViewer is browser-only — load the whole inner component client-side
const CVPreviewClient = dynamic(
  () => import('@/components/pdf/CVPreviewClient'),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-64 border border-gray-200 rounded-lg bg-gray-50">
        <p className="text-sm text-gray-400">Laddar förhandsvisning…</p>
      </div>
    ),
  }
)

export default async function PreviewPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createClient()

  const [fullCV, comments] = await Promise.all([
    getFullCV(params.id),
    getCommentsForCV(params.id),
  ])

  if (!fullCV) notFound()

  // Check if this user has a linked coach
  const { data: coachLink } = await supabase
    .from('coach_links')
    .select('coach_id')
    .eq('user_id', fullCV.cv.user_id)
    .single()

  const activeComments = comments.filter((c) => !c.is_resolved)

  const atsResult = validateCV(fullCV)
  const hasHardErrors = atsResult.hard.length > 0
  const activeLayout = fullCV.cv.layout
  const activeLanguage = fullCV.cv.language
  const accentColor = fullCV.cv.accent_color ?? '#2563eb'

  const editedByCoach =
    fullCV.cv.updated_by !== null &&
    fullCV.cv.updated_by !== fullCV.cv.user_id

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {fullCV.cv.title}
          </h1>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-sm text-gray-500">Förhandsvisning</p>
            {editedByCoach && (
              <span className="inline-flex items-center rounded-full bg-blue-50 border border-blue-200 px-2 py-0.5 text-xs text-blue-700">
                Ändrad av coach
              </span>
            )}
          </div>
        </div>
        <Link href={`/cv/${params.id}/edit/1`}>
          <Button variant="outline">Redigera</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left panel — layout picker + ATS + coach comments + export */}
        <div className="lg:col-span-1 space-y-6">
          {/* Language toggle */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-gray-700 mb-3">Språk</p>
            <LanguageToggle cvId={params.id} activeLanguage={activeLanguage} />
          </div>

          {/* Layout selector */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-gray-700 mb-3">Välj layout</p>
            <LayoutPicker
              cvId={params.id}
              activeLayout={activeLayout}
              accentColor={accentColor}
            />
          </div>

          {/* Coach comments — only shown if user has a linked coach */}
          {coachLink && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-gray-700 mb-3">
                Coachkommentarer
                {activeComments.length > 0 && (
                  <span className="ml-2 inline-block rounded-full bg-amber-100 text-amber-700 text-xs px-2 py-0.5">
                    {activeComments.length} ny{activeComments.length > 1 ? 'a' : ''}
                  </span>
                )}
              </p>
              <CoachCommentsPanel comments={activeComments} />
            </div>
          )}

          {/* ATS check */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-gray-700 mb-3">ATS-kontroll</p>
            <ATSPanel result={atsResult} />
          </div>

          {/* Keyword matching */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-gray-700 mb-3">Matcha mot jobbannons</p>
            <KeywordMatchPanel cvId={params.id} language={activeLanguage} />
          </div>

          {/* Export */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-gray-700 mb-3">Exportera</p>
            {hasHardErrors ? (
              <div>
                <Button className="w-full" disabled>
                  Ladda ner PDF
                </Button>
                <p className="text-xs text-red-600 mt-2">
                  Åtgärda felen ovan för att låsa upp export.
                </p>
              </div>
            ) : (
              <a href={`/api/cv/${params.id}/pdf?layout=${activeLayout}`} download>
                <Button className="w-full">Ladda ner PDF</Button>
              </a>
            )}
          </div>
        </div>

        {/* Right panel — PDF preview */}
        <div className="lg:col-span-2">
          <CVPreviewClient fullCV={fullCV} layout={activeLayout} />
        </div>
      </div>
    </div>
  )
}
