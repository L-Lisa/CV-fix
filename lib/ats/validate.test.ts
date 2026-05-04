import { describe, it, expect } from 'vitest'
import { validateCV } from './validate'
import type {
  FullCV,
  CV,
  CVPersonalInfo,
  CVProfile,
  CVExperience,
  CVEducation,
} from '@/types'

// ─── Test fixtures ────────────────────────────────────────────────────────────

function makeCV(overrides: Partial<CV> = {}): CV {
  return {
    id: 'cv-1',
    user_id: 'user-1',
    title: 'Mitt CV',
    language: 'sv',
    layout: 1,
    accent_color: '#000000',
    status: 'draft',
    has_been_exported: false,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    updated_by: null,
    ...overrides,
  }
}

function makePI(overrides: Partial<CVPersonalInfo> = {}): CVPersonalInfo {
  return {
    cv_id: 'cv-1',
    first_name: 'Anna',
    last_name: 'Andersson',
    headline: null,
    phone: '0701234567',
    email: 'anna@example.com',
    city: null,
    region: null,
    linkedin_url: null,
    github_url: null,
    portfolio_url: null,
    other_url: null,
    driving_license: null,
    photo_url: null,
    ...overrides,
  }
}

function makeProfile(summary: string | null = 'Jag är en utvecklare. Jag bygger webbappar. Jag söker nästa utmaning.'): CVProfile {
  return { cv_id: 'cv-1', summary }
}

function makeExp(overrides: Partial<CVExperience> = {}): CVExperience {
  return {
    id: 'exp-1',
    cv_id: 'cv-1',
    job_title: 'Utvecklare',
    employer: 'Acme AB',
    city: null,
    country: null,
    start_month: 1,
    start_year: 2020,
    end_month: 12,
    end_year: 2022,
    is_current: false,
    description: '- Hanterade backend\n- Ledde team',
    type: 'job',
    sort_order: 0,
    ...overrides,
  }
}

function makeEdu(overrides: Partial<CVEducation> = {}): CVEducation {
  return {
    id: 'edu-1',
    cv_id: 'cv-1',
    institution: 'KTH',
    program: 'Datateknik',
    level: 'hogskola',
    start_year: 2015,
    end_year: 2019,
    is_current: false,
    description: null,
    sort_order: 0,
    ...overrides,
  }
}

function validCV(): FullCV {
  return {
    cv: makeCV(),
    personalInfo: makePI(),
    profile: makeProfile(),
    experiences: [makeExp()],
    educations: [makeEdu()],
    skills: [],
    languages: [],
    hobbies: null,
    volunteering: [],
    other: [],
  }
}

const hasField = (errors: { field: string | null }[], field: string) =>
  errors.some((e) => e.field === field)

// ─── Baseline ─────────────────────────────────────────────────────────────────

describe('validateCV — baseline', () => {
  it('a fully-valid CV returns no hard errors', () => {
    const result = validateCV(validCV())
    expect(result.hard).toEqual([])
  })

  it('a fully-valid CV returns no soft warnings', () => {
    const result = validateCV(validCV())
    expect(result.soft).toEqual([])
  })
})

// ─── Hard rules (PRD §9.1) ────────────────────────────────────────────────────

describe('validateCV — hard: name missing (PRD §9.1 #1)', () => {
  it('flags first_name when blank', () => {
    const cv = validCV()
    cv.personalInfo = makePI({ first_name: '' })
    const result = validateCV(cv)
    expect(hasField(result.hard, 'first_name')).toBe(true)
  })

  it('flags first_name when only whitespace', () => {
    const cv = validCV()
    cv.personalInfo = makePI({ first_name: '   ' })
    expect(hasField(validateCV(cv).hard, 'first_name')).toBe(true)
  })

  it('flags last_name when blank', () => {
    const cv = validCV()
    cv.personalInfo = makePI({ last_name: '' })
    expect(hasField(validateCV(cv).hard, 'last_name')).toBe(true)
  })

  it('flags both names when personalInfo is null', () => {
    const cv = validCV()
    cv.personalInfo = null
    const hard = validateCV(cv).hard
    expect(hasField(hard, 'first_name')).toBe(true)
    expect(hasField(hard, 'last_name')).toBe(true)
  })
})

