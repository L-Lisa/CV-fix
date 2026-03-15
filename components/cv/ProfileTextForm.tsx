'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { profileTextSchema, type ProfileTextValues } from '@/lib/validation/cv'
import { saveProfileText } from '@/lib/actions/cv'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import type { SaveResult } from '@/types'

interface Props {
  cvId: string
  initialSummary: string | null
  onSave?: (values: ProfileTextValues) => Promise<SaveResult>
  nextHref?: string
  prevHref?: string
  onAfterSave?: () => void
}

export default function ProfileTextForm({ cvId, initialSummary, onSave, nextHref, prevHref, onAfterSave }: Props) {
  const router = useRouter()
  const [saveError, setSaveError] = useState('')

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProfileTextValues>({
    resolver: zodResolver(profileTextSchema),
    defaultValues: { summary: initialSummary ?? '' },
  })

  const summary = watch('summary')
  const charCount = summary?.length ?? 0

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
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      <div>
        <Label htmlFor="summary">
          Profiltext <span className="text-red-500">*</span>
        </Label>
        <p className="text-sm text-gray-500 mt-1 mb-2">
          Skriv 3–5 meningar om vem du är, vad du kan och vad du söker.
          Rekryterare läser detta först.
        </p>
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
  )
}
