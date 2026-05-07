import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { FreelancerProfile } from '@/lib/supabase/types'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = request.nextUrl
  const service = searchParams.get('service')
  const search = searchParams.get('search')
  const available = searchParams.get('available')

  const supabase = await createClient()

  let query = supabase
    .from('freelancer_profiles')
    .select('*')
    .eq('approved', true)

  if (service) {
    query = query.contains('services', [service])
  }

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,bio.ilike.%${search}%`)
  }

  if (available === 'true') {
    query = query.eq('availability', true)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data as FreelancerProfile[])
}
