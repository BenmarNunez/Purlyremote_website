import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { PLANS } from '@/lib/stripe'
import type { Metadata } from 'next'
import BillingActions from './BillingActions'

export const metadata: Metadata = { title: 'Billing — PurlyRemote', robots: { index: false, follow: false } }

interface Subscription {
  plan: string
  status: string
  current_period_end: string | null
}

export default async function BillingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: sub } = await adminClient
    .from('subscriptions')
    .select('plan, status, current_period_end')
    .eq('user_id', user.id)
    .maybeSingle<Subscription>()

  const plan = sub?.plan ?? 'free'
  const planDetails = PLANS[plan as keyof typeof PLANS] ?? PLANS.free

  return (
    <div className="min-h-screen bg-neutral-50 pt-20">
      <div className="container-max section-padding max-w-2xl">
        <h1 className="text-2xl font-heading font-bold text-neutral-900 mb-8">Billing & Subscription</h1>

        <div className="card p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-body text-neutral-400 uppercase tracking-wide mb-1">Current Plan</p>
              <h2 className="text-2xl font-heading font-bold text-neutral-900">{planDetails.name}</h2>
              <p className="font-body text-neutral-500 text-sm mt-1">
                {planDetails.price === 0 ? 'Free forever' : `$${planDetails.price}/month`}
              </p>
              {sub?.status && sub.status !== 'active' && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-body font-medium bg-red-100 text-red-800 mt-2 capitalize">
                  {sub.status.replace('_', ' ')}
                </span>
              )}
              {sub?.current_period_end && (
                <p className="text-xs font-body text-neutral-400 mt-2">
                  Renews {new Date(sub.current_period_end).toLocaleDateString()}
                </p>
              )}
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-body font-semibold ${
              plan === 'pro' ? 'bg-[#007BFF] text-white' :
              plan === 'enterprise' ? 'bg-purple-600 text-white' :
              'bg-neutral-100 text-neutral-600'
            }`}>
              {planDetails.name}
            </div>
          </div>
        </div>

        <div className="card p-6 mb-6">
          <h2 className="font-heading font-semibold text-neutral-800 mb-4">Plan Features</h2>
          <ul className="space-y-2.5">
            {planDetails.features.map(f => (
              <li key={f} className="flex items-start gap-2.5 text-sm font-body text-neutral-600">
                <svg className="w-4 h-4 text-[#007BFF] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {f}
              </li>
            ))}
          </ul>
        </div>

        <BillingActions currentPlan={plan} hasSubscription={!!sub?.plan && sub.plan !== 'free'} />
      </div>
    </div>
  )
}
