import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { registerSchema } from './schema'

export async function POST(req: NextRequest) {
  const body = await req.json()

  // Block admin self-registration.
  // Admin accounts are created via POST /api/admin/seed using ADMIN_SEED_SECRET env var.
  if (body.role === 'admin') {
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

  if (authError || !authData.user) {
    return NextResponse.json(
      { error: authError?.message ?? 'Registration failed' },
      { status: 409 }
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
  } catch {
    // Clean up orphaned Supabase Auth user if DB inserts fail
    await adminClient.auth.admin.deleteUser(userId)
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