describe('validateCV — hard: email (PRD §9.1 #2)', () => {
  it('flags missing email', () => {
    const cv = validCV()
    cv.personalInfo = makePI({ email: '' })
    expect(hasField(validateCV(cv).hard, 'email')).toBe(true)
  })

  it('flags email without @', () => {
    const cv = validCV()
    cv.personalInfo = makePI({ email: 'invalid.example.com' })
    expect(hasField(validateCV(cv).hard, 'email')).toBe(true)
  })

  it('flags email with no domain', () => {
    const cv = validCV()
    cv.personalInfo = makePI({ email: 'anna@' })
    expect(hasField(validateCV(cv).hard, 'email')).toBe(true)
  })

  it('flags email with whitespace', () => {
    const cv = validCV()
    cv.personalInfo = makePI({ email: 'anna @example.com' })
    expect(hasField(validateCV(cv).hard, 'email')).toBe(true)
  })

  it('accepts a normal email', () => {
    const cv = validCV()
    cv.personalInfo = makePI({ email: 'a.b@example.co.uk' })
    expect(hasField(validateCV(cv).hard, 'email')).toBe(false)
  })
})

describe('validateCV — hard: phone (PRD §9.1 #3)', () => {
  it('flags missing phone', () => {
    const cv = validCV()
    cv.personalInfo = makePI({ phone: '' })
    expect(hasField(validateCV(cv).hard, 'phone')).toBe(true)
  })

  it('flags phone with fewer than 5 digits', () => {
    const cv = validCV()
    cv.personalInfo = makePI({ phone: '123' })
    expect(hasField(validateCV(cv).hard, 'phone')).toBe(true)
  })

  it('accepts phone with formatting characters as long as digits ≥ 5', () => {
    const cv = validCV()
    cv.personalInfo = makePI({ phone: '+46 (0) 70-12345' })
    expect(hasField(validateCV(cv).hard, 'phone')).toBe(false)
  })
})

describe('validateCV — hard: profile text empty (PRD §9.1 #4)', () => {
  it('flags missing profile', () => {
    const cv = validCV()
    cv.profile = null
    expect(hasField(validateCV(cv).hard, 'summary')).toBe(true)
  })

  it('flags whitespace-only summary', () => {
    const cv = validCV()
    cv.profile = makeProfile('   ')
    expect(hasField(validateCV(cv).hard, 'summary')).toBe(true)
  })
})

describe('validateCV — hard: experience or education required (PRD §9.1 #5)', () => {
  it('flags when both experiences and educations are empty', () => {
    const cv = validCV()
    cv.experiences = []
    cv.educations = []
    const hard = validateCV(cv).hard
    expect(hard.some((e) => e.message.includes('arbetslivserfarenhet eller utbildning'))).toBe(true)
  })

  it('passes with only education filled in (PRD §7 exception)', () => {
    const cv = validCV()
    cv.experiences = []
    const hard = validateCV(cv).hard
    expect(hard.some((e) => e.message.includes('arbetslivserfarenhet eller utbildning'))).toBe(false)
  })

  it('passes with only experiences filled in', () => {
    const cv = validCV()
    cv.educations = []
    const hard = validateCV(cv).hard
    expect(hard.some((e) => e.message.includes('arbetslivserfarenhet eller utbildning'))).toBe(false)
  })
})

describe('validateCV — hard: end before start (PRD §9.1 #6)', () => {
  it('flags experience with end_year < start_year', () => {
    const cv = validCV()
    cv.experiences = [makeExp({ start_year: 2022, end_year: 2020 })]
    expect(hasField(validateCV(cv).hard, 'experiences[0].end_year')).toBe(true)
  })

  it('flags experience with same year but end_month < start_month', () => {
    const cv = validCV()
    cv.experiences = [makeExp({ start_year: 2022, start_month: 6, end_year: 2022, end_month: 3 })]
    expect(hasField(validateCV(cv).hard, 'experiences[0].end_year')).toBe(true)
  })

  it('does not flag is_current experiences', () => {
    const cv = validCV()
    cv.experiences = [makeExp({ start_year: 2025, is_current: true, end_year: null, end_month: null })]
    expect(hasField(validateCV(cv).hard, 'experiences[0].end_year')).toBe(false)
  })
})

