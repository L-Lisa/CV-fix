import { cookies } from 'next/headers'

// Marker cookie set when a user requests a password reset. The
// /auth/callback route reads this after the code exchange and routes to
// /reset-password instead of /dashboard. We use a cookie rather than a
// ?next= query param on Supabase's redirectTo because the Supabase URL
// whitelist rejects redirect URLs with query strings unless the exact
// variant is allowed — and we don't want to require a Supabase config
// change per flow.
//
// Lives outside lib/actions/ because Next.js forbids non-async exports
// from 'use server' modules.
export const RESET_PENDING_COOKIE = 'cv_reset_pending'

// 30 minutes covers a realistic time-to-click on the reset email.
const RESET_PENDING_MAX_AGE_SECONDS = 60 * 30

export function setResetPendingCookie(): void {
  cookies().set(RESET_PENDING_COOKIE, '1', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: RESET_PENDING_MAX_AGE_SECONDS,
  })
}

// Returns true and deletes the cookie if present; returns false otherwise.
// Deleting prevents a stale marker from hijacking a later sign-up
// confirmation in the same browser.
export function consumeResetPendingCookie(): boolean {
  const store = cookies()
  const present = store.get(RESET_PENDING_COOKIE)?.value === '1'
  if (present) store.delete(RESET_PENDING_COOKIE)
  return present
}
