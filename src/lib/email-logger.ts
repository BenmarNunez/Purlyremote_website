import { adminClient } from '@/lib/supabase/admin'

interface LogEmailParams {
  toEmail: string
  subject: string
  type: string
  status: 'sent' | 'failed'
  errorMessage?: string
  metadata?: Record<string, unknown>
}

export async function logEmail(params: LogEmailParams): Promise<void> {
  try {
    await adminClient.from('email_logs').insert({
      to_email: params.toEmail,
      subject: params.subject,
      type: params.type,
      status: params.status,
      error_message: params.errorMessage ?? null,
      metadata: params.metadata ?? null,
    })
  } catch (err) {
    console.error('Failed to write email log:', err)
  }
}

export async function sendAndLog(
  sendFn: () => Promise<unknown>,
  params: Omit<LogEmailParams, 'status' | 'errorMessage'>
): Promise<void> {
  try {
    await sendFn()
    await logEmail({ ...params, status: 'sent' })
  } catch (err) {
    await logEmail({
      ...params,
      status: 'failed',
      errorMessage: err instanceof Error ? err.message : String(err),
    })
    console.error(`Email failed [${params.type}] to ${params.toEmail}:`, err)
  }
}
