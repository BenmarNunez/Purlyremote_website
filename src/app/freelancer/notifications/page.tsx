'use client'

import { useEffect, useState } from 'react'
import type { Notification } from '@/lib/supabase/types'

function formatTimestamp(isoString: string): string {
  const date = new Date(isoString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60_000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

export default function FreelancerNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [markingAll, setMarkingAll] = useState(false)

  useEffect(() => {
    async function fetchNotifications() {
      try {
        const res = await fetch('/api/notifications')
        if (!res.ok) return
        const data = (await res.json()) as Notification[]
        setNotifications(data)
      } catch {
        // silently ignore
      } finally {
        setLoading(false)
      }
    }
    fetchNotifications()
  }, [])

  async function handleMarkAllRead() {
    setMarkingAll(true)
    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true }),
      })
      if (!res.ok) return
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    } catch {
      // silently ignore
    } finally {
      setMarkingAll(false)
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="section-tag mb-2">Notifications</div>
          <h1 className="text-2xl font-heading font-bold text-neutral-900">Notifications</h1>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={markingAll}
            className="btn-outline text-sm px-4 py-2 disabled:opacity-60"
          >
            {markingAll ? 'Marking…' : 'Mark All Read'}
          </button>
        )}
      </div>

      {/* List */}
      {loading ? (
        <div className="text-sm font-body text-neutral-400 py-12 text-center">Loading…</div>
      ) : notifications.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-sm font-body text-neutral-400">No notifications yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={[
                'card p-4 transition-colors',
                !notification.read ? 'bg-blue-50 border-blue-100' : '',
              ].join(' ')}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-body font-semibold text-sm text-neutral-800">
                    {notification.title}
                  </p>
                  <p className="text-sm font-body text-neutral-500 mt-0.5 leading-snug">
                    {notification.content}
                  </p>
                  <p className="text-xs font-body text-neutral-400 mt-1">
                    {formatTimestamp(notification.created_at)}
                  </p>
                </div>
                {!notification.read && (
                  <span className="flex-shrink-0 w-2 h-2 rounded-full bg-[#007BFF] mt-1.5" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
