import { stripe } from '@/lib/stripe'
import { adminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature or webhook secret' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  async function upsertSubscription(subscription: Stripe.Subscription) {
    const userId = subscription.metadata?.user_id
    const plan = (subscription.metadata?.plan ?? 'pro') as string
    const customerId = typeof subscription.customer === 'string'
      ? subscription.customer
      : subscription.customer?.id

    if (!userId) return

    await adminClient.from('subscriptions').upsert({
      user_id: userId,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      plan,
      status: subscription.status,
      current_period_end: (() => {
        const raw = (subscription as unknown as Record<string, unknown>).current_period_end
        return raw ? new Date((raw as number) * 1000).toISOString() : null
      })(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      if (session.mode === 'subscription' && session.subscription) {
        const sub = await stripe.subscriptions.retrieve(session.subscription as string)
        await upsertSubscription(sub)
      }
      break
    }

    case 'customer.subscription.updated':
    case 'customer.subscription.created': {
      await upsertSubscription(event.data.object as Stripe.Subscription)
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      const userId = subscription.metadata?.user_id
      if (userId) {
        await adminClient.from('subscriptions').update({
          plan: 'free',
          status: 'canceled',
          stripe_subscription_id: null,
          updated_at: new Date().toISOString(),
        }).eq('user_id', userId)
      }
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id
      if (customerId) {
        await adminClient.from('subscriptions').update({ status: 'past_due' }).eq('stripe_customer_id', customerId)
      }
      break
    }

    default:
      break
  }

  return NextResponse.json({ received: true })
}
