import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { registerSchema } from './schema'

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  // Block admin self-registration.
  // Admin accounts are created via POST /api/admin/seed using ADMIN_SEED_SECRET env var.
  if (typeof body === 'object' && body !== null && 'role' in body && (body as Record<string, unknown>).role === 'admin') {
    return NextResponse.json(
      { error: 'Admin accounts cannot be self-registered.' },
      { status: 403 }
    )
  }

  const parsed = registerSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const data = parsed.data

  // Create Supabase Auth user via admin API.
  // email_confirm: true = skip email confirmation (clients get immediate access)
  // email_confirm: false = send confirmation email (freelancers must confirm first)
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email: data.email,
    password: data.password,
    app_metadata: { role: data.role },
    email_confirm: data.role === 'client',
  })

  if (authError) {
    return NextResponse.json(
      { error: authError.message },
      { status: 409 }
    )
  }

  if (!authData.user) {
    return NextResponse.json(
      { error: 'Registration failed. Please try again.' },
      { status: 500 }
    )
  }

  const userId = authData.user.id

  try {
    const { error: userError } = await adminClient
      .from('users')
      .insert({ id: userId, email: data.email, role: data.role })

    if (userError) throw userError

    if (data.role === 'client') {
      const { error: profileError } = await adminClient
        .from('client_profiles')
        .insert({
          user_id: userId,
          full_name: data.full_name,
          company_name: data.company_name ?? null,
        })
      if (profileError) throw profileError
    } else {
      const { error: profileError } = await adminClient
        .from('freelancer_profiles')
        .insert({
          user_id: userId,
          full_name: data.full_name,
          skills: [data.expertise_area],
          services: [],
          approval_status: 'pending',
          approved: false,
          profile_completed: false,
        })
      if (profileError) throw profileError
    }
  } catch (err) {
    // Clean up orphaned Supabase Auth user if DB inserts fail.
    // Log cleanup failure — a silent failure here leaves a permanently orphaned auth account.
    const { error: cleanupError } = await adminClient.auth.admin.deleteUser(userId)
    if (cleanupError) {
      console.error('Failed to clean up orphaned auth user after registration failure', {
        userId,
        cleanupError: cleanupError.message,
        originalError: err,
      })
    }
    return NextResponse.json(
      { error: 'Registration failed. Please try again.' },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    role: data.role,
    requiresEmailConfirmation: data.role === 'freelancer',
  })
}
