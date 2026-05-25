import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { logAdminAction } from '@/lib/audit'

interface RouteContext { params: Promise<{ id: string }> }

const ALLOWED = new Set(['open', 'reviewing', 'resolved', 'dismissed'])

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.app_metadata?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const { status } = (await req.json()) as { status?: string }
  if (!status || !ALLOWED.has(status)) {
    return NextResponse.json({ error: 'Invalid status.' }, { status: 400 })
  }

  const updates: Record<string, unknown> = { status }
  if (status === 'resolved' || status === 'dismissed') {
    updates.resolved_by = user.id
    updates.resolved_at = new Date().toISOString()
  }

  const { error } = await adminClient.from('reports').update(updates).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await logAdminAction({
    adminId: user.id,
    adminEmail: user.email ?? '',
    action: `report_${status}`,
    targetType: 'report',
    targetId: id,
  })

  return NextResponse.json({ success: true })
}
