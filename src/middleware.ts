import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getRedirectPath } from './middleware.utils'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: getUser() validates JWT server-side and refreshes the token.
  // Never use getSession() here — it trusts the client-side cookie without validation.
  const { data: { user } } = await supabase.auth.getUser()

  const redirectPath = getRedirectPath(user, request.nextUrl.pathname)

  if (redirectPath) {
    const url = request.nextUrl.clone()
    url.pathname = redirectPath
    const redirectResponse = NextResponse.redirect(url)
    // Copy refreshed auth cookies to the redirect response
    supabaseResponse.cookies.getAll().forEach(cookie => {
      redirectResponse.cookies.set(cookie.name, cookie.value)
    })
    return redirectResponse
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/client/:path*', '/freelancer/:path*', '/admin/:path*', '/auth/:path*'],
}
