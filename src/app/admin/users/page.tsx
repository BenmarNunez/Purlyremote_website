import { adminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import UserTable from './UserTable'

export interface UserRow {
  id: string
  email: string
  role: 'client' | 'freelancer' | 'admin'
  status: 'active' | 'suspended' | 'banned'
  created_at: string
  full_name: string | null
  company_name: string | null
  avatar_url: string | null
  approval_status: string | null
}

export default async function UsersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.app_metadata?.role !== 'admin') redirect('/auth/login')

  const [usersRes, freelancerRes, clientRes] = await Promise.all([
    adminClient.from('users').select('*').is('deleted_at', null).order('created_at', { ascending: false }),
    adminClient.from('freelancer_profiles').select('user_id, full_name, approval_status, avatar_url'),
    adminClient.from('client_profiles').select('user_id, full_name, company_name, avatar_url'),
  ])

  const freelancerMap = new Map((freelancerRes.data ?? []).map(p => [p.user_id, p]))
  const clientMap = new Map((clientRes.data ?? []).map(p => [p.user_id, p]))

  const users: UserRow[] = (usersRes.data ?? []).map(u => {
    const fp = freelancerMap.get(u.id)
    const cp = clientMap.get(u.id)
    return {
      id: u.id,
      email: u.email as string,
      role: u.role as UserRow['role'],
      status: ((u as { status?: string }).status ?? 'active') as UserRow['status'],
      created_at: u.created_at as string,
      full_name: (fp?.full_name ?? cp?.full_name ?? null) as string | null,
      company_name: (cp?.company_name ?? null) as string | null,
      avatar_url: (fp?.avatar_url ?? cp?.avatar_url ?? null) as string | null,
      approval_status: (fp?.approval_status ?? null) as string | null,
    }
  })

  return (
    <div>
      <div className="mb-6">
        <div className="section-tag mb-2">Management</div>
        <h1 className="text-2xl font-heading font-bold text-neutral-900">User Management</h1>
        <p className="text-sm font-body text-neutral-500 mt-1">{users.length} total accounts</p>
      </div>
      <UserTable users={users} />
    </div>
  )
}
