'use client'

import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { educationsSchema, type EducationsValues } from '@/lib/validation/cv'
import { saveEducations } from '@/lib/actions/cv'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { CVEducation } from '@/types'
import type { SaveResult } from '@/types'

interface Props {
  cvId: string
  initialData: CVEducation[]
  onSave?: (values: EducationValues[]) => Promise<SaveResult>
  nextHref?: string
  prevHref?: string
}

const EDUCATION_LEVELS = [
  { value: 'gymnasium', label: 'Gymnasium' },
  { value: 'yh', label: 'Yrkeshögskola (YH)' },
  { value: 'hogskola', label: 'Högskola / Universitet' },
  { value: 'kurs', label: 'Kurs / Certifiering' },
  { value: 'annat', label: 'Annat' },
] as const

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: 60 }, (_, i) => CURRENT_YEAR - i)

function emptyEducation() {
  return {
    institution: '',
    program: '',
    level: null as 'gymnasium' | 'yh' | 'hogskola' | 'kurs' | 'annat' | null,
    start_year: CURRENT_YEAR,
    end_year: null as number | null,
    is_current: false,
    description: '',
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

export default function EducationForm({ cvId, initialData, onSave, nextHref, prevHref }: Props) {
  const router = useRouter()
  const [saveError, setSaveError] = useState('')

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<EducationsValues>({
    resolver: zodResolver(educationsSchema),
    defaultValues: {
      educations:
        initialData.length > 0
          ? initialData.map((e) => ({
              institution: e.institution ?? '',
              program: e.program ?? '',
              level: e.level ?? null,
              start_year: e.start_year ?? CURRENT_YEAR,
              end_year: e.end_year ?? null,
              is_current: e.is_current,
              description: e.description ?? '',
            }))
          : [emptyEducation()],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'educations',
  })

  async function onSubmit(values: EducationsValues) {
    setSaveError('')
    const result = onSave
      ? await onSave(values.educations)
      : await saveEducations(cvId, values.educations)

    if (!result.success) {
      setSaveError(result.error)
      return
    }

    router.push(nextHref ?? `/cv/${cvId}/edit/5`)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      {fields.map((field, index) => {
        const isCurrent = watch(`educations.${index}.is_current`)
        const eduErrors = errors.educations?.[index]

        return (
          <div
            key={field.id}
            className="bg-white border border-gray-200 rounded-lg p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-700">
                Utbildning {index + 1}
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

            {/* Level */}
            <div>
              <Label htmlFor={`edu-level-${index}`}>Nivå</Label>
              <select
                id={`edu-level-${index}`}
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                {...register(`educations.${index}.level`)}
              >
                <option value="">Välj nivå</option>
                {EDUCATION_LEVELS.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Institution + Program */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`edu-institution-${index}`}>
                  Skola / Organisation <span className="text-red-500">*</span>
                </Label>
                <Input
                  id={`edu-institution-${index}`}
                  className="mt-1"
                  {...register(`educations.${index}.institution`)}
                />
                <FieldError message={eduErrors?.institution?.message} />
              </div>
              <div>
                <Label htmlFor={`edu-program-${index}`}>
                  Program / Utbildning <span className="text-red-500">*</span>
                </Label>
                <Input
                  id={`edu-program-${index}`}
                  className="mt-1"
                  {...register(`educations.${index}.program`)}
                />
                <FieldError message={eduErrors?.program?.message} />
              </div>
            </div>

            {/* Start year */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>
                  Startår <span className="text-red-500">*</span>
                </Label>
                <Controller
                  control={control}
                  name={`educations.${index}.start_year`}
                  render={({ field }) => (
                    <select
                      className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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

              {/* End year or is_current */}
              {!isCurrent && (
                <div>
                  <Label>Slutår</Label>
                  <Controller
                    control={control}
                    name={`educations.${index}.end_year`}
                    render={({ field }) => (
                      <select
                        className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                  <FieldError message={eduErrors?.end_year?.message} />
                </div>
              )}
            </div>

            {/* Is current */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`edu-current-${index}`}
                className="h-4 w-4 rounded border-gray-300"
                {...register(`educations.${index}.is_current`)}
              />
              <Label htmlFor={`edu-current-${index}`}>Studerar här nu</Label>
            </div>

            {/* Description */}
            <div>
              <Label htmlFor={`edu-desc-${index}`}>
                Kort beskrivning (valfritt)
              </Label>
              <textarea
                id={`edu-desc-${index}`}
                rows={2}
                className="mt-1 flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                placeholder="t.ex. inriktning, examensarbete…"
                {...register(`educations.${index}.description`)}
              />
            </div>
          </div>
        )
      })}

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => append(emptyEducation())}
      >
        + Lägg till utbildning
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
          onClick={() => router.push(prevHref ?? `/cv/${cvId}/edit/3`)}
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
