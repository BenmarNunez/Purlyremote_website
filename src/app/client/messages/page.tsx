import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import type { HireRequest, FreelancerProfile, Message } from '@/lib/supabase/types'

export const metadata: Metadata = { title: 'Messages — PurlyRemote' }

function Initials({ name }: { name: string }) {
  const parts = name.trim().split(' ')
  const initials =
    parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : name.slice(0, 2).toUpperCase()
  return (
    <div className="w-10 h-10 rounded-full bg-[#007BFF] flex items-center justify-center flex-shrink-0">
      <span className="text-white text-sm font-heading font-semibold">{initials}</span>
    </div>
  )
}

interface ThreadRow {
  request: HireRequest
  freelancerName: string
  avatarUrl: string | null
  lastMessage: Message | null
  unreadCount: number
}

export default async function ClientMessagesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  // Fetch accepted/completed hire requests for this client
  const { data: requestsRaw } = await supabase
    .from('hire_requests')
    .select('*')
    .eq('client_id', user.id)
    .in('status', ['accepted', 'completed'])
    .order('updated_at', { ascending: false })

  const requests = (requestsRaw ?? []) as HireRequest[]

  if (requests.length === 0) {
    return (
      <div>
        <div className="mb-6">
          <p className="section-tag mb-2">Messages</p>
          <h1 className="text-2xl font-heading font-bold text-neutral-900">Conversations</h1>
        </div>
        <div className="card p-12 text-center">
          <p className="font-body text-neutral-500">
            No active conversations.{' '}
            <Link href="/client/browse" className="text-[#007BFF] hover:underline">
              Hire a freelancer
            </Link>{' '}
            to start messaging.
          </p>
        </div>
      </div>
    )
  }

  // Fetch per-thread data in parallel
  const threads: ThreadRow[] = await Promise.all(
    requests.map(async (req) => {
      const [profileRes, lastMsgRes, unreadRes] = await Promise.all([
        supabase
          .from('freelancer_profiles')
          .select('full_name, avatar_url')
          .eq('user_id', req.freelancer_id)
          .single<Pick<FreelancerProfile, 'full_name' | 'avatar_url'>>(),
        supabase
          .from('messages')
          .select('*')
          .eq('request_id', req.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle<Message>(),
        supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('request_id', req.id)
          .eq('receiver_id', user.id)
          .eq('read', false),
      ])

      return {
        request: req,
        freelancerName: profileRes.data?.full_name ?? 'Freelancer',
        avatarUrl: profileRes.data?.avatar_url ?? null,
        lastMessage: lastMsgRes.data ?? null,
        unreadCount: unreadRes.count ?? 0,
      }
    })
  )

  function formatTime(dateStr: string) {
    const date = new Date(dateStr)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000)
    if (diffDays === 0) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return date.toLocaleDateString([], { weekday: 'short' })
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }

  return (
    <div>
      <div className="mb-6">
        <p className="section-tag mb-2">Messages</p>
        <h1 className="text-2xl font-heading font-bold text-neutral-900">Conversations</h1>
      </div>

      <div className="card overflow-hidden divide-y divide-neutral-100">
        {threads.map(({ request, freelancerName, avatarUrl, lastMessage, unreadCount }) => (
          <Link
            key={request.id}
            href={`/client/messages/${request.id}`}
            className="flex items-center gap-4 px-5 py-4 hover:bg-neutral-50 transition-colors"
          >
            {/* Avatar */}
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={freelancerName}
                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <Initials name={freelancerName} />
            )}

            {/* Text */}
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between gap-2">
                <p className="font-body font-semibold text-neutral-900 text-sm truncate">
                  {freelancerName}
                </p>
                {lastMessage && (
                  <span className="text-xs font-body text-neutral-400 flex-shrink-0">
                    {formatTime(lastMessage.created_at)}
                  </span>
                )}
              </div>
              <p className="text-xs font-body text-neutral-400 truncate">{request.service}</p>
              <p className="text-sm font-body text-neutral-500 truncate mt-0.5">
                {lastMessage
                  ? lastMessage.content.slice(0, 60) +
                    (lastMessage.content.length > 60 ? '…' : '')
                  : 'No messages yet'}
              </p>
            </div>

            {/* Unread badge */}
            {unreadCount > 0 && (
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#007BFF] flex items-center justify-center">
                <span className="text-white text-xs font-heading font-bold leading-none">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  )
}
