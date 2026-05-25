import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.CONTACT_FROM_EMAIL ?? 'noreply@purlyremote.com'
const ADMIN_EMAIL = process.env.CONTACT_TO_EMAIL ?? ''
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const {
    full_name,
    email,
    phone_number,
    expertise_area,
    years_experience,
    portfolio_link,
    preferred_role,
    availability_status,
    additional_notes,
    resume_url,
  } = body as Record<string, string | undefined>

  if (!full_name || !email || !expertise_area || !years_experience) {
    return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
  }

  const { error: dbError } = await adminClient.from('freelancer_applications').insert({
    full_name,
    email,
    phone_number: phone_number || null,
    expertise_area,
    years_experience,
    preferred_role: preferred_role || null,
    portfolio_url: portfolio_link || null,
    availability_status: availability_status || 'Flexible',
    additional_notes: additional_notes || null,
    resume_url: resume_url || null,
    status: 'pending',
  })

  if (dbError) {
    console.error('Failed to save application:', dbError.message)
    return NextResponse.json({ error: 'Failed to submit application. Please try again.' }, { status: 500 })
  }

  if (ADMIN_EMAIL) {
    resend.emails.send({
      from: FROM,
      to: ADMIN_EMAIL,
      subject: `New Freelancer Application — ${full_name}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px">
          <h2 style="color:#007BFF">New Freelancer Application</h2>
          <table style="width:100%;border-collapse:collapse;margin-top:16px">
            <tr><td style="padding:8px;color:#666;width:160px">Name</td><td style="padding:8px;font-weight:600">${full_name}</td></tr>
            <tr style="background:#f9f9f9"><td style="padding:8px;color:#666">Email</td><td style="padding:8px">${email}</td></tr>
            <tr><td style="padding:8px;color:#666">Expertise</td><td style="padding:8px">${expertise_area}</td></tr>
            <tr style="background:#f9f9f9"><td style="padding:8px;color:#666">Experience</td><td style="padding:8px">${years_experience}</td></tr>
            <tr><td style="padding:8px;color:#666">Preferred Role</td><td style="padding:8px">${preferred_role || 'N/A'}</td></tr>
            <tr style="background:#f9f9f9"><td style="padding:8px;color:#666">Portfolio</td><td style="padding:8px">${portfolio_link || 'N/A'}</td></tr>
            <tr><td style="padding:8px;color:#666">Availability</td><td style="padding:8px">${availability_status || 'Flexible'}</td></tr>
            <tr style="background:#f9f9f9"><td style="padding:8px;color:#666">Notes</td><td style="padding:8px">${additional_notes || 'N/A'}</td></tr>
          </table>
          <a href="${SITE_URL}/admin/applications"
             style="display:inline-block;background:#007BFF;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:24px">
            Review in Admin Panel
          </a>
        </div>
      `,
    }).catch((err: unknown) => console.error('Admin notification email failed:', err))
  }

  return NextResponse.json({ success: true })
}
