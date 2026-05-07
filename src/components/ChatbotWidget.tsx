'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send } from 'lucide-react'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

const INITIAL_MESSAGE: ChatMessage = {
  role: 'assistant',
  content:
    "Hi! I'm the Purly Remote assistant. How can I help you today? I can help you find the right freelancer for your needs.",
}

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sessionToken] = useState<string>(() => crypto.randomUUID())
  const [email, setEmail] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const handleOpen = () => {
    setIsOpen(true)
    if (messages.length === 0) {
      setMessages([INITIAL_MESSAGE])
    }
  }

  const handleClose = () => {
    setIsOpen(false)
  }

  const extractEmail = (text: string): string | null => {
    const matches = text.match(EMAIL_REGEX)
    return matches ? matches[0] : null
  }

  const handleSend = async () => {
    const trimmed = input.trim()
    if (!trimmed || isLoading) return

    const userMessage: ChatMessage = { role: 'user', content: trimmed }
    const updatedMessages = [...messages, userMessage]

    setMessages(updatedMessages)
    setInput('')
    setIsLoading(true)

    // Extract email from user message
    const foundEmail = extractEmail(trimmed)
    if (foundEmail) {
      setEmail(foundEmail)
    }

    try {
      const res = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages,
          session_token: sessionToken,
          ...(email || foundEmail ? { email: foundEmail ?? email } : {}),
        }),
      })

      if (!res.ok) {
        throw new Error('Network response was not ok')
      }

      const data = (await res.json()) as { response: string }
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.response },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            'Sorry, I encountered an error. Please try again in a moment.',
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Open chat panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-80 sm:w-[350px] h-[480px] rounded-2xl shadow-2xl bg-white flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-[#007BFF] text-white rounded-t-2xl px-4 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center flex-shrink-0">
                <MessageCircle className="w-4 h-4 text-[#007BFF]" />
              </div>
              <span className="font-heading font-semibold text-sm">
                Purly Remote Assistant
              </span>
            </div>
            <button
              onClick={handleClose}
              className="text-white hover:text-white/80 transition-colors"
              aria-label="Close chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`px-3 py-2 text-sm font-body max-w-[80%] ${
                    msg.role === 'user'
                      ? 'bg-[#007BFF] text-white rounded-2xl rounded-tr-sm'
                      : 'bg-gray-100 text-gray-800 rounded-2xl rounded-tl-sm'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-3 py-2 max-w-[80%]">
                  <div className="flex space-x-1">
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: '0ms' }}
                    />
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: '150ms' }}
                    />
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: '300ms' }}
                    />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="border-t p-3 flex gap-2 flex-shrink-0">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              disabled={isLoading}
              className="flex-1 text-sm rounded-full px-4 py-2 border border-neutral-200 focus:outline-none focus:border-[#007BFF] disabled:opacity-60"
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              aria-label="Send message"
              className="bg-[#007BFF] text-white rounded-full w-9 h-9 flex items-center justify-center flex-shrink-0 hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={isOpen ? handleClose : handleOpen}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
        className="w-[60px] h-[60px] rounded-full bg-[#007BFF] text-white shadow-lg flex items-center justify-center hover:bg-blue-600 transition-colors"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageCircle className="w-6 h-6" />
        )}
      </button>
    </div>
  )
}