describe('validateCV — hard: missing start date (PRD §9.1 #7)', () => {
  it('flags experience without start_year and not current', () => {
    const cv = validCV()
    cv.experiences = [makeExp({ start_year: null as unknown as number, is_current: false })]
    expect(hasField(validateCV(cv).hard, 'experiences[0].start_year')).toBe(true)
  })

  it('does not flag is_current experiences without start_year', () => {
    const cv = validCV()
    cv.experiences = [makeExp({ start_year: null as unknown as number, is_current: true })]
    expect(hasField(validateCV(cv).hard, 'experiences[0].start_year')).toBe(false)
  })
})

describe('validateCV — hard: URL validation (PRD §9.1 #8)', () => {
  it('flags an invalid LinkedIn URL', () => {
    const cv = validCV()
    cv.personalInfo = makePI({ linkedin_url: 'not a url' })
    expect(hasField(validateCV(cv).hard, 'linkedin_url')).toBe(true)
  })

  it('accepts a valid LinkedIn URL', () => {
    const cv = validCV()
    cv.personalInfo = makePI({ linkedin_url: 'https://linkedin.com/in/anna' })
    expect(hasField(validateCV(cv).hard, 'linkedin_url')).toBe(false)
  })

  it('does not flag empty URL fields', () => {
    const cv = validCV()
    cv.personalInfo = makePI({ linkedin_url: '', github_url: null })
    const hard = validateCV(cv).hard
    expect(hasField(hard, 'linkedin_url')).toBe(false)
    expect(hasField(hard, 'github_url')).toBe(false)
  })

  it('flags every invalid URL field independently', () => {
    const cv = validCV()
    cv.personalInfo = makePI({
      linkedin_url: 'bad',
      github_url: 'also bad',
      portfolio_url: 'still bad',
      other_url: 'final bad',
    })
    const hard = validateCV(cv).hard
    expect(hasField(hard, 'linkedin_url')).toBe(true)
    expect(hasField(hard, 'github_url')).toBe(true)
    expect(hasField(hard, 'portfolio_url')).toBe(true)
    expect(hasField(hard, 'other_url')).toBe(true)
  })
})

// ─── Soft rules (PRD §9.2) ────────────────────────────────────────────────────

describe('validateCV — soft: profile length', () => {
  it('warns when profile is < 2 sentences', () => {
    const cv = validCV()
    cv.profile = makeProfile('Endast en mening.')
    const soft = validateCV(cv).soft
    expect(soft.some((e) => e.field === 'summary' && e.message.includes('kort'))).toBe(true)
  })

  it('warns when profile is > 6 sentences', () => {
    const cv = validCV()
    cv.profile = makeProfile('Ett. Två. Tre. Fyra. Fem. Sex. Sju.')
    const soft = validateCV(cv).soft
    expect(soft.some((e) => e.field === 'summary' && e.message.includes('lång'))).toBe(true)
  })

  it('does not warn for 3 sentences', () => {
    const cv = validCV()
    cv.profile = makeProfile('Ett. Två. Tre.')
    const soft = validateCV(cv).soft
    expect(soft.some((e) => e.field === 'summary')).toBe(false)
  })

  it('does not warn for exactly 6 sentences (boundary)', () => {
    const cv = validCV()
    cv.profile = makeProfile('Ett. Två. Tre. Fyra. Fem. Sex.')
    const soft = validateCV(cv).soft
    expect(soft.some((e) => e.field === 'summary')).toBe(false)
  })
})

