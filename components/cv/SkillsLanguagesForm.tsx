'use client'

import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  skillsSchema,
  languagesSchema,
  volunteeringsSchema,
  othersSchema,
  type SkillsValues,
  type LanguagesValues,
  type VolunteeringsValues,
  type OthersValues,
  type Step5Values,
} from '@/lib/validation/cv'
import {
  saveSkills,
  saveLanguages,
  saveHobbies,
  saveVolunteerings,
  saveOthers,
  touchCV,
} from '@/lib/actions/cv'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { CVSkill, CVLanguageEntry, CVHobbies, CVVolunteering, CVOther, SaveResult } from '@/types'

interface Props {
  cvId: string
  initialSkills: CVSkill[]
  initialLanguages: CVLanguageEntry[]
  initialHobbies: CVHobbies | null
  initialVolunteerings: CVVolunteering[]
  initialOthers: CVOther[]
  onSave?: (values: Step5Values) => Promise<SaveResult>
  nextHref?: string
  prevHref?: string
}

const SKILL_CATEGORIES = [
  { value: 'technical', label: 'Tekniska' },
  { value: 'language', label: 'Språkliga' },
  { value: 'other', label: 'Övriga' },
] as const

const LANGUAGE_LEVELS = [
  { value: 'native', label: 'Modersmål' },
  { value: 'fluent', label: 'Flytande' },
  { value: 'good', label: 'God' },
  { value: 'basic', label: 'Grundläggande' },
] as const

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: 60 }, (_, i) => CURRENT_YEAR - i)

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p className="text-sm text-red-600 mt-1" role="alert">
      {message}
    </p>
  )
}

function SectionHeading({ title, optional = true }: { title: string; optional?: boolean }) {
  return (
    <div className="flex items-baseline gap-2 mb-4">
      <h3 className="text-base font-semibold text-gray-800">{title}</h3>
      {optional && <span className="text-sm text-gray-400">valfritt</span>}
    </div>
  )
}

