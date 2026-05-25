import { adminClient } from '@/lib/supabase/admin'

interface LogActionParams {
  adminId: string
  adminEmail: string
  action: string
  targetType?: string
  targetId?: string
  details?: Record<string, unknown>
  ipAddress?: string
}

export async function logAdminAction(params: LogActionParams): Promise<void> {
  try {
    await adminClient.from('admin_logs').insert({
      admin_id: params.adminId,
      admin_email: params.adminEmail,
      action: params.action,
      target_type: params.targetType ?? null,
      target_id: params.targetId ?? null,
      details: params.details ?? null,
      ip_address: params.ipAddress ?? null,
    })
  } catch (err) {
    // Non-fatal — never let audit logging crash the request
    console.error('Failed to write audit log:', err)
  }
}
