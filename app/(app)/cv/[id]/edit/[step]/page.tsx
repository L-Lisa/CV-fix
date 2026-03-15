import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  getPersonalInfo,
  getProfileText,
  getExperiences,
  getEducations,
  getSkills,
  getLanguageEntries,
  getHobbies,
  getVolunteerings,
  getOthers,
} from '@/lib/queries/cv'
import type { CVLanguage } from '@/types'
import StepProgress from '@/components/cv/StepProgress'
import PersonalInfoForm from '@/components/cv/PersonalInfoForm'
import ProfileTextForm from '@/components/cv/ProfileTextForm'
import ExperienceForm from '@/components/cv/ExperienceForm'
import EducationForm from '@/components/cv/EducationForm'
import SkillsLanguagesForm from '@/components/cv/SkillsLanguagesForm'

const VALID_STEPS = [1, 2, 3, 4, 5] as const
type ValidStep = (typeof VALID_STEPS)[number]

const STEP_LABELS: Record<ValidStep, string> = {
  1: 'Personuppgifter',
  2: 'Profiltext',
  3: 'Arbetslivserfarenhet',
  4: 'Utbildning',
  5: 'Kunskaper & Färdigheter',
}

function parseStep(raw: string): ValidStep | null {
  const n = parseInt(raw, 10)
  if (isNaN(n)) return null
  return VALID_STEPS.includes(n as ValidStep) ? (n as ValidStep) : null
}

export default async function CVStepPage({
  params,
}: {
  params: { id: string; step: string }
}) {
  const stepNum = parseStep(params.step)

  if (stepNum === null) {
    redirect(`/cv/${params.id}/edit/1`)
  }

  const supabase = createClient()

  const { data: cv, error } = await supabase
    .from('cvs')
    .select('id, title, language')
    .eq('id', params.id)
    .single()

  if (error || !cv) {
    notFound()
  }

  const cvLanguage = (cv.language ?? 'sv') as CVLanguage

  // Pre-fetch data for the current step only
  const personalInfo = stepNum === 1 ? await getPersonalInfo(params.id) : null
  const profileText = stepNum === 2 ? await getProfileText(params.id) : null
  const experiences = stepNum === 3 ? await getExperiences(params.id) : []
  const educations = stepNum === 4 ? await getEducations(params.id) : []
  const [skills, languages, hobbies, volunteerings, others] =
    stepNum === 5
      ? await Promise.all([
          getSkills(params.id),
          getLanguageEntries(params.id),
          getHobbies(params.id),
          getVolunteerings(params.id),
          getOthers(params.id),
        ])
      : [[], [], null, [], []]

  return (
    <div className="max-w-2xl mx-auto">
      <p className="text-sm font-medium text-gray-500 mb-1 truncate">{cv.title}</p>

      <StepProgress
        current={stepNum}
        total={VALID_STEPS.length}
        labels={Object.values(STEP_LABELS)}
      />

      <h2 className="text-xl font-semibold text-gray-900 mb-6">
        {STEP_LABELS[stepNum]}
      </h2>

      {stepNum === 1 && (
        <PersonalInfoForm cvId={params.id} initialData={personalInfo} />
      )}

      {stepNum === 2 && (
        <ProfileTextForm
          cvId={params.id}
          initialSummary={profileText}
          language={cvLanguage}
        />
      )}

      {stepNum === 3 && (
        <ExperienceForm
          cvId={params.id}
          initialData={experiences}
          language={cvLanguage}
        />
      )}

      {stepNum === 4 && (
        <EducationForm cvId={params.id} initialData={educations} />
      )}

      {stepNum === 5 && (
        <SkillsLanguagesForm
          cvId={params.id}
          initialSkills={skills}
          initialLanguages={languages}
          initialHobbies={hobbies}
          initialVolunteerings={volunteerings}
          initialOthers={others}
          language={cvLanguage}
        />
      )}
    </div>
  )
}
