import { notFound } from 'next/navigation'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { getFullCV } from '@/lib/queries/cv'
import { validateCV } from '@/lib/ats/validate'
import ATSPanel from '@/components/cv/ATSPanel'
import { Button } from '@/components/ui/button'
import type { CVLayout } from '@/types'

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

const LAYOUTS: Array<{ value: CVLayout; label: string; description: string }> = [
  { value: 1, label: 'Layout 1', description: 'Enkel, svartvit' },
  { value: 2, label: 'Layout 2', description: 'Färgad rubrik' },
  { value: 3, label: 'Layout 3', description: 'Med sidofält' },
]

export default async function PreviewPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { layout?: string }
}) {
  const fullCV = await getFullCV(params.id)
  if (!fullCV) notFound()

  // Layout can be changed via ?layout=2 query param (set by client-side picker)
  const rawLayout = parseInt(searchParams.layout ?? '', 10)
  const activeLayout: CVLayout =
    rawLayout === 2 ? 2 : rawLayout === 3 ? 3 : fullCV.cv.layout

  const atsResult = validateCV(fullCV)
  const hasHardErrors = atsResult.hard.length > 0

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {fullCV.cv.title}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Förhandsvisning</p>
        </div>
        <Link href={`/cv/${params.id}/edit/1`}>
          <Button variant="outline">Redigera</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left panel — layout picker + ATS + export */}
        <div className="lg:col-span-1 space-y-6">
          {/* Layout selector */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-gray-700 mb-3">Välj layout</p>
            <div className="space-y-2">
              {LAYOUTS.map(({ value, label, description }) => (
                <Link
                  key={value}
                  href={`/cv/${params.id}/preview?layout=${value}`}
                  className={`flex items-center justify-between rounded-md border px-3 py-2.5 text-sm transition-colors ${
                    activeLayout === value
                      ? 'border-gray-900 bg-gray-900 text-white'
                      : 'border-gray-200 text-gray-700 hover:border-gray-400'
                  }`}
                >
                  <span className="font-medium">{label}</span>
                  <span className={activeLayout === value ? 'text-gray-300' : 'text-gray-400'}>
                    {description}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* ATS check */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-gray-700 mb-3">ATS-kontroll</p>
            <ATSPanel result={atsResult} />
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
