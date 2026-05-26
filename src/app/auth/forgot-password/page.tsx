'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setStatus('loading')

    const supabase = createClient()
    const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/confirm?next=/auth/reset-password`,
    })

    if (resetErr) {
      setError(resetErr.message)
      setStatus('error')
      return
    }

    setStatus('sent')
  }

  if (status === 'sent') {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-white">
        <div className="w-full max-w-[400px] text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center mb-6">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h1 className="text-2xl font-heading font-bold text-neutral-900 mb-2">Check your inbox</h1>
          <p className="text-sm font-body text-neutral-500 mb-6">
            We sent a password reset link to <strong className="text-neutral-800">{email}</strong>. It expires in 24 hours.
          </p>
          <p className="text-xs font-body text-neutral-400 mb-8">
            Didn&apos;t get it? Check spam or{' '}
            <button
              onClick={() => setStatus('idle')}
              className="text-[#007BFF] hover:underline font-medium"
            >
              try again
            </button>
            .
          </p>
          <Link href="/auth/login" className="text-sm text-[#007BFF] font-semibold hover:underline font-body">
            ← Back to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[45%] bg-gradient-to-br from-[#007BFF] to-[#0056CC] flex-col justify-center items-center p-12">
        <div className="max-w-xs text-center space-y-4">
          <div className="w-20 h-20 mx-auto rounded-full bg-white/10 flex items-center justify-center">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <h2 className="text-2xl font-heading font-bold text-white">Forgot your password?</h2>
          <p className="text-white/70 font-body text-sm leading-relaxed">
            No worries. Enter your email and we&apos;ll send you a secure reset link instantly.
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-[400px]">
          <div className="mb-8">
            <Link href="/auth/login" className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-[#007BFF] font-body transition-colors mb-6">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              Back to Login
            </Link>
            <h1 className="text-2xl font-heading font-bold text-neutral-900">Reset password</h1>
            <p className="text-neutral-500 text-sm font-body mt-1">
              Enter your account email and we&apos;ll send a reset link.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-neutral-700 font-body mb-1.5">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                autoFocus
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@email.com"
                disabled={status === 'loading'}
                className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-900 text-sm font-body placeholder:text-neutral-400 focus:outline-none focus:border-[#007BFF] focus:ring-2 focus:ring-[#007BFF]/10 focus:bg-white transition-all disabled:opacity-60"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 rounded-lg px-4 py-3">
                <p className="text-sm text-red-600 font-body">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={status === 'loading' || !email}
              className="w-full py-3.5 rounded-xl bg-[#007BFF] hover:bg-[#0066dd] active:bg-[#0055bb] text-white font-body font-semibold text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm shadow-blue-200"
            >
              {status === 'loading' ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sending…
                </>
              ) : (
                'Send Reset Link'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
