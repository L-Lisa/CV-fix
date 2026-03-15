// ATS validation logic — PRD section 9.
// Pure function: takes FullCV, returns arrays of hard errors and soft warnings.
// No side effects, no imports from server-only modules — safe to call anywhere.

import type { FullCV, ATSError, CVPersonalInfo } from '@/types'

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

function countSentences(text: string): number {
  // Split on . ! ? followed by whitespace or end — rough but reliable enough
  return text.split(/[.!?]+(?:\s|$)/).filter((s) => s.trim().length > 0).length
}

export interface ATSResult {
  hard: ATSError[]
  soft: ATSError[]
}

export function validateCV(data: FullCV): ATSResult {
  const hard: ATSError[] = []
  const soft: ATSError[] = []
  const { personalInfo: pi, profile, experiences, educations } = data

  // ─── Hard errors (block export) ────────────────────────────────────────────

  // 1. Name missing
  if (!pi?.first_name?.trim()) {
    hard.push({ severity: 'hard', field: 'first_name', message: 'Förnamn saknas' })
  }
  if (!pi?.last_name?.trim()) {
    hard.push({ severity: 'hard', field: 'last_name', message: 'Efternamn saknas' })
  }

  // 2. Invalid email
  if (!pi?.email?.trim()) {
    hard.push({ severity: 'hard', field: 'email', message: 'E-postadress saknas' })
  } else if (!isValidEmail(pi.email)) {
    hard.push({ severity: 'hard', field: 'email', message: 'E-postadressen är ogiltig' })
  }

  // 3. Phone missing or too short
  if (!pi?.phone?.trim()) {
    hard.push({ severity: 'hard', field: 'phone', message: 'Telefonnummer saknas' })
  } else if (pi.phone.replace(/\D/g, '').length < 5) {
    hard.push({ severity: 'hard', field: 'phone', message: 'Telefonnumret verkar för kort' })
  }

  // 4. Profile text empty
  if (!profile?.summary?.trim()) {
    hard.push({ severity: 'hard', field: 'summary', message: 'Profiltext saknas' })
  }

  // 5. Neither experience nor education filled in
  if (experiences.length === 0 && educations.length === 0) {
    hard.push({
      severity: 'hard',
      field: null,
      message: 'Minst en arbetslivserfarenhet eller utbildning krävs',
    })
  }

  // 6. Date range errors (end before start)
  experiences.forEach((exp, i) => {
    if (!exp.is_current && exp.start_year && exp.end_year) {
      if (
        exp.end_year < exp.start_year ||
        (exp.end_year === exp.start_year &&
          exp.start_month !== null &&
          exp.end_month !== null &&
          exp.end_month < exp.start_month)
      ) {
        hard.push({
          severity: 'hard',
          field: `experiences[${i}].end_year`,
          message: `Erfarenhet ${i + 1}: Slutdatum kan inte vara före startdatum`,
        })
      }
    }
    // 7. Both start and end empty
    if (!exp.start_year && !exp.is_current) {
      hard.push({
        severity: 'hard',
        field: `experiences[${i}].start_year`,
        message: `Erfarenhet ${i + 1}: Startdatum saknas`,
      })
    }
  })

  // 8. URL validation
  const urlFields: Array<{ key: keyof CVPersonalInfo; label: string }> = [
    { key: 'linkedin_url', label: 'LinkedIn-URL' },
    { key: 'github_url', label: 'GitHub-URL' },
    { key: 'portfolio_url', label: 'Portfolio-URL' },
    { key: 'other_url', label: 'Annan URL' },
  ]
  if (pi) {
    urlFields.forEach(({ key, label }) => {
      const val = pi[key] as string | null
      if (val?.trim() && !isValidUrl(val.trim())) {
        hard.push({ severity: 'hard', field: key, message: `${label} är ogiltig` })
      }
    })
  }

  // ─── Soft warnings (do not block export) ───────────────────────────────────

  // Profile too short or too long
  if (profile?.summary?.trim()) {
    const sentences = countSentences(profile.summary)
    if (sentences < 2) {
      soft.push({
        severity: 'soft',
        field: 'summary',
        message: 'Profiltexten är kort — sikta på 3–5 meningar',
      })
    } else if (sentences > 6) {
      soft.push({
        severity: 'soft',
        field: 'summary',
        message: 'Profiltexten är lång — håll den till max 6 meningar',
      })
    }
  }

  // Experience entries without description
  experiences.forEach((exp, i) => {
    if (!exp.description?.trim()) {
      soft.push({
        severity: 'soft',
        field: `experiences[${i}].description`,
        message: `Erfarenhet ${i + 1} (${exp.job_title ?? 'okänd'}) saknar beskrivning`,
      })
    }
  })

  // Education without level or end year
  educations.forEach((edu, i) => {
    if (!edu.level) {
      soft.push({
        severity: 'soft',
        field: `educations[${i}].level`,
        message: `Utbildning ${i + 1} (${edu.program ?? 'okänd'}) saknar nivå`,
      })
    }
    if (!edu.end_year && !edu.is_current) {
      soft.push({
        severity: 'soft',
        field: `educations[${i}].end_year`,
        message: `Utbildning ${i + 1} (${edu.program ?? 'okänd'}) saknar slutår`,
      })
    }
  })

  // Unprofessional email (simple heuristics — only flag obvious cases)
  if (pi?.email && isValidEmail(pi.email)) {
    const local = pi.email.split('@')[0].toLowerCase()
    if (local.includes('123') || /^(test|temp|spam)/i.test(local)) {
      soft.push({
        severity: 'soft',
        field: 'email',
        message: 'E-postadressen kan uppfattas som oprofessionell',
      })
    }
  }

  return { hard, soft }
}
