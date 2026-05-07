import { adminClient } from '@/lib/supabase/admin'
import type { ClientProfile } from '@/lib/supabase/types'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Clients — Admin — PurlyRemote' }

interface ClientRow extends ClientProfile {
  email: string
  request_count: number
}

export default async function AdminClientsPage() {
  // Fetch all client profiles
  const { data: profilesRaw } = await adminClient
    .from('client_profiles')
    .select('*')
    .order('created_at', { ascending: false })

  const profiles = (profilesRaw ?? []) as ClientProfile[]

  if (profiles.length === 0) {
    return (
      <div>
        <div className="mb-6">
          <p className="section-tag mb-2">Management</p>
          <h1 className="text-2xl font-heading font-bold text-neutral-900">Clients</h1>
        </div>
        <div className="card px-6 py-10 text-center">
          <p className="font-body text-neutral-500 text-sm">No clients yet.</p>
        </div>
      </div>
    )
  }

  // Fetch users emails + hire request counts for each client in parallel
  const userIds = profiles.map((p) => p.user_id)

  const [{ data: usersRaw }, { data: requestsRaw }] = await Promise.all([
    adminClient.from('users').select('id, email').in('id', userIds),
    adminClient
      .from('hire_requests')
      .select('client_id')
      .in('client_id', userIds),
  ])

  const emailMap = new Map<string, string>()
  for (const u of usersRaw ?? []) {
    const row = u as { id: string; email: string }
    emailMap.set(row.id, row.email)
  }

  const countMap = new Map<string, number>()
  for (const r of requestsRaw ?? []) {
    const row = r as { client_id: string }
    countMap.set(row.client_id, (countMap.get(row.client_id) ?? 0) + 1)
  }

  const clients: ClientRow[] = profiles.map((p) => ({
    ...p,
    email: emailMap.get(p.user_id) ?? '—',
    request_count: countMap.get(p.user_id) ?? 0,
  }))

  return (
    <div>
      <div className="mb-6">
        <p className="section-tag mb-2">Management</p>
        <h1 className="text-2xl font-heading font-bold text-neutral-900">Clients</h1>
        <p className="text-sm font-body text-neutral-500 mt-1">
          {clients.length} registered client{clients.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-100">
                <th className="text-left px-6 py-3 font-body font-medium text-neutral-500">Name</th>
                <th className="text-left px-6 py-3 font-body font-medium text-neutral-500">Company</th>
                <th className="text-left px-6 py-3 font-body font-medium text-neutral-500">Email</th>
                <th className="text-left px-6 py-3 font-body font-medium text-neutral-500">Total Requests</th>
                <th className="text-left px-6 py-3 font-body font-medium text-neutral-500">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {clients.map((c) => (
                <tr key={c.user_id} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      {c.avatar_url ? (
                        <img
                          src={c.avatar_url}
                          alt={c.full_name}
                          className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center flex-shrink-0">
                          <span className="text-neutral-600 text-xs font-heading font-semibold">
                            {c.full_name
                              .split(' ')
                              .map((p) => p[0])
                              .join('')
                              .toUpperCase()
                              .slice(0, 2)}
                          </span>
                        </div>
                      )}
                      <span className="font-body font-medium text-neutral-800">{c.full_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3 font-body text-neutral-600">
                    {c.company_name ?? <span className="text-neutral-400">—</span>}
                  </td>
                  <td className="px-6 py-3 font-body text-neutral-600">{c.email}</td>
                  <td className="px-6 py-3">
                    <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-2 rounded-full bg-blue-50 text-[#007BFF] text-xs font-body font-medium">
                      {c.request_count}
                    </span>
                  </td>
                  <td className="px-6 py-3 font-body text-neutral-500">
                    {new Date(c.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
