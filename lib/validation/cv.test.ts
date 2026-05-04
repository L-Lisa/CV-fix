import { describe, it, expect } from 'vitest'
import {
  personalInfoSchema,
  profileTextSchema,
  experienceSchema,
  educationSchema,
  skillSchema,
  languageEntrySchema,
  volunteeringSchema,
  otherEntrySchema,
} from './cv'

describe('personalInfoSchema', () => {
  const valid = {
    first_name: 'Anna',
    last_name: 'Andersson',
    headline: '',
    phone: '0701234567',
    email: 'anna@example.com',
    city: '',
    region: '',
    linkedin_url: '',
    github_url: '',
    portfolio_url: '',
    other_url: '',
    driving_license: '',
  }

  it('accepts a complete valid object', () => {
    expect(personalInfoSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects empty first_name', () => {
    const r = personalInfoSchema.safeParse({ ...valid, first_name: '' })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.issues[0].message).toBe('Förnamn krävs')
  })

  it('rejects empty last_name', () => {
    const r = personalInfoSchema.safeParse({ ...valid, last_name: '' })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.issues[0].message).toBe('Efternamn krävs')
  })

  it('rejects phone shorter than 5 chars', () => {
    const r = personalInfoSchema.safeParse({ ...valid, phone: '1234' })
    expect(r.success).toBe(false)
  })

  it('rejects an invalid email', () => {
    const r = personalInfoSchema.safeParse({ ...valid, email: 'bad' })
    expect(r.success).toBe(false)
  })

  it('accepts a valid LinkedIn URL', () => {
    expect(
      personalInfoSchema.safeParse({ ...valid, linkedin_url: 'https://linkedin.com/in/anna' }).success
    ).toBe(true)
  })

  it('rejects a malformed URL but accepts empty string', () => {
    expect(personalInfoSchema.safeParse({ ...valid, linkedin_url: 'not a url' }).success).toBe(false)
    expect(personalInfoSchema.safeParse({ ...valid, linkedin_url: '' }).success).toBe(true)
  })
})

describe('profileTextSchema', () => {
  it('rejects empty summary', () => {
    expect(profileTextSchema.safeParse({ summary: '' }).success).toBe(false)
  })

  it('accepts a normal summary', () => {
    expect(profileTextSchema.safeParse({ summary: 'En profiltext.' }).success).toBe(true)
  })

  it('rejects summary > 2000 chars', () => {
    expect(profileTextSchema.safeParse({ summary: 'a'.repeat(2001) }).success).toBe(false)
  })
})

describe('experienceSchema', () => {
  const valid = {
    job_title: 'Utvecklare',
    employer: 'Acme',
    city: '',
    country: '',
    start_month: 1,
    start_year: 2020,
    end_month: 12,
    end_year: 2022,
    is_current: false,
    description: '',
    type: 'job' as const,
  }

  it('accepts a complete experience', () => {
    expect(experienceSchema.safeParse(valid).success).toBe(true)
  })

  it('accepts is_current=true with null end dates', () => {
    expect(
      experienceSchema.safeParse({ ...valid, is_current: true, end_month: null, end_year: null })
        .success
    ).toBe(true)
  })

  it('rejects when end dates are null and is_current is false', () => {
    const r = experienceSchema.safeParse({
      ...valid,
      is_current: false,
      end_month: null,
      end_year: null,
    })
    expect(r.success).toBe(false)
    if (!r.success) {
      expect(r.error.issues[0].message).toBe('Ange slutdatum eller markera som pågående')
    }
  })

  it('rejects end before start in same year', () => {
    const r = experienceSchema.safeParse({
      ...valid,
      start_month: 6,
      start_year: 2022,
      end_month: 3,
      end_year: 2022,
    })
    expect(r.success).toBe(false)
    if (!r.success) {
      expect(r.error.issues[0].message).toBe('Slutdatum kan inte vara före startdatum')
    }
  })

  it('rejects end_year before start_year', () => {
    const r = experienceSchema.safeParse({
      ...valid,
      start_year: 2022,
      end_year: 2020,
    })
    expect(r.success).toBe(false)
  })

  it('rejects empty job_title', () => {
    const r = experienceSchema.safeParse({ ...valid, job_title: '' })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.issues[0].message).toBe('Jobbtitel krävs')
  })
})

describe('educationSchema', () => {
  const valid = {
    institution: 'KTH',
    program: 'Datateknik',
    level: 'hogskola' as const,
    start_year: 2015,
    end_year: 2019,
    is_current: false,
    description: '',
  }

  it('accepts a complete education', () => {
    expect(educationSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects end_year < start_year', () => {
    const r = educationSchema.safeParse({ ...valid, start_year: 2020, end_year: 2018 })
    expect(r.success).toBe(false)
  })

  it('accepts is_current=true with null end_year', () => {
    expect(
      educationSchema.safeParse({ ...valid, is_current: true, end_year: null }).success
    ).toBe(true)
  })

  it('rejects null end_year when not current', () => {
    expect(
      educationSchema.safeParse({ ...valid, is_current: false, end_year: null }).success
    ).toBe(false)
  })
})

describe('skillSchema', () => {
  it('accepts a skill with a name', () => {
    expect(skillSchema.safeParse({ category: 'technical', name: 'TypeScript', level: 4 }).success).toBe(true)
  })

  it('rejects empty name', () => {
    const r = skillSchema.safeParse({ category: 'technical', name: '', level: 4 })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.issues[0].message).toBe('Namn krävs')
  })

  it('rejects level outside 1-5', () => {
    expect(skillSchema.safeParse({ category: 'technical', name: 'X', level: 0 }).success).toBe(false)
    expect(skillSchema.safeParse({ category: 'technical', name: 'X', level: 6 }).success).toBe(false)
  })

  it('accepts null level (rendered as text)', () => {
    expect(skillSchema.safeParse({ category: 'technical', name: 'X', level: null }).success).toBe(true)
  })
})

describe('languageEntrySchema', () => {
  it('accepts a valid language entry', () => {
    expect(
      languageEntrySchema.safeParse({ language: 'Svenska', level: 'native' }).success
    ).toBe(true)
  })

  it('rejects an unknown level', () => {
    expect(
      languageEntrySchema.safeParse({ language: 'Svenska', level: 'expert' as 'fluent' }).success
    ).toBe(false)
  })

  it('rejects empty language', () => {
    const r = languageEntrySchema.safeParse({ language: '', level: 'fluent' })
    expect(r.success).toBe(false)
  })
})

describe('volunteeringSchema', () => {
  const valid = {
    role: 'Frivillig',
    organisation: 'Röda Korset',
    start_year: 2020,
    end_year: 2021,
    is_current: false,
    description: '',
  }

  it('accepts a complete entry', () => {
    expect(volunteeringSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects null end_year when not current', () => {
    expect(
      volunteeringSchema.safeParse({ ...valid, is_current: false, end_year: null }).success
    ).toBe(false)
  })

  it('accepts is_current=true with null end_year', () => {
    expect(
      volunteeringSchema.safeParse({ ...valid, is_current: true, end_year: null }).success
    ).toBe(true)
  })
})

describe('otherEntrySchema', () => {
  it('accepts a complete entry', () => {
    expect(otherEntrySchema.safeParse({ label: 'Certifikat', text: 'AWS CCP' }).success).toBe(true)
  })

  it('rejects an empty label', () => {
    expect(otherEntrySchema.safeParse({ label: '', text: 'AWS CCP' }).success).toBe(false)
  })

  it('rejects an empty text', () => {
    expect(otherEntrySchema.safeParse({ label: 'Certifikat', text: '' }).success).toBe(false)
  })
})
