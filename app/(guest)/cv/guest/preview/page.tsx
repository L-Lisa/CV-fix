'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { loadGuestCV, saveGuestCV, assembleGuestFullCV, type GuestCV } from '@/lib/guest/storage'
import { validateCV } from '@/lib/ats/validate'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import LayoutPicker from '@/components/cv/LayoutPicker'
import CVFeedbackPanel from '@/components/cv/CVFeedbackPanel'
import type { CVLayout } from '@/types'

export default function GuestPreviewPage() {
  const [guestCV, setGuestCV] = useState<GuestCV | null>(null)
  const [downloading, setDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState('')

  useEffect(() => {
    setGuestCV(loadGuestCV())
  }, [])

  function handleLayoutChange(layout: CVLayout) {
    if (!guestCV) return
    const next = { ...guestCV, layout }
    setGuestCV(next)
    saveGuestCV(next)
  }

  function handleAccentChange(accentColor: string) {
    if (!guestCV) return
    const next = { ...guestCV, accentColor }
    setGuestCV(next)
    saveGuestCV(next)
  }

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

      {/* Layout picker — Layout 4 (Harvard / Ivy League) needs this to be reachable */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <p className="text-sm font-semibold text-gray-700 mb-3">Välj layout</p>
        <LayoutPicker
          activeLayout={guestCV.layout}
          accentColor={guestCV.accentColor}
          onLayoutChange={handleLayoutChange}
          onAccentChange={handleAccentChange}
        />
      </div>

      {/* Full-CV feedback (v1.4) */}
      <CVFeedbackPanel
        mode="guest"
        language={guestCV.language}
        guestData={{
          personalInfo: guestCV.personalInfo
            ? {
                first_name: guestCV.personalInfo.first_name ?? null,
                last_name: guestCV.personalInfo.last_name ?? null,
                headline: guestCV.personalInfo.headline ?? null,
                city: guestCV.personalInfo.city ?? null,
              }
            : null,
          profile: guestCV.profile,
          experiences: guestCV.experiences.map((e) => ({
            job_title: e.job_title ?? null,
            employer: e.employer ?? null,
            description: e.description ?? null,
            start_year: e.start_year ?? null,
            end_year: e.end_year ?? null,
            is_current: e.is_current ?? false,
          })),
          educations: guestCV.educations.map((e) => ({
            program: e.program ?? null,
            institution: e.institution ?? null,
            start_year: e.start_year ?? null,
            end_year: e.end_year ?? null,
            is_current: e.is_current ?? false,
          })),
          skills: guestCV.skills.map((s) => ({ name: s.name ?? null })),
          languages: guestCV.languages.map((l) => ({
            language: l.language ?? null,
            level: l.level ?? null,
          })),
        }}
      />

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

        {/* Beta-mode reminder — PRD §6.3 calls for a guest warning at the
            export point. While login is disabled (testversion) we replace
            the post-MVP "create account to save" CTA so we don't contradict
            the landing-page promise that no information is saved. */}
        <div className="bg-amber-50 rounded-lg p-4">
          <p className="text-sm font-semibold text-amber-900">
            Detta är en testversion
          </p>
          <p className="text-sm text-amber-800 mt-1">
            Ditt CV finns endast i den här webbläsaren just nu. Ingen
            information sparas hos oss.
          </p>
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
