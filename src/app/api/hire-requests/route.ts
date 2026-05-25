import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'

interface HireRequestBody {
  freelancer_id: string
  service: string
  description: string
  timeline?: string
  budget_range?: string
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (user.app_metadata?.role !== 'client') {
    return NextResponse.json({ error: 'Forbidden: clients only' }, { status: 403 })
  }

  let body: HireRequestBody
  try {
    body = (await request.json()) as HireRequestBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { freelancer_id, service, description, timeline, budget_range } = body

  if (!freelancer_id || !service || !description) {
    return NextResponse.json(
      { error: 'freelancer_id, service, and description are required' },
      { status: 400 }
    )
  }

  if (description.length < 20) {
    return NextResponse.json(
      { error: 'description must be at least 20 characters' },
      { status: 400 }
    )
  }

  // Prevent duplicate pending requests to same freelancer for same service
  const { data: duplicate } = await supabase
    .from('hire_requests')
    .select('id')
    .eq('client_id', user.id)
    .eq('freelancer_id', freelancer_id)
    .eq('service', service)
    .eq('status', 'pending')
    .maybeSingle()

  if (duplicate) {
    return NextResponse.json(
      { error: 'You already have a pending request to this freelancer for this service.' },
      { status: 409 }
    )
  }

  const insertPayload: Record<string, string> = {
    client_id: user.id,
    freelancer_id,
    service,
    description,
    status: 'pending',
  }

  if (timeline !== undefined) insertPayload.timeline = timeline
  if (budget_range !== undefined) insertPayload.budget_range = budget_range

  const { data, error: insertError } = await supabase
    .from('hire_requests')
    .insert(insertPayload)
    .select('id')
    .single()

  if (insertError || !data) {
    return NextResponse.json(
      { error: insertError?.message ?? 'Failed to create hire request' },
      { status: 500 }
    )
  }

  const { error: notifError } = await adminClient
    .from('notifications')
    .insert({
      user_id: freelancer_id,
      type: 'hire_request',
      title: 'New Hire Request',
      content: `A client wants to hire you for ${service}`,
    })

  if (notifError) {
    console.error('Failed to create notification:', notifError.message)
  }

  return NextResponse.json({ success: true, request_id: data.id }, { status: 201 })
}
