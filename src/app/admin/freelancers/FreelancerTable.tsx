'use client'

import { useState } from 'react'
import type { FreelancerProfile, ApprovalStatus } from '@/lib/supabase/types'

interface FreelancerTableProps {
  freelancers: FreelancerProfile[]
}

type FilterTab = 'all' | ApprovalStatus

const STATUS_BADGE: Record<ApprovalStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  approved: 'bg-green-100 text-green-800 border-green-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
}

function StatusBadge({ status }: { status: ApprovalStatus }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-body font-medium capitalize border ${STATUS_BADGE[status]}`}
    >
      {status}
    </span>
  )
}

function FreelancerInitials({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
  return (
    <div className="w-9 h-9 rounded-full bg-[#007BFF]/10 flex items-center justify-center flex-shrink-0">
      <span className="text-[#007BFF] text-sm font-heading font-semibold">{initials}</span>
    </div>
  )
}

interface RejectPanelProps {
  freelancer: FreelancerProfile
  onCancel: () => void
  onConfirm: (notes: string) => void
  loading: boolean
}

function RejectPanel({ freelancer, onCancel, onConfirm, loading }: RejectPanelProps) {
  const [notes, setNotes] = useState('')
  return (
    <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
      <p className="text-xs font-body font-medium text-red-700 mb-2">
        Rejection notes for {freelancer.full_name} (optional):
      </p>
      <textarea
        className="form-input text-sm w-full resize-none"
        rows={2}
        placeholder="Explain the reason for rejection..."
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
      <div className="flex gap-2 mt-2">
        <button
          onClick={() => onConfirm(notes)}
          disabled={loading}
          className="inline-flex items-center px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-body font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
        >
          {loading ? 'Rejecting…' : 'Confirm Reject'}
        </button>
        <button
          onClick={onCancel}
          className="inline-flex items-center px-3 py-1.5 rounded-lg border border-neutral-200 text-neutral-600 text-xs font-body font-medium hover:bg-neutral-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

interface ProfileModalProps {
  freelancer: FreelancerProfile
  onClose: () => void
}

function ProfileModal({ freelancer, onClose }: ProfileModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <h2 className="font-heading font-semibold text-neutral-900">{freelancer.full_name}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
            aria-label="Close modal"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M13.5 4.5l-9 9M4.5 4.5l9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Modal body */}
        <div className="px-6 py-5 space-y-4">
          {/* Avatar + status */}
          <div className="flex items-center gap-4">
            {freelancer.avatar_url ? (
              <img
                src={freelancer.avatar_url}
                alt={freelancer.full_name}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-[#007BFF]/10 flex items-center justify-center">
                <span className="text-[#007BFF] text-xl font-heading font-semibold">
                  {freelancer.full_name
                    .split(' ')
                    .map((p) => p[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)}
                </span>
              </div>
            )}
            <div>
              <p className="font-body font-semibold text-neutral-900">{freelancer.full_name}</p>
              <div className="mt-1">
                <StatusBadge status={freelancer.approval_status} />
              </div>
            </div>
          </div>

          {/* Bio */}
          {freelancer.bio && (
            <div>
              <p className="text-xs font-body font-medium text-neutral-500 uppercase tracking-wide mb-1">Bio</p>
              <p className="text-sm font-body text-neutral-700">{freelancer.bio}</p>
            </div>
          )}

          {/* Skills */}
          {freelancer.skills.length > 0 && (
            <div>
              <p className="text-xs font-body font-medium text-neutral-500 uppercase tracking-wide mb-2">Skills</p>
              <div className="flex flex-wrap gap-1.5">
                {freelancer.skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-body bg-blue-50 text-[#007BFF] border border-blue-100"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Services */}
          {freelancer.services.length > 0 && (
            <div>
              <p className="text-xs font-body font-medium text-neutral-500 uppercase tracking-wide mb-2">Services</p>
              <div className="flex flex-wrap gap-1.5">
                {freelancer.services.map((svc) => (
                  <span
                    key={svc}
                    className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-body bg-neutral-100 text-neutral-700 border border-neutral-200"
                  >
                    {svc}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs font-body text-neutral-500">Hourly Rate</p>
              <p className="font-body font-medium text-neutral-800">
                {freelancer.hourly_rate != null ? `$${freelancer.hourly_rate}/hr` : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs font-body text-neutral-500">Availability</p>
              <p className={`font-body font-medium ${freelancer.availability ? 'text-green-600' : 'text-neutral-500'}`}>
                {freelancer.availability ? 'Available' : 'Unavailable'}
              </p>
            </div>
            <div>
              <p className="text-xs font-body text-neutral-500">Portfolio</p>
              {freelancer.portfolio_url ? (
                <a
                  href={freelancer.portfolio_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-body font-medium text-[#007BFF] hover:underline truncate block"
                >
                  View Portfolio
                </a>
              ) : (
                <p className="font-body text-neutral-500">—</p>
              )}
            </div>
            <div>
              <p className="text-xs font-body text-neutral-500">Joined</p>
              <p className="font-body font-medium text-neutral-800">
                {new Date(freelancer.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Approval notes */}
          {freelancer.approval_notes && (
            <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
              <p className="text-xs font-body font-medium text-neutral-500 uppercase tracking-wide mb-1">Notes</p>
              <p className="text-sm font-body text-neutral-700">{freelancer.approval_notes}</p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-neutral-100 flex justify-end">
          <button onClick={onClose} className="btn-outline text-sm">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default function FreelancerTable({ freelancers }: FreelancerTableProps) {
  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [viewingProfile, setViewingProfile] = useState<FreelancerProfile | null>(null)

  const TABS: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'approved', label: 'Approved' },
    { key: 'rejected', label: 'Rejected' },
  ]

  const filtered =
    activeTab === 'all'
      ? freelancers
      : freelancers.filter((f) => f.approval_status === activeTab)

  async function handleApprove(userId: string) {
    setActionLoading(userId + '-approve')
    try {
      const res = await fetch(`/api/admin/freelancers/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      })
      if (res.ok) window.location.reload()
    } finally {
      setActionLoading(null)
    }
  }

  async function handleReject(userId: string, notes: string) {
    setActionLoading(userId + '-reject')
    try {
      const res = await fetch(`/api/admin/freelancers/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', notes }),
      })
      if (res.ok) window.location.reload()
    } finally {
      setActionLoading(null)
      setRejectingId(null)
    }
  }

  return (
    <>
      {/* Filter tabs */}
      <div className="flex gap-1 mb-4 border-b border-neutral-200">
        {TABS.map((tab) => {
          const count =
            tab.key === 'all'
              ? freelancers.length
              : freelancers.filter((f) => f.approval_status === tab.key).length
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={[
                'px-4 py-2.5 text-sm font-body font-medium border-b-2 -mb-px transition-colors',
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
          <p className="font-body text-neutral-500 text-sm">No freelancers found.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-100">
                  <th className="text-left px-4 py-3 font-body font-medium text-neutral-500">Name</th>
                  <th className="text-left px-4 py-3 font-body font-medium text-neutral-500">Skills</th>
                  <th className="text-left px-4 py-3 font-body font-medium text-neutral-500">Status</th>
                  <th className="text-left px-4 py-3 font-body font-medium text-neutral-500">Joined</th>
                  <th className="text-left px-4 py-3 font-body font-medium text-neutral-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filtered.map((f) => (
                  <tr key={f.user_id} className="hover:bg-neutral-50 transition-colors align-top">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {f.avatar_url ? (
                          <img
                            src={f.avatar_url}
                            alt={f.full_name}
                            className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <FreelancerInitials name={f.full_name} />
                        )}
                        <span className="font-body font-medium text-neutral-800">{f.full_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {f.skills.slice(0, 3).map((skill) => (
                          <span
                            key={skill}
                            className="inline-flex px-2 py-0.5 rounded-full text-xs font-body bg-blue-50 text-[#007BFF] border border-blue-100"
                          >
                            {skill}
                          </span>
                        ))}
                        {f.skills.length > 3 && (
                          <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-body bg-neutral-100 text-neutral-500">
                            +{f.skills.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={f.approval_status} />
                    </td>
                    <td className="px-4 py-3 font-body text-neutral-500">
                      {new Date(f.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1 items-start">
                        <div className="flex gap-1 flex-wrap">
                          {/* View */}
                          <button
                            onClick={() => setViewingProfile(f)}
                            className="inline-flex items-center px-2.5 py-1 rounded-md bg-neutral-100 text-neutral-700 text-xs font-body font-medium hover:bg-neutral-200 transition-colors"
                          >
                            View
                          </button>

                          {/* Approve */}
                          {f.approval_status !== 'approved' && (
                            <button
                              onClick={() => handleApprove(f.user_id)}
                              disabled={actionLoading === f.user_id + '-approve'}
                              className="inline-flex items-center px-2.5 py-1 rounded-md bg-green-50 text-green-700 text-xs font-body font-medium border border-green-200 hover:bg-green-100 transition-colors disabled:opacity-50"
                            >
                              {actionLoading === f.user_id + '-approve' ? 'Approving…' : 'Approve'}
                            </button>
                          )}

                          {/* Reject */}
                          {f.approval_status !== 'rejected' && rejectingId !== f.user_id && (
                            <button
                              onClick={() => setRejectingId(f.user_id)}
                              className="inline-flex items-center px-2.5 py-1 rounded-md bg-red-50 text-red-700 text-xs font-body font-medium border border-red-200 hover:bg-red-100 transition-colors"
                            >
                              Reject
                            </button>
                          )}
                        </div>

                        {/* Reject panel */}
                        {rejectingId === f.user_id && (
                          <RejectPanel
                            freelancer={f}
                            onCancel={() => setRejectingId(null)}
                            onConfirm={(notes) => handleReject(f.user_id, notes)}
                            loading={actionLoading === f.user_id + '-reject'}
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Profile modal */}
      {viewingProfile && (
        <ProfileModal
          freelancer={viewingProfile}
          onClose={() => setViewingProfile(null)}
        />
      )}
    </>
  )
}
