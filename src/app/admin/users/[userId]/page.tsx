'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface AdminLog {
  id: string
  admin_email: string
  action: string
  details: Record<string, unknown> | null
  created_at: string
}

interface HireRow {
  id: string
  service: string
  status: string
  created_at: string
  client_id: string
  freelancer_id: string
}

interface ActivityData {
  logs: AdminLog[]
  hires: HireRow[]
  messageCount: number
}

const ACTION_LABEL: Record<string, string> = {
  user_role_changed: 'Role Changed',
  user_suspended: 'Suspended',
  user_unsuspended: 'Unsuspended',
  user_banned: 'Banned',
  user_notes_updated: 'Notes Updated',
}

const HIRE_STATUS_COLOR: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  accepted: 'bg-green-100 text-green-800',
  declined: 'bg-red-100 text-red-800',
  completed: 'bg-blue-100 text-blue-800',
}

export default function UserDetailPage() {
  const { userId } = useParams<{ userId: string }>()
  const router = useRouter()
  const [activity, setActivity] = useState<ActivityData | null>(null)
  const [loading, setLoading] = useState(true)
  const [notes, setNotes] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)
  const [notesSaved, setNotesSaved] = useState(false)

  useEffect(() => {
    fetch(`/api/admin/users/${userId}/activity`)
      .then(r => r.json())
      .then((data: ActivityData) => { setActivity(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [userId])

  const saveNotes = async () => {
    setSavingNotes(true)
    await fetch(`/api/admin/users/${userId}/notes`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes }),
    })
    setSavingNotes(false)
    setNotesSaved(true)
    setTimeout(() => setNotesSaved(false), 2000)
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-neutral-400 hover:text-neutral-600 transition-colors">
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <div>
          <div className="section-tag mb-1">User Profile</div>
          <h1 className="text-2xl font-heading font-bold text-neutral-900">Activity Timeline</h1>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-neutral-400 font-body">Loading...</div>
      ) : !activity ? (
        <div className="card p-12 text-center">
          <p className="font-body text-neutral-500">Failed to load activity.</p>
          <Link href="/admin/users" className="text-[#007BFF] text-sm hover:underline mt-2 inline-block">Back to Users</Link>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Stats + Notes */}
          <div className="space-y-4">
            <div className="card p-5">
              <h2 className="font-heading font-semibold text-neutral-800 mb-4">Quick Stats</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm font-body text-neutral-500">Admin Actions</span>
                  <span className="font-body font-semibold text-neutral-800">{activity.logs.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-body text-neutral-500">Hire Requests</span>
                  <span className="font-body font-semibold text-neutral-800">{activity.hires.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-body text-neutral-500">Messages</span>
                  <span className="font-body font-semibold text-neutral-800">{activity.messageCount}</span>
                </div>
              </div>
            </div>

            <div className="card p-5">
              <h2 className="font-heading font-semibold text-neutral-800 mb-3">Admin Notes</h2>
              <textarea
                className="form-input w-full text-sm min-h-[100px] resize-none"
                placeholder="Private notes — only admins can see this..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
              <button
                onClick={saveNotes}
                disabled={savingNotes}
                className="mt-2 w-full btn-outline text-sm disabled:opacity-50"
              >
                {notesSaved ? '✓ Saved' : savingNotes ? 'Saving...' : 'Save Notes'}
              </button>
            </div>
          </div>

          {/* Right: Activity timeline */}
          <div className="lg:col-span-2 space-y-4">
            {/* Hire requests */}
            {activity.hires.length > 0 && (
              <div className="card p-5">
                <h2 className="font-heading font-semibold text-neutral-800 mb-4">Hire Requests</h2>
                <div className="space-y-2">
                  {activity.hires.map(h => (
                    <div key={h.id} className="flex items-center justify-between py-2 border-b border-neutral-100 last:border-0">
                      <div>
                        <p className="font-body font-medium text-sm text-neutral-800">{h.service}</p>
                        <p className="text-xs font-body text-neutral-400">{new Date(h.created_at).toLocaleDateString()}</p>
                      </div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-body font-medium capitalize ${HIRE_STATUS_COLOR[h.status] ?? 'bg-neutral-100 text-neutral-600'}`}>
                        {h.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Admin action logs */}
            <div className="card p-5">
              <h2 className="font-heading font-semibold text-neutral-800 mb-4">Admin Action History</h2>
              {activity.logs.length === 0 ? (
                <p className="text-sm font-body text-neutral-400 text-center py-6">No admin actions recorded for this user.</p>
              ) : (
                <div className="space-y-3">
                  {activity.logs.map(log => (
                    <div key={log.id} className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-[#007BFF] mt-1.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <p className="font-body font-medium text-sm text-neutral-800">
                            {ACTION_LABEL[log.action] ?? log.action}
                          </p>
                          <p className="text-xs font-body text-neutral-400 whitespace-nowrap">
                            {new Date(log.created_at).toLocaleString()}
                          </p>
                        </div>
                        <p className="text-xs font-body text-neutral-500 mt-0.5">by {log.admin_email}</p>
                        {log.details && Object.keys(log.details).length > 0 && (
                          <p className="text-xs font-body text-neutral-400 mt-0.5 font-mono">
                            {JSON.stringify(log.details)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
