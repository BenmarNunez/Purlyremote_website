import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function PATCH() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const role = user.app_metadata?.role as string | undefined
  if (role !== 'freelancer') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: profile, error: fetchError } = await supabase
    .from('freelancer_profiles')
    .select('full_name, profile_completed, approval_status')
    .eq('user_id', user.id)
    .single()

  if (fetchError || !profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  if (profile.profile_completed !== true) {
    return NextResponse.json(
      { error: 'Complete your profile before submitting for review' },
      { status: 400 }
    )
  }

  if (profile.approval_status === 'approved') {
    return NextResponse.json(
      { error: 'Profile is already approved' },
      { status: 400 }
    )
  }

  const { error: updateError } = await supabase
    .from('freelancer_profiles')
    .update({ approval_status: 'pending' })
    .eq('user_id', user.id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  // Find an admin user to notify — skip silently if none found
  const { data: adminUser } = await adminClient
    .from('users')
    .select('id')
    .eq('role', 'admin')
    .limit(1)
    .single()

  if (adminUser) {
    await adminClient.from('notifications').insert({
      user_id: adminUser.id,
      type: 'review_request',
      title: 'New Review Request',
      content: `Freelancer ${profile.full_name} submitted profile for review`,
    })
  }

  return NextResponse.json({ success: true })
}
