import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { getFullCV } from '@/lib/queries/cv'
import type { AIDescriptionPayload, AIResult } from '@/types'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `Du förbättrar CV-beskrivningar för den svenska eller engelska arbetsmarknaden. Skriv på det språk du ombeds skriva på.

REGLER:
- Exakt 3 punkter. Varje punkt max 12 ord.
- Varje punkt börjar med starkt verb i preteritum (sv) eller past tense (en).
- Exempel sv-verb: Hanterade, Ledde, Ansvarade för, Optimerade, Byggde, Implementerade, Koordinerade.
- Förbjudet: 'bidrog till', 'hjälpte med', 'jobbade med', 'var ansvarig för diverse'.
- Om currentDescription är tom: hitta på 3 rimliga punkter baserat på jobbtiteln.
- Svara ENBART med 3 punkter, en per rad. Ingen numrering. Inga bindestreck. Inget annat.`

function err(message: string, status = 500): NextResponse {
  const body: AIResult = { result: '', error: message }
  return NextResponse.json(body, { status })
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: AIDescriptionPayload
  try {
    body = await request.json()
  } catch {
    return err('Ogiltig förfrågan.', 400)
  }

  const { jobTitle, employer, currentDescription, language, cvId, isGuest } = body

  // Auth flow — verify ownership when cvId is present and not guest
  if (cvId && !isGuest) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return err('Inte inloggad.', 401)

    const fullCV = await getFullCV(cvId)
    if (!fullCV || fullCV.cv.user_id !== user.id) {
      return err('CV hittades inte.', 403)
    }
  }

  const userPrompt = `Förbättra beskrivningen på ${language === 'sv' ? 'svenska' : 'engelska'}.
Jobbtitel: ${jobTitle || 'okänd'}
Arbetsgivare: ${employer || 'okänd'}
Nuvarande text: ${currentDescription?.trim() || 'ingen'}`

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 600,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text.trim() : ''
    const result: AIResult = {
      result: text,
      systemPrompt: SYSTEM_PROMPT,
      userPrompt,
    }
    return NextResponse.json(result)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('AI description route failed:', msg)
    const userMsg = msg.includes('credit') ? 'Vi har slut på AI cash.' : 'AI-tjänsten svarade inte. Försök igen.'
    return err(userMsg)
  }
}
