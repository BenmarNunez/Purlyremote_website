import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { stripe, PLANS, type PlanKey } from '@/lib/stripe'
import { NextRequest, NextResponse } from 'next/server'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { plan } = await req.json() as { plan: PlanKey }

  if (plan === 'free' || !PLANS[plan]?.priceId) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
  }

  // Get or create Stripe customer
  const { data: sub } = await adminClient
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .maybeSingle<{ stripe_customer_id: string | null }>()

  let customerId = sub?.stripe_customer_id

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { supabase_user_id: user.id },
    })
    customerId = customer.id

    await adminClient.from('subscriptions').upsert({
      user_id: user.id,
      stripe_customer_id: customerId,
      plan: 'free',
      status: 'active',
    }, { onConflict: 'user_id' })
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: PLANS[plan].priceId, quantity: 1 }],
    success_url: `${SITE_URL}/billing?success=true`,
    cancel_url: `${SITE_URL}/pricing?canceled=true`,
    metadata: { user_id: user.id, plan },
    subscription_data: {
      metadata: { user_id: user.id, plan },
    },
  })

  return NextResponse.json({ url: session.url })
}
