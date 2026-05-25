import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getRedirectPath } from './middleware.utils'

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const hasUpstash = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)

const ratelimit = hasUpstash
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(60, '1m'),
      analytics: true,
    })
  : null

export async function middleware(request: NextRequest) {
  // Rate limit all matched routes — 60 requests/min per IP (if Upstash configured)
  if (ratelimit) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      ?? request.headers.get('x-real-ip')
      ?? 'anonymous'
    const { success } = await ratelimit.limit(ip)
    if (!success) {
      return new NextResponse('Too many requests', { status: 429 })
    }
  }

  let supabaseResponse = NextResponse.next({ request })

  // Capture full cookie options so they can be forwarded to redirect responses.
  // ResponseCookies.getAll() only returns name+value — options (HttpOnly, Secure,
  // SameSite, etc.) are lost once baked into a response. Preserving them here
  // ensures security attributes survive redirect hops.
  let pendingCookies: { name: string; value: string; options: CookieOptions }[] = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          pendingCookies = cookiesToSet
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

  // API routes handle their own auth — skip redirect logic, only apply rate limiting
  // Stripe webhook must never be rate-limited (Stripe retries will fail)
  if (request.nextUrl.pathname.startsWith('/api/')) {
    if (request.nextUrl.pathname === '/api/stripe/webhook') {
      return supabaseResponse
    }
    return supabaseResponse
  }

  const redirectPath = getRedirectPath(user, request.nextUrl.pathname)

  if (redirectPath) {
    const url = request.nextUrl.clone()
    url.pathname = redirectPath
    const redirectResponse = NextResponse.redirect(url)
    // Forward full cookie options (including HttpOnly, Secure, SameSite) to redirect
    pendingCookies.forEach(({ name, value, options }) =>
      redirectResponse.cookies.set(name, value, options)
    )
    return redirectResponse
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/client/:path*',
    '/freelancer/:path*',
    '/admin/:path*',
    '/auth/:path*',
    '/api/:path*',
  ],
}
