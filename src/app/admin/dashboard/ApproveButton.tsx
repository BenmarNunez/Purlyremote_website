'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface ApproveButtonProps {
  userId: string
}

export default function ApproveButton({ userId }: ApproveButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleApprove() {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/freelancers/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      })
      if (res.ok) {
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleApprove}
      disabled={loading}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 text-green-700 text-xs font-body font-medium border border-green-200 hover:bg-green-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? 'Approving…' : 'Quick Approve'}
    </button>
  )
}
