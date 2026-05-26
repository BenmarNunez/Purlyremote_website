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

// Resend SDK returns { data, error } and DOES NOT throw on API failures.
// Treat a populated `error` field as a real failure so email_logs status is accurate.
interface ResendLikeResult {
  data?: unknown
  error?: { message?: string; name?: string; statusCode?: number } | null
}

export async function sendAndLog(
  sendFn: () => Promise<ResendLikeResult | unknown>,
  params: Omit<LogEmailParams, 'status' | 'errorMessage'>
): Promise<void> {
  try {
    const result = (await sendFn()) as ResendLikeResult
    if (result && typeof result === 'object' && 'error' in result && result.error) {
      const msg = result.error.message ?? result.error.name ?? 'Resend rejected the send.'
      await logEmail({ ...params, status: 'failed', errorMessage: msg })
      console.error(`Email rejected by Resend [${params.type}] to ${params.toEmail}: ${msg}`)
      return
    }
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
