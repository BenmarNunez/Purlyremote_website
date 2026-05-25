import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.CONTACT_FROM_EMAIL ?? 'noreply@purlyremote.com'

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

async function getFreelancerEmail(userId: string): Promise<string | null> {
  const { data } = await adminClient
    .from('users')
    .select('email')
    .eq('id', userId)
    .single<{ email: string }>()
  return data?.email ?? null
}

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const role = user.app_metadata?.role as string | undefined
  if (role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await context.params

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (typeof body !== 'object' || body === null) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const raw = body as Record<string, unknown>
  const action = raw.action
  const notes = typeof raw.notes === 'string' ? raw.notes : undefined

  if (action !== 'approve' && action !== 'reject') {
    return NextResponse.json(
      { error: 'action must be "approve" or "reject"' },
      { status: 400 }
    )
  }

  if (action === 'approve') {
    const { error: updateError } = await adminClient
      .from('freelancer_profiles')
      .update({
        approved: true,
        approval_status: 'approved',
        approval_notes: null,
      })
      .eq('user_id', id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    const { error: notifError } = await adminClient.from('notifications').insert({
      user_id: id,
      type: 'approval',
      title: 'Profile Approved',
      content: 'Congratulations! Your profile has been approved and is now visible to clients.',
    })

    if (notifError) {
      console.error('Failed to insert approval notification:', notifError.message)
    }

    const email = await getFreelancerEmail(id)
    if (email) {
      await resend.emails.send({
        from: FROM,
        to: email,
        subject: '🎉 Your Purly Remote profile has been approved!',
        html: `
          <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px">
            <h2 style="color:#007BFF">Congratulations! Your profile is approved.</h2>
            <p>Your freelancer profile on <strong>Purly Remote</strong> has been reviewed and approved. You are now visible to clients looking to hire talent.</p>
            <p>Log in to your dashboard to view incoming hire requests.</p>
            <a href="${process.env.NEXT_PUBLIC_SITE_URL}/auth/login"
               style="display:inline-block;background:#007BFF;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px">
              Go to Dashboard
            </a>
            <p style="margin-top:32px;color:#888;font-size:13px">— The Purly Remote Team</p>
          </div>
        `,
      }).catch((err: unknown) => console.error('Approval email failed:', err))
    }
  } else {
    const { error: updateError } = await adminClient
      .from('freelancer_profiles')
      .update({
        approved: false,
        approval_status: 'rejected',
        approval_notes: notes ?? null,
      })
      .eq('user_id', id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    const { error: notifError } = await adminClient.from('notifications').insert({
      user_id: id,
      type: 'rejection',
      title: 'Profile Not Approved',
      content: notes ?? 'Your profile was not approved. Please update it and resubmit.',
    })

    if (notifError) {
      console.error('Failed to insert rejection notification:', notifError.message)
    }

    const email = await getFreelancerEmail(id)
    if (email) {
      await resend.emails.send({
        from: FROM,
        to: email,
        subject: 'Update on your Purly Remote application',
        html: `
          <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px">
            <h2 style="color:#111">Your profile needs some updates</h2>
            <p>Thank you for applying to <strong>Purly Remote</strong>. After reviewing your profile, we were unable to approve it at this time.</p>
            ${notes ? `<p><strong>Reason:</strong> ${escapeHtml(notes)}</p>` : ''}
            <p>Please log in, update your profile based on the feedback above, and resubmit for review.</p>
            <a href="${process.env.NEXT_PUBLIC_SITE_URL}/auth/login"
               style="display:inline-block;background:#007BFF;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px">
              Update My Profile
            </a>
            <p style="margin-top:32px;color:#888;font-size:13px">— The Purly Remote Team</p>
          </div>
        `,
      }).catch((err: unknown) => console.error('Rejection email failed:', err))
    }
  }

  return NextResponse.json({ success: true })
}
