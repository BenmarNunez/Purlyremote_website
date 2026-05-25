import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { logAdminAction } from '@/lib/audit'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.app_metadata?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { userId } = await req.json() as { userId: string }

  if (userId === user.id) {
    return NextResponse.json({ error: 'Cannot impersonate yourself.' }, { status: 400 })
  }

  // Generate a magic link (password recovery link) for the target user
  // Admin clicks it → logs in as that user
  const { data, error } = await adminClient.auth.admin.generateLink({
    type: 'magiclink',
    email: (await adminClient.from('users').select('email').eq('id', userId).single<{ email: string }>()).data?.email ?? '',
  })

  if (error || !data?.properties?.action_link) {
    return NextResponse.json({ error: 'Failed to generate impersonation link.' }, { status: 500 })
  }

  await logAdminAction({
    adminId: user.id,
    adminEmail: user.email ?? '',
    action: 'user_impersonated',
    targetType: 'user',
    targetId: userId,
    details: { note: 'Magic link generated for impersonation' },
  })

  return NextResponse.json({ url: data.properties.action_link })
}
