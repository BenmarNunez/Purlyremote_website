import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { logAdminAction } from '@/lib/audit'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.app_metadata?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('user_id')
  const search = searchParams.get('q')
  const requestId = searchParams.get('request_id')
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '100', 10), 500)
  const offset = parseInt(searchParams.get('offset') ?? '0', 10)

  let query = adminClient
    .from('messages')
    .select('id, sender_id, receiver_id, request_id, content, read, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (userId) query = query.or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
  if (requestId) query = query.eq('request_id', requestId)
  if (search) query = query.ilike('content', `%${search}%`)

  const { data, error, count } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Hydrate sender/receiver emails (one extra query)
  const userIds = Array.from(new Set((data ?? []).flatMap(m => [m.sender_id, m.receiver_id])))
  const { data: users } = await adminClient.from('users').select('id, email').in('id', userIds)
  const userMap = new Map((users ?? []).map(u => [u.id, u.email as string]))

  const hydrated = (data ?? []).map(m => ({
    ...m,
    sender_email: userMap.get(m.sender_id) ?? null,
    receiver_email: userMap.get(m.receiver_id) ?? null,
  }))

  return NextResponse.json({ messages: hydrated, total: count ?? 0 })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.app_metadata?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = (await req.json()) as { id?: string }
  if (!id) return NextResponse.json({ error: 'Missing message id.' }, { status: 400 })

  const { error } = await adminClient.from('messages').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await logAdminAction({
    adminId: user.id,
    adminEmail: user.email ?? '',
    action: 'message_deleted',
    targetType: 'message',
    targetId: id,
  })
  return NextResponse.json({ success: true })
}
