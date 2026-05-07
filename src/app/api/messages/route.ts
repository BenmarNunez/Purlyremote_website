import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import type { Message, HireRequest } from '@/lib/supabase/types'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const requestId = request.nextUrl.searchParams.get('request_id')
  if (!requestId) {
    return NextResponse.json({ error: 'request_id is required' }, { status: 400 })
  }

  // Validate user is sender or receiver — must be client_id or freelancer_id on this hire request
  const { data: hireRequest, error: hireError } = await supabase
    .from('hire_requests')
    .select('id, client_id, freelancer_id')
    .eq('id', requestId)
    .single<Pick<HireRequest, 'id' | 'client_id' | 'freelancer_id'>>()

  if (hireError || !hireRequest) {
    return NextResponse.json({ error: 'Hire request not found' }, { status: 404 })
  }

  if (hireRequest.client_id !== user.id && hireRequest.freelancer_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: messages, error: messagesError } = await supabase
    .from('messages')
    .select('*')
    .eq('request_id', requestId)
    .order('created_at', { ascending: true })
    .limit(50)

  if (messagesError) {
    return NextResponse.json({ error: messagesError.message }, { status: 500 })
  }

  return NextResponse.json((messages ?? []) as Message[])
}

interface PostBody {
  request_id: string
  receiver_id: string
  content: string
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: PostBody
  try {
    body = (await request.json()) as PostBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { request_id, receiver_id, content } = body

  if (!request_id || !receiver_id || !content) {
    return NextResponse.json(
      { error: 'request_id, receiver_id, and content are required' },
      { status: 400 }
    )
  }

  if (content.trim().length === 0) {
    return NextResponse.json({ error: 'content cannot be empty' }, { status: 400 })
  }

  // Validate user is a participant in this hire request
  const { data: hireRequest, error: hireError } = await supabase
    .from('hire_requests')
    .select('id, client_id, freelancer_id')
    .eq('id', request_id)
    .single<Pick<HireRequest, 'id' | 'client_id' | 'freelancer_id'>>()

  if (hireError || !hireRequest) {
    return NextResponse.json({ error: 'Hire request not found' }, { status: 404 })
  }

  if (hireRequest.client_id !== user.id && hireRequest.freelancer_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: inserted, error: insertError } = await supabase
    .from('messages')
    .insert({
      sender_id: user.id,
      receiver_id,
      request_id,
      content: content.trim(),
      read: false,
    })
    .select('*')
    .single<Message>()

  if (insertError || !inserted) {
    return NextResponse.json(
      { error: insertError?.message ?? 'Failed to send message' },
      { status: 500 }
    )
  }

  // Create notification for receiver via admin client (bypasses RLS)
  const preview =
    content.trim().length > 50
      ? content.trim().slice(0, 50) + '...'
      : content.trim()

  const { error: notifError } = await adminClient.from('notifications').insert({
    user_id: receiver_id,
    type: 'message',
    title: 'New Message',
    content: preview,
  })

  if (notifError) {
    console.error('Failed to create notification:', notifError.message)
  }

  return NextResponse.json({ success: true, message: inserted }, { status: 201 })
}
