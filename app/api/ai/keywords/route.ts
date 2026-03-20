import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { getFullCV } from '@/lib/queries/cv'
import type { AIKeywordsPayload, AIResult } from '@/types'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `Du är en erfaren rekryterare och karriärhandledare inom Rusta och Matcha. Du analyserar CV:n mot jobbannonser för att identifiera nyckelord som saknas och som är viktiga för att klara ATS-granskning.

REGLER:
- Identifiera nyckelord och fraser i jobbannonsen som INTE finns i CV:t.
- Fokusera på: yrkesspecifika kompetenser, verktyg, certifikat, branschtermer, mjuka kompetenser som nämns explicit.
- Ignorera nyckelord som redan finns eller som är nära synonymer till befintliga.
- För varje nyckelord: ange vilken CV-sektion det naturligast hör hemma i.
- Max 8 förslag. Prioritera de viktigaste för ATS-matchning.
- Svara ENBART med ett JSON-array. Inget annat.
- Format: [{"keyword":"...","section":"..."},...]
- Sektioner att använda: "Profiltext", "Arbetslivserfarenhet", "Kunskaper & Färdigheter", "Utbildning"`

function err(message: string, status = 500): NextResponse {
  const body: AIResult = { result: '', error: message }
  return NextResponse.json(body, { status })
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: AIKeywordsPayload
  try {
    body = await request.json()
  } catch {
    return err('Ogiltig förfrågan.', 400)
  }

  const { cvId, jobPosting, language } = body

  if (!jobPosting?.trim()) {
    return err('Jobbannons saknas.', 400)
  }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('Inte inloggad.', 401)

  const fullCV = await getFullCV(cvId)
  if (!fullCV) return err('CV hittades inte.', 404)

  const isOwner = fullCV.cv.user_id === user.id

  if (!isOwner) {
    // Allow coaches with a verified coach_link to the CV owner
    const { data: link } = await supabase
      .from('coach_links')
      .select('id')
      .eq('coach_id', user.id)
      .eq('user_id', fullCV.cv.user_id)
      .single()

    if (!link) return err('Åtkomst nekad.', 403)
  }

  const { personalInfo, profile, experiences, educations, skills, languages } = fullCV

  const cvSummary = [
    personalInfo?.headline ? `Yrkestitel: ${personalInfo.headline}` : null,
    profile?.summary ? `Profil: ${profile.summary}` : null,
    experiences.length > 0
      ? `Erfarenhet: ${experiences.map((e) => [e.job_title, e.employer, e.description].filter(Boolean).join(' – ')).join(' | ')}`
      : null,
    educations.length > 0
      ? `Utbildning: ${educations.map((e) => [e.program, e.institution].filter(Boolean).join(' på ')).join(' | ')}`
      : null,
    skills.length > 0
      ? `Kunskaper: ${skills.map((s) => s.name).filter(Boolean).join(', ')}`
      : null,
    languages.length > 0
      ? `Språk: ${languages.map((l) => l.language).filter(Boolean).join(', ')}`
      : null,
  ].filter(Boolean).join('\n')

  const userPrompt = `Analysera på ${language === 'sv' ? 'svenska' : 'engelska'}.

CV-innehåll:
${cvSummary || 'inget CV-innehåll'}

Jobbannons:
${jobPosting.slice(0, 3000)}`

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
    console.error('AI keywords route failed:', msg)
    return err(`AI-fel: ${msg}`)
  }
}
