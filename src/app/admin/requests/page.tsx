import { adminClient } from '@/lib/supabase/admin'
import type { HireRequest, HireRequestStatus } from '@/lib/supabase/types'
import type { Metadata } from 'next'
import RequestsTable from './RequestsTable'

export const metadata: Metadata = { title: 'Requests — Admin — PurlyRemote' }

export interface EnrichedRequest extends HireRequest {
  client_name: string
  freelancer_name: string
}

export default async function AdminRequestsPage() {
  const { data: requestsRaw } = await adminClient
    .from('hire_requests')
    .select('*')
    .order('created_at', { ascending: false })

  const requests = (requestsRaw ?? []) as HireRequest[]

  if (requests.length === 0) {
    return (
      <div>
        <div className="mb-6">
          <p className="section-tag mb-2">Management</p>
          <h1 className="text-2xl font-heading font-bold text-neutral-900">Hire Requests</h1>
        </div>
        <div className="card px-6 py-10 text-center">
          <p className="font-body text-neutral-500 text-sm">No hire requests yet.</p>
        </div>
      </div>
    )
  }

  // Collect unique client and freelancer IDs
  const clientIds = [...new Set(requests.map((r) => r.client_id))]
  const freelancerIds = [...new Set(requests.map((r) => r.freelancer_id))]

  const [{ data: clientsRaw }, { data: freelancersRaw }] = await Promise.all([
    adminClient
      .from('client_profiles')
      .select('user_id, full_name')
      .in('user_id', clientIds),
    adminClient
      .from('freelancer_profiles')
      .select('user_id, full_name')
      .in('user_id', freelancerIds),
  ])

  const clientMap = new Map<string, string>()
  for (const c of clientsRaw ?? []) {
    const row = c as { user_id: string; full_name: string }
    clientMap.set(row.user_id, row.full_name)
  }

  const freelancerMap = new Map<string, string>()
  for (const f of freelancersRaw ?? []) {
    const row = f as { user_id: string; full_name: string }
    freelancerMap.set(row.user_id, row.full_name)
  }

  const enriched: EnrichedRequest[] = requests.map((r) => ({
    ...r,
    client_name: clientMap.get(r.client_id) ?? 'Unknown Client',
    freelancer_name: freelancerMap.get(r.freelancer_id) ?? 'Unknown Freelancer',
  }))

  return (
    <div>
      <div className="mb-6">
        <p className="section-tag mb-2">Management</p>
        <h1 className="text-2xl font-heading font-bold text-neutral-900">Hire Requests</h1>
        <p className="text-sm font-body text-neutral-500 mt-1">
          {enriched.length} total request{enriched.length !== 1 ? 's' : ''}
        </p>
      </div>
      <RequestsTable requests={enriched} />
    </div>
  )
}
