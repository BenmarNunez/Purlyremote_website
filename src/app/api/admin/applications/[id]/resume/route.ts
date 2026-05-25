import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

interface RouteContext { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: RouteContext) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.app_metadata?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  const { data: app } = await adminClient
    .from('freelancer_applications')
    .select('resume_url')
    .eq('id', id)
    .single<{ resume_url: string | null }>()

  if (!app?.resume_url) {
    return NextResponse.json({ error: 'No resume found' }, { status: 404 })
  }

  const { data } = await adminClient.storage
    .from('resumes')
    .createSignedUrl(app.resume_url, 3600)

  if (!data?.signedUrl) {
    return NextResponse.json({ error: 'Failed to generate URL' }, { status: 500 })
  }

  return NextResponse.redirect(data.signedUrl)
}
