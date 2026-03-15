import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getPersonalInfo, getProfileText, getExperiences } from '@/lib/queries/cv'
import PersonalInfoForm from '@/components/cv/PersonalInfoForm'
import ProfileTextForm from '@/components/cv/ProfileTextForm'
import ExperienceForm from '@/components/cv/ExperienceForm'

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

  // Pre-fetch data for the current step
  const personalInfo = stepNum === 1 ? await getPersonalInfo(params.id) : null
  const profileText = stepNum === 2 ? await getProfileText(params.id) : null
  const experiences = stepNum === 3 ? await getExperiences(params.id) : []

  return (
    <div>
      <p className="text-sm text-gray-500 mb-1">
        Steg {stepNum} av {VALID_STEPS.length}
      </p>
      <h2 className="text-xl font-semibold text-gray-900 mb-6">
        {STEP_LABELS[stepNum]}
      </h2>

      {stepNum === 1 && (
        <PersonalInfoForm cvId={params.id} initialData={personalInfo} />
      )}

      {stepNum === 2 && (
        <ProfileTextForm cvId={params.id} initialSummary={profileText} />
      )}

      {stepNum === 3 && (
        <ExperienceForm cvId={params.id} initialData={experiences} />
      )}

      {stepNum !== 1 && stepNum !== 2 && stepNum !== 3 && (
        <div className="bg-white border border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-400 text-sm">
          Formulär för &ldquo;{STEP_LABELS[stepNum]}&rdquo; byggs i nästa steg.
        </div>
      )}
    </div>
  )
}
