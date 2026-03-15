import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const VALID_STEPS = [1, 2, 3, 4, 5] as const
type ValidStep = (typeof VALID_STEPS)[number]

const STEP_LABELS: Record<ValidStep, string> = {
  1: 'Personuppgifter',
  2: 'Profiltext',
  3: 'Arbetslivserfarenhet',
  4: 'Utbildning',
  5: 'Kunskaper & Färdigheter',
}

export default async function CVStepPage({
  params,
}: {
  params: { id: string; step: string }
}) {
  const stepNum = parseInt(params.step, 10) as ValidStep

  if (!VALID_STEPS.includes(stepNum)) {
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

  return (
    <div>
      <p className="text-sm text-gray-500 mb-1">
        Steg {stepNum} av {VALID_STEPS.length}
      </p>
      <h2 className="text-xl font-semibold text-gray-900 mb-6">
        {STEP_LABELS[stepNum]}
      </h2>
      {/* Form components wired in 3.2–3.6 */}
      <div className="bg-white border border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-400 text-sm">
        Formulär för &ldquo;{STEP_LABELS[stepNum]}&rdquo; byggs i nästa steg.
      </div>
    </div>
  )
}
