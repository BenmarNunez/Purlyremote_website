'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PLANS, type PlanKey } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/client'

const PLAN_KEYS: PlanKey[] = ['free', 'pro', 'enterprise']

export default function PricingCards() {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const handleSelect = async (plan: PlanKey) => {
    if (plan === 'free') {
      router.push('/auth/register')
      return
    }

    setLoading(plan)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push(`/auth/register?plan=${plan}`)
      return
    }

    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    })
    const data = await res.json() as { url?: string; error?: string }
    if (data.url) window.location.href = data.url
    setLoading(null)
  }

  return (
    <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
      {PLAN_KEYS.map((key) => {
        const plan = PLANS[key]
        const isPro = key === 'pro'

        return (
          <div key={key} className={`card p-8 flex flex-col relative ${isPro ? 'border-2 border-[#007BFF] shadow-xl' : ''}`}>
            {isPro && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-[#007BFF] text-white text-xs font-body font-semibold px-4 py-1 rounded-full">
                  Most Popular
                </span>
              </div>
            )}

            <div className="mb-6">
              <h2 className="font-heading font-bold text-xl text-neutral-900">{plan.name}</h2>
              <div className="mt-3 flex items-end gap-1">
                <span className="text-4xl font-heading font-bold text-neutral-900">
                  ${plan.price}
                </span>
                {plan.price > 0 && (
                  <span className="text-neutral-400 font-body text-sm mb-1">/month</span>
                )}
              </div>
            </div>

            <ul className="space-y-3 flex-1 mb-8">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm font-body text-neutral-600">
                  <svg className="w-4 h-4 text-[#007BFF] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleSelect(key)}
              disabled={loading === key}
              className={`w-full py-3 rounded-lg font-body font-semibold text-sm transition-colors disabled:opacity-60 ${
                isPro
                  ? 'bg-[#007BFF] text-white hover:bg-blue-700'
                  : 'border border-neutral-200 text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              {loading === key ? 'Redirecting...' : key === 'free' ? 'Get Started Free' : `Get ${plan.name}`}
            </button>
          </div>
        )
      })}
    </div>
  )
}
