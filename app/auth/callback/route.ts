import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { RESET_PENDING_COOKIE } from '@/lib/actions/auth'

// Handles email-link callbacks from Supabase Auth — sign-up confirmation AND
// password recovery. Supabase redirects here with ?code=xxx; we exchange it
// for a session, then route by signal:
//
// - Password recovery: the cv_reset_pending cookie was set by
//   requestPasswordReset before the email was sent. Presence here means
//   "send the user to /reset-password to choose a new password." Cookie is
//   consumed (deleted) so a stale cookie can't hijack a future sign-up.
// - Sign-up confirmation (or anything else): default to /dashboard.
//
// We avoid a ?next= query param on the Supabase redirectTo because the
// Supabase URL whitelist rejects URLs with query strings unless the exact
// variant is allowed.
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

  const cookieStore = cookies()
  const isPasswordReset = cookieStore.get(RESET_PENDING_COOKIE)?.value === '1'
  if (isPasswordReset) {
    cookieStore.delete(RESET_PENDING_COOKIE)
    return NextResponse.redirect(`${origin}/reset-password`)
  }

  return NextResponse.redirect(`${origin}/dashboard`)
}
