'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Message, HireRequest, FreelancerProfile } from '@/lib/supabase/types'

interface PageProps {
  params: Promise<{ requestId: string }>
}

export default function ClientChatPage({ params }: PageProps) {
  const [requestId, setRequestId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [hireRequest, setHireRequest] = useState<HireRequest | null>(null)
  const [freelancerName, setFreelancerName] = useState<string>('')
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  // Resolve params
  useEffect(() => {
    params.then((p) => setRequestId(p.requestId))
  }, [params])

  // Initialize: auth + fetch data
  useEffect(() => {
    if (!requestId) return

    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        window.location.href = '/auth/login'
        return
      }
      setUserId(user.id)

      // Fetch messages
      const res = await fetch(`/api/messages?request_id=${requestId}`)
      if (res.ok) {
        const data = (await res.json()) as Message[]
        setMessages(data)
      }

      // Mark messages as read
      await supabase
        .from('messages')
        .update({ read: true })
        .eq('request_id', requestId)
        .eq('receiver_id', user.id)
        .eq('read', false)

      // Fetch hire request
      const { data: reqData } = await supabase
        .from('hire_requests')
        .select('*')
        .eq('id', requestId)
        .single<HireRequest>()
      if (reqData) setHireRequest(reqData)

      // Fetch freelancer name
      if (reqData) {
        const { data: profile } = await supabase
          .from('freelancer_profiles')
          .select('full_name')
          .eq('user_id', reqData.freelancer_id)
          .single<Pick<FreelancerProfile, 'full_name'>>()
        setFreelancerName(profile?.full_name ?? 'Freelancer')
      }

      setLoading(false)
    }

    init()
  }, [requestId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Realtime subscription
  useEffect(() => {
    if (!requestId || !userId) return

    const channel = supabase
      .channel(`messages-${requestId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `request_id=eq.${requestId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message
          setMessages((prev) => {
            // Avoid duplicates from optimistic updates
            if (prev.some((m) => m.id === newMsg.id)) return prev
            return [...prev, newMsg]
          })
          if (newMsg.receiver_id === userId) {
            supabase
              .from('messages')
              .update({ read: true })
              .eq('id', newMsg.id)
              .then(() => {})
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [requestId, userId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = useCallback(async () => {
    if (!input.trim() || !requestId || !hireRequest || !userId || sending) return

    const content = input.trim()
    setInput('')
    setSending(true)

    // Optimistic update with a temporary id
    const tempMsg: Message = {
      id: `temp-${Date.now()}`,
      sender_id: userId,
      receiver_id: hireRequest.freelancer_id,
      request_id: requestId,
      content,
      read: false,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, tempMsg])

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request_id: requestId,
          receiver_id: hireRequest.freelancer_id,
          content,
        }),
      })

      if (res.ok) {
        const { message } = (await res.json()) as { success: boolean; message: Message }
        // Replace temp message with real one
        setMessages((prev) =>
          prev.map((m) => (m.id === tempMsg.id ? message : m))
        )
      } else {
        // Remove optimistic on failure
        setMessages((prev) => prev.filter((m) => m.id !== tempMsg.id))
        setInput(content)
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== tempMsg.id))
      setInput(content)
    } finally {
      setSending(false)
    }
  }, [input, requestId, hireRequest, userId, sending])

  function formatTime(dateStr: string) {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="font-body text-neutral-400 text-sm">Loading conversation...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-neutral-200 px-4 py-3 flex items-center gap-3">
        <div>
          <p className="font-heading font-semibold text-neutral-900 text-sm leading-tight">
            {freelancerName}
          </p>
          {hireRequest && (
            <p className="text-xs font-body text-neutral-400">{hireRequest.service}</p>
          )}
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-center text-sm font-body text-neutral-400 py-8">
            No messages yet. Start the conversation!
          </p>
        )}

        {messages.map((msg) => {
          const isOwn = msg.sender_id === userId
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[75%] px-4 py-2.5 text-sm font-body leading-relaxed ${
                  isOwn
                    ? 'bg-[#007BFF] text-white rounded-2xl rounded-br-sm'
                    : 'bg-white border border-neutral-200 text-neutral-800 rounded-2xl rounded-bl-sm'
                }`}
              >
                {msg.content}
              </div>
              <span className="text-xs text-neutral-400 mt-1 font-body">
                {formatTime(msg.created_at)}
              </span>
            </div>
          )
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-neutral-200 bg-white px-4 py-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            className="form-input flex-1 text-sm"
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                sendMessage()
              }
            }}
            disabled={sending}
          />
          <button
            className="btn-primary px-4 py-2 text-sm"
            onClick={sendMessage}
            disabled={sending || !input.trim()}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
