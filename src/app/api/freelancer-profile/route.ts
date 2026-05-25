import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

interface PatchBody {
  full_name?: string
  bio?: string
  skills?: string[]
  services?: string[]
  hourly_rate?: number | null
  portfolio_url?: string | null
  portfolio_images?: string[]
  availability?: boolean
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const role = user.app_metadata?.role as string | undefined
  if (role !== 'freelancer') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

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

  const update: Record<string, unknown> = {}

  if ('full_name' in raw && typeof raw.full_name === 'string') {
    update.full_name = raw.full_name
  }
  if ('bio' in raw && (typeof raw.bio === 'string' || raw.bio === null)) {
    update.bio = raw.bio
  }
  if ('skills' in raw && Array.isArray(raw.skills) && raw.skills.every((s) => typeof s === 'string')) {
    update.skills = raw.skills as string[]
  }
  if ('services' in raw && Array.isArray(raw.services) && raw.services.every((s) => typeof s === 'string')) {
    update.services = raw.services as string[]
  }
  if ('hourly_rate' in raw) {
    if (raw.hourly_rate === null) {
      update.hourly_rate = null
    } else if (typeof raw.hourly_rate === 'number' && raw.hourly_rate >= 0 && raw.hourly_rate <= 9999) {
      update.hourly_rate = raw.hourly_rate
    } else {
      return NextResponse.json({ error: 'hourly_rate must be between 0 and 9999' }, { status: 400 })
    }
  }
  if ('portfolio_url' in raw && (typeof raw.portfolio_url === 'string' || raw.portfolio_url === null)) {
    update.portfolio_url = raw.portfolio_url
  }
  if ('portfolio_images' in raw && Array.isArray(raw.portfolio_images) && raw.portfolio_images.every((s) => typeof s === 'string')) {
    if (raw.portfolio_images.length > 8) {
      return NextResponse.json({ error: 'Maximum 8 portfolio images' }, { status: 400 })
    }
    update.portfolio_images = raw.portfolio_images as string[]
  }
  if ('availability' in raw && typeof raw.availability === 'boolean') {
    update.availability = raw.availability
  }

  // Fetch current profile to fill in fields not present in this update
  const { data: existing, error: fetchError } = await supabase
    .from('freelancer_profiles')
    .select('bio, skills, services, hourly_rate')
    .eq('user_id', user.id)
    .single()

  if (fetchError || !existing) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  const bio = ('bio' in update ? update.bio : existing.bio) as string | null
  const skills = ('skills' in update ? update.skills : existing.skills) as string[]
  const services = ('services' in update ? update.services : existing.services) as string[]
  const hourly_rate = ('hourly_rate' in update ? update.hourly_rate : existing.hourly_rate) as number | null

  const profile_completed =
    typeof bio === 'string' && bio.trim().length > 0 &&
    Array.isArray(skills) && skills.length >= 1 &&
    Array.isArray(services) && services.length >= 1 &&
    hourly_rate !== null

  update.profile_completed = profile_completed

  const { error: updateError } = await supabase
    .from('freelancer_profiles')
    .update(update)
    .eq('user_id', user.id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, profile_completed })
}
