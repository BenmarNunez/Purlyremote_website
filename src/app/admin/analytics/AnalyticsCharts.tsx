'use client'

import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'

interface Props {
  userGrowth: { month: string; count: number }[]
  applicationTrend: { month: string; count: number }[]
  hireTrend: { month: string; count: number }[]
  roleBreakdown: { name: string; value: number }[]
  appStatusBreakdown: { name: string; value: number }[]
  stats: {
    totalUsers: number
    approvedFreelancers: number
    totalClients: number
    totalApplications: number
    totalHires: number
    completedHires: number
  }
}

const COLORS = ['#007BFF', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

function StatCard({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <div className="card p-5">
      <p className="text-xs font-body text-neutral-400 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-3xl font-heading font-bold text-neutral-900">{value}</p>
      {sub && <p className="text-xs font-body text-neutral-400 mt-1">{sub}</p>}
    </div>
  )
}

function formatMonth(month: string) {
  const [year, m] = month.split('-')
  const date = new Date(parseInt(year), parseInt(m) - 1)
  return date.toLocaleString('default', { month: 'short', year: '2-digit' })
}

export default function AnalyticsCharts({ userGrowth, applicationTrend, hireTrend, roleBreakdown, appStatusBreakdown, stats }: Props) {
  const userGrowthFmt = userGrowth.map(d => ({ ...d, month: formatMonth(d.month) }))
  const appFmt = applicationTrend.map(d => ({ ...d, month: formatMonth(d.month) }))
  const hireFmt = hireTrend.map(d => ({ ...d, month: formatMonth(d.month) }))

  return (
    <div className="space-y-6">
      {/* KPI stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard label="Total Users" value={stats.totalUsers} />
        <StatCard label="Freelancers" value={stats.approvedFreelancers} sub="approved" />
        <StatCard label="Clients" value={stats.totalClients} />
        <StatCard label="Applications" value={stats.totalApplications} />
        <StatCard label="Hire Requests" value={stats.totalHires} />
        <StatCard label="Completed" value={stats.completedHires} sub="projects" />
      </div>

      {/* User growth chart */}
      <div className="card p-6">
        <h2 className="font-heading font-semibold text-neutral-800 mb-4">User Growth (Last 12 Months)</h2>
        {userGrowthFmt.length === 0 ? (
          <p className="text-sm font-body text-neutral-400 text-center py-8">No data yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={userGrowthFmt}>
              <defs>
                <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#007BFF" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#007BFF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fontFamily: 'DM Sans' }} />
              <YAxis tick={{ fontSize: 11, fontFamily: 'DM Sans' }} allowDecimals={false} />
              <Tooltip contentStyle={{ fontSize: 12, fontFamily: 'DM Sans' }} />
              <Area type="monotone" dataKey="count" stroke="#007BFF" strokeWidth={2} fill="url(#userGrad)" name="New Users" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Applications + Hires side by side */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="font-heading font-semibold text-neutral-800 mb-4">Applications (Last 12 Months)</h2>
          {appFmt.length === 0 ? (
            <p className="text-sm font-body text-neutral-400 text-center py-8">No data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={appFmt}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fontFamily: 'DM Sans' }} />
                <YAxis tick={{ fontSize: 10, fontFamily: 'DM Sans' }} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12, fontFamily: 'DM Sans' }} />
                <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Applications" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card p-6">
          <h2 className="font-heading font-semibold text-neutral-800 mb-4">Hire Requests (Last 12 Months)</h2>
          {hireFmt.length === 0 ? (
            <p className="text-sm font-body text-neutral-400 text-center py-8">No data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={hireFmt}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fontFamily: 'DM Sans' }} />
                <YAxis tick={{ fontSize: 10, fontFamily: 'DM Sans' }} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12, fontFamily: 'DM Sans' }} />
                <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} name="Hire Requests" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Pie charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="font-heading font-semibold text-neutral-800 mb-4">User Roles</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={roleBreakdown} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                {roleBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12, fontFamily: 'DM Sans' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-6">
          <h2 className="font-heading font-semibold text-neutral-800 mb-4">Application Status</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={appStatusBreakdown.filter(d => d.value > 0)} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                {appStatusBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12, fontFamily: 'DM Sans' }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
