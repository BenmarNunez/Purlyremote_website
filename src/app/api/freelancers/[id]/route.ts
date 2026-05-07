import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { FreelancerProfile } from '@/lib/supabase/types'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const { id } = await params

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('freelancer_profiles')
    .select('*')
    .eq('user_id', id)
    .eq('approved', true)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Freelancer not found' }, { status: 404 })
  }

  return NextResponse.json(data as FreelancerProfile)
}
