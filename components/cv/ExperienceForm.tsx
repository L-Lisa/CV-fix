'use client'

import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { experiencesSchema, type ExperiencesValues, type ExperienceValues } from '@/lib/validation/cv'
import { saveExperiences } from '@/lib/actions/cv'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { CVExperience } from '@/types'
import { useAIMode } from '@/components/cv/AIToggle'
import { Wand2 } from 'lucide-react'
import type { SaveResult, CVLanguage, AIDescriptionPayload, AIResult } from '@/types'

interface Props {
  cvId: string
  initialData: CVExperience[]
  language?: CVLanguage
  isGuest?: boolean
  onSave?: (values: ExperienceValues[]) => Promise<SaveResult>
  nextHref?: string
  prevHref?: string
  onAfterSave?: () => void
}

const MONTHS = [
  { value: 1, label: 'Jan' },
  { value: 2, label: 'Feb' },
  { value: 3, label: 'Mar' },
  { value: 4, label: 'Apr' },
  { value: 5, label: 'Maj' },
  { value: 6, label: 'Jun' },
  { value: 7, label: 'Jul' },
  { value: 8, label: 'Aug' },
  { value: 9, label: 'Sep' },
  { value: 10, label: 'Okt' },
  { value: 11, label: 'Nov' },
  { value: 12, label: 'Dec' },
]

const EXPERIENCE_TYPES = [
  { value: 'job', label: 'Jobb' },
  { value: 'internship', label: 'Praktik' },
  { value: 'summer', label: 'Sommarjobb' },
  { value: 'volunteer', label: 'Volontär' },
] as const

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: 60 }, (_, i) => CURRENT_YEAR - i)

function emptyExperience() {
  return {
    job_title: '',
    employer: '',
    city: '',
    country: '',
    start_month: 1 as number,
    start_year: CURRENT_YEAR,
    end_month: null as number | null,
    end_year: null as number | null,
    is_current: false,
    description: '',
    type: null as 'job' | 'internship' | 'summer' | 'volunteer' | null,
  }
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p className="text-sm text-red-600 mt-1" role="alert">
      {message}
    </p>
  )
}