describe('validateCV — soft: experience descriptions', () => {
  it('warns when an experience has no description', () => {
    const cv = validCV()
    cv.experiences = [makeExp({ description: null })]
    expect(hasField(validateCV(cv).soft, 'experiences[0].description')).toBe(true)
  })

  it('does not warn when description has bullets — even when length > 150 chars', () => {
    // The "long unpunctuated block" warning has TWO conditions: length > 150 AND no bullets.
    // We need to be over the length gate so the bullet check is what actually decides.
    const cv = validCV()
    const longBulleted =
      '- Hanterade och utvecklade backend-system för en stor svensk e-handelsplattform med många användare\n' +
      '- Ledde teamet och drev förbättringar i CI/CD-pipelinen vilket halverade deploy-tiden för produktionen\n' +
      '- Mentorerade tre juniora utvecklare och höll regelbundna kodgranskningar varje vecka'
    expect(longBulleted.length).toBeGreaterThan(150) // sanity: we are past the gate
    cv.experiences = [makeExp({ description: longBulleted })]
    expect(hasField(validateCV(cv).soft, 'experiences[0].description')).toBe(false)
  })

  it('warns when description is long AND has no bullets — proves bullet detection actually gates', () => {
    // Counterpart to the test above: same length, no bullet markers.
    const cv = validCV()
    const longUnbulleted =
      'Jag hanterade och utvecklade backend-system för en stor svensk e-handelsplattform och ledde teamet och drev förbättringar i deploy-pipelinen och mentorerade juniora utvecklare under hela perioden'
    expect(longUnbulleted.length).toBeGreaterThan(150)
    cv.experiences = [makeExp({ description: longUnbulleted })]
    expect(hasField(validateCV(cv).soft, 'experiences[0].description')).toBe(true)
  })
})

describe('validateCV — soft: education', () => {
  it('warns when education has no level', () => {
    const cv = validCV()
    cv.educations = [makeEdu({ level: null })]
    expect(hasField(validateCV(cv).soft, 'educations[0].level')).toBe(true)
  })

  it('warns when education has no end_year and is not current', () => {
    const cv = validCV()
    cv.educations = [makeEdu({ end_year: null, is_current: false })]
    expect(hasField(validateCV(cv).soft, 'educations[0].end_year')).toBe(true)
  })

  it('does not warn when end_year is missing but is_current=true', () => {
    const cv = validCV()
    cv.educations = [makeEdu({ end_year: null, is_current: true })]
    expect(hasField(validateCV(cv).soft, 'educations[0].end_year')).toBe(false)
  })
})

describe('validateCV — soft: unprofessional email', () => {
  it('warns when local part starts with "test" (regex path)', () => {
    // Use 'tester@' (no '123') so we isolate the test|temp|spam regex
    // from the includes('123') path.
    const cv = validCV()
    cv.personalInfo = makePI({ email: 'tester@example.com' })
    const soft = validateCV(cv).soft
    expect(soft.some((e) => e.field === 'email')).toBe(true)
  })

  it('warns when local part contains "123"', () => {
    const cv = validCV()
    cv.personalInfo = makePI({ email: 'anna123@example.com' })
    const soft = validateCV(cv).soft
    expect(soft.some((e) => e.field === 'email')).toBe(true)
  })

  it('does not warn for a normal address', () => {
    const cv = validCV()
    cv.personalInfo = makePI({ email: 'anna.andersson@example.com' })
    const soft = validateCV(cv).soft
    expect(soft.some((e) => e.field === 'email')).toBe(false)
  })
})

describe('validateCV — soft: chronological gaps', () => {
  it('warns when gap between two experiences is > 12 months', () => {
    const cv = validCV()
    cv.experiences = [
      makeExp({ id: 'a', start_year: 2018, start_month: 1, end_year: 2020, end_month: 1, is_current: false }),
      makeExp({ id: 'b', start_year: 2022, start_month: 1, end_year: 2023, end_month: 1, is_current: false }),
    ]
    const soft = validateCV(cv).soft
    expect(soft.some((e) => e.message.includes('Gap'))).toBe(true)
  })

  it('does not warn when gap is < 12 months', () => {
    const cv = validCV()
    cv.experiences = [
      makeExp({ id: 'a', start_year: 2020, start_month: 1, end_year: 2021, end_month: 1, is_current: false }),
      makeExp({ id: 'b', start_year: 2021, start_month: 6, end_year: 2022, end_month: 1, is_current: false }),
    ]
    const soft = validateCV(cv).soft
    expect(soft.some((e) => e.message.includes('Gap'))).toBe(false)
  })

  it('ignores gaps when the earlier role is_current', () => {
    const cv = validCV()
    cv.experiences = [
      makeExp({ id: 'a', start_year: 2018, end_year: null, end_month: null, is_current: true }),
      makeExp({ id: 'b', start_year: 2024, end_year: 2025, is_current: false }),
    ]
    const soft = validateCV(cv).soft
    expect(soft.some((e) => e.message.includes('Gap'))).toBe(false)
  })
})
