import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.app_metadata?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const [usersRes, freelancerRes, clientRes] = await Promise.all([
    adminClient.from('users').select('*').order('created_at', { ascending: false }),
    adminClient.from('freelancer_profiles').select('user_id, full_name, approval_status, avatar_url'),
    adminClient.from('client_profiles').select('user_id, full_name, company_name, avatar_url'),
  ])

  const freelancerMap = new Map((freelancerRes.data ?? []).map(p => [p.user_id, p]))
  const clientMap = new Map((clientRes.data ?? []).map(p => [p.user_id, p]))

  const users = (usersRes.data ?? []).map(u => {
    const fp = freelancerMap.get(u.id)
    const cp = clientMap.get(u.id)
    return {
      id: u.id,
      email: u.email,
      role: u.role,
      created_at: u.created_at,
      full_name: fp?.full_name ?? cp?.full_name ?? null,
      company_name: cp?.company_name ?? null,
      avatar_url: fp?.avatar_url ?? cp?.avatar_url ?? null,
      approval_status: fp?.approval_status ?? null,
    }
  })

  return NextResponse.json({ users })
}
