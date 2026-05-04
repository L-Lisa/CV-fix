import { describe, it, expect } from 'vitest'
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from './auth'

describe('registerSchema', () => {
  const valid = {
    fullName: 'Anna Andersson',
    email: 'anna@example.com',
    password: 'hemligt12',
    role: 'user' as const,
    coachEmail: '',
  }

  it('accepts a valid jobseeker registration', () => {
    expect(registerSchema.safeParse(valid).success).toBe(true)
  })

  it('accepts a valid coach registration', () => {
    expect(registerSchema.safeParse({ ...valid, role: 'coach' }).success).toBe(true)
  })

  it('rejects empty full name with the Swedish message', () => {
    const result = registerSchema.safeParse({ ...valid, fullName: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Namn krävs')
    }
  })

  it('rejects an email without @', () => {
    const result = registerSchema.safeParse({ ...valid, email: 'not-an-email' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Ange en giltig e-postadress')
    }
  })

  it('rejects passwords shorter than 8 chars', () => {
    const result = registerSchema.safeParse({ ...valid, password: '1234567' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Lösenordet måste vara minst 8 tecken')
    }
  })

  it('accepts passwords of exactly 8 chars (boundary)', () => {
    expect(registerSchema.safeParse({ ...valid, password: '12345678' }).success).toBe(true)
  })

  it('rejects passwords longer than 72 chars (Supabase limit)', () => {
    const result = registerSchema.safeParse({ ...valid, password: 'a'.repeat(73) })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Lösenordet är för långt')
    }
  })

  it('rejects an unknown role', () => {
    // Cast to bypass the literal union — we want the runtime validator to catch it
    const result = registerSchema.safeParse({ ...valid, role: 'admin' as 'user' })
    expect(result.success).toBe(false)
  })

  it('accepts an empty coachEmail (jobseeker without a coach)', () => {
    expect(registerSchema.safeParse({ ...valid, coachEmail: '' }).success).toBe(true)
  })

  it('accepts a valid coachEmail', () => {
    expect(
      registerSchema.safeParse({ ...valid, coachEmail: 'coach@example.com' }).success
    ).toBe(true)
  })

  it('rejects an invalid coachEmail (must be valid OR empty — not garbage)', () => {
    const result = registerSchema.safeParse({ ...valid, coachEmail: 'not-an-email' })
    expect(result.success).toBe(false)
  })
})

describe('loginSchema', () => {
  it('accepts a valid login', () => {
    expect(
      loginSchema.safeParse({ email: 'anna@example.com', password: 'hemligt12' }).success
    ).toBe(true)
  })

  it('rejects an invalid email', () => {
    const result = loginSchema.safeParse({ email: 'bad', password: 'hemligt12' })
    expect(result.success).toBe(false)
  })

  it('rejects an empty password (login does not enforce length, but does require non-empty)', () => {
    const result = loginSchema.safeParse({ email: 'anna@example.com', password: '' })
    expect(result.success).toBe(false)
  })
})

describe('forgotPasswordSchema', () => {
  it('accepts a valid email', () => {
    expect(forgotPasswordSchema.safeParse({ email: 'anna@example.com' }).success).toBe(true)
  })

  it('rejects an invalid email with the Swedish message', () => {
    const r = forgotPasswordSchema.safeParse({ email: 'not-an-email' })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.issues[0].message).toBe('Ange en giltig e-postadress')
  })

  it('rejects an empty email', () => {
    expect(forgotPasswordSchema.safeParse({ email: '' }).success).toBe(false)
  })
})

describe('resetPasswordSchema', () => {
  const valid = { password: 'nyttPassw0rd', confirmPassword: 'nyttPassw0rd' }

  it('accepts a matching password pair (≥ 8 chars)', () => {
    expect(resetPasswordSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects a password shorter than 8 chars (Swedish message)', () => {
    const r = resetPasswordSchema.safeParse({ password: '1234567', confirmPassword: '1234567' })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.issues[0].message).toBe('Lösenordet måste vara minst 8 tecken')
  })

  it('rejects passwords longer than 72 chars (Supabase limit)', () => {
    const long = 'a'.repeat(73)
    expect(resetPasswordSchema.safeParse({ password: long, confirmPassword: long }).success).toBe(false)
  })

  it('rejects when confirmPassword does not match (Swedish message)', () => {
    const r = resetPasswordSchema.safeParse({ password: 'hemligt12', confirmPassword: 'annorlunda' })
    expect(r.success).toBe(false)
    if (!r.success) {
      // The mismatch message should be on the confirmPassword field, not password.
      const mismatch = r.error.issues.find((i) => i.path.includes('confirmPassword'))
      expect(mismatch?.message).toBe('Lösenorden matchar inte')
    }
  })

  it('rejects when both fields are empty (length check fires first)', () => {
    expect(resetPasswordSchema.safeParse({ password: '', confirmPassword: '' }).success).toBe(false)
  })
})
