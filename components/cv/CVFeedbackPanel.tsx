'use client'

// Cv-feedback panel — UI for /api/ai/cv-feedback (PRD §15.5, v1.4).
// Renders in step 6 (preview pages, both authed and guest). Pedagogical
// framing per UI_COPY_v1.md §6: AI is a checklist, not a verdict.

import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAIMode } from '@/components/cv/AIToggle'
import HowDoesThisWork from '@/components/shared/HowDoesThisWork'
import type {
  AICVFeedbackPayload,
  AICVFeedbackPoint,
  AICVFeedbackResult,
} from '@/types'

type Props =
  | { mode: 'authed'; cvId: string; language: 'sv' | 'en' }
  | {
      mode: 'guest'
      guestData: NonNullable<AICVFeedbackPayload['guestData']>
      language: 'sv' | 'en'
    }

const HOW_IT_WORKS_TEXT =
  'När du klickar läser AI:n igenom hela ditt CV och pekar ut 3–5 saker som är värda att titta på. Inga ändringar görs automatiskt — du får en lista att gå igenom själv. AI:n ser mönster och formuleringar, men kan inte avgöra vad som faktiskt stämmer för dig.'

export default function CVFeedbackPanel(props: Props) {
  const { aiEnabled } = useAIMode()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [points, setPoints] = useState<AICVFeedbackPoint[] | null>(null)
  const [tipsMessage, setTipsMessage] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  async function fetchFeedback() {
    setLoading(true)
    setError('')
    setPoints(null)
    setTipsMessage(null)

    const payload: AICVFeedbackPayload =
      props.mode === 'authed'
        ? { cvId: props.cvId, language: props.language }
        : { guestData: props.guestData, isGuest: true, language: props.language }

    try {
      const res = await fetch('/api/ai/cv-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = (await res.json()) as AICVFeedbackResult
      if (!res.ok || data.error) {
        setError(data.error || 'Jag hänger inte med just nu — försök igen om en stund.')
        return
      }
      if (typeof data.result === 'string') {
        // [TIPS] response — strip the prefix for display, soft framing.
        setTipsMessage(data.result.replace(/^\[TIPS\]\s*/, ''))
      } else {
        setPoints(data.result)
      }
    } catch {
      setError('Jag hänger inte med just nu — försök igen om en stund.')
    } finally {
      setLoading(false)
    }
  }

  function handleCopy() {
    if (!points || points.length === 0) return
    const text = points.map((p, i) => `${i + 1}. ${p.point}`).join('\n')
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
      .catch(() => {
        // Clipboard may be unavailable (older browsers, restricted contexts).
        // Failing silently is fine here — user can still read and re-type.
      })
  }

  function handleClose() {
    setPoints(null)
    setTipsMessage(null)
    setError('')
  }

  const hasResult = points !== null || tipsMessage !== null

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-gray-900">
        En sista koll innan du skickar
      </h3>
      <p className="text-xs text-gray-600 mt-1">
        När du känner dig klar — be om en ärlig genomgång av hela ditt CV.
      </p>

      {!hasResult && !error && (
        <p className="text-xs text-gray-500 mt-3 leading-relaxed">
          Du får några konkreta saker att titta på. Inget mer, inget mindre.
          Du är experten på dig själv och din bransch — använd punkterna som
          en checklista, inte ett facit.
        </p>
      )}

      {!aiEnabled && !hasResult && (
        <p className="text-xs text-gray-500 mt-3">
          Slå på AI-hjälp för att använda den här funktionen.
        </p>
      )}

      {aiEnabled && !hasResult && !error && (
        <div className="mt-3 space-y-2">
          <Button
            type="button"
            onClick={fetchFeedback}
            disabled={loading}
            className="w-full gap-2"
            variant="outline"
          >
            <Sparkles className="h-4 w-4 text-purple-600" />
            {loading ? 'Läser igenom ditt CV…' : 'Få ärlig feedback på mitt CV'}
          </Button>
          <p className="text-xs text-gray-500 leading-relaxed">
            Det är du som väljer vad som faktiskt ska stå i ditt CV — och det
            är ditt ansvar att kontrollera att det stämmer.
          </p>
          <HowDoesThisWork text={HOW_IT_WORKS_TEXT} />
        </div>
      )}

      {error && (
        <div className="mt-3 space-y-2">
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setError('')}
          >
            Försök igen
          </Button>
        </div>
      )}

      {points && (
        <div className="mt-3 space-y-3">
          <p className="text-xs font-semibold text-gray-700">
            Här är vad som är värt att titta på
          </p>
          <ul className="space-y-2">
            {points.map((p, i) => (
              <li
                key={i}
                className="text-sm text-gray-700 leading-relaxed pl-3 border-l-2 border-purple-200"
              >
                {p.point}
              </li>
            ))}
          </ul>
          <p className="text-xs text-gray-500 leading-relaxed bg-gray-50 border border-gray-200 rounded p-3">
            Du är experten på dig själv och din bransch. AI:n ser mönster och
            formuleringar — den ser inte vem du är. Använd punkterna ovan som
            en checklista, inte som ett facit. Det är du som sätter pricken
            över i:et.
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              onClick={handleCopy}
              className="flex-1"
            >
              {copied ? 'Kopierat' : 'Kopiera feedbacken'}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClose}
            >
              Stäng
            </Button>
          </div>
        </div>
      )}

      {tipsMessage && (
        <div className="mt-3 space-y-3">
          <p className="text-sm text-gray-700 leading-relaxed bg-amber-50 border border-amber-200 rounded p-3">
            {tipsMessage}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClose}
          >
            Stäng
          </Button>
        </div>
      )}
    </div>
  )
}
