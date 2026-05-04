import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/database'

// True when the pathname requires an authenticated user. The guest flow
// lives under /cv/guest/* and must remain reachable without a session —
// without this exclusion, "Starta utan konto" silently redirects to /login.
export function isProtectedAppRoute(pathname: string): boolean {
  if (pathname.startsWith('/dashboard')) return true
  if (pathname.startsWith('/coach')) return true
  if (pathname.startsWith('/cv')) {
    return !pathname.startsWith('/cv/guest')
  }
  return false
}

export async function updateSession(request: NextRequest) {
  // If env vars are missing, pass through rather than crash
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('Missing Supabase environment variables')
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session if expired — required for Server Components
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (isProtectedAppRoute(request.nextUrl.pathname) && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
