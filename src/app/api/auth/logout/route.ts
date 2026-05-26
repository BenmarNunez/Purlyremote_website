import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    await supabase.auth.signOut()
  } catch {
    // signOut failure is non-fatal — still redirect to home
  }
  // Use request origin so redirect works on any domain (prod + preview + localhost)
  const origin = req.nextUrl.origin
  return NextResponse.redirect(new URL('/', origin), { status: 303 })
}