export default function ExperienceForm({ cvId, initialData, language = 'sv', isGuest, onSave, nextHref, prevHref, onAfterSave }: Props) {
  const router = useRouter()
  const [saveError, setSaveError] = useState('')
  const { aiEnabled } = useAIMode()
  const [aiLoadingIdx, setAiLoadingIdx] = useState<Record<number, boolean>>({})
  const [aiPrompts, setAiPrompts] = useState<Record<number, { system: string; user: string }>>({})

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ExperiencesValues>({
    resolver: zodResolver(experiencesSchema),
    defaultValues: {
      experiences:
        initialData.length > 0
          ? initialData.map((e) => ({
              job_title: e.job_title ?? '',
              employer: e.employer ?? '',
              city: e.city ?? '',
              country: e.country ?? '',
              start_month: e.start_month ?? 1,
              start_year: e.start_year ?? CURRENT_YEAR,
              end_month: e.end_month ?? null,
              end_year: e.end_year ?? null,
              is_current: e.is_current,
              description: e.description ?? '',
              type: e.type ?? null,
            }))
          : [emptyExperience()],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'experiences',
  })

  async function handleImproveDescription(index: number) {
    const exp = watch(`experiences.${index}`)
    setAiLoadingIdx((prev) => ({ ...prev, [index]: true }))
    setAiPrompts((prev) => { const next = { ...prev }; delete next[index]; return next })

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)

    try {
      const payload: AIDescriptionPayload = {
        jobTitle: exp.job_title ?? '',
        employer: exp.employer ?? '',
        currentDescription: exp.description ?? '',
        language,
        ...(isGuest ? { isGuest: true } : { cvId }),
      }

      const res = await fetch('/api/ai/description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      })

      const data: AIResult = await res.json()

      if (!data.error && data.result) {
        setValue(`experiences.${index}.description`, data.result, { shouldDirty: true })
        if (data.systemPrompt && data.userPrompt) {
          setAiPrompts((prev) => ({ ...prev, [index]: { system: data.systemPrompt!, user: data.userPrompt! } }))
        }
      }
    } catch {
      // silent fail — user sees unchanged description
    } finally {
      clearTimeout(timeout)
      setAiLoadingIdx((prev) => ({ ...prev, [index]: false }))
    }
  }

  async function onSubmit(values: ExperiencesValues) {
    setSaveError('')
    const result = onSave
      ? await onSave(values.experiences)
      : await saveExperiences(cvId, values.experiences)

    if (!result.success) {
      setSaveError(result.error)
      return
    }

    if (onAfterSave) {
      onAfterSave()
    } else {
      router.push(nextHref ?? `/cv/${cvId}/edit/4`)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      {fields.map((field, index) => {
        const isCurrent = watch(`experiences.${index}.is_current`)
        const expErrors = errors.experiences?.[index]

        return (
          <div
            key={field.id}
            className={`bg-white border border-gray-200 rounded-lg p-5 space-y-4 ai-shimmer ${aiEnabled ? 'ai-active' : ''}`}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-700">
                Erfarenhet {index + 1}
              </p>
              {fields.length > 1 && (
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="text-sm text-red-500 hover:text-red-700"
                >
                  Ta bort
                </button>
              )}
            </div>

            {/* Type */}
            <div>
              <Label htmlFor={`exp-type-${index}`}>Typ</Label>
              <select
                id={`exp-type-${index}`}
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                {...register(`experiences.${index}.type`)}
              >
                <option value="">Välj typ</option>
                {EXPERIENCE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Title + Employer */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`exp-title-${index}`}>
                  Jobbtitel <span className="text-red-500">*</span>
                </Label>
                <Input
                  id={`exp-title-${index}`}
                  className="mt-1"
                  {...register(`experiences.${index}.job_title`)}
                />
                <FieldError message={expErrors?.job_title?.message} />
              </div>
              <div>
                <Label htmlFor={`exp-employer-${index}`}>
                  Arbetsgivare <span className="text-red-500">*</span>
                </Label>
                <Input
                  id={`exp-employer-${index}`}
                  className="mt-1"
                  {...register(`experiences.${index}.employer`)}
                />
                <FieldError message={expErrors?.employer?.message} />
              </div>
            </div>

            {/* City + Country */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`exp-city-${index}`}>Stad</Label>
                <Input
                  id={`exp-city-${index}`}
                  className="mt-1"
                  {...register(`experiences.${index}.city`)}
                />
              </div>
              <div>
                <Label htmlFor={`exp-country-${index}`}>Land</Label>
                <Input
                  id={`exp-country-${index}`}
                  className="mt-1"
                  placeholder="Sverige"
                  {...register(`experiences.${index}.country`)}
                />
              </div>
            </div>

            {/* Start date */}
            <div>
              <Label>
                Startdatum <span className="text-red-500">*</span>
              </Label>
              <div className="grid grid-cols-2 gap-3 mt-1">
                <Controller
                  control={control}
                  name={`experiences.${index}.start_month`}
                  render={({ field }) => (
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    >
                      {MONTHS.map((m) => (
                        <option key={m.value} value={m.value}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                  )}
                />
                <Controller
                  control={control}
                  name={`experiences.${index}.start_year`}
                  render={({ field }) => (
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    >
                      {YEARS.map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  )}
                />
              </div>
            </div>

            {/* Is current */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`exp-current-${index}`}
                className="h-4 w-4 rounded border-gray-300"
                {...register(`experiences.${index}.is_current`)}
              />
              <Label htmlFor={`exp-current-${index}`}>Jobbar här nu</Label>
            </div>

            {/* End date (hidden when is_current) */}
            {!isCurrent && (
              <div>
                <Label>Slutdatum</Label>
                <div className="grid grid-cols-2 gap-3 mt-1">
                  <Controller
                    control={control}
                    name={`experiences.${index}.end_month`}
                    render={({ field }) => (
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        value={field.value ?? ''}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === '' ? null : Number(e.target.value)
                          )
                        }
                      >
                        <option value="">Månad</option>
                        {MONTHS.map((m) => (
                          <option key={m.value} value={m.value}>
                            {m.label}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                  <Controller
                    control={control}
                    name={`experiences.${index}.end_year`}
                    render={({ field }) => (
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        value={field.value ?? ''}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === '' ? null : Number(e.target.value)
                          )
                        }
                      >
                        <option value="">År</option>
                        {YEARS.map((y) => (
                          <option key={y} value={y}>
                            {y}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                </div>
                <FieldError message={expErrors?.end_year?.message} />
              </div>
            )}

            {/* Description */}
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor={`exp-desc-${index}`}>Beskrivning</Label>
                {aiEnabled && (
                  <button
                    type="button"
                    onClick={() => handleImproveDescription(index)}
                    disabled={aiLoadingIdx[index]}
                    className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 disabled:opacity-50"
                  >
                    <Wand2 className="h-3 w-3" />
                    {aiLoadingIdx[index] ? 'Förbättrar…' : 'Förbättra'}
                  </button>
                )}
              </div>
              <textarea
                id={`exp-desc-${index}`}
                rows={3}
                className="mt-1 flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                placeholder="Beskriv dina arbetsuppgifter och resultat…"
                {...register(`experiences.${index}.description`)}
              />

              {/* Dev mode: expandable prompt panel */}
              {aiEnabled && aiPrompts[index] && (
                <details className="mt-2 text-xs text-gray-500 border border-purple-100 rounded-md">
                  <summary className="cursor-pointer px-3 py-2 font-medium text-purple-700 select-none">
                    Visa prompt (dev)
                  </summary>
                  <div className="px-3 pb-3 space-y-2">
                    <div>
                      <p className="font-semibold text-gray-600 mb-1">System:</p>
                      <pre className="whitespace-pre-wrap bg-gray-50 rounded p-2 text-gray-700">{aiPrompts[index].system}</pre>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-600 mb-1">User:</p>
                      <pre className="whitespace-pre-wrap bg-gray-50 rounded p-2 text-gray-700">{aiPrompts[index].user}</pre>
                    </div>
                  </div>
                </details>
              )}
            </div>
          </div>
        )
      })}

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => append(emptyExperience())}
      >
        + Lägg till erfarenhet
      </Button>

      {saveError && (
        <p className="text-sm text-red-600" role="alert">
          {saveError}
        </p>
      )}

      <div className="flex justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(prevHref ?? `/cv/${cvId}/edit/2`)}
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
