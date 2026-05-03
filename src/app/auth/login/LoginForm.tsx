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
    <div className="card border border-neutral-border">
      {errorParam === 'confirmation_failed' && (
        <div className="bg-red-50 border border-red-200 rounded-input p-3 mb-5">
          <p className="form-error">
            Your confirmation link has expired or already been used. Please
            register again or contact support.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className="form-label">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@email.com"
            className="form-input"
            required
            autoComplete="email"
          />
        </div>

        <div>
          <label htmlFor="password" className="form-label">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            className="form-input"
            required
            autoComplete="current-password"
          />
        </div>

        {formError && <p className="form-error">{formError}</p>}

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full py-3.5 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Signing in...
            </>
          ) : (
            'Sign In'
          )}
        </button>
      </form>
    </div>
  )
}
