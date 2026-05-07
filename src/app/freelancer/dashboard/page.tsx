import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import type { FreelancerProfile, HireRequest } from '@/lib/supabase/types'
import PendingRequestActions from './PendingRequestActions'

export const metadata: Metadata = { title: 'Freelancer Dashboard — PurlyRemote' }

interface Stats {
  pending_requests: number
  active_projects: number
  completed: number
  unread_messages: number
}

function ApprovalBanner({
  status,
  notes,
}: {
  status: FreelancerProfile['approval_status']
  notes: string | null
}) {
  if (status === 'pending') {
    return (
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
        <p className="font-body text-yellow-800 text-sm">
          ⏳ Your profile is under review. Complete your profile to improve your chances.
          We&apos;ll notify you within 24 hours.
        </p>
        <Link href="/freelancer/profile" className="btn-outline mt-3 inline-block text-sm">
          Complete Profile
        </Link>
      </div>
    )
  }

  if (status === 'approved') {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-4">
        <p className="font-body text-green-800 text-sm">
          ✅ Your profile is approved and visible to clients.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
      <p className="font-body text-red-800 text-sm">
        ❌ Not approved{notes ? `: ${notes}` : ''}. Please update and resubmit.
      </p>
      <Link href="/freelancer/profile" className="btn-outline mt-3 inline-block text-sm">
        Resubmit for Review
      </Link>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="card p-5">
      <p className="text-3xl font-heading font-bold text-[#007BFF]">{value}</p>
      <p className="text-sm font-body text-neutral-500 mt-1">{label}</p>
    </div>
  )
}

export default async function FreelancerDashboard() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('freelancer_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single<FreelancerProfile>()

  const approvalStatus = profile?.approval_status ?? 'pending'
  const isApproved = approvalStatus === 'approved'

  let stats: Stats | null = null
  let pendingRequests: HireRequest[] = []

  if (isApproved) {
    const [pendingRes, activeRes, completedRes, messagesRes, requestsRes] = await Promise.all([
      supabase
        .from('hire_requests')
        .select('id', { count: 'exact', head: true })
        .eq('freelancer_id', user.id)
        .eq('status', 'pending'),
      supabase
        .from('hire_requests')
        .select('id', { count: 'exact', head: true })
        .eq('freelancer_id', user.id)
        .eq('status', 'accepted'),
      supabase
        .from('hire_requests')
        .select('id', { count: 'exact', head: true })
        .eq('freelancer_id', user.id)
        .eq('status', 'completed'),
      supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .eq('read', false),
      supabase
        .from('hire_requests')
        .select('*')
        .eq('freelancer_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(5),
    ])

    stats = {
      pending_requests: pendingRes.count ?? 0,
      active_projects: activeRes.count ?? 0,
      completed: completedRes.count ?? 0,
      unread_messages: messagesRes.count ?? 0,
    }

    pendingRequests = (requestsRes.data ?? []) as HireRequest[]
  }

  const name = profile?.full_name ?? user.email ?? 'Freelancer'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="section-tag mb-2">Freelancer Dashboard</div>
        <h1 className="text-2xl font-heading font-bold text-neutral-900">
          Welcome back, {name}
        </h1>
      </div>

      {/* Approval banner */}
      <ApprovalBanner status={approvalStatus} notes={profile?.approval_notes ?? null} />

      {/* Stats (approved only) */}
      {isApproved && stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Pending Requests" value={stats.pending_requests} />
          <StatCard label="Active Projects" value={stats.active_projects} />
          <StatCard label="Completed" value={stats.completed} />
          <StatCard label="Unread Messages" value={stats.unread_messages} />
        </div>
      )}

      {/* Pending requests list (approved only) */}
      {isApproved && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-semibold text-neutral-900">Pending Requests</h2>
            <Link
              href="/freelancer/requests"
              className="text-sm text-[#007BFF] hover:underline font-body"
            >
              View all
            </Link>
          </div>

          {pendingRequests.length === 0 ? (
            <p className="text-sm font-body text-neutral-400 py-4 text-center">
              No pending requests right now.
            </p>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {pendingRequests.map((req) => (
                <li key={req.id} className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="font-body font-semibold text-sm text-neutral-800">
                        {req.service}
                      </p>
                      <p className="text-sm font-body text-neutral-500 mt-0.5 line-clamp-2">
                        {req.description.length > 100
                          ? req.description.slice(0, 100) + '…'
                          : req.description}
                      </p>
                      <p className="text-xs font-body text-neutral-400 mt-1">
                        {new Date(req.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <PendingRequestActions requestId={req.id} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
