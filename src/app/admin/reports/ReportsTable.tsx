'use client'

import { useEffect, useState } from 'react'

interface Report {
  id: string
  reporter_id: string
  target_type: string
  target_id: string
  reason: string
  details: string | null
  status: 'open' | 'reviewing' | 'resolved' | 'dismissed'
  resolved_by: string | null
  resolved_at: string | null
  created_at: string
}

const STATUS_BADGE: Record<Report['status'], string> = {
  open: 'bg-amber-100 text-amber-800 border-amber-200',
  reviewing: 'bg-blue-100 text-blue-800 border-blue-200',
  resolved: 'bg-green-100 text-green-800 border-green-200',
  dismissed: 'bg-neutral-100 text-neutral-700 border-neutral-200',
}

export default function ReportsTable() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | Report['status']>('all')
  const [actionId, setActionId] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    const url = filter === 'all' ? '/api/admin/reports' : `/api/admin/reports?status=${filter}`
    const res = await fetch(url)
    const json = await res.json() as { reports?: Report[]; error?: string }
    if (!res.ok) setError(json.error ?? 'Failed to load.')
    else setReports(json.reports ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [filter])

  async function setStatus(id: string, status: Report['status']) {
    setActionId(id)
    const res = await fetch(`/api/admin/reports/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    const json = await res.json() as { error?: string }
    if (!res.ok) setError(json.error ?? 'Update failed.')
    else setReports(prev => prev.map(r => r.id === id ? { ...r, status } : r))
    setActionId(null)
  }

  const tabs: ('all' | Report['status'])[] = ['all', 'open', 'reviewing', 'resolved', 'dismissed']

  return (
    <>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
      )}

      <div className="flex gap-1 border-b border-neutral-200 mb-6">
        {tabs.map(t => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`px-4 py-2.5 text-sm font-body font-medium border-b-2 transition-colors capitalize ${
              filter === t ? 'border-[#007BFF] text-[#007BFF]' : 'border-transparent text-neutral-500 hover:text-neutral-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="card p-12 text-center font-body text-neutral-500 text-sm">Loading…</div>
      ) : reports.length === 0 ? (
        <div className="card p-12 text-center font-body text-neutral-500 text-sm">No reports.</div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-100">
                  {['When', 'Target', 'Reason', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-body font-medium text-neutral-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {reports.map(r => (
                  <tr key={r.id} className="hover:bg-neutral-50 align-top">
                    <td className="px-4 py-3 text-xs font-body text-neutral-400 whitespace-nowrap">
                      {new Date(r.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-xs font-body text-neutral-700">
                      <div className="capitalize">{r.target_type.replace('_', ' ')}</div>
                      <div className="text-neutral-400">{r.target_id.slice(0, 8)}</div>
                    </td>
                    <td className="px-4 py-3 font-body text-neutral-800 text-sm max-w-md">
                      <div className="font-medium">{r.reason}</div>
                      {r.details && <div className="text-xs text-neutral-500 mt-1">{r.details}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-body font-medium border capitalize ${STATUS_BADGE[r.status]}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5 flex-wrap">
                        {r.status === 'open' && (
                          <button
                            onClick={() => setStatus(r.id, 'reviewing')}
                            disabled={actionId === r.id}
                            className="text-xs px-2 py-1 rounded border border-blue-200 text-blue-600 hover:bg-blue-50 disabled:opacity-50"
                          >
                            Start Review
                          </button>
                        )}
                        {(r.status === 'open' || r.status === 'reviewing') && (
                          <>
                            <button
                              onClick={() => setStatus(r.id, 'resolved')}
                              disabled={actionId === r.id}
                              className="text-xs px-2 py-1 rounded border border-green-200 text-green-700 hover:bg-green-50 disabled:opacity-50"
                            >
                              Resolve
                            </button>
                            <button
                              onClick={() => setStatus(r.id, 'dismissed')}
                              disabled={actionId === r.id}
                              className="text-xs px-2 py-1 rounded border border-neutral-300 text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
                            >
                              Dismiss
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  )
}
