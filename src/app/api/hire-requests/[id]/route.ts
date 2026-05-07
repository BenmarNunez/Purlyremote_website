import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import type { HireRequestStatus, HireRequest } from '@/lib/supabase/types'

interface RouteParams {
  params: Promise<{ id: string }>
}

interface PatchBody {
  status: HireRequestStatus
}

const ALLOWED_STATUSES: HireRequestStatus[] = ['accepted', 'declined', 'completed']

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const { id } = await params

  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (user.app_metadata?.role !== 'freelancer') {
    return NextResponse.json({ error: 'Forbidden: freelancers only' }, { status: 403 })
  }

  let body: PatchBody
  try {
    body = (await request.json()) as PatchBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { status } = body

  if (!ALLOWED_STATUSES.includes(status)) {
    return NextResponse.json(
      { error: `status must be one of: ${ALLOWED_STATUSES.join(', ')}` },
      { status: 400 }
    )
  }

  // Fetch the hire request first to get client_id and verify ownership
  const { data: existing, error: fetchError } = await supabase
    .from('hire_requests')
    .select('id, client_id, freelancer_id, service')
    .eq('id', id)
    .eq('freelancer_id', user.id)
    .single()

  if (fetchError || !existing) {
    return NextResponse.json({ error: 'Hire request not found' }, { status: 404 })
  }

  const hireRequest = existing as Pick<HireRequest, 'id' | 'client_id' | 'freelancer_id' | 'service'>

  const { error: updateError } = await supabase
    .from('hire_requests')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('freelancer_id', user.id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  const { error: notifError } = await adminClient
    .from('notifications')
    .insert({
      user_id: hireRequest.client_id,
      type: 'hire_request_update',
      title: 'Request Update',
      content: `Your hire request has been ${status}`,
    })

  if (notifError) {
    console.error('Failed to create notification:', notifError.message)
  }

  return NextResponse.json({ success: true })
}
