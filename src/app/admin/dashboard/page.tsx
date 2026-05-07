import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import type { Metadata } from 'next'
import ApproveButton from './ApproveButton'

export const metadata: Metadata = { title: 'Admin Dashboard — PurlyRemote' }

interface StatCardProps {
  label: string
  value: number
  description: string
  accent?: string
}

function StatCard({ label, value, description, accent = 'text-neutral-900' }: StatCardProps) {
  return (
    <div className="card p-6">
      <p className="text-sm font-body text-neutral-500 mb-1">{label}</p>
      <p className={`text-3xl font-heading font-bold ${accent}`}>{value}</p>
      <p className="text-xs font-body text-neutral-400 mt-1">{description}</p>
    </div>
  )
}

interface PendingFreelancer {
  user_id: string
  full_name: string
  created_at: string
}

export default async function AdminDashboard() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  // Fetch all stats in parallel using adminClient (bypasses RLS)
  const [
    { count: totalUsers },
    { count: pendingApprovals },
    { count: activeRequests },
    { count: availableFreelancers },
    { data: pendingRaw },
  ] = await Promise.all([
    adminClient.from('users').select('id', { count: 'exact', head: true }),
    adminClient
      .from('freelancer_profiles')
      .select('id', { count: 'exact', head: true })
      .eq('approval_status', 'pending'),
    adminClient
      .from('hire_requests')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'accepted'),
    adminClient
      .from('freelancer_profiles')
      .select('id', { count: 'exact', head: true })
      .eq('availability', true)
      .eq('approved', true),
    adminClient
      .from('freelancer_profiles')
      .select('user_id, full_name, created_at')
      .eq('approval_status', 'pending')
      .order('created_at', { ascending: true })
      .limit(5),
  ])

  const pendingFreelancers = (pendingRaw ?? []) as PendingFreelancer[]

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <p className="section-tag mb-2">Overview</p>
        <h1 className="text-2xl font-heading font-bold text-neutral-900">Admin Dashboard</h1>
        <p className="text-sm font-body text-neutral-500 mt-1">Logged in as {user.email}</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Users"
          value={totalUsers ?? 0}
          description="Registered accounts"
        />
        <StatCard
          label="Pending Approvals"
          value={pendingApprovals ?? 0}
          description="Freelancers awaiting review"
          accent="text-yellow-600"
        />
        <StatCard
          label="Active Requests"
          value={activeRequests ?? 0}
          description="Accepted hire requests"
          accent="text-green-600"
        />
        <StatCard
          label="Available Freelancers"
          value={availableFreelancers ?? 0}
          description="Approved &amp; open for work"
          accent="text-[#007BFF]"
        />
      </div>

      {/* Pending approvals list */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <h2 className="font-heading font-semibold text-neutral-800">Pending Approvals</h2>
          <a href="/admin/freelancers" className="text-sm text-[#007BFF] font-body hover:underline">
            View all freelancers
          </a>
        </div>

        {pendingFreelancers.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="font-body text-neutral-500 text-sm">No pending approvals.</p>
          </div>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {pendingFreelancers.map((f) => (
              <li
                key={f.user_id}
                className="flex items-center justify-between px-6 py-4 hover:bg-neutral-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {/* Avatar / initials */}
                  <div className="w-9 h-9 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-yellow-700 text-sm font-heading font-semibold">
                      {f.full_name
                        .split(' ')
                        .map((p) => p[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2)}
                    </span>
                  </div>
                  <div>
                    <p className="font-body font-medium text-sm text-neutral-800">{f.full_name}</p>
                    <p className="font-body text-xs text-neutral-400">
                      Applied {new Date(f.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <ApproveButton userId={f.user_id} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
