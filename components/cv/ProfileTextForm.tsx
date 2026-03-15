'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { profileTextSchema, type ProfileTextValues } from '@/lib/validation/cv'
import { saveProfileText } from '@/lib/actions/cv'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import AIToggle, { useAIMode } from '@/components/cv/AIToggle'
import { Sparkles } from 'lucide-react'
import type { SaveResult, CVLanguage, AIProfilePayload, AIResult } from '@/types'

interface Props {
  cvId: string
  initialSummary: string | null
  language?: CVLanguage
  isGuest?: boolean
  guestContext?: {
    headline: string | null
    experiences: Array<{ job_title: string | null; employer: string | null; description: string | null }>
    educations: Array<{ program: string | null; institution: string | null }>
    skills: Array<{ name: string | null }>
    languages: Array<{ language: string | null; level: string | null }>
  }
  onSave?: (values: ProfileTextValues) => Promise<SaveResult>
  nextHref?: string
  prevHref?: string
  onAfterSave?: () => void
}

export default function ProfileTextForm({ cvId, initialSummary, language = 'sv', isGuest, guestContext, onSave, nextHref, prevHref, onAfterSave }: Props) {
  const router = useRouter()
  const [saveError, setSaveError] = useState('')
  const { aiEnabled } = useAIMode()
  const [aiLoading, setAiLoading] = useState(false)
  const [aiMessage, setAiMessage] = useState('')
  const [aiPrompts, setAiPrompts] = useState<{ system: string; user: string } | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProfileTextValues>({
    resolver: zodResolver(profileTextSchema),
    defaultValues: { summary: initialSummary ?? '' },
  })

  const summary = watch('summary')
  const charCount = summary?.length ?? 0

  async function handleGenerateProfile() {
    setAiLoading(true)
    setAiMessage('')
    setAiPrompts(null)

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)

    try {
      const payload: AIProfilePayload = isGuest && guestContext
        ? { language, guestData: guestContext }
        : { language, cvId }

      const res = await fetch('/api/ai/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      })

      const data: AIResult = await res.json()

      if (data.error) {
        setAiMessage('Fel: ' + data.error)
        return
      }

      setValue('summary', data.result, { shouldDirty: true })
      setAiMessage('Förslag genererat — redigera gärna texten.')
      if (data.systemPrompt && data.userPrompt) {
        setAiPrompts({ system: data.systemPrompt, user: data.userPrompt })
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setAiMessage('Tog för lång tid. Försök igen.')
      } else {
        setAiMessage('Något gick fel. Försök igen.')
      }
    } finally {
      clearTimeout(timeout)
      setAiLoading(false)
    }
  }

  async function onSubmit(values: ProfileTextValues) {
    setSaveError('')
    const result = onSave
      ? await onSave(values)
      : await saveProfileText(cvId, values.summary)

    if (!result.success) {
      setSaveError(result.error)
      return
    }

    if (onAfterSave) {
      onAfterSave()
    } else {
      router.push(nextHref ?? `/cv/${cvId}/edit/3`)
    }
  }

  return (
    <div className={`ai-shimmer ${aiEnabled ? 'ai-active' : ''} rounded-lg`}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label htmlFor="summary">
              Profiltext <span className="text-red-500">*</span>
            </Label>
            <AIToggle />
          </div>

          <p className="text-sm text-gray-500 mb-2">
            Skriv 3–5 meningar om vem du är, vad du kan och vad du söker.
            Rekryterare läser detta först.
          </p>

          {aiEnabled && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleGenerateProfile}
              disabled={aiLoading}
              className="mb-3 text-purple-600 border-purple-200 hover:bg-purple-50 gap-2"
            >
              <Sparkles className="h-4 w-4" />
              {aiLoading ? 'Genererar…' : 'Generera förslag'}
            </Button>
          )}

          <textarea
            id="summary"
            rows={6}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
            placeholder="Jag är en engagerad och lösningsorienterad…"
            {...register('summary')}
          />

          <div className="flex items-center justify-between mt-1">
            {errors.summary ? (
              <p className="text-sm text-red-600" role="alert">
                {errors.summary.message}
              </p>
            ) : (
              <span />
            )}
            <p className="text-xs text-gray-400">{charCount} / 2000</p>
          </div>

          {aiMessage && (
            <p className="text-xs text-purple-600 mt-1">{aiMessage}</p>
          )}

          {/* Dev mode: expandable prompt panel */}
          {aiEnabled && aiPrompts && (
            <details className="mt-3 text-xs text-gray-500 border border-purple-100 rounded-md">
              <summary className="cursor-pointer px-3 py-2 font-medium text-purple-700 select-none">
                Visa prompt (dev)
              </summary>
              <div className="px-3 pb-3 space-y-2">
                <div>
                  <p className="font-semibold text-gray-600 mb-1">System:</p>
                  <pre className="whitespace-pre-wrap bg-gray-50 rounded p-2 text-gray-700">{aiPrompts.system}</pre>
                </div>
                <div>
                  <p className="font-semibold text-gray-600 mb-1">User:</p>
                  <pre className="whitespace-pre-wrap bg-gray-50 rounded p-2 text-gray-700">{aiPrompts.user}</pre>
                </div>
              </div>
            </details>
          )}
        </div>

        {saveError && (
          <p className="text-sm text-red-600" role="alert">
            {saveError}
          </p>
        )}

        <div className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(prevHref ?? `/cv/${cvId}/edit/1`)}
          >
            Tillbaka
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Sparar…' : 'Spara och fortsätt'}
          </Button>
        </div>
      </form>
    </div>
  )
}
