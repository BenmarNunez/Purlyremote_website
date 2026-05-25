'use client'

import { useEffect, useState } from 'react'

interface EmailLog {
  id: string
  to_email: string
  subject: string
  type: string
  status: 'sent' | 'failed'
  error_message: string | null
  created_at: string
}

const TYPE_LABEL: Record<string, string> = {
  application_notification: 'Application Notification',
  application_approved: 'Application Approved',
  application_rejected: 'Application Rejected',
  freelancer_approved: 'Freelancer Approved',
  freelancer_rejected: 'Freelancer Rejected',
}

export default function EmailLogsPage() {
  const [emails, setEmails] = useState<EmailLog[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [offset, setOffset] = useState(0)

  const fetchEmails = async (reset = false) => {
    setLoading(true)
    const newOffset = reset ? 0 : offset
    const params = new URLSearchParams({ limit: '50', offset: String(newOffset) })
    if (statusFilter) params.set('status', statusFilter)
    const res = await fetch(`/api/admin/emails?${params}`)
    const data = await res.json() as { emails: EmailLog[]; total: number }
    if (reset) { setEmails(data.emails); setOffset(50) }
    else { setEmails(prev => [...prev, ...data.emails]); setOffset(newOffset + 50) }
    setTotal(data.total)
    setLoading(false)
  }

  useEffect(() => { fetchEmails(true) }, [statusFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  const sentCount = emails.filter(e => e.status === 'sent').length
  const failedCount = emails.filter(e => e.status === 'failed').length

  return (
    <div>
      <div className="mb-6">
        <div className="section-tag mb-2">Monitoring</div>
        <h1 className="text-2xl font-heading font-bold text-neutral-900">Email Logs</h1>
        <p className="text-sm font-body text-neutral-500 mt-1">Track all emails sent by the platform</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card p-4">
          <p className="text-xs font-body text-neutral-400 mb-1">Total</p>
          <p className="text-2xl font-heading font-bold text-neutral-900">{total}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-body text-neutral-400 mb-1">Sent</p>
          <p className="text-2xl font-heading font-bold text-green-600">{sentCount}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-body text-neutral-400 mb-1">Failed</p>
          <p className="text-2xl font-heading font-bold text-red-600">{failedCount}</p>
        </div>
      </div>

      <div className="flex gap-3 mb-4">
        <select className="form-input text-sm max-w-xs" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="sent">Sent</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {loading && emails.length === 0 ? (
        <div className="text-center py-16 text-neutral-400 font-body">Loading...</div>
      ) : emails.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-2xl mb-2">📧</p>
          <p className="font-body text-neutral-500 text-sm">No email logs yet.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-100">
                  {['To', 'Subject', 'Type', 'Status', 'Date'].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-body font-medium text-neutral-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {emails.map(e => (
                  <tr key={e.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-4 py-3 font-body text-neutral-700 text-xs">{e.to_email}</td>
                    <td className="px-4 py-3 font-body text-neutral-600 text-xs max-w-[200px] truncate">{e.subject}</td>
                    <td className="px-4 py-3 font-body text-neutral-500 text-xs">{TYPE_LABEL[e.type] ?? e.type}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-body font-medium ${
                        e.status === 'sent' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {e.status}
                      </span>
                      {e.error_message && (
                        <p className="text-xs text-red-500 mt-0.5 max-w-[150px] truncate">{e.error_message}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 font-body text-neutral-400 text-xs whitespace-nowrap">
                      {new Date(e.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {emails.length < total && (
            <div className="px-4 py-3 border-t border-neutral-100 text-center">
              <button onClick={() => fetchEmails(false)} disabled={loading} className="btn-outline text-sm disabled:opacity-50">
                {loading ? 'Loading...' : `Load more (${total - emails.length} remaining)`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
