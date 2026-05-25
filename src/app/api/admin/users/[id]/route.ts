import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { logAdminAction } from '@/lib/audit'

interface RouteContext { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.app_metadata?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json() as { action: string; role?: string }
  const { action, role } = body

  if (id === user.id) {
    return NextResponse.json({ error: 'Cannot modify your own account.' }, { status: 400 })
  }

  if (action === 'change_role') {
    if (!role || !['client', 'freelancer', 'admin'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role.' }, { status: 400 })
    }
    await adminClient.from('users').update({ role }).eq('id', id)
    await adminClient.auth.admin.updateUserById(id, { app_metadata: { role } })
    await logAdminAction({ adminId: user.id, adminEmail: user.email ?? '', action: 'user_role_changed', targetType: 'user', targetId: id, details: { newRole: role } })
    return NextResponse.json({ success: true })
  }

  if (action === 'suspend') {
    await adminClient.from('users').update({ status: 'suspended' }).eq('id', id)
    await adminClient.auth.admin.updateUserById(id, { ban_duration: '87600h' })
    await logAdminAction({ adminId: user.id, adminEmail: user.email ?? '', action: 'user_suspended', targetType: 'user', targetId: id })
    return NextResponse.json({ success: true })
  }

  if (action === 'unsuspend') {
    await adminClient.from('users').update({ status: 'active' }).eq('id', id)
    await adminClient.auth.admin.updateUserById(id, { ban_duration: 'none' })
    await logAdminAction({ adminId: user.id, adminEmail: user.email ?? '', action: 'user_unsuspended', targetType: 'user', targetId: id })
    return NextResponse.json({ success: true })
  }

  if (action === 'ban') {
    // Soft delete: mark deleted_at + status=banned, disable auth login via ban
    await adminClient.from('users').update({
      status: 'banned',
      deleted_at: new Date().toISOString(),
    }).eq('id', id)
    await adminClient.auth.admin.updateUserById(id, { ban_duration: '87600h' })
    await logAdminAction({ adminId: user.id, adminEmail: user.email ?? '', action: 'user_banned', targetType: 'user', targetId: id })
    return NextResponse.json({ success: true })
  }

  if (action === 'reset_password') {
    const { data: target } = await adminClient.from('users').select('email').eq('id', id).single<{ email: string }>()
    if (!target?.email) return NextResponse.json({ error: 'User not found.' }, { status: 404 })

    const { data, error } = await adminClient.auth.admin.generateLink({
      type: 'recovery',
      email: target.email,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await logAdminAction({ adminId: user.id, adminEmail: user.email ?? '', action: 'user_password_reset_sent', targetType: 'user', targetId: id })
    return NextResponse.json({ success: true, link: data.properties?.action_link })
  }

  if (action === 'force_logout') {
    const { error } = await adminClient.auth.admin.signOut(id, 'global')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await logAdminAction({ adminId: user.id, adminEmail: user.email ?? '', action: 'user_force_logout', targetType: 'user', targetId: id })
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Unknown action.' }, { status: 400 })
}
