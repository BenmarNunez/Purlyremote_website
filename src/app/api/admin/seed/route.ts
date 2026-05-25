// WARNING: Delete this file after creating your admin account.
import { adminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  // Hard-disabled in production unless ALLOW_ADMIN_SEED=true is explicitly set.
  // After seeding, remove ALLOW_ADMIN_SEED from your environment and delete this file.
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_ADMIN_SEED !== 'true') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  if (
    typeof body !== 'object' ||
    body === null ||
    (body as Record<string, unknown>).secret !== process.env.ADMIN_SEED_SECRET
  ) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  const { email, password, full_name } = body as Record<string, unknown>

  if (typeof email !== 'string' || typeof password !== 'string' || typeof full_name !== 'string') {
    return NextResponse.json({ error: 'email, password, and full_name are required.' }, { status: 400 })
  }

  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password,
    user_metadata: { role: 'admin', full_name },
    app_metadata: { role: 'admin' },
    email_confirm: true,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 409 })
  }

  const userId = data.user.id

  const { error: userError } = await adminClient
    .from('users')
    .insert({ id: userId, email, role: 'admin' })

  if (userError) {
    await adminClient.auth.admin.deleteUser(userId)
    return NextResponse.json({ error: 'Failed to create admin user record.' }, { status: 500 })
  }

  return NextResponse.json({ success: true, user_id: userId })
}
