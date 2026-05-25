import { adminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AnalyticsCharts from './AnalyticsCharts'

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.app_metadata?.role !== 'admin') redirect('/auth/login')

  const [usersRes, applicationsRes, hiresRes, freelancersRes, clientsRes] = await Promise.all([
    adminClient.from('users').select('created_at, role').order('created_at'),
    adminClient.from('freelancer_applications').select('created_at, status').order('created_at'),
    adminClient.from('hire_requests').select('created_at, status').order('created_at'),
    adminClient.from('freelancer_profiles').select('id', { count: 'exact', head: true }).eq('approved', true),
    adminClient.from('client_profiles').select('id', { count: 'exact', head: true }),
  ])

  // Group by month helper
  function groupByMonth(items: { created_at: string }[]) {
    const map = new Map<string, number>()
    items.forEach(item => {
      const d = new Date(item.created_at)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      map.set(key, (map.get(key) ?? 0) + 1)
    })
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([month, count]) => ({ month, count }))
  }

  const users = usersRes.data ?? []
  const applications = applicationsRes.data ?? []
  const hires = hiresRes.data ?? []

  const userGrowth = groupByMonth(users)
  const applicationTrend = groupByMonth(applications)
  const hireTrend = groupByMonth(hires)

  // Role breakdown
  const roleBreakdown = [
    { name: 'Clients', value: users.filter(u => u.role === 'client').length },
    { name: 'Freelancers', value: users.filter(u => u.role === 'freelancer').length },
    { name: 'Admins', value: users.filter(u => u.role === 'admin').length },
  ]

  // Application status breakdown
  const appStatusBreakdown = [
    { name: 'Pending', value: applications.filter(a => a.status === 'pending').length },
    { name: 'Screening', value: applications.filter(a => a.status === 'screening').length },
    { name: 'Approved', value: applications.filter(a => a.status === 'approved').length },
    { name: 'Rejected', value: applications.filter(a => a.status === 'rejected').length },
  ]

  const stats = {
    totalUsers: users.length,
    approvedFreelancers: freelancersRes.count ?? 0,
    totalClients: clientsRes.count ?? 0,
    totalApplications: applications.length,
    totalHires: hires.length,
    completedHires: hires.filter(h => h.status === 'completed').length,
  }

  return (
    <div>
      <div className="mb-6">
        <div className="section-tag mb-2">Insights</div>
        <h1 className="text-2xl font-heading font-bold text-neutral-900">Analytics</h1>
        <p className="text-sm font-body text-neutral-500 mt-1">Platform growth and activity overview</p>
      </div>
      <AnalyticsCharts
        userGrowth={userGrowth}
        applicationTrend={applicationTrend}
        hireTrend={hireTrend}
        roleBreakdown={roleBreakdown}
        appStatusBreakdown={appStatusBreakdown}
        stats={stats}
      />
    </div>
  )
}
