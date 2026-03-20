import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { getFullCV } from '@/lib/queries/cv'
import type { AIProfilePayload, AIResult } from '@/types'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `Du är en erfaren rekryterare och karriärhandledare inom Rusta och Matcha. Du hjälper deltagare att skriva ATS-optimerade profiltexter på svenska eller engelska. Skriv alltid på det språk du ombeds skriva på.

NONSENSE-DETEKTION — kontrollera ALLTID "Nuvarande text" först:
- Om texten är meningslös (upprepade ord, slumpmässiga tecken, teststrängar, obegriplig text): svara ENBART med exakt detta format (ingen annan text):
  [TIPS] Din profiltext verkar inte beskriva din bakgrund. Försök rikta texten mot den tjänst du söker och beskriv din faktiska erfarenhet och kompetens.
- Generera ALDRIG en profiltext om nuvarande text är nonsense — visa bara [TIPS]-meddelandet.

NÄR TEXTEN ÄR GILTIG — generera ATS-optimerad profiltext:
- Exakt 3 meningar. Aldrig mer, aldrig mindre.
- Mening 1: yrkesidentitet + antal års erfarenhet eller bransch (konkret).
- Mening 2: en till två specifika kompetenser eller verktyg från CV-datan.
- Mening 3: vad kandidaten söker eller tillför — kopplat till branschen.
- Aktiva verb. Aldrig passiv form.
- Förbjudna ord: driven, social, flexibel, passionerad, engagerad, noggrann, lösningsorienterad, ansvarstagande, motiverad, positiv, teamspelare.
- Inkludera branschspecifika nyckelord från erfarenhet och utbildning — ATS skannar efter dessa.
- Inga tomma påståenden. Bara vad CV-datan bevisar.
- Hitta aldrig på fakta som inte finns i datan.
- Svara ENBART med profiltext eller [TIPS]-meddelande. Inget annat.`

function err(message: string, status = 500): NextResponse {
  const body: AIResult = { result: '', error: message }
  return NextResponse.json(body, { status })
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: AIProfilePayload
  try {
    body = await request.json()
  } catch {
    return err('Ogiltig förfrågan.', 400)
  }

  const { language, currentSummary, cvId, guestData } = body

  let headline: string | null = null
  let experiences: Array<{ job_title: string | null; employer: string | null; description: string | null }> = []
  let educations: Array<{ program: string | null; institution: string | null }> = []
  let skills: Array<{ name: string | null }> = []
  let languages: Array<{ language: string | null; level: string | null }> = []

  if (cvId) {
    // Auth flow — verify ownership
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return err('Inte inloggad.', 401)

    const fullCV = await getFullCV(cvId)
    if (!fullCV || fullCV.cv.user_id !== user.id) {
      return err('CV hittades inte.', 403)
    }

    headline = fullCV.personalInfo?.headline ?? null
    experiences = fullCV.experiences.map((e) => ({
      job_title: e.job_title,
      employer: e.employer,
      description: e.description,
    }))
    educations = fullCV.educations.map((e) => ({
      program: e.program,
      institution: e.institution,
    }))
    skills = fullCV.skills.map((s) => ({ name: s.name }))
    languages = fullCV.languages.map((l) => ({ language: l.language, level: l.level }))
  } else if (guestData) {
    headline = guestData.headline
    experiences = guestData.experiences
    educations = guestData.educations
    skills = guestData.skills
    languages = guestData.languages
  } else {
    return err('Saknar cvId eller guestData.', 400)
  }

  const expLines = experiences.slice(0, 3).map((e) => {
    const base = [e.job_title, e.employer].filter(Boolean).join(' på ')
    return e.description ? `${base}: ${e.description.slice(0, 100)}` : base
  }).join('\n')

  const eduLines = educations.slice(0, 2).map((e) =>
    [e.program, e.institution].filter(Boolean).join(' på ')
  ).join('\n')

  const skillLines = skills.slice(0, 6).map((s) => s.name).filter(Boolean).join(', ')

  const langLines = languages.map((l) => {
    const level = l.level ?? ''
    return l.language ? `${l.language}${level ? ` – ${level}` : ''}` : null
  }).filter(Boolean).join(', ')

  const userPrompt = `Skriv en profiltext på ${language === 'sv' ? 'svenska' : 'engelska'}.
Nuvarande text: ${currentSummary?.trim() || 'ingen'}
Yrkestitel: ${headline ?? 'ej angiven'}
Erfarenhet (max 3):
${expLines || 'ingen'}
Utbildning (max 2):
${eduLines || 'ingen'}
Kompetenser (max 6): ${skillLines || 'inga'}
Språk: ${langLines || 'inga'}`

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
    console.error('AI profile route failed:', e)
    return err('AI-tjänsten svarade inte. Försök igen.')
  }
}
