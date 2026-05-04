import { describe, it, expect, beforeEach, vi } from 'vitest'

// ─── Supabase mock ────────────────────────────────────────────────────────────
//
// Replaces `@/lib/supabase/server`. Every test calls `setMockState()` to
// configure (a) what auth.getUser returns, and (b) what the .update() chain
// returns. This proves we can mock the canonical "auth → ownership-scoped
// update → return SaveResult" pattern from CLAUDE.md → Error Handling.

interface MockState {
  user: { id: string } | null
  updateError: { message: string } | null
}

const state: MockState = { user: null, updateError: null }

function setMockState(next: Partial<MockState>) {
  Object.assign(state, next)
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => ({
    auth: {
      getUser: async () => ({ data: { user: state.user } }),
    },
    from: () => ({
      update: () => ({
        eq: () => ({
          eq: async () => ({ error: state.updateError }),
        }),
      }),
    }),
  }),
}))

// Import AFTER vi.mock so the mock is in place.
import { updateCVSettings } from './cv'

beforeEach(() => {
  setMockState({ user: null, updateError: null })
})

describe('updateCVSettings', () => {
  it('returns { success: false, error: "Inte inloggad" } when no user', async () => {
    setMockState({ user: null })
    const result = await updateCVSettings('cv-1', 1, '#000000')
    expect(result).toEqual({ success: false, error: 'Inte inloggad' })
  })

  it('returns { success: true } on a clean update', async () => {
    setMockState({ user: { id: 'user-1' }, updateError: null })
    const result = await updateCVSettings('cv-1', 2, '#2563eb')
    expect(result).toEqual({ success: true })
  })

  it('returns a friendly Swedish error when Supabase update fails', async () => {
    setMockState({
      user: { id: 'user-1' },
      updateError: { message: 'permission denied for table cvs' },
    })
    const result = await updateCVSettings('cv-1', 1, '#000000')
    expect(result.success).toBe(false)
    if (!result.success) {
      // Don't leak the raw DB error text to the user
      expect(result.error).not.toContain('permission denied')
      expect(result.error).toBe('Det gick inte att spara. Försök igen.')
    }
  })
})
