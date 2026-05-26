import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const SAFE_NEXT = /^\/[A-Za-z0-9/_\-?=&.]*$/

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const rawNext = searchParams.get('next')

  if (!code) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(
      new URL('/auth/login?error=confirmation_failed', request.url)
    )
  }

  // Allow same-origin relative path only — guards against open redirect.
  const next = rawNext && SAFE_NEXT.test(rawNext) ? rawNext : '/freelancer/dashboard'
  return NextResponse.redirect(new URL(next, request.url))
}
