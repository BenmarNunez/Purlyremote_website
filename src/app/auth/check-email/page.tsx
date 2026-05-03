import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Check Your Email',
}

export default function CheckEmailPage() {
  return (
    <div className="min-h-screen bg-neutral-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="card border border-neutral-border text-center py-12">
          <div className="w-16 h-16 bg-brand-blue-light rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">📧</span>
          </div>
          <h1 className="text-2xl font-heading font-bold text-neutral-text mb-3">
            Check your email
          </h1>
          <p className="text-neutral-muted font-body leading-relaxed mb-2">
            We've sent a confirmation link to your email address.
          </p>
          <p className="text-neutral-muted font-body leading-relaxed mb-8">
            Click the link in the email to confirm your account and continue.
          </p>
          <p className="text-xs text-neutral-muted mb-6">
            Didn't receive it? Check your spam folder or{' '}
            <a href="mailto:info@purlyremote.net" className="text-brand-blue hover:underline">contact support</a>.
          </p>
          <Link href="/auth/login" className="btn-outline text-sm">
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}
