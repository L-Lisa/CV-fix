import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { getFullCV } from '@/lib/queries/cv'
import type { AISkillsPayload, AIResult } from '@/types'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `Du föreslår relevanta kompetenser till CV:n för den svenska eller engelska arbetsmarknaden. Skriv på det språk du ombeds skriva på.

REGLER:
- Föreslå exakt 6 kompetenser.
- Specifika: 'Microsoft Excel' inte 'Office'. 'Truckkort A+B' inte 'truck'. 'JavaScript' inte 'programmering'.
- Inkludera INTE kompetenser som redan finns i existingSkills (jämför case-insensitive).
- 4 tekniska/yrkesspecifika + 2 generella/mjuka kompetenser.
- Svara ENBART med ett JSON-array: ["kompetens1","kompetens2","kompetens3","kompetens4","kompetens5","kompetens6"]
  Inget annat. Inga kommentarer.`

function err(message: string, status = 500): NextResponse {
  const body: AIResult = { result: '', error: message }
  return NextResponse.json(body, { status })
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: AISkillsPayload
  try {
    body = await request.json()
  } catch {
    return err('Ogiltig förfrågan.', 400)
  }

  const { language, cvId, guestData } = body

  let expTitles: string[] = []
  let eduPrograms: string[] = []
  let existingSkillNames: string[] = []

  if (cvId) {
    // Auth flow — verify ownership
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return err('Inte inloggad.', 401)

    const fullCV = await getFullCV(cvId)
    if (!fullCV || fullCV.cv.user_id !== user.id) {
      return err('CV hittades inte.', 403)
    }

    expTitles = fullCV.experiences.slice(0, 3).map((e) => e.job_title).filter(Boolean) as string[]
    eduPrograms = fullCV.educations.slice(0, 2).map((e) => e.program).filter(Boolean) as string[]
    existingSkillNames = fullCV.skills.map((s) => s.name).filter(Boolean) as string[]
  } else if (guestData) {
    expTitles = guestData.experiences.slice(0, 3).map((e) => e.job_title).filter(Boolean) as string[]
    eduPrograms = guestData.educations.slice(0, 2).map((e) => e.program).filter(Boolean) as string[]
    existingSkillNames = guestData.existingSkills.map((s) => s.name).filter(Boolean) as string[]
  } else {
    return err('Saknar cvId eller guestData.', 400)
  }

  const userPrompt = `Föreslå kompetenser på ${language === 'sv' ? 'svenska' : 'engelska'}.
Erfarenhet: ${expTitles.join(', ') || 'ingen'}
Utbildning: ${eduPrograms.join(', ') || 'ingen'}
Befintliga kompetenser att INTE upprepa: ${existingSkillNames.join(', ') || 'inga'}`

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
    console.error('AI skills route failed:', e)
    return err('AI-tjänsten svarade inte. Försök igen.')
  }
}
