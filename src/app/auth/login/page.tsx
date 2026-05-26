import { Suspense } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import LoginForm from './LoginForm'

export const metadata: Metadata = {
  title: 'Sign In — Purly Remote',
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-[45%] bg-gradient-to-br from-[#007BFF] to-[#0056CC] flex-col justify-between p-12">
        <Link href="/" className="flex items-center gap-2">
          <div className="relative w-[160px] h-9">
            <Image src="/logo.jpeg" alt="Purly Remote" fill className="object-contain brightness-0 invert" priority />
          </div>
        </Link>

        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white text-xs font-body font-medium px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-green-300 animate-pulse" />
            Live matching active
          </div>
          <h2 className="text-4xl font-heading font-bold text-white leading-tight">
            Your global remote<br />team starts here.
          </h2>
          <p className="text-white/70 font-body text-base leading-relaxed">
            Connect with pre-screened Filipino professionals ready to work with clients worldwide.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-4">
            {[
              { stat: '500+', label: 'Verified Freelancers' },
              { stat: '48hr',  label: 'Avg. Match Time' },
              { stat: '98%',  label: 'Client Satisfaction' },
              { stat: '50+',  label: 'Global Clients' },
            ].map(({ stat, label }) => (
              <div key={label} className="bg-white/10 rounded-xl p-4">
                <p className="text-2xl font-heading font-bold text-white">{stat}</p>
                <p className="text-white/60 text-xs font-body mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-white/40 text-xs font-body">© {new Date().getFullYear()} Purly Remote LLC</p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-white">
        {/* Mobile logo */}
        <Link href="/" className="lg:hidden mb-8">
          <div className="relative w-[140px] h-9">
            <Image src="/logo.jpeg" alt="Purly Remote" fill className="object-contain" priority />
          </div>
        </Link>

        <div className="w-full max-w-[400px]">
          <div className="mb-8">
            <h1 className="text-2xl font-heading font-bold text-neutral-900">
              Welcome back
            </h1>
            <p className="text-neutral-500 text-sm font-body mt-1">
              Sign in to your Purly Remote account
            </p>
          </div>

          {/* Suspense required — LoginForm uses useSearchParams() */}
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>

          <div className="mt-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-neutral-100" />
              <span className="text-xs text-neutral-400 font-body">or</span>
              <div className="flex-1 h-px bg-neutral-100" />
            </div>

            <p className="text-center text-sm text-neutral-500 font-body">
              Don&apos;t have an account?{' '}
              <Link href="/auth/register" className="text-[#007BFF] font-semibold hover:underline">
                Register
              </Link>
            </p>
            <p className="text-center text-sm text-neutral-500 font-body">
              Want to freelance?{' '}
              <Link href="/apply" className="text-[#007BFF] font-semibold hover:underline">
                Apply here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
