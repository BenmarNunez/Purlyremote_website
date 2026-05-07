import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { ClientProfile, HireRequest, HireRequestStatus } from '@/lib/supabase/types'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Client Dashboard — PurlyRemote' }

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

interface StatCardProps {
  label: string
  value: number
  description: string
}

function StatCard({ label, value, description }: StatCardProps) {
  return (
    <div className="card p-6">
      <p className="text-sm font-body text-neutral-500 mb-1">{label}</p>
      <p className="text-3xl font-heading font-bold text-neutral-900">{value}</p>
      <p className="text-xs font-body text-neutral-400 mt-1">{description}</p>
    </div>
  )
}

interface RecentRequest {
  id: string
  service: string
  status: HireRequestStatus
  created_at: string
}

export default async function ClientDashboard() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('client_profiles')
    .select('full_name, avatar_url')
    .eq('user_id', user.id)
    .single<Pick<ClientProfile, 'full_name' | 'avatar_url'>>()

  const fullName = profile?.full_name ?? user.email ?? 'Client'

  // Stat counts
  const [{ count: activeCount }, { count: completedCount }, { count: unreadCount }] =
    await Promise.all([
      supabase
        .from('hire_requests')
        .select('id', { count: 'exact', head: true })
        .eq('client_id', user.id)
        .eq('status', 'pending'),
      supabase
        .from('hire_requests')
        .select('id', { count: 'exact', head: true })
        .eq('client_id', user.id)
        .eq('status', 'completed'),
      supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .eq('read', false),
    ])

  // Recent requests
  const { data: recentRaw } = await supabase
    .from('hire_requests')
    .select('id, service, status, created_at')
    .eq('client_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const recentRequests = (recentRaw ?? []) as RecentRequest[]

  return (
    <div>
      {/* Welcome heading */}
      <div className="mb-8">
        <p className="section-tag mb-2">Overview</p>
        <h1 className="text-2xl font-heading font-bold text-neutral-900">
          Welcome back, {fullName}
        </h1>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard
          label="Active Requests"
          value={activeCount ?? 0}
          description="Pending freelancer response"
        />
        <StatCard
          label="Completed Hires"
          value={completedCount ?? 0}
          description="Successfully finished projects"
        />
        <StatCard
          label="Unread Messages"
          value={unreadCount ?? 0}
          description="New messages from freelancers"
        />
      </div>

      {/* Recent requests table */}
      <div className="card overflow-hidden mb-6">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <h2 className="font-heading font-semibold text-neutral-800">Recent Requests</h2>
          <Link href="/client/requests" className="text-sm text-[#007BFF] font-body hover:underline">
            View all
          </Link>
        </div>

        {recentRequests.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="font-body text-neutral-500 text-sm">
              No hire requests yet.{' '}
              <Link href="/client/browse" className="text-[#007BFF] hover:underline">
                Browse freelancers
              </Link>{' '}
              to get started.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-100">
                  <th className="text-left px-6 py-3 font-body font-medium text-neutral-500">
                    Service
                  </th>
                  <th className="text-left px-6 py-3 font-body font-medium text-neutral-500">
                    Status
                  </th>
                  <th className="text-left px-6 py-3 font-body font-medium text-neutral-500">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {recentRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-6 py-3 font-body text-neutral-800">{req.service}</td>
                    <td className="px-6 py-3">
                      <StatusBadge status={req.status} />
                    </td>
                    <td className="px-6 py-3 font-body text-neutral-500">
                      {new Date(req.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Browse CTA */}
      <Link href="/client/browse" className="btn-primary inline-flex">
        Browse Freelancers
      </Link>
    </div>
  )
}
