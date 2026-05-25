'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function BillingActions({ currentPlan, hasSubscription }: { currentPlan: string; hasSubscription: boolean }) {
  const [loading, setLoading] = useState(false)

  const openPortal = async () => {
    setLoading(true)
    const res = await fetch('/api/stripe/portal', { method: 'POST' })
    const data = await res.json() as { url?: string; error?: string }
    if (data.url) window.location.href = data.url
    else setLoading(false)
  }

  return (
    <div className="card p-6">
      <h2 className="font-heading font-semibold text-neutral-800 mb-4">Manage Subscription</h2>
      <div className="flex gap-3 flex-wrap">
        {currentPlan === 'free' ? (
          <Link href="/pricing" className="btn-primary text-sm">
            Upgrade Plan
          </Link>
        ) : (
          <>
            <button onClick={openPortal} disabled={loading} className="btn-primary text-sm disabled:opacity-60">
              {loading ? 'Opening...' : 'Manage Billing'}
            </button>
            <Link href="/pricing" className="btn-outline text-sm">
              Change Plan
            </Link>
          </>
        )}
      </div>
      {hasSubscription && (
        <p className="text-xs font-body text-neutral-400 mt-3">
          Manage payment methods, download invoices, and cancel via the billing portal.
        </p>
      )}
    </div>
  )
}
