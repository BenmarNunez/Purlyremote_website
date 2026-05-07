'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { HireRequest, HireRequestStatus } from '@/lib/supabase/types'

type TabStatus = 'pending' | 'accepted' | 'completed' | 'declined'

const TABS: { label: string; status: TabStatus }[] = [
  { label: 'Pending', status: 'pending' },
  { label: 'Active', status: 'accepted' },
  { label: 'Completed', status: 'completed' },
  { label: 'Declined', status: 'declined' },
]

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max) + '…' : str
}

interface RequestCardProps {
  request: HireRequest
  onAction?: (id: string, status: 'accepted' | 'declined') => Promise<void>
}

function RequestCard({ request, onAction }: RequestCardProps) {
  const [loading, setLoading] = useState<'accepted' | 'declined' | null>(null)

  async function handleAction(status: 'accepted' | 'declined') {
    if (!onAction) return
    setLoading(status)
    await onAction(request.id, status)
    setLoading(null)
  }

  return (
    <div className="card p-5 space-y-2">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="font-body font-semibold text-neutral-800 text-sm">{request.service}</p>
          <p className="text-sm font-body text-neutral-500 mt-0.5">
            {truncate(request.description, 100)}
          </p>
          <p className="text-xs font-body text-neutral-400 mt-1">{formatDate(request.created_at)}</p>
        </div>
        {request.status === 'pending' && onAction && (
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => handleAction('accepted')}
              disabled={loading !== null}
              className="btn-primary text-xs px-3 py-1.5 disabled:opacity-60"
            >
              {loading === 'accepted' ? '…' : 'Accept'}
            </button>
            <button
              onClick={() => handleAction('declined')}
              disabled={loading !== null}
              className="btn-outline text-xs px-3 py-1.5 disabled:opacity-60"
            >
              {loading === 'declined' ? '…' : 'Decline'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function FreelancerRequestsPage() {
  const [activeTab, setActiveTab] = useState<TabStatus>('pending')
  const [requests, setRequests] = useState<HireRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  const fetchRequests = useCallback(async (uid: string) => {
    const supabase = createClient()
    const { data } = await supabase
      .from('hire_requests')
      .select('*')
      .eq('freelancer_id', uid)
      .order('created_at', { ascending: false })

    setRequests((data ?? []) as HireRequest[])
  }, [])

  useEffect(() => {
    async function init() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
      await fetchRequests(user.id)
      setLoading(false)
    }
    init()
  }, [fetchRequests])

  async function handleAction(id: string, status: 'accepted' | 'declined') {
    await fetch(`/api/hire-requests/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (userId) await fetchRequests(userId)
  }

  const filtered = requests.filter((r) => r.status === activeTab)

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <div className="section-tag mb-2">Requests</div>
        <h1 className="text-2xl font-heading font-bold text-neutral-900">Hire Requests</h1>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-neutral-200 gap-0">
        {TABS.map((tab) => {
          const count = requests.filter((r) => r.status === tab.status).length
          const isActive = activeTab === tab.status
          return (
            <button
              key={tab.status}
              onClick={() => setActiveTab(tab.status)}
              className={[
                'px-4 py-2.5 text-sm font-body font-medium transition-colors relative',
                isActive
                  ? 'border-b-2 border-[#007BFF] text-[#007BFF]'
                  : 'text-neutral-500 hover:text-neutral-800',
              ].join(' ')}
            >
              {tab.label}
              {count > 0 && (
                <span
                  className={[
                    'ml-1.5 text-xs rounded-full px-1.5 py-0.5',
                    isActive
                      ? 'bg-blue-100 text-[#007BFF]'
                      : 'bg-neutral-100 text-neutral-500',
                  ].join(' ')}
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Request list */}
      {loading ? (
        <div className="text-sm font-body text-neutral-400 py-8 text-center">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="text-sm font-body text-neutral-400 py-8 text-center">
          No {activeTab} requests.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((req) => (
            <RequestCard
              key={req.id}
              request={req}
              onAction={req.status === 'pending' ? handleAction : undefined}
            />
          ))}
        </div>
      )}
    </div>
  )
}
