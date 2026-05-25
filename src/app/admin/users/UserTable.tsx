'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { UserRow } from './page'

const ROLE_BADGE: Record<string, string> = {
  client: 'bg-blue-100 text-blue-800 border-blue-200',
  freelancer: 'bg-purple-100 text-purple-800 border-purple-200',
  admin: 'bg-red-100 text-red-800 border-red-200',
}

function Initials({ name, email }: { name: string | null; email: string }) {
  const str = name ?? email
  const init = str.split(/[ @]/).map(p => p[0]).join('').toUpperCase().slice(0, 2)
  return (
    <div className="w-9 h-9 rounded-full bg-[#007BFF]/10 flex items-center justify-center flex-shrink-0">
      <span className="text-[#007BFF] text-sm font-heading font-semibold">{init}</span>
    </div>
  )
}

type Tab = 'all' | 'client' | 'freelancer' | 'admin'

export default function UserTable({ users }: { users: UserRow[] }) {
  const [tab, setTab] = useState<Tab>('all')
  const [search, setSearch] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [localUsers, setLocalUsers] = useState<UserRow[]>(users)
  const [changeRoleId, setChangeRoleId] = useState<string | null>(null)
  const [newRole, setNewRole] = useState<string>('client')

  const filtered = localUsers.filter(u => {
    const matchTab = tab === 'all' || u.role === tab
    const matchSearch = !search ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.full_name?.toLowerCase().includes(search.toLowerCase()) ?? false)
    return matchTab && matchSearch
  })

  const count = (t: Tab) => t === 'all' ? localUsers.length : localUsers.filter(u => u.role === t).length

  const doImpersonate = async (id: string) => {
    if (!window.confirm('⚠️ You will be logged in as this user. All actions will be performed as them. Audit log will record this. Continue?')) return
    setActionLoading(id)
    const res = await fetch('/api/admin/impersonate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: id }),
    })
    const json = await res.json() as { url?: string; error?: string }
    if (json.url) window.open(json.url, '_blank')
    else setError(json.error ?? 'Failed to impersonate.')
    setActionLoading(null)
  }

  const doAction = async (id: string, action: string, extra?: Record<string, string>) => {
    if (!window.confirm(
      action === 'ban'
        ? '⚠️ This will ban and soft-delete this user. Continue?'
        : `Confirm: ${action} this user?`
    )) return

    setActionLoading(id)
    setError(null)
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...extra }),
    })
    const json = await res.json() as { error?: string }
    if (!res.ok) {
      setError(json.error ?? 'Action failed.')
    } else if (action === 'ban') {
      setLocalUsers(prev => prev.filter(u => u.id !== id))
    }
    setActionLoading(null)
    setChangeRoleId(null)
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'client', label: 'Clients' },
    { key: 'freelancer', label: 'Freelancers' },
    { key: 'admin', label: 'Admins' },
  ]

  return (
    <>
      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="text"
          placeholder="Search by name or email..."
          className="form-input text-sm max-w-sm"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="flex gap-1 border-b border-neutral-200 mb-6">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-body font-medium border-b-2 transition-colors ${
              tab === t.key ? 'border-[#007BFF] text-[#007BFF]' : 'border-transparent text-neutral-500 hover:text-neutral-700'
            }`}
          >
            {t.label} <span className="ml-1 text-xs bg-neutral-100 px-1.5 py-0.5 rounded-full">{count(t.key)}</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="font-body text-neutral-500 text-sm">No users found.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-100">
                  {['User', 'Email', 'Role', 'Joined', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-body font-medium text-neutral-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filtered.map(u => (
                  <tr key={u.id} className="hover:bg-neutral-50 transition-colors align-top">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Initials name={u.full_name} email={u.email} />
                        <div className="min-w-0">
                          <p className="font-body font-medium text-neutral-800 text-sm truncate">{u.full_name ?? '—'}</p>
                          {u.company_name && <p className="text-xs font-body text-neutral-400 truncate">{u.company_name}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-body text-neutral-600 text-xs">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-body font-medium border capitalize ${ROLE_BADGE[u.role] ?? 'bg-neutral-100 text-neutral-700'}`}>
                        {u.role}
                      </span>
                      {u.approval_status && u.role === 'freelancer' && (
                        <span className="block text-xs text-neutral-400 mt-0.5 capitalize">{u.approval_status}</span>
                      )}
                      {u.status && u.status !== 'active' && (
                        <span className={`block text-xs mt-0.5 capitalize font-medium ${u.status === 'suspended' ? 'text-orange-600' : 'text-red-600'}`}>
                          {u.status}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-body text-neutral-400 text-xs whitespace-nowrap">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1.5">
                        <Link href={`/admin/users/${u.id}`} className="text-xs px-2 py-1 rounded border border-[#007BFF]/30 text-[#007BFF] hover:bg-blue-50 text-center">
                          View Details
                        </Link>
                        {u.role !== 'admin' && (
                          <button
                            onClick={() => doImpersonate(u.id)}
                            disabled={actionLoading === u.id}
                            className="text-xs px-2 py-1 rounded border border-purple-200 text-purple-600 hover:bg-purple-50 disabled:opacity-50"
                          >
                            Impersonate
                          </button>
                        )}
                        {changeRoleId === u.id ? (
                          <div className="flex gap-2 items-center">
                            <select className="form-input text-xs py-1 px-2" value={newRole} onChange={e => setNewRole(e.target.value)}>
                              <option value="client">Client</option>
                              <option value="freelancer">Freelancer</option>
                              <option value="admin">Admin</option>
                            </select>
                            <button
                              onClick={() => doAction(u.id, 'change_role', { role: newRole })}
                              disabled={actionLoading === u.id}
                              className="text-xs px-2 py-1 rounded bg-[#007BFF] text-white hover:bg-blue-700 disabled:opacity-50"
                            >
                              Save
                            </button>
                            <button onClick={() => setChangeRoleId(null)} className="text-xs text-neutral-400 hover:text-neutral-600">Cancel</button>
                          </div>
                        ) : (
                          <div className="flex gap-1.5 flex-wrap">
                            <button
                              onClick={() => { setChangeRoleId(u.id); setNewRole(u.role) }}
                              className="text-xs px-2 py-1 rounded border border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                            >
                              Change Role
                            </button>
                            {u.status === 'suspended' ? (
                              <button
                                onClick={() => doAction(u.id, 'unsuspend')}
                                disabled={actionLoading === u.id}
                                className="text-xs px-2 py-1 rounded border border-green-200 text-green-700 hover:bg-green-50 disabled:opacity-50"
                              >
                                Unsuspend
                              </button>
                            ) : (
                              <button
                                onClick={() => doAction(u.id, 'suspend')}
                                disabled={actionLoading === u.id}
                                className="text-xs px-2 py-1 rounded border border-orange-200 text-orange-600 hover:bg-orange-50 disabled:opacity-50"
                              >
                                Suspend
                              </button>
                            )}
                            <button
                              onClick={() => doAction(u.id, 'reset_password')}
                              disabled={actionLoading === u.id}
                              className="text-xs px-2 py-1 rounded border border-blue-200 text-blue-600 hover:bg-blue-50 disabled:opacity-50"
                            >
                              Reset Password
                            </button>
                            <button
                              onClick={() => doAction(u.id, 'force_logout')}
                              disabled={actionLoading === u.id}
                              className="text-xs px-2 py-1 rounded border border-neutral-300 text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
                            >
                              Force Logout
                            </button>
                            <button
                              onClick={() => doAction(u.id, 'ban')}
                              disabled={actionLoading === u.id}
                              className="text-xs px-2 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50"
                            >
                              Ban
                            </button>
                          </div>
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
    </>
  )
}
