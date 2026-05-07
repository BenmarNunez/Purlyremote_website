import { adminClient } from '@/lib/supabase/admin'
import type { ChatbotSession } from '@/lib/supabase/types'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Chatbot Logs — Admin — PurlyRemote' }

function truncate(text: string | null, max = 80): string {
  if (!text) return '—'
  return text.length > max ? text.slice(0, max) + '…' : text
}

export default async function AdminChatbotPage() {
  const { data: sessionsRaw } = await adminClient
    .from('chatbot_sessions')
    .select('*')
    .order('created_at', { ascending: false })

  const sessions = (sessionsRaw ?? []) as ChatbotSession[]

  return (
    <div>
      <div className="mb-6">
        <p className="section-tag mb-2">Logs</p>
        <h1 className="text-2xl font-heading font-bold text-neutral-900">Chatbot Sessions</h1>
        <p className="text-sm font-body text-neutral-500 mt-1">
          Visitor inquiries captured by the chatbot
        </p>
      </div>

      {sessions.length === 0 ? (
        <div className="card px-6 py-10 text-center">
          <p className="font-body text-neutral-500 text-sm">No chatbot sessions yet.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-100">
                  <th className="text-left px-6 py-3 font-body font-medium text-neutral-500">Email</th>
                  <th className="text-left px-6 py-3 font-body font-medium text-neutral-500">Service Needed</th>
                  <th className="text-left px-6 py-3 font-body font-medium text-neutral-500">Notes</th>
                  <th className="text-left px-6 py-3 font-body font-medium text-neutral-500">Notified</th>
                  <th className="text-left px-6 py-3 font-body font-medium text-neutral-500">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {sessions.map((s) => (
                  <tr key={s.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-6 py-3 font-body text-neutral-800">
                      {s.email ?? <span className="text-neutral-400">—</span>}
                    </td>
                    <td className="px-6 py-3 font-body text-neutral-700">
                      {s.service_needed ?? <span className="text-neutral-400">—</span>}
                    </td>
                    <td className="px-6 py-3 font-body text-neutral-600 max-w-xs">
                      <span title={s.notes ?? undefined}>{truncate(s.notes)}</span>
                    </td>
                    <td className="px-6 py-3">
                      {s.notified ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-body font-medium bg-green-100 text-green-800 border border-green-200">
                          Yes
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-body font-medium bg-neutral-100 text-neutral-500 border border-neutral-200">
                          No
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3 font-body text-neutral-500">
                      {new Date(s.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
