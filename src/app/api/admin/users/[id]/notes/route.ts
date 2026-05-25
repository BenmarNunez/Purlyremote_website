import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { logAdminAction } from '@/lib/audit'

interface RouteContext { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.app_metadata?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json() as { notes: string }

  await adminClient.from('users').update({ admin_notes: body.notes ?? null }).eq('id', id)
  await logAdminAction({
    adminId: user.id,
    adminEmail: user.email ?? '',
    action: 'user_notes_updated',
    targetType: 'user',
    targetId: id,
  })

  return NextResponse.json({ success: true })
}
