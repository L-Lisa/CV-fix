'use client'

import { useState, useEffect } from 'react'
import { loadGuestCV, saveGuestCV, type GuestCV } from '@/lib/guest/storage'
import StepProgress from '@/components/cv/StepProgress'
import PersonalInfoForm from '@/components/cv/PersonalInfoForm'
import ProfileTextForm from '@/components/cv/ProfileTextForm'
import ExperienceForm from '@/components/cv/ExperienceForm'
import EducationForm from '@/components/cv/EducationForm'
import SkillsLanguagesForm from '@/components/cv/SkillsLanguagesForm'
import { Skeleton } from '@/components/ui/skeleton'
import type { SaveResult } from '@/types'
import type {
  PersonalInfoValues,
  ProfileTextValues,
  ExperienceValues,
  EducationValues,
  Step5Values,
} from '@/lib/validation/cv'
// Type casts are safe: the forms only read the value fields, not id/cv_id/sort_order
import type { CVPersonalInfo, CVExperience, CVEducation, CVSkill, CVLanguageEntry, CVHobbies, CVVolunteering, CVOther } from '@/types'

type ValidStep = 1 | 2 | 3 | 4 | 5

const STEP_LABELS: Record<ValidStep, string> = {
  1: 'Personuppgifter',
  2: 'Profiltext',
  3: 'Arbetslivserfarenhet',
  4: 'Utbildning',
  5: 'Kunskaper & Färdigheter',
}

function ok(): SaveResult {
  return { success: true }
}

export default function GuestStepContent({ step }: { step: ValidStep }) {
  const [guestCV, setGuestCV] = useState<GuestCV | null>(null)

  useEffect(() => {
    setGuestCV(loadGuestCV())
  }, [])

  if (!guestCV) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <Skeleton className="h-4 w-40" />
        <div className="flex gap-2 my-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-1.5 flex-1" />
          ))}
        </div>
        <Skeleton className="h-7 w-56 mb-6" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  function update<K extends keyof GuestCV>(key: K, value: GuestCV[K]): Promise<SaveResult> {
    const updated = { ...guestCV!, [key]: value }
    saveGuestCV(updated)
    setGuestCV(updated)
    return Promise.resolve(ok())
  }

  function updateStep5(values: Step5Values): Promise<SaveResult> {
    const updated: GuestCV = {
      ...guestCV!,
      skills: values.skills,
      languages: values.languages,
      hobbies: values.hobbies,
      volunteerings: values.volunteerings,
      others: values.others,
    }
    saveGuestCV(updated)
    setGuestCV(updated)
    return Promise.resolve(ok())
  }

  return (
    <div className="max-w-2xl mx-auto">
      <p className="text-sm font-medium text-gray-500 mb-1 truncate">
        {guestCV.title}
      </p>

      <StepProgress
        current={step}
        total={5}
        labels={Object.values(STEP_LABELS)}
      />

      <h2 className="text-xl font-semibold text-gray-900 mb-6">
        {STEP_LABELS[step]}
      </h2>

      {step === 1 && (
        <PersonalInfoForm
          cvId="guest"
          initialData={guestCV.personalInfo as unknown as CVPersonalInfo | null}
          onSave={(v: PersonalInfoValues) => update('personalInfo', v)}
          nextHref="/cv/guest/2"
        />
      )}

      {step === 2 && (
        <ProfileTextForm
          cvId="guest"
          initialSummary={guestCV.profile}
          onSave={(v: ProfileTextValues) => update('profile', v.summary)}
          nextHref="/cv/guest/3"
          prevHref="/cv/guest/1"
        />
      )}

      {step === 3 && (
        <ExperienceForm
          cvId="guest"
          initialData={guestCV.experiences as unknown as CVExperience[]}
          onSave={(v: ExperienceValues[]) => update('experiences', v)}
          nextHref="/cv/guest/4"
          prevHref="/cv/guest/2"
        />
      )}

      {step === 4 && (
        <EducationForm
          cvId="guest"
          initialData={guestCV.educations as unknown as CVEducation[]}
          onSave={(v: EducationValues[]) => update('educations', v)}
          nextHref="/cv/guest/5"
          prevHref="/cv/guest/3"
        />
      )}

      {step === 5 && (
        <SkillsLanguagesForm
          cvId="guest"
          initialSkills={guestCV.skills as unknown as CVSkill[]}
          initialLanguages={guestCV.languages as unknown as CVLanguageEntry[]}
          initialHobbies={
            guestCV.hobbies
              ? ({ cv_id: 'guest', text: guestCV.hobbies } as CVHobbies)
              : null
          }
          initialVolunteerings={guestCV.volunteerings as unknown as CVVolunteering[]}
          initialOthers={guestCV.others as unknown as CVOther[]}
          onSave={updateStep5}
          nextHref="/cv/guest/preview"
          prevHref="/cv/guest/4"
        />
      )}
    </div>
  )
}
