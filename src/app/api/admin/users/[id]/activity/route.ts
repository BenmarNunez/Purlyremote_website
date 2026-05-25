import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

interface RouteContext { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: RouteContext) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.app_metadata?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  // Fetch admin actions targeting this user
  const { data: logs } = await adminClient
    .from('admin_logs')
    .select('*')
    .eq('target_id', id)
    .order('created_at', { ascending: false })
    .limit(50)

  // Fetch hire requests for this user (as client or freelancer)
  const { data: hires } = await adminClient
    .from('hire_requests')
    .select('id, service, status, created_at, client_id, freelancer_id')
    .or(`client_id.eq.${id},freelancer_id.eq.${id}`)
    .order('created_at', { ascending: false })
    .limit(20)

  // Fetch messages count
  const { count: messageCount } = await adminClient
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .or(`sender_id.eq.${id},receiver_id.eq.${id}`)

  return NextResponse.json({ logs: logs ?? [], hires: hires ?? [], messageCount: messageCount ?? 0 })
}
