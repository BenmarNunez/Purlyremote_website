import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const TARGET_TYPES = ['user', 'message', 'hire_request', 'freelancer_profile'] as const
type TargetType = typeof TARGET_TYPES[number]

interface SubmitBody {
  target_type: TargetType
  target_id: string
  reason: string
  details?: string
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: SubmitBody
  try {
    body = (await req.json()) as SubmitBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 })
  }

  if (!body.target_type || !TARGET_TYPES.includes(body.target_type)) {
    return NextResponse.json({ error: 'Invalid target_type.' }, { status: 400 })
  }
  if (!body.target_id || !body.reason?.trim()) {
    return NextResponse.json({ error: 'target_id and reason are required.' }, { status: 400 })
  }
  if (body.reason.length > 200 || (body.details?.length ?? 0) > 2000) {
    return NextResponse.json({ error: 'Reason or details too long.' }, { status: 400 })
  }

  const { data, error } = await supabase.from('reports').insert({
    reporter_id: user.id,
    target_type: body.target_type,
    target_id: body.target_id,
    reason: body.reason.trim(),
    details: body.details?.trim() ?? null,
  }).select('id').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, id: data.id })
}
