import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { logAdminAction } from '@/lib/audit'
import { sendAndLog } from '@/lib/email-logger'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.CONTACT_FROM_EMAIL ?? 'noreply@purlyremote.com'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

interface RouteContext {
  params: Promise<{ id: string }>
}

interface Application {
  id: string
  full_name: string
  email: string
  expertise_area: string
  years_experience: string
  preferred_role: string | null
  portfolio_url: string | null
  availability_status: string
  additional_notes: string | null
  status: string
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.app_metadata?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await context.params

  let body: { action?: string; notes?: string; status?: string }
  try {
    body = await req.json() as { action?: string; notes?: string; status?: string }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const { action, notes, status: newStatus } = body

  // Handle generic status change
  if (action === 'status') {
    const valid = ['pending', 'screening', 'needs_revision', 'approved', 'rejected', 'matched']
    if (!newStatus || !valid.includes(newStatus)) {
      return NextResponse.json({ error: 'Invalid status.' }, { status: 400 })
    }
    await adminClient.from('freelancer_applications').update({ status: newStatus, admin_notes: notes ?? null }).eq('id', id)
    await logAdminAction({ adminId: user.id, adminEmail: user.email ?? '', action: 'application_status_changed', targetType: 'application', targetId: id, details: { newStatus, notes } })
    return NextResponse.json({ success: true })
  }

  if (action !== 'approve' && action !== 'reject') {
    return NextResponse.json({ error: 'action must be "approve" or "reject"' }, { status: 400 })
  }

  const { data: app, error: fetchError } = await adminClient
    .from('freelancer_applications')
    .select('*')
    .eq('id', id)
    .single<Application>()

  if (fetchError || !app) {
    return NextResponse.json({ error: 'Application not found.' }, { status: 404 })
  }

  if (action === 'approve') {
    const { data: existing } = await adminClient
      .from('users')
      .select('id')
      .eq('email', app.email)
      .maybeSingle<{ id: string }>()

    if (existing) {
      return NextResponse.json({ error: 'An account already exists for this email.' }, { status: 409 })
    }

    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: app.email,
      email_confirm: true,
      app_metadata: { role: 'freelancer' },
      user_metadata: { full_name: app.full_name },
    })

    if (authError || !authData.user) {
      return NextResponse.json({ error: authError?.message ?? 'Failed to create account.' }, { status: 500 })
    }

    const userId = authData.user.id

    await adminClient.from('users').insert({ id: userId, email: app.email, role: 'freelancer' })
    await adminClient.from('freelancer_profiles').insert({
      user_id: userId,
      full_name: app.full_name,
      skills: [app.expertise_area],
      services: [],
      approval_status: 'pending',
      approved: false,
      profile_completed: false,
    })

    const { data: linkData } = await adminClient.auth.admin.generateLink({
      type: 'recovery',
      email: app.email,
      options: {
        redirectTo: `${SITE_URL}/auth/confirm?next=/auth/reset-password`,
      },
    })
    const setupLink = linkData?.properties?.action_link ?? `${SITE_URL}/auth/login`

    await sendAndLog(
      () => resend.emails.send({
        from: FROM,
        to: app.email,
        subject: '🎉 Your Purly Remote application was approved!',
        html: `
          <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px">
            <h2 style="color:#007BFF">Congratulations, ${escapeHtml(app.full_name)}!</h2>
            <p>Your application to <strong>Purly Remote</strong> has been approved. Welcome to the team!</p>
            <p>To get started:</p>
            <ol style="line-height:2">
              <li>Click the button below to set your password</li>
              <li>Complete your freelancer profile</li>
              <li>Submit your profile for final approval to become visible to clients</li>
            </ol>
            <a href="${setupLink}"
               style="display:inline-block;background:#007BFF;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px;margin-bottom:24px">
              Set My Password & Get Started
            </a>
            <p style="color:#888;font-size:13px">This link expires in 24 hours. If it expires, use the login page to request a new one.</p>
            <p style="margin-top:24px;color:#888;font-size:13px">— The Purly Remote Team</p>
          </div>
        `,
      }),
      { toEmail: app.email, subject: '🎉 Your Purly Remote application was approved!', type: 'application_approved' }
    )

    await adminClient
      .from('freelancer_applications')
      .update({ status: 'approved' })
      .eq('id', id)

    await logAdminAction({ adminId: user.id, adminEmail: user.email ?? '', action: 'application_approved', targetType: 'application', targetId: id, details: { applicantEmail: app.email } })

  } else {
    await adminClient
      .from('freelancer_applications')
      .update({ status: 'rejected', admin_notes: notes ?? null })
      .eq('id', id)

    await sendAndLog(
      () => resend.emails.send({
        from: FROM,
        to: app.email,
        subject: 'Update on your Purly Remote application',
        html: `
          <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px">
            <h2 style="color:#111">Thank you for applying, ${escapeHtml(app.full_name)}</h2>
            <p>We appreciate your interest in joining <strong>Purly Remote</strong>. After reviewing your application, we are unable to move forward at this time.</p>
            ${notes ? `<p><strong>Feedback:</strong> ${escapeHtml(notes)}</p>` : ''}
            <p>We encourage you to reapply in the future as our needs evolve.</p>
            <p style="margin-top:32px;color:#888;font-size:13px">— The Purly Remote Team</p>
          </div>
        `,
      }),
      { toEmail: app.email, subject: 'Update on your Purly Remote application', type: 'application_rejected' }
    )
  }

  return NextResponse.json({ success: true })
}