export default function SkillsLanguagesForm({
  cvId,
  initialSkills,
  initialLanguages,
  initialHobbies,
  initialVolunteerings,
  initialOthers,
  onSave,
  nextHref,
  prevHref,
}: Props) {
  const router = useRouter()
  const [saveError, setSaveError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [hobbiesText, setHobbiesText] = useState(initialHobbies?.text ?? '')

  // ── Skills form ──────────────────────────────────────────────────────────────
  const skillsForm = useForm<SkillsValues>({
    resolver: zodResolver(skillsSchema),
    defaultValues: {
      skills:
        initialSkills.length > 0
          ? initialSkills.map((s) => ({
              category: s.category ?? null,
              name: s.name ?? '',
              level: s.level ?? null,
            }))
          : [],
    },
  })
  const { fields: skillFields, append: appendSkill, remove: removeSkill } =
    useFieldArray({ control: skillsForm.control, name: 'skills' })

  // ── Languages form ───────────────────────────────────────────────────────────
  const languagesForm = useForm<LanguagesValues>({
    resolver: zodResolver(languagesSchema),
    defaultValues: {
      languages:
        initialLanguages.length > 0
          ? initialLanguages.map((l) => ({
              language: l.language ?? '',
              level: l.level ?? null,
            }))
          : [],
    },
  })
  const { fields: langFields, append: appendLang, remove: removeLang } =
    useFieldArray({ control: languagesForm.control, name: 'languages' })

  // ── Volunteering form ────────────────────────────────────────────────────────
  const volunteeringsForm = useForm<VolunteeringsValues>({
    resolver: zodResolver(volunteeringsSchema),
    defaultValues: {
      volunteerings:
        initialVolunteerings.length > 0
          ? initialVolunteerings.map((v) => ({
              role: v.role ?? '',
              organisation: v.organisation ?? '',
              start_year: v.start_year ?? CURRENT_YEAR,
              end_year: v.end_year ?? null,
              is_current: v.is_current,
              description: v.description ?? '',
            }))
          : [],
    },
  })
  const { fields: volFields, append: appendVol, remove: removeVol } =
    useFieldArray({ control: volunteeringsForm.control, name: 'volunteerings' })

  // ── Others form ──────────────────────────────────────────────────────────────
  const othersForm = useForm<OthersValues>({
    resolver: zodResolver(othersSchema),
    defaultValues: {
      others:
        initialOthers.length > 0
          ? initialOthers.map((o) => ({
              label: o.label ?? '',
              text: o.text ?? '',
            }))
          : [],
    },
  })
  const { fields: otherFields, append: appendOther, remove: removeOther } =
    useFieldArray({ control: othersForm.control, name: 'others' })

  async function handleSaveAll() {
    const [skillsValid, langsValid, volsValid, othersValid] = await Promise.all([
      skillsForm.trigger(),
      languagesForm.trigger(),
      volunteeringsForm.trigger(),
      othersForm.trigger(),
    ])

    if (!skillsValid || !langsValid || !volsValid || !othersValid) return

    setSaveError('')
    setSubmitting(true)

    const skillsData = skillsForm.getValues()
    const langsData = languagesForm.getValues()
    const volsData = volunteeringsForm.getValues()
    const othersData = othersForm.getValues()

    if (onSave) {
      const result = await onSave({
        skills: skillsData.skills,
        languages: langsData.languages,
        hobbies: hobbiesText,
        volunteerings: volsData.volunteerings,
        others: othersData.others,
      })
      if (!result.success) {
        setSaveError(result.error)
        setSubmitting(false)
        return
      }
      router.push(nextHref ?? `/cv/${cvId}/preview`)
      return
    }

    const results = await Promise.all([
      saveSkills(cvId, skillsData.skills),
      saveLanguages(cvId, langsData.languages),
      saveHobbies(cvId, hobbiesText),
      saveVolunteerings(cvId, volsData.volunteerings),
      saveOthers(cvId, othersData.others),
    ])

    const failed = results.find((r) => !r.success)
    if (failed) {
      setSaveError(failed.error)
      setSubmitting(false)
      return
    }

    await touchCV(cvId)
    router.push(nextHref ?? `/cv/${cvId}/preview`)
  }

  return (
    <div className="space-y-10">
      {/* ── Skills ── */}
      <section>
        <SectionHeading title="Kunskaper & Färdigheter" />
        <div className="space-y-3">
          {skillFields.map((field, index) => {
            const skillErrors = skillsForm.formState.errors.skills?.[index]
            return (
              <div key={field.id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <Label htmlFor={`skill-cat-${index}`}>Kategori</Label>
                    <select
                      id={`skill-cat-${index}`}
                      className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      {...skillsForm.register(`skills.${index}.category`)}
                    >
                      <option value="">Välj</option>
                      {SKILL_CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor={`skill-name-${index}`}>
                      Namn <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id={`skill-name-${index}`}
                      className="mt-1"
                      placeholder="t.ex. Python, Excel"
                      {...skillsForm.register(`skills.${index}.name`)}
                    />
                    <FieldError message={skillErrors?.name?.message} />
                  </div>
                  <div>
                    <Label htmlFor={`skill-level-${index}`}>Nivå (1–5)</Label>
                    <Controller
                      control={skillsForm.control}
                      name={`skills.${index}.level`}
                      render={({ field: f }) => (
                        <select
                          id={`skill-level-${index}`}
                          className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          value={f.value ?? ''}
                          onChange={(e) =>
                            f.onChange(e.target.value === '' ? null : Number(e.target.value))
                          }
                        >
                          <option value="">–</option>
                          {[1, 2, 3, 4, 5].map((n) => (
                            <option key={n} value={n}>{n}</option>
                          ))}
                        </select>
                      )}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeSkill(index)}
                  className="mt-2 text-sm text-red-500 hover:text-red-700"
                >
                  Ta bort
                </button>
              </div>
            )
          })}
        </div>
        <Button
          type="button"
          variant="outline"
          className="mt-3 w-full"
          onClick={() => appendSkill({ category: null, name: '', level: null })}
        >
          + Lägg till färdighet
        </Button>
      </section>

      {/* ── Languages ── */}
      <section>
        <SectionHeading title="Språk" />
        <div className="space-y-3">
          {langFields.map((field, index) => {
            const langErrors = languagesForm.formState.errors.languages?.[index]
            return (
              <div key={field.id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor={`lang-name-${index}`}>
                      Språk <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id={`lang-name-${index}`}
                      className="mt-1"
                      placeholder="t.ex. Svenska, Engelska"
                      {...languagesForm.register(`languages.${index}.language`)}
                    />
                    <FieldError message={langErrors?.language?.message} />
                  </div>
                  <div>
                    <Label htmlFor={`lang-level-${index}`}>Nivå</Label>
                    <select
                      id={`lang-level-${index}`}
                      className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      {...languagesForm.register(`languages.${index}.level`)}
                    >
                      <option value="">Välj nivå</option>
                      {LANGUAGE_LEVELS.map((l) => (
                        <option key={l.value} value={l.value}>{l.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeLang(index)}
                  className="mt-2 text-sm text-red-500 hover:text-red-700"
                >
                  Ta bort
                </button>
              </div>
            )
          })}
        </div>
        <Button
          type="button"
          variant="outline"
          className="mt-3 w-full"
          onClick={() => appendLang({ language: '', level: null })}
        >
          + Lägg till språk
        </Button>
      </section>

      {/* ── Hobbies ── */}
      <section>
        <SectionHeading title="Hobbies & Intressen" />
        <div>
          <Label htmlFor="hobbies">Beskriv dina intressen</Label>
          <textarea
            id="hobbies"
            rows={3}
            className="mt-1 flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
            placeholder="t.ex. Löpning, matlagning, fotografering…"
            value={hobbiesText}
            onChange={(e) => setHobbiesText(e.target.value)}
            maxLength={500}
          />
        </div>
      </section>

      {/* ── Volunteering ── */}
      <section>
        <SectionHeading title="Volontärarbete" />
        <div className="space-y-3">
          {volFields.map((field, index) => {
            const isCurrent = volunteeringsForm.watch(`volunteerings.${index}.is_current`)
            const volErrors = volunteeringsForm.formState.errors.volunteerings?.[index]
            return (
              <div key={field.id} className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-700">Post {index + 1}</p>
                  <button
                    type="button"
                    onClick={() => removeVol(index)}
                    className="text-sm text-red-500 hover:text-red-700"
                  >
                    Ta bort
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor={`vol-role-${index}`}>
                      Roll <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id={`vol-role-${index}`}
                      className="mt-1"
                      {...volunteeringsForm.register(`volunteerings.${index}.role`)}
                    />
                    <FieldError message={volErrors?.role?.message} />
                  </div>
                  <div>
                    <Label htmlFor={`vol-org-${index}`}>
                      Organisation <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id={`vol-org-${index}`}
                      className="mt-1"
                      {...volunteeringsForm.register(`volunteerings.${index}.organisation`)}
                    />
                    <FieldError message={volErrors?.organisation?.message} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Startår</Label>
                    <Controller
                      control={volunteeringsForm.control}
                      name={`volunteerings.${index}.start_year`}
                      render={({ field: f }) => (
                        <select
                          className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          value={f.value ?? ''}
                          onChange={(e) => f.onChange(Number(e.target.value))}
                        >
                          {YEARS.map((y) => (
                            <option key={y} value={y}>{y}</option>
                          ))}
                        </select>
                      )}
                    />
                  </div>
                  {!isCurrent && (
                    <div>
                      <Label>Slutår</Label>
                      <Controller
                        control={volunteeringsForm.control}
                        name={`volunteerings.${index}.end_year`}
                        render={({ field: f }) => (
                          <select
                            className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            value={f.value ?? ''}
                            onChange={(e) =>
                              f.onChange(e.target.value === '' ? null : Number(e.target.value))
                            }
                          >
                            <option value="">År</option>
                            {YEARS.map((y) => (
                              <option key={y} value={y}>{y}</option>
                            ))}
                          </select>
                        )}
                      />
                      <FieldError message={volErrors?.end_year?.message} />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`vol-current-${index}`}
                    className="h-4 w-4 rounded border-gray-300"
                    {...volunteeringsForm.register(`volunteerings.${index}.is_current`)}
                  />
                  <Label htmlFor={`vol-current-${index}`}>Pågående</Label>
                </div>
                <div>
                  <Label htmlFor={`vol-desc-${index}`}>Beskrivning</Label>
                  <textarea
                    id={`vol-desc-${index}`}
                    rows={2}
                    className="mt-1 flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                    {...volunteeringsForm.register(`volunteerings.${index}.description`)}
                  />
                </div>
              </div>
            )
          })}
        </div>
        <Button
          type="button"
          variant="outline"
          className="mt-3 w-full"
          onClick={() =>
            appendVol({
              role: '',
              organisation: '',
              start_year: CURRENT_YEAR,
              end_year: null,
              is_current: false,
              description: '',
            })
          }
        >
          + Lägg till volontärarbete
        </Button>
      </section>

      {/* ── Other ── */}
      <section>
        <SectionHeading title="Övrigt" />
        <div className="space-y-3">
          {otherFields.map((field, index) => {
            const otherErrors = othersForm.formState.errors.others?.[index]
            return (
              <div key={field.id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor={`other-label-${index}`}>
                      Etikett <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id={`other-label-${index}`}
                      className="mt-1"
                      placeholder="t.ex. Körkort, Certifikat"
                      {...othersForm.register(`others.${index}.label`)}
                    />
                    <FieldError message={otherErrors?.label?.message} />
                  </div>
                  <div>
                    <Label htmlFor={`other-text-${index}`}>
                      Text <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id={`other-text-${index}`}
                      className="mt-1"
                      {...othersForm.register(`others.${index}.text`)}
                    />
                    <FieldError message={otherErrors?.text?.message} />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeOther(index)}
                  className="mt-2 text-sm text-red-500 hover:text-red-700"
                >
                  Ta bort
                </button>
              </div>
            )
          })}
        </div>
        <Button
          type="button"
          variant="outline"
          className="mt-3 w-full"
          onClick={() => appendOther({ label: '', text: '' })}
        >
          + Lägg till post
        </Button>
      </section>

      {saveError && (
        <p className="text-sm text-red-600" role="alert">
          {saveError}
        </p>
      )}

      <div className="flex justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(prevHref ?? `/cv/${cvId}/edit/4`)}
        >
          Tillbaka
        </Button>
        <Button onClick={handleSaveAll} disabled={submitting}>
          {submitting ? 'Sparar…' : 'Spara och avsluta'}
        </Button>
      </div>
    </div>
  )
}
