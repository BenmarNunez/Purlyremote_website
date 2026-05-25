'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { clientSchema, type ClientInput } from '@/app/api/auth/register/schema'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const router = useRouter()

  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm<ClientInput>({
    resolver: zodResolver(clientSchema),
    defaultValues: { role: 'client' },
  })

  const onSubmit = async (data: ClientInput) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const json = await res.json() as { error?: string }

    if (!res.ok) {
      setError('root', { message: typeof json.error === 'string' ? json.error : 'Registration failed.' })
      return
    }

    const supabase = createClient()
    await supabase.auth.signInWithPassword({ email: data.email, password: data.password })
    router.push('/client/dashboard')
  }

  return (
    <div className="min-h-screen bg-neutral-bg flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-heading font-bold text-neutral-text">Create a Client Account</h1>
          <p className="text-neutral-muted mt-2 font-body">
            Looking to hire?{' '}
            <span className="font-medium text-neutral-text">Register below.</span>
          </p>
        </div>

        <div className="card border border-neutral-border">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <input type="hidden" {...register('role')} />

            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="form-label">Full Name *</label>
                <input type="text" placeholder="Your full name" className="form-input" {...register('full_name')} />
                {errors.full_name && <p className="form-error">{errors.full_name.message}</p>}
              </div>
              <div>
                <label className="form-label">Company Name</label>
                <input type="text" placeholder="Optional" className="form-input" {...register('company_name')} />
              </div>
            </div>

            <div>
              <label className="form-label">Email Address *</label>
              <input type="email" placeholder="you@company.com" className="form-input" autoComplete="email" {...register('email')} />
              {errors.email && <p className="form-error">{errors.email.message}</p>}
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="form-label">Password *</label>
                <input type="password" placeholder="Min. 8 characters" className="form-input" autoComplete="new-password" {...register('password')} />
                {errors.password && <p className="form-error">{errors.password.message}</p>}
              </div>
              <div>
                <label className="form-label">Confirm Password *</label>
                <input type="password" placeholder="Repeat password" className="form-input" autoComplete="new-password" {...register('confirm_password')} />
                {errors.confirm_password && <p className="form-error">{errors.confirm_password.message}</p>}
              </div>
            </div>

            {errors.root && (
              <p className="text-sm text-danger bg-red-50 border border-red-200 rounded-lg p-3">
                {errors.root.message}
              </p>
            )}

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-3.5 disabled:opacity-60 disabled:cursor-not-allowed">
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account...
                </span>
              ) : 'Create Account'}
            </button>
          </form>
        </div>

        <div className="mt-6 text-center space-y-2">
          <p className="text-sm text-neutral-muted font-body">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-brand-blue font-semibold hover:underline">Sign in</Link>
          </p>
          <p className="text-sm text-neutral-muted font-body">
            Want to work as a freelancer?{' '}
            <Link href="/apply" className="text-brand-blue font-semibold hover:underline">Apply here</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
