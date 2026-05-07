'use client'

import { useEffect, useRef, useState } from 'react'
import { Bell } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Notification } from '@/lib/supabase/types'

interface NotificationBellProps {
  userId: string
}

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

export default function NotificationBell({ userId }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Fetch notifications on mount
  useEffect(() => {
    async function fetchNotifications() {
      try {
        const res = await fetch('/api/notifications')
        if (!res.ok) return
        const data: Notification[] = await res.json()
        setNotifications(data)
        setUnreadCount(data.filter((n) => !n.read).length)
      } catch {
        // silently ignore fetch errors
      } finally {
        setLoading(false)
      }
    }

    fetchNotifications()
  }, [])

  // Supabase realtime subscription
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification
          setNotifications((prev) => [newNotification, ...prev])
          setUnreadCount((prev) => prev + 1)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  async function handleMarkAllRead() {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true }),
      })
      if (!res.ok) return

      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch {
      // silently ignore errors
    }
  }

  const recentNotifications = notifications.slice(0, 5)

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="relative p-2 rounded-lg text-neutral-600 hover:bg-blue-50 hover:text-[#007BFF] transition-colors"
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Bell size={20} />

        {/* Unread badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-body font-bold leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-neutral-200 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
            <h3 className="font-heading font-semibold text-sm text-neutral-800">Notifications</h3>
            {unreadCount > 0 && (
              <span className="text-xs font-body text-neutral-500">{unreadCount} unread</span>
            )}
          </div>

          {/* Notification list */}
          <div className="max-h-72 overflow-y-auto divide-y divide-neutral-100">
            {loading ? (
              <div className="px-4 py-6 text-center text-sm font-body text-neutral-400">
                Loading…
              </div>
            ) : recentNotifications.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm font-body text-neutral-400">
                No notifications yet
              </div>
            ) : (
              recentNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={[
                    'px-4 py-3 transition-colors',
                    !notification.read ? 'bg-blue-50' : 'bg-white hover:bg-neutral-50',
                  ].join(' ')}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-body font-medium text-sm text-neutral-800 leading-snug">
                      {notification.title}
                    </p>
                    {!notification.read && (
                      <span className="flex-shrink-0 w-2 h-2 rounded-full bg-[#007BFF] mt-1" />
                    )}
                  </div>
                  <p className="text-sm font-body text-neutral-500 mt-0.5 leading-snug line-clamp-2">
                    {notification.content}
                  </p>
                  <p className="text-xs font-body text-neutral-400 mt-1">
                    {formatTimestamp(notification.created_at)}
                  </p>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {!loading && notifications.length > 0 && (
            <div className="px-4 py-3 border-t border-neutral-100 bg-neutral-50">
              <button
                onClick={handleMarkAllRead}
                disabled={unreadCount === 0}
                className={[
                  'w-full text-xs font-body font-medium py-1.5 rounded-lg transition-colors',
                  unreadCount > 0
                    ? 'text-[#007BFF] hover:bg-blue-50'
                    : 'text-neutral-400 cursor-default',
                ].join(' ')}
              >
                Mark all as read
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
