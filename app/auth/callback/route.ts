import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { consumeResetPendingCookie } from '@/lib/auth/cookies'

// Handles email-link callbacks from Supabase Auth — sign-up confirmation AND
// password recovery. Supabase redirects here with ?code=xxx; we exchange it
// for a session, then route by signal:
//
// - Password recovery: the cv_reset_pending marker cookie was set by
//   requestPasswordReset before the email was sent. Presence here means
//   "send the user to /reset-password to choose a new password."
// - Sign-up confirmation (or anything else): default to /dashboard.
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  const origin = request.nextUrl.origin

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`)
  }

  const supabase = createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('auth callback failed:', error.message)
    return NextResponse.redirect(`${origin}/login?error=confirmation_failed`)
  }

  if (consumeResetPendingCookie()) {
    return NextResponse.redirect(`${origin}/reset-password`)
  }

  return NextResponse.redirect(`${origin}/dashboard`)
}
