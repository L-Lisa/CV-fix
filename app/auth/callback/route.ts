import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Handles the email confirmation link sent by Supabase after sign-up.
// Supabase redirects here with ?code=xxx — we exchange it for a session,
// then send the user to their dashboard.
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

  return NextResponse.redirect(`${origin}/dashboard`)
}
