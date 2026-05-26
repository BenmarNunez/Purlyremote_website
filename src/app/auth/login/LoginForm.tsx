'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const errorParam = searchParams.get('error')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setLoading(true)

    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error || !data.user) {
      setFormError(error?.message ?? 'Invalid email or password')
      setLoading(false)
      return
    }

    const role = data.user.app_metadata?.role as string
    router.push(`/${role}/dashboard`)
  }

  return (
    <div>
      {errorParam === 'confirmation_failed' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-5">
          <p className="text-sm text-red-600 font-body">
            Confirmation link expired or already used. Register again or contact support.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-neutral-700 font-body mb-1.5">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@email.com"
            className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-900 text-sm font-body placeholder:text-neutral-400 focus:outline-none focus:border-[#007BFF] focus:ring-2 focus:ring-[#007BFF]/10 focus:bg-white transition-all"
            required
            autoComplete="email"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="password" className="block text-sm font-medium text-neutral-700 font-body">
              Password
            </label>
            <a href="/auth/forgot-password" className="text-xs text-[#007BFF] hover:underline font-body">
              Forgot password?
            </a>
          </div>
          <input
            id="password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-900 text-sm font-body placeholder:text-neutral-400 focus:outline-none focus:border-[#007BFF] focus:ring-2 focus:ring-[#007BFF]/10 focus:bg-white transition-all"
            required
            autoComplete="current-password"
          />
        </div>

        {formError && (
          <div className="bg-red-50 border border-red-100 rounded-lg px-4 py-3">
            <p className="text-sm text-red-600 font-body">{formError}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-xl bg-[#007BFF] hover:bg-[#0066dd] active:bg-[#0055bb] text-white font-body font-semibold text-sm transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm shadow-blue-200"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Signing in…
            </>
          ) : (
            'Sign In'
          )}
        </button>
      </form>
    </div>
  )
}
