import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

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
  }

  return NextResponse.json({ success: true })
}
