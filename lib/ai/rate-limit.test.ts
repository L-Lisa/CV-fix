import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { checkRateLimit, AI_HOURLY_LIMIT, rateLimitHeaders } from './rate-limit'

// ─── Supabase mock ────────────────────────────────────────────────────────────
//
// `checkRateLimit` does two things on the supabase client:
//   1. select count of rows for user_id in last hour
//   2. insert a new row when allowed
// We mock both. Tests configure the count it sees and the error returned by
// each step.

interface MockState {
  selectCount: number | null      // rows seen for the user; null → query error
  selectError: { message: string } | null
  insertError: { message: string } | null
  selectThrows: boolean           // whether `.from(...).select(...)` chain throws
}

const state: MockState = {
  selectCount: 0,
  selectError: null,
  insertError: null,
  selectThrows: false,
}

function setState(next: Partial<MockState>) {
  Object.assign(state, next)
}

beforeEach(() => {
  setState({ selectCount: 0, selectError: null, insertError: null, selectThrows: false })
})

// Tracks how many times insert was called — to prove we don't insert when blocked.
let insertCalls = 0

function buildMockClient(): SupabaseClient {
  return {
    from: () => {
      if (state.selectThrows) {
        throw new Error('connection lost')
      }
      return {
        select: () => ({
          eq: () => ({
            gt: () =>
              Promise.resolve({
                count: state.selectCount,
                error: state.selectError,
                data: null,
              }),
          }),
        }),
        insert: () => {
          insertCalls += 1
          return Promise.resolve({ error: state.insertError })
        },
      }
    },
  } as unknown as SupabaseClient
}

beforeEach(() => {
  insertCalls = 0
})

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('checkRateLimit — under the limit', () => {
  it('allows a request when no prior calls in the window', async () => {
    setState({ selectCount: 0 })
    const result = await checkRateLimit(buildMockClient(), 'user-1', 'profile')
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(AI_HOURLY_LIMIT - 1)
  })

  it('records the call (insert is invoked) when allowed', async () => {
    setState({ selectCount: 5 })
    await checkRateLimit(buildMockClient(), 'user-1', 'profile')
    expect(insertCalls).toBe(1)
  })

  it('decrements remaining as usage approaches the limit', async () => {
    setState({ selectCount: AI_HOURLY_LIMIT - 1 })
    const result = await checkRateLimit(buildMockClient(), 'user-1', 'profile')
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(0)
  })
})

describe('checkRateLimit — at the limit', () => {
  it('blocks when count is exactly at the limit', async () => {
    setState({ selectCount: AI_HOURLY_LIMIT })
    const result = await checkRateLimit(buildMockClient(), 'user-1', 'profile')
    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
  })

  it('blocks when count is over the limit', async () => {
    setState({ selectCount: AI_HOURLY_LIMIT + 5 })
    const result = await checkRateLimit(buildMockClient(), 'user-1', 'profile')
    expect(result.allowed).toBe(false)
  })

  it('does NOT insert a row when blocked (no log, no fake count inflation)', async () => {
    setState({ selectCount: AI_HOURLY_LIMIT })
    await checkRateLimit(buildMockClient(), 'user-1', 'profile')
    expect(insertCalls).toBe(0)
  })
})

describe('checkRateLimit — fail-open semantics', () => {
  it('allows the request when the select query returns an error (e.g. table missing)', async () => {
    // Suppress the expected console.warn from the helper.
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    setState({ selectCount: null, selectError: { message: 'relation "ai_request_log" does not exist' } })

    const result = await checkRateLimit(buildMockClient(), 'user-1', 'profile')
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(AI_HOURLY_LIMIT)
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('rate-limit query failed'),
      expect.any(String)
    )
    warn.mockRestore()
  })

  it('allows when the supabase chain throws (e.g. network down)', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    setState({ selectThrows: true })

    const result = await checkRateLimit(buildMockClient(), 'user-1', 'profile')
    expect(result.allowed).toBe(true)
    warn.mockRestore()
  })

  it('still allows the call when insert fails, but logs a warning', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    setState({ selectCount: 5, insertError: { message: 'permission denied' } })

    const result = await checkRateLimit(buildMockClient(), 'user-1', 'profile')
    expect(result.allowed).toBe(true)
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('rate-limit insert failed'),
      expect.any(String)
    )
    warn.mockRestore()
  })
})

describe('rateLimitHeaders', () => {
  it('produces the standard X-RateLimit-* triple', async () => {
    const resetAt = new Date('2026-05-04T15:00:00Z')
    const headers = rateLimitHeaders({ allowed: true, remaining: 42, resetAt })
    expect(headers['X-RateLimit-Limit']).toBe(String(AI_HOURLY_LIMIT))
    expect(headers['X-RateLimit-Remaining']).toBe('42')
    // Reset is a unix timestamp in seconds.
    expect(headers['X-RateLimit-Reset']).toBe(String(Math.floor(resetAt.getTime() / 1000)))
  })
})
