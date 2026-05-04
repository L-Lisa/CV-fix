import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Handles email-link callbacks from Supabase Auth — both sign-up confirmation
// and password recovery. Supabase redirects here with ?code=xxx; we exchange
// it for a session, then send the user to ?next or /dashboard.
//
// `next` is whitelisted to relative same-origin paths only — never a full URL —
// so the callback can't be turned into an open-redirect.
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  const next = request.nextUrl.searchParams.get('next')
  const origin = request.nextUrl.origin

  // Only accept relative paths; reject anything that could escape this origin.
  const safeNext = next && next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard'

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`)
  }

  const supabase = createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('auth callback failed:', error.message)
    return NextResponse.redirect(`${origin}/login?error=confirmation_failed`)
  }

  return NextResponse.redirect(`${origin}${safeNext}`)
}
