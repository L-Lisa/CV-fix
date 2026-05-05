// Per-user hourly rate limit for AI routes.
// Backed by the `ai_request_log` table (see
// supabase/migrations/20260504_ai_request_log.sql).
//
// Fail-open: if the rate-limit query errors (e.g. the table doesn't exist
// yet because the migration hasn't been applied, or Supabase is briefly
// unreachable), we log a warning and allow the request. Better to occasionally
// allow a spam burst than to block legitimate users when the protection
// infrastructure is down.

import type { SupabaseClient } from '@supabase/supabase-js'

export type AIRoute = 'profile' | 'description' | 'skills' | 'keywords' | 'cv-feedback'

// 50 calls/hour covers normal CV editing (≈10/hr) with a 5× margin and
// realistic coach review workloads (≈30/hr for a multi-participant session).
// Tune once we have telemetry.
export const AI_HOURLY_LIMIT = 50

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: Date
}

// Returns the start of the next hour (the earliest the bucket can refill).
function nextHourBoundary(now: Date = new Date()): Date {
  const reset = new Date(now)
  reset.setMinutes(0, 0, 0)
  reset.setHours(reset.getHours() + 1)
  return reset
}

// Counts the user's calls in the last 60 minutes; if under limit, inserts a
// new row and returns allowed=true. If at limit, returns allowed=false and
// does not insert.
//
// The count + insert is not atomic. In a high-concurrency edge case a user
// could squeeze a couple of extra calls past the limit. Acceptable: the
// limit's purpose is to bound budget burn, not to enforce an exact quota.
export async function checkRateLimit(
  supabase: SupabaseClient,
  userId: string,
  route: AIRoute
): Promise<RateLimitResult> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const resetAt = nextHourBoundary()

  try {
    const { count, error } = await supabase
      .from('ai_request_log')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gt('created_at', oneHourAgo)

    if (error) {
      // Fail-open: log and allow.
      console.warn('rate-limit query failed (failing open):', error.message)
      return { allowed: true, remaining: AI_HOURLY_LIMIT, resetAt }
    }

    const used = count ?? 0
    if (used >= AI_HOURLY_LIMIT) {
      console.warn('rate-limit hit:', { userId, route, used })
      return { allowed: false, remaining: 0, resetAt }
    }

    // Allowed — record the call.
    const { error: insertError } = await supabase
      .from('ai_request_log')
      .insert({ user_id: userId, route })

    if (insertError) {
      // Fail-open: counted as an allowed call without persistence.
      console.warn('rate-limit insert failed (allowing without log):', insertError.message)
    }

    return {
      allowed: true,
      remaining: AI_HOURLY_LIMIT - used - 1,
      resetAt,
    }
  } catch (e) {
    // Catch-all fail-open. Anything unexpected → allow.
    const msg = e instanceof Error ? e.message : String(e)
    console.warn('rate-limit threw (failing open):', msg)
    return { allowed: true, remaining: AI_HOURLY_LIMIT, resetAt }
  }
}

// Standard rate-limit headers; mirror what GitHub / Twitter / Stripe send.
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(AI_HOURLY_LIMIT),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.floor(result.resetAt.getTime() / 1000)),
  }
}
