import Stripe from 'stripe'

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set. Add it to .env.local.')
  }
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-04-22.dahlia',
      typescript: true,
    })
  }
  return _stripe
}

// Convenience alias — same lazy pattern
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return (getStripe() as unknown as Record<string | symbol, unknown>)[prop]
  },
})

export const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    priceId: null,
    features: [
      'Browse approved freelancers',
      'Send up to 3 hire requests/month',
      'Basic messaging',
      'Email support',
    ],
  },
  pro: {
    name: 'Pro',
    price: 49,
    priceId: process.env.STRIPE_PRO_PRICE_ID ?? '',
    features: [
      'Unlimited hire requests',
      'Priority freelancer matching',
      'Advanced search & filters',
      'Real-time messaging',
      'Priority support',
      'Analytics dashboard',
    ],
  },
  enterprise: {
    name: 'Enterprise',
    price: 149,
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID ?? '',
    features: [
      'Everything in Pro',
      'Dedicated account manager',
      'Custom contracts',
      'Team accounts (up to 10 seats)',
      'SLA guarantee',
      'Custom integrations',
      'Invoice billing',
    ],
  },
} as const

export type PlanKey = keyof typeof PLANS
