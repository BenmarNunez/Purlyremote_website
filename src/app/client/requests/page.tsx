import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { HireRequest, HireRequestStatus, FreelancerProfile } from '@/lib/supabase/types'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'My Requests — PurlyRemote' }

const STATUS_BADGE: Record<HireRequestStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  accepted: 'bg-green-100 text-green-800',
  declined: 'bg-red-100 text-red-800',
  completed: 'bg-blue-100 text-blue-800',
}

function StatusBadge({ status }: { status: HireRequestStatus }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-body font-medium capitalize ${STATUS_BADGE[status]}`}
    >
      {status}
    </span>
  )
}

interface RequestRow extends HireRequest {
  freelancer_name: string
}

export default async function ClientRequestsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: raw } = await supabase
    .from('hire_requests')
    .select('*')
    .eq('client_id', user.id)
    .order('created_at', { ascending: false })

  const requests = (raw ?? []) as HireRequest[]

  // Collect unique freelancer IDs and fetch names in one query
  const freelancerIds = [...new Set(requests.map((r) => r.freelancer_id))]

  let nameMap: Map<string, string> = new Map()

  if (freelancerIds.length > 0) {
    const { data: profiles } = await supabase
      .from('freelancer_profiles')
      .select('user_id, full_name')
      .in('user_id', freelancerIds)

    if (profiles) {
      nameMap = new Map(
        (profiles as Pick<FreelancerProfile, 'user_id' | 'full_name'>[]).map((p) => [
          p.user_id,
          p.full_name,
        ])
      )
    }
  }

  const rows: RequestRow[] = requests.map((r) => ({
    ...r,
    freelancer_name: nameMap.get(r.freelancer_id) ?? 'Unknown Freelancer',
  }))

  return (
    <div>
      <div className="mb-6">
        <p className="section-tag mb-2">Hiring</p>
        <h1 className="text-2xl font-heading font-bold text-neutral-900">My Requests</h1>
      </div>

      <div className="card overflow-hidden">
        {rows.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="font-body text-neutral-500 text-sm">
              No hire requests yet.{' '}
              <Link href="/client/browse" className="text-[#007BFF] hover:underline">
                Browse freelancers to get started.
              </Link>
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-100">
                  <th className="text-left px-6 py-3 font-body font-medium text-neutral-500">
                    Freelancer
                  </th>
                  <th className="text-left px-6 py-3 font-body font-medium text-neutral-500">
                    Service
                  </th>
                  <th className="text-left px-6 py-3 font-body font-medium text-neutral-500">
                    Status
                  </th>
                  <th className="text-left px-6 py-3 font-body font-medium text-neutral-500">
                    Date
                  </th>
                  <th className="text-left px-6 py-3 font-body font-medium text-neutral-500">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {rows.map((row) => (
                  <tr key={row.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-6 py-3 font-body text-neutral-800">
                      <Link
                        href={`/client/browse/${row.freelancer_id}`}
                        className="hover:text-[#007BFF] hover:underline"
                      >
                        {row.freelancer_name}
                      </Link>
                    </td>
                    <td className="px-6 py-3 font-body text-neutral-700">{row.service}</td>
                    <td className="px-6 py-3">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="px-6 py-3 font-body text-neutral-500">
                      {new Date(row.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3">
                      <Link
                        href={`/client/messages`}
                        className="text-[#007BFF] text-xs font-body hover:underline"
                      >
                        Message
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
