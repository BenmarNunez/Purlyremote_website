'use client'

import { useEffect, useState } from 'react'

interface ApplicationRow {
  id: string
  full_name: string
  email: string
  expertise_area: string
  years_experience: string
  preferred_role: string | null
  portfolio_url: string | null
  availability_status: string
  additional_notes: string | null
  status: 'pending' | 'approved' | 'rejected'
  admin_notes: string | null
  created_at: string
}

type Tab = 'all' | 'pending' | 'approved' | 'rejected'

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  approved: 'bg-green-100 text-green-800 border-green-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
}

const STATUS_DOT: Record<string, string> = {
  pending: 'bg-yellow-400',
  approved: 'bg-green-500',
  rejected: 'bg-red-500',
}

function Initials({ name }: { name: string }) {
  const init = name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)
  return (
    <div className="w-10 h-10 rounded-full bg-[#007BFF] flex items-center justify-center flex-shrink-0">
      <span className="text-white text-sm font-heading font-semibold">{init}</span>
    </div>
  )
}

interface DetailModalProps {
  app: ApplicationRow
  onClose: () => void
  onApprove: (id: string) => void
  onReject: (id: string, notes: string) => void
  loading: boolean
}

function DetailModal({ app, onClose, onApprove, onReject, loading }: DetailModalProps) {
  const [showReject, setShowReject] = useState(false)
  const [rejectNotes, setRejectNotes] = useState('')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-100">
          <div className="flex items-center gap-3">
            <Initials name={app.full_name} />
            <div>
              <h2 className="font-heading font-bold text-neutral-900 text-lg">{app.full_name}</h2>
              <p className="text-sm font-body text-neutral-500">{app.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-body font-medium border capitalize ${STATUS_BADGE[app.status]}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[app.status]}`} />
              {app.status}
            </span>
            <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600 transition-colors p-1">
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
        </div>

        {/* Application details */}
        <div className="px-6 py-5 space-y-5">
          {/* Primary info grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-neutral-50 rounded-xl">
              <p className="text-xs font-body font-medium text-neutral-400 uppercase tracking-wide mb-1">Primary Expertise</p>
              <p className="font-body font-semibold text-neutral-800">{app.expertise_area}</p>
            </div>
            <div className="p-4 bg-neutral-50 rounded-xl">
              <p className="text-xs font-body font-medium text-neutral-400 uppercase tracking-wide mb-1">Years of Experience</p>
              <p className="font-body font-semibold text-neutral-800">{app.years_experience}</p>
            </div>
            <div className="p-4 bg-neutral-50 rounded-xl">
              <p className="text-xs font-body font-medium text-neutral-400 uppercase tracking-wide mb-1">Preferred Role</p>
              <p className="font-body font-semibold text-neutral-800">{app.preferred_role || '—'}</p>
            </div>
            <div className="p-4 bg-neutral-50 rounded-xl">
              <p className="text-xs font-body font-medium text-neutral-400 uppercase tracking-wide mb-1">Availability</p>
              <p className="font-body font-semibold text-neutral-800">{app.availability_status}</p>
            </div>
          </div>

          {/* Portfolio */}
          <div className="p-4 bg-neutral-50 rounded-xl">
            <p className="text-xs font-body font-medium text-neutral-400 uppercase tracking-wide mb-1">Portfolio / LinkedIn / GitHub</p>
            {app.portfolio_url ? (
              <a href={app.portfolio_url} target="_blank" rel="noopener noreferrer"
                className="font-body text-[#007BFF] hover:underline break-all text-sm">
                {app.portfolio_url}
              </a>
            ) : (
              <p className="font-body text-neutral-500 text-sm">Not provided</p>
            )}
          </div>

          {/* Additional notes */}
          {app.additional_notes && (
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
              <p className="text-xs font-body font-medium text-blue-600 uppercase tracking-wide mb-2">Additional Notes from Applicant</p>
              <p className="font-body text-neutral-700 text-sm leading-relaxed">{app.additional_notes}</p>
            </div>
          )}

          {/* Admin notes (if rejected) */}
          {app.admin_notes && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
              <p className="text-xs font-body font-medium text-red-600 uppercase tracking-wide mb-2">Admin Rejection Notes</p>
              <p className="font-body text-neutral-700 text-sm leading-relaxed">{app.admin_notes}</p>
            </div>
          )}

          {/* Applied date */}
          <p className="text-xs font-body text-neutral-400">
            Applied on {new Date(app.created_at).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Actions */}
        {app.status === 'pending' && (
          <div className="px-6 pb-6">
            {!showReject ? (
              <div className="flex gap-3">
                <button
                  onClick={() => { if (window.confirm(`Approve ${app.full_name}? This will create their account and email them a setup link.`)) onApprove(app.id) }}
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-lg bg-green-600 text-white font-body font-semibold text-sm hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Processing...' : '✓ Approve Application'}
                </button>
                <button
                  onClick={() => setShowReject(true)}
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-lg border border-red-200 text-red-600 font-body font-semibold text-sm hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  ✕ Reject
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm font-body font-medium text-neutral-700">Rejection reason <span className="text-neutral-400 font-normal">(sent to applicant via email)</span></p>
                <textarea
                  className="form-input w-full text-sm min-h-[80px] resize-none"
                  placeholder="e.g. We need more experience in customer support roles. Please reapply after 6 months."
                  value={rejectNotes}
                  onChange={e => setRejectNotes(e.target.value)}
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => onReject(app.id, rejectNotes)}
                    disabled={loading}
                    className="flex-1 py-2.5 rounded-lg bg-red-600 text-white font-body font-semibold text-sm hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Sending...' : 'Confirm Rejection'}
                  </button>
                  <button
                    onClick={() => { setShowReject(false); setRejectNotes('') }}
                    className="px-6 py-2.5 rounded-lg border border-neutral-200 text-neutral-600 font-body text-sm hover:bg-neutral-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<ApplicationRow[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('pending')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [viewing, setViewing] = useState<ApplicationRow | null>(null)

  useEffect(() => {
    fetch('/api/admin/applications')
      .then(r => r.json())
      .then((data: { applications?: ApplicationRow[]; error?: string }) => {
        if (data.applications) setApplications(data.applications)
        else setError(data.error ?? 'Failed to load.')
      })
      .catch(() => setError('Failed to load applications.'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = tab === 'all' ? applications : applications.filter(a => a.status === tab)
  const count = (s: Tab) => s === 'all' ? applications.length : applications.filter(a => a.status === s).length

  const doAction = async (id: string, action: 'approve' | 'reject', notes?: string) => {
    setActionLoading(id)
    setError(null)
    const res = await fetch(`/api/admin/applications/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, notes }),
    })
    const json = await res.json() as { error?: string }
    if (!res.ok) {
      setError(json.error ?? 'Action failed.')
      setActionLoading(null)
      return
    }
    setApplications(prev => prev.map(a =>
      a.id === id
        ? { ...a, status: action === 'approve' ? 'approved' : 'rejected', admin_notes: notes ?? null }
        : a
    ))
    setViewing(prev => prev?.id === id
      ? { ...prev, status: action === 'approve' ? 'approved' : 'rejected', admin_notes: notes ?? null }
      : prev
    )
    setActionLoading(null)
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'pending', label: 'Pending' },
    { key: 'approved', label: 'Approved' },
    { key: 'rejected', label: 'Rejected' },
    { key: 'all', label: 'All' },
  ]

  return (
    <div>
      <div className="mb-6">
        <div className="section-tag mb-2">Management</div>
        <h1 className="text-2xl font-heading font-bold text-neutral-900">Freelancer Applications</h1>
        <p className="text-sm font-body text-neutral-500 mt-1">Applications submitted via the Apply as Freelancer form</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-neutral-200 mb-6">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-body font-medium border-b-2 transition-colors ${
              tab === t.key ? 'border-[#007BFF] text-[#007BFF]' : 'border-transparent text-neutral-500 hover:text-neutral-700'
            }`}
          >
            {t.label}
            <span className={`ml-2 inline-flex items-center justify-center min-w-[20px] h-5 px-1 rounded-full text-xs font-medium ${
              t.key === 'pending' && count('pending') > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-neutral-100 text-neutral-600'
            }`}>
              {count(t.key)}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-neutral-400 font-body">Loading applications...</div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-2xl mb-2">📋</p>
          <p className="font-body text-neutral-500 text-sm">No {tab === 'all' ? '' : tab} applications yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(app => (
            <div key={app.id}
              className="card p-5 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setViewing(app)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <Initials name={app.full_name} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-heading font-semibold text-neutral-900">{app.full_name}</p>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-body font-medium border capitalize ${STATUS_BADGE[app.status]}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[app.status]}`} />
                        {app.status}
                      </span>
                    </div>
                    <p className="text-sm font-body text-neutral-500 mt-0.5">{app.email}</p>
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      <span className="inline-flex items-center gap-1 text-xs font-body text-neutral-600 bg-neutral-100 px-2.5 py-1 rounded-full">
                        💼 {app.expertise_area}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-body text-neutral-600 bg-neutral-100 px-2.5 py-1 rounded-full">
                        📅 {app.years_experience} experience
                      </span>
                      {app.preferred_role && (
                        <span className="inline-flex items-center gap-1 text-xs font-body text-neutral-600 bg-neutral-100 px-2.5 py-1 rounded-full">
                          🎯 {app.preferred_role}
                        </span>
                      )}
                      <span className="text-xs font-body text-neutral-400">
                        {new Date(app.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {app.additional_notes && (
                      <p className="text-xs font-body text-neutral-400 mt-2 line-clamp-1 italic">
                        &ldquo;{app.additional_notes}&rdquo;
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => setViewing(app)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 font-body font-medium transition-colors"
                  >
                    View Details
                  </button>
                  {app.status === 'pending' && (
                    <>
                      <button
                        onClick={() => { if (window.confirm(`Approve ${app.full_name}?`)) doAction(app.id, 'approve') }}
                        disabled={actionLoading === app.id}
                        className="text-xs px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 font-body font-medium transition-colors disabled:opacity-50"
                      >
                        {actionLoading === app.id ? '...' : 'Approve'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail modal */}
      {viewing && (
        <DetailModal
          app={viewing}
          onClose={() => setViewing(null)}
          onApprove={(id) => doAction(id, 'approve')}
          onReject={(id, notes) => doAction(id, 'reject', notes)}
          loading={actionLoading === viewing.id}
        />
      )}
    </div>
  )
}
