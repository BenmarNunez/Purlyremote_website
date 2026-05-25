import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { FreelancerProfile } from '@/lib/supabase/types'

const DEFAULT_LIMIT = 20
const MAX_LIMIT = 100

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = request.nextUrl
  const service = searchParams.get('service')
  const search = searchParams.get('search')
  const available = searchParams.get('available')
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(searchParams.get('limit') ?? String(DEFAULT_LIMIT), 10)))
  const offset = (page - 1) * limit

  const supabase = await createClient()

  let query = supabase
    .from('freelancer_profiles')
    .select('*', { count: 'exact' })
    .eq('approved', true)

  if (service) query = query.contains('services', [service])
  if (search) query = query.or(`full_name.ilike.%${search}%,bio.ilike.%${search}%`)
  if (available === 'true') query = query.eq('availability', true)

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    data: data as FreelancerProfile[],
    pagination: {
      page,
      limit,
      total: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / limit),
    },
  })
}
