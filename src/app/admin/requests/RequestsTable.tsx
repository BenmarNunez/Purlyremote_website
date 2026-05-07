'use client'

import { useState } from 'react'
import type { HireRequestStatus } from '@/lib/supabase/types'
import type { EnrichedRequest } from './page'

interface RequestsTableProps {
  requests: EnrichedRequest[]
}

type FilterTab = 'all' | HireRequestStatus

const STATUS_BADGE: Record<HireRequestStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  accepted: 'bg-green-100 text-green-800 border-green-200',
  declined: 'bg-red-100 text-red-800 border-red-200',
  completed: 'bg-blue-100 text-blue-800 border-blue-200',
}

function StatusBadge({ status }: { status: HireRequestStatus }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-body font-medium capitalize border ${STATUS_BADGE[status]}`}
    >
      {status}
    </span>
  )
}

export default function RequestsTable({ requests }: RequestsTableProps) {
  const [activeTab, setActiveTab] = useState<FilterTab>('all')

  const TABS: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'accepted', label: 'Accepted' },
    { key: 'declined', label: 'Declined' },
    { key: 'completed', label: 'Completed' },
  ]

  const filtered =
    activeTab === 'all' ? requests : requests.filter((r) => r.status === activeTab)

  return (
    <>
      {/* Filter tabs */}
      <div className="flex gap-1 mb-4 border-b border-neutral-200 overflow-x-auto">
        {TABS.map((tab) => {
          const count =
            tab.key === 'all'
              ? requests.length
              : requests.filter((r) => r.status === tab.key).length
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={[
                'px-4 py-2.5 text-sm font-body font-medium border-b-2 -mb-px transition-colors whitespace-nowrap',
                activeTab === tab.key
                  ? 'border-[#007BFF] text-[#007BFF]'
                  : 'border-transparent text-neutral-500 hover:text-neutral-800',
              ].join(' ')}
            >
              {tab.label}
              <span className="ml-1.5 inline-flex items-center justify-center min-w-[20px] h-5 px-1 rounded-full bg-neutral-100 text-neutral-600 text-xs">
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="card px-6 py-10 text-center">
          <p className="font-body text-neutral-500 text-sm">No requests found.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-100">
                  <th className="text-left px-6 py-3 font-body font-medium text-neutral-500">Client</th>
                  <th className="text-left px-6 py-3 font-body font-medium text-neutral-500">Freelancer</th>
                  <th className="text-left px-6 py-3 font-body font-medium text-neutral-500">Service</th>
                  <th className="text-left px-6 py-3 font-body font-medium text-neutral-500">Status</th>
                  <th className="text-left px-6 py-3 font-body font-medium text-neutral-500">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-6 py-3 font-body font-medium text-neutral-800">
                      {r.client_name}
                    </td>
                    <td className="px-6 py-3 font-body text-neutral-700">{r.freelancer_name}</td>
                    <td className="px-6 py-3 font-body text-neutral-600">{r.service}</td>
                    <td className="px-6 py-3">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-6 py-3 font-body text-neutral-500">
                      {new Date(r.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  )
}
