import { Suspense } from 'react'
import type { Metadata } from 'next'
import LoginForm from './LoginForm'

export const metadata: Metadata = {
  title: 'Sign In',
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-neutral-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-heading font-bold text-neutral-text">
            Welcome back
          </h1>
          <p className="text-neutral-muted mt-2 font-body">
            Sign in to your Purly Remote account
          </p>
        </div>
        {/* Suspense required — LoginForm uses useSearchParams() */}
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
        <p className="text-center text-sm text-neutral-muted mt-6 font-body">
          Don&apos;t have an account?{' '}
          <a
            href="/auth/register"
            className="text-brand-blue font-semibold hover:underline"
          >
            Register
          </a>
        </p>
      </div>
    </div>
  )
}
