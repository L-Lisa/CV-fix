import { describe, it, expect, beforeEach, vi } from 'vitest'

// ─── Supabase mock ────────────────────────────────────────────────────────────
//
// Both auth Server Actions under test go through `createClient()` from
// `@/lib/supabase/server`. We stub that with a fake whose `auth` methods
// return whatever the test configures.

interface MockState {
  resetPasswordError: { message: string } | null
  updateUserError: { message: string } | null
  signOutError: { message: string } | null
  resetPasswordCalls: Array<{ email: string; redirectTo: string | undefined }>
  updateUserCalls: Array<{ password: string }>
  signOutCalls: number
}

const state: MockState = {
  resetPasswordError: null,
  updateUserError: null,
  signOutError: null,
  resetPasswordCalls: [],
  updateUserCalls: [],
  signOutCalls: 0,
}

function setMockState(next: Partial<MockState>) {
  Object.assign(state, next)
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => ({
    auth: {
      resetPasswordForEmail: async (email: string, options?: { redirectTo?: string }) => {
        state.resetPasswordCalls.push({ email, redirectTo: options?.redirectTo })
        return { data: {}, error: state.resetPasswordError }
      },
      updateUser: async (attrs: { password: string }) => {
        state.updateUserCalls.push({ password: attrs.password })
        return { data: { user: null }, error: state.updateUserError }
      },
      signOut: async () => {
        state.signOutCalls += 1
        return { error: state.signOutError }
      },
    },
  }),
}))

// `redirect()` from next/navigation throws a special error to short-circuit
// the action. We replace it with a no-op so the action returns a value we
// can assert on.
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}))

// Import AFTER mocks.
import { requestPasswordReset, updatePassword } from './auth'

beforeEach(() => {
  setMockState({
    resetPasswordError: null,
    updateUserError: null,
    signOutError: null,
    resetPasswordCalls: [],
    updateUserCalls: [],
    signOutCalls: 0,
  })
  process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3000'
})

// ─── requestPasswordReset ─────────────────────────────────────────────────────

describe('requestPasswordReset', () => {
  function fd(email: string): FormData {
    const f = new FormData()
    f.set('email', email)
    return f
  }

  it('returns success and calls resetPasswordForEmail with the canonical callback URL', async () => {
    const result = await requestPasswordReset(fd('anna@example.com'))
    expect(result.success).toBe(true)
    expect(state.resetPasswordCalls).toHaveLength(1)
    expect(state.resetPasswordCalls[0].email).toBe('anna@example.com')
    // The redirect must go through /auth/callback so the code-for-session
    // exchange happens before the user lands on /reset-password.
    expect(state.resetPasswordCalls[0].redirectTo).toBe(
      'http://localhost:3000/auth/callback?next=/reset-password'
    )
  })

  it('rejects an invalid email (Zod) and does NOT call Supabase', async () => {
    const result = await requestPasswordReset(fd('not-an-email'))
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe('Ange en giltig e-postadress')
    expect(state.resetPasswordCalls).toHaveLength(0)
  })

  it('returns success even when Supabase reports an error (do not leak whether the email exists)', async () => {
    setMockState({ resetPasswordError: { message: 'user not found' } })
    const result = await requestPasswordReset(fd('unknown@example.com'))
    // User-enumeration safety: always report success to the user. Logged
    // server-side for debugging.
    expect(result.success).toBe(true)
  })
})

// ─── updatePassword ───────────────────────────────────────────────────────────

describe('updatePassword', () => {
  function fd(password: string, confirmPassword: string): FormData {
    const f = new FormData()
    f.set('password', password)
    f.set('confirmPassword', confirmPassword)
    return f
  }

  it('updates the password and signs the user out (forces re-login with new password)', async () => {
    const result = await updatePassword(fd('nyttPassw0rd', 'nyttPassw0rd'))
    expect(result.success).toBe(true)
    expect(state.updateUserCalls).toEqual([{ password: 'nyttPassw0rd' }])
    expect(state.signOutCalls).toBe(1)
  })

  it('rejects mismatched passwords (Zod) and does not call Supabase', async () => {
    const result = await updatePassword(fd('hemligt12', 'olika123'))
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe('Lösenorden matchar inte')
    expect(state.updateUserCalls).toHaveLength(0)
    expect(state.signOutCalls).toBe(0)
  })

  it('rejects a too-short password and does not call Supabase', async () => {
    const result = await updatePassword(fd('1234567', '1234567'))
    expect(result.success).toBe(false)
    expect(state.updateUserCalls).toHaveLength(0)
  })

  it('returns a friendly Swedish error if Supabase update fails (does not leak DB text)', async () => {
    setMockState({ updateUserError: { message: 'auth session missing' } })
    const result = await updatePassword(fd('nyttPassw0rd', 'nyttPassw0rd'))
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).not.toContain('auth session')
      expect(result.error).toBe('Det gick inte att uppdatera lösenordet. Försök igen.')
    }
    // Should NOT have signed out — the update failed.
    expect(state.signOutCalls).toBe(0)
  })
})
