'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { clientSchema, freelancerSchema, type ClientInput, type FreelancerInput } from '@/app/api/auth/register/schema'
import { createClient } from '@/lib/supabase/client'

const expertiseOptions = [
  'Software Development',
  'UI/UX Design',
  'Digital Marketing',
  'Content Writing & Copywriting',
  'Virtual Assistant',
  'Project Management',
  'Data Analysis',
  'Graphic Design',
  'Video Editing',
  'Customer Support',
  'Accounting & Finance',
  'Other',
]

export default function RegisterPage() {
  const router = useRouter()
  const [activeRole, setActiveRole] = useState<'client' | 'freelancer'>('client')
  const [serverError, setServerError] = useState<string | null>(null)

  const clientForm = useForm<ClientInput>({
    resolver: zodResolver(clientSchema),
    defaultValues: { role: 'client' },
  })

  const freelancerForm = useForm<FreelancerInput>({
    resolver: zodResolver(freelancerSchema),
    defaultValues: { role: 'freelancer' },
  })

  const handleSubmit = async (data: ClientInput | FreelancerInput) => {
    setServerError(null)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json() as { error?: string; requiresEmailConfirmation?: boolean }

      if (!res.ok) {
        setServerError(typeof json.error === 'string' ? json.error : 'Registration failed. Please try again.')
        return
      }

      if (json.requiresEmailConfirmation) {
        router.push('/auth/check-email')
      } else {
        const supabase = createClient()
        await supabase.auth.signInWithPassword({ email: data.email, password: data.password })
        router.push('/client/dashboard')
      }
    } catch {
      setServerError('Something went wrong. Please try again.')
    }
  }

  const isClientSubmitting = clientForm.formState.isSubmitting
  const isFreelancerSubmitting = freelancerForm.formState.isSubmitting

  return (
    <div className="min-h-screen bg-neutral-bg flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-heading font-bold text-neutral-text">
            Create an account
          </h1>
          <p className="text-neutral-muted mt-2 font-body">Join Purly Remote today</p>
        </div>

        <div className="flex rounded-btn border border-neutral-border bg-white p-1 mb-6">
          {(['client', 'freelancer'] as const).map(role => (
            <button
              key={role}
              type="button"
              onClick={() => { setActiveRole(role); setServerError(null) }}
              className={lex-1 py-2.5 text-sm font-semibold rounded-btn transition-all +${
                activeRole === role
                  ? 'bg-brand-blue text-white shadow-btn'
                  : 'text-neutral-muted hover:text-neutral-text'
              }}
            >
              {role === 'client' ? "I'm a Client" : "I'm a Freelancer"}
            </button>
          ))}
        </div>

        <div className="card border border-neutral-border">
          {activeRole === 'client' && (
            <form onSubmit={clientForm.handleSubmit(handleSubmit)} className="space-y-5">
              <input type="hidden" {...clientForm.register('role')} />
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="form-label">Full Name *</label>
                  <input type="text" placeholder="Your full name" className="form-input" {...clientForm.register('full_name')} />
                  {clientForm.formState.errors.full_name && <p className="form-error">{clientForm.formState.errors.full_name.message}</p>}
                </div>
                <div>
                  <label className="form-label">Company Name</label>
                  <input type="text" placeholder="Optional" className="form-input" {...clientForm.register('company_name')} />
                </div>
              </div>
              <div>
                <label className="form-label">Email Address *</label>
                <input type="email" placeholder="you@company.com" className="form-input" autoComplete="email" {...clientForm.register('email')} />
                {clientForm.formState.errors.email && <p className="form-error">{clientForm.formState.errors.email.message}</p>}
              </div>
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="form-label">Password *</label>
                  <input type="password" placeholder="Min. 8 characters" className="form-input" autoComplete="new-password" {...clientForm.register('password')} />
                  {clientForm.formState.errors.password && <p className="form-error">{clientForm.formState.errors.password.message}</p>}
                </div>
                <div>
                  <label className="form-label">Confirm Password *</label>
                  <input type="password" placeholder="Repeat password" className="form-input" autoComplete="new-password" {...clientForm.register('confirm_password')} />
                  {clientForm.formState.errors.confirm_password && <p className="form-error">{clientForm.formState.errors.confirm_password.message}</p>}
                </div>
              </div>
              {serverError && <p className="text-sm text-danger bg-red-50 border border-red-200 rounded-input p-3">{serverError}</p>}
              <button type="submit" disabled={isClientSubmitting} className="btn-primary w-full py-3.5 disabled:opacity-60 disabled:cursor-not-allowed">
                {isClientSubmitting ? (<><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating account...</>) : 'Create Client Account'}
              </button>
            </form>
          )}

          {activeRole === 'freelancer' && (
            <form onSubmit={freelancerForm.handleSubmit(handleSubmit)} className="space-y-5">
              <input type="hidden" {...freelancerForm.register('role')} />
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="form-label">Full Name *</label>
                  <input type="text" placeholder="Your full name" className="form-input" {...freelancerForm.register('full_name')} />
                  {freelancerForm.formState.errors.full_name && <p className="form-error">{freelancerForm.formState.errors.full_name.message}</p>}
                </div>
                <div>
                  <label className="form-label">Email Address *</label>
                  <input type="email" placeholder="you@email.com" className="form-input" autoComplete="email" {...freelancerForm.register('email')} />
                  {freelancerForm.formState.errors.email && <p className="form-error">{freelancerForm.formState.errors.email.message}</p>}
                </div>
              </div>
              <div>
                <label className="form-label">Primary Expertise *</label>
                <select className="form-input" {...freelancerForm.register('expertise_area')}>
                  <option value="">Select your expertise...</option>
                  {expertiseOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                {freelancerForm.formState.errors.expertise_area && <p className="form-error">{freelancerForm.formState.errors.expertise_area.message}</p>}
              </div>
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="form-label">Password *</label>
                  <input type="password" placeholder="Min. 8 characters" className="form-input" autoComplete="new-password" {...freelancerForm.register('password')} />
                  {freelancerForm.formState.errors.password && <p className="form-error">{freelancerForm.formState.errors.password.message}</p>}
                </div>
                <div>
                  <label className="form-label">Confirm Password *</label>
                  <input type="password" placeholder="Repeat password" className="form-input" autoComplete="new-password" {...freelancerForm.register('confirm_password')} />
                  {freelancerForm.formState.errors.confirm_password && <p className="form-error">{freelancerForm.formState.errors.confirm_password.message}</p>}
                </div>
              </div>
              {serverError && <p className="text-sm text-danger bg-red-50 border border-red-200 rounded-input p-3">{serverError}</p>}
              <button type="submit" disabled={isFreelancerSubmitting} className="btn-primary w-full py-3.5 disabled:opacity-60 disabled:cursor-not-allowed">
                {isFreelancerSubmitting ? (<><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating account...</>) : 'Apply as Freelancer'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-neutral-muted mt-6 font-body">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-brand-blue font-semibold hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
