import { describe, it, expect } from 'vitest'
import { isProtectedAppRoute } from './middleware'

describe('isProtectedAppRoute', () => {
  it('protects /dashboard', () => {
    expect(isProtectedAppRoute('/dashboard')).toBe(true)
  })

  it('protects /coach and its children', () => {
    expect(isProtectedAppRoute('/coach')).toBe(true)
    expect(isProtectedAppRoute('/coach/dashboard')).toBe(true)
    expect(isProtectedAppRoute('/coach/cv/abc')).toBe(true)
  })

  it('protects authed CV routes', () => {
    expect(isProtectedAppRoute('/cv/new')).toBe(true)
    expect(isProtectedAppRoute('/cv/abc/edit')).toBe(true)
    expect(isProtectedAppRoute('/cv/abc/edit/3')).toBe(true)
    expect(isProtectedAppRoute('/cv/abc/preview')).toBe(true)
  })

  // Regression guard: this is the bug that broke "Starta utan konto" in
  // production. The guest flow MUST remain reachable without a session.
  it('does NOT protect /cv/guest and its children', () => {
    expect(isProtectedAppRoute('/cv/guest')).toBe(false)
    expect(isProtectedAppRoute('/cv/guest/1')).toBe(false)
    expect(isProtectedAppRoute('/cv/guest/preview')).toBe(false)
  })

  it('does not protect public routes', () => {
    expect(isProtectedAppRoute('/')).toBe(false)
    expect(isProtectedAppRoute('/login')).toBe(false)
    expect(isProtectedAppRoute('/register')).toBe(false)
    expect(isProtectedAppRoute('/forgot-password')).toBe(false)
    expect(isProtectedAppRoute('/reset-password')).toBe(false)
    expect(isProtectedAppRoute('/auth/callback')).toBe(false)
  })
})
