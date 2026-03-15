'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { loadGuestCV, assembleGuestFullCV, type GuestCV } from '@/lib/guest/storage'
import { validateCV } from '@/lib/ats/validate'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

export default function GuestPreviewPage() {
  const [guestCV, setGuestCV] = useState<GuestCV | null>(null)
  const [downloading, setDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState('')

  useEffect(() => {
    setGuestCV(loadGuestCV())
  }, [])

  if (!guestCV) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    )
  }

  const fullCV = assembleGuestFullCV(guestCV)
  const { hard, soft } = validateCV(fullCV)
  const canExport = hard.length === 0

  async function handleDownload() {
    setDownloadError('')
    setDownloading(true)

    try {
      const response = await fetch('/api/cv/guest/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(guestCV),
      })

      if (!response.ok) {
        setDownloadError('Det gick inte att skapa PDF:en. Kontrollera felen ovan.')
        setDownloading(false)
        return
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${guestCV!.title}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      setDownloadError('Något gick fel. Försök igen.')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/cv/guest/5"
          className="text-sm text-gray-400 hover:text-gray-700"
        >
          ← Tillbaka
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900 mt-3">
          {guestCV.title}
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">Förhandsvisning av gäst-CV</p>
      </div>

      {/* ATS results */}
      {(hard.length > 0 || soft.length > 0) && (
        <div className="space-y-3">
          {hard.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-red-700 mb-2">
                {hard.length} fel blockerar export
              </p>
              <ul className="space-y-1">
                {hard.map((e, i) => (
                  <li key={i} className="text-sm text-red-600">
                    • {e.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {soft.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-amber-700 mb-2">
                {soft.length} förbättringsförslag
              </p>
              <ul className="space-y-1">
                {soft.map((e, i) => (
                  <li key={i} className="text-sm text-amber-700">
                    • {e.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {hard.length === 0 && soft.length === 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-700 font-medium">
            Inga ATS-problem hittades — ditt CV är redo för export.
          </p>
        </div>
      )}

      {/* Export + CTA */}
      <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
        <div>
          <Button
            onClick={handleDownload}
            disabled={!canExport || downloading}
            className="w-full sm:w-auto"
          >
            {downloading ? 'Skapar PDF…' : 'Ladda ner PDF'}
          </Button>
          {!canExport && (
            <p className="text-xs text-red-600 mt-1">
              Åtgärda felen ovan för att kunna ladda ner.
            </p>
          )}
          {downloadError && (
            <p className="text-sm text-red-600 mt-2" role="alert">
              {downloadError}
            </p>
          )}
        </div>

        <hr className="border-gray-100" />

        {/* Save + sign up CTA */}
        <div className="bg-amber-50 rounded-lg p-4">
          <p className="text-sm font-semibold text-amber-900">
            Spara ditt CV permanent
          </p>
          <p className="text-sm text-amber-800 mt-1">
            Ditt CV finns bara i den här webbläsaren just nu. Skapa ett konto
            för att spara det, redigera det senare och använda det med en coach.
          </p>
          <div className="mt-3 flex gap-3">
            <Link href="/register">
              <Button size="sm">Skapa konto och spara</Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="sm">
                Logga in
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Back to editing */}
      <div className="flex gap-3 flex-wrap">
        {[1, 2, 3, 4, 5].map((s) => (
          <Link
            key={s}
            href={`/cv/guest/${s}`}
            className="text-sm text-gray-400 hover:text-gray-700"
          >
            Redigera steg {s}
          </Link>
        ))}
      </div>
    </div>
  )
}
