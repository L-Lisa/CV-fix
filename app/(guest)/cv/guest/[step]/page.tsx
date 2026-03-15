import { redirect } from 'next/navigation'
import GuestStepContent from './GuestStepContent'

const VALID_STEPS = [1, 2, 3, 4, 5] as const
type ValidStep = (typeof VALID_STEPS)[number]

export default function GuestStepPage({ params }: { params: { step: string } }) {
  const step = parseInt(params.step, 10)

  if (!VALID_STEPS.includes(step as ValidStep)) {
    redirect('/cv/guest/1')
  }

  return <GuestStepContent step={step as ValidStep} />
}
