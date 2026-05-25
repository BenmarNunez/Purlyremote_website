'use client'

import { useEffect, useState } from 'react'

interface MessageRow {
  id: string
  sender_id: string
  receiver_id: string
  request_id: string | null
  content: string
  read: boolean
  created_at: string
  sender_email: string | null
  receiver_email: string | null
}

export default function MessageModeration() {
  const [messages, setMessages] = useState<MessageRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [userId, setUserId] = useState('')
  const [actionId, setActionId] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    const params = new URLSearchParams()
    if (search) params.set('q', search)
    if (userId) params.set('user_id', userId)
    const res = await fetch(`/api/admin/messages?${params.toString()}`)
    const json = await res.json() as { messages?: MessageRow[]; total?: number; error?: string }
    if (!res.ok) setError(json.error ?? 'Failed to load messages.')
    else {
      setMessages(json.messages ?? [])
      setTotal(json.total ?? 0)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this message? Logged in audit trail.')) return
    setActionId(id)
    const res = await fetch('/api/admin/messages', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    const json = await res.json() as { error?: string }
    if (!res.ok) setError(json.error ?? 'Delete failed.')
    else setMessages(prev => prev.filter(m => m.id !== id))
    setActionId(null)
  }

  return (
    <>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
      )}

      <form
        onSubmit={(e) => { e.preventDefault(); load() }}
        className="flex flex-col sm:flex-row gap-3 mb-4"
      >
        <input
          type="text"
          placeholder="Search content..."
          className="form-input text-sm flex-1"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <input
          type="text"
          placeholder="Filter by user UUID..."
          className="form-input text-sm flex-1"
          value={userId}
          onChange={e => setUserId(e.target.value)}
        />
        <button type="submit" className="btn-primary text-sm px-4 py-2">Search</button>
      </form>

      <p className="text-xs text-neutral-500 mb-3 font-body">
        Showing {messages.length} of {total} message(s)
      </p>

      {loading ? (
        <div className="card p-12 text-center font-body text-neutral-500 text-sm">Loading…</div>
      ) : messages.length === 0 ? (
        <div className="card p-12 text-center font-body text-neutral-500 text-sm">No messages match.</div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-100">
                  {['When', 'From', 'To', 'Content', 'Request', 'Action'].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-body font-medium text-neutral-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {messages.map(m => (
                  <tr key={m.id} className="hover:bg-neutral-50 align-top">
                    <td className="px-4 py-3 text-xs font-body text-neutral-400 whitespace-nowrap">
                      {new Date(m.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-xs font-body text-neutral-600">{m.sender_email ?? m.sender_id.slice(0, 8)}</td>
                    <td className="px-4 py-3 text-xs font-body text-neutral-600">{m.receiver_email ?? m.receiver_id.slice(0, 8)}</td>
                    <td className="px-4 py-3 font-body text-neutral-800 text-sm max-w-md">{m.content}</td>
                    <td className="px-4 py-3 text-xs font-body text-neutral-400">{m.request_id?.slice(0, 8) ?? '—'}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDelete(m.id)}
                        disabled={actionId === m.id}
                        className="text-xs px-2 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        Delete
                      </button>
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
