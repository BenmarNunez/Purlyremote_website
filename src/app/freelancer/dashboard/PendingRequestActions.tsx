'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface PendingRequestActionsProps {
  requestId: string
}

export default function PendingRequestActions({ requestId }: PendingRequestActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<'accepted' | 'declined' | null>(null)

  async function handleAction(status: 'accepted' | 'declined') {
    setLoading(status)
    try {
      await fetch(`/api/hire-requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      router.refresh()
    } catch {
      // silently ignore
    } finally {
      setLoading(null)
    }
  }

  return (
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
  )
}
