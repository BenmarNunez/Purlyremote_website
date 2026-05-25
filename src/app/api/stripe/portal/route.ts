import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { stripe } from '@/lib/stripe'
import { NextResponse } from 'next/server'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: sub } = await adminClient
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .maybeSingle<{ stripe_customer_id: string | null }>()

  if (!sub?.stripe_customer_id) {
    return NextResponse.json({ error: 'No billing account found' }, { status: 404 })
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: sub.stripe_customer_id,
    return_url: `${SITE_URL}/billing`,
  })

  return NextResponse.json({ url: session.url })
}
