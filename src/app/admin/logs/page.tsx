'use client'

import { useEffect, useState } from 'react'

interface AdminLog {
  id: string
  admin_email: string
  action: string
  target_type: string | null
  target_id: string | null
  details: Record<string, unknown> | null
  ip_address: string | null
  created_at: string
}

const ACTION_LABEL: Record<string, string> = {
  freelancer_approved: 'Freelancer Approved',
  freelancer_rejected: 'Freelancer Rejected',
  application_approved: 'Application Approved',
  application_rejected: 'Application Rejected',
  application_status_changed: 'Status Changed',
  user_role_changed: 'Role Changed',
  user_suspended: 'User Suspended',
  user_unsuspended: 'User Unsuspended',
  user_banned: 'User Banned',
}

const ACTION_COLOR: Record<string, string> = {
  freelancer_approved: 'bg-green-100 text-green-800',
  application_approved: 'bg-green-100 text-green-800',
  user_unsuspended: 'bg-green-100 text-green-800',
  freelancer_rejected: 'bg-red-100 text-red-800',
  application_rejected: 'bg-red-100 text-red-800',
  user_banned: 'bg-red-100 text-red-800',
  user_suspended: 'bg-orange-100 text-orange-800',
  application_status_changed: 'bg-blue-100 text-blue-800',
  user_role_changed: 'bg-purple-100 text-purple-800',
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AdminLog[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [offset, setOffset] = useState(0)
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('')

  const fetchLogs = async (reset = false) => {
    setLoading(true)
    const newOffset = reset ? 0 : offset
    const params = new URLSearchParams({ limit: '50', offset: String(newOffset) })
    if (search) params.set('search', search)
    if (actionFilter) params.set('action', actionFilter)
    const res = await fetch(`/api/admin/logs?${params}`)
    const data = await res.json() as { logs: AdminLog[]; total: number }
    if (reset) {
      setLogs(data.logs)
      setOffset(50)
    } else {
      setLogs(prev => [...prev, ...data.logs])
      setOffset(newOffset + 50)
    }
    setTotal(data.total)
    setLoading(false)
  }

  useEffect(() => { fetchLogs(true) }, [search, actionFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <div className="mb-6">
        <div className="section-tag mb-2">Security</div>
        <h1 className="text-2xl font-heading font-bold text-neutral-900">Audit Logs</h1>
        <p className="text-sm font-body text-neutral-500 mt-1">All admin actions are recorded here</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <input
          type="text"
          placeholder="Search by admin email..."
          className="form-input max-w-xs text-sm"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          className="form-input max-w-xs text-sm"
          value={actionFilter}
          onChange={e => setActionFilter(e.target.value)}
        >
          <option value="">All Actions</option>
          {Object.entries(ACTION_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <span className="text-sm font-body text-neutral-400 self-center">{total} total</span>
      </div>

      {loading && logs.length === 0 ? (
        <div className="text-center py-16 text-neutral-400 font-body">Loading...</div>
      ) : logs.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-2xl mb-2">🔍</p>
          <p className="font-body text-neutral-500 text-sm">No audit logs yet.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-100">
                  {['Admin', 'Action', 'Target', 'Details', 'Date'].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-body font-medium text-neutral-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-4 py-3 font-body text-neutral-700 text-xs">{log.admin_email}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-body font-medium ${ACTION_COLOR[log.action] ?? 'bg-neutral-100 text-neutral-700'}`}>
                        {ACTION_LABEL[log.action] ?? log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-body text-neutral-500 text-xs">
                      {log.target_type && <span>{log.target_type}</span>}
                      {log.target_id && <span className="text-neutral-400 ml-1 font-mono">{log.target_id.slice(0, 8)}…</span>}
                    </td>
                    <td className="px-4 py-3 font-body text-neutral-400 text-xs max-w-[200px] truncate">
                      {log.details ? JSON.stringify(log.details) : '—'}
                    </td>
                    <td className="px-4 py-3 font-body text-neutral-400 text-xs whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {logs.length < total && (
            <div className="px-4 py-3 border-t border-neutral-100 text-center">
              <button onClick={() => fetchLogs(false)} disabled={loading} className="btn-outline text-sm disabled:opacity-50">
                {loading ? 'Loading...' : `Load more (${total - logs.length} remaining)`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
