'use client'

import { useCallback, useEffect, useState } from 'react'
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

export default function ClientNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [marking, setMarking] = useState(false)

  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/notifications')
      if (!res.ok) return
      const data = (await res.json()) as Notification[]
      setNotifications(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  async function handleMarkAllRead() {
    setMarking(true)
    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true }),
      })
      if (!res.ok) return
      await fetchNotifications()
    } finally {
      setMarking(false)
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="section-tag mb-2">Inbox</p>
          <h1 className="text-2xl font-heading font-bold text-neutral-900">Notifications</h1>
        </div>

        {unreadCount > 0 && (
          <button
            className="btn-outline text-sm"
            onClick={handleMarkAllRead}
            disabled={marking}
          >
            {marking ? 'Marking…' : 'Mark All Read'}
          </button>
        )}
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="divide-y divide-neutral-100">
            {[1, 2, 3].map((i) => (
              <div key={i} className="px-6 py-4 animate-pulse space-y-2">
                <div className="h-4 bg-neutral-200 rounded w-1/3" />
                <div className="h-3 bg-neutral-200 rounded w-2/3" />
                <div className="h-3 bg-neutral-200 rounded w-1/4" />
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="font-body text-neutral-500 text-sm">No notifications yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`px-6 py-4 transition-colors ${
                  !notification.read ? 'bg-blue-50' : 'bg-white hover:bg-neutral-50'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-body font-medium text-sm text-neutral-800 leading-snug">
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
    </div>
  )
}
