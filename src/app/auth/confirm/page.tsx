'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const SAFE_NEXT = /^\/[A-Za-z0-9/_\-?=&.]*$/

function ConfirmInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'error'>('loading')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    async function handle() {
      const supabase = createClient()

      // Read hash fragment (implicit flow from server-generated links)
      const hash = window.location.hash.slice(1) // strip leading #
      const hashParams = new URLSearchParams(hash)
      const access_token = hashParams.get('access_token')
      const refresh_token = hashParams.get('refresh_token')
      const errorCode = hashParams.get('error_code') ?? searchParams.get('error_code')
      const errorDesc = hashParams.get('error_description') ?? searchParams.get('error_description')

      // Also check query params for PKCE code flow
      const code = searchParams.get('code')
      const rawNext = searchParams.get('next')
      const next = rawNext && SAFE_NEXT.test(rawNext) ? rawNext : '/freelancer/dashboard'

      // Handle Supabase error redirect (e.g. otp_expired)
      if (errorCode) {
        setErrorMsg(
          errorDesc?.replace(/\+/g, ' ') ??
          'Link expired or already used. Request a new one from the login page.'
        )
        setStatus('error')
        return
      }

      if (access_token && refresh_token) {
        // Implicit flow — set session directly
        const { error } = await supabase.auth.setSession({ access_token, refresh_token })
        if (error) {
          setErrorMsg(error.message)
          setStatus('error')
          return
        }
        router.replace(next)
        return
      }

      if (code) {
        // PKCE flow
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) {
          setErrorMsg(error.message)
          setStatus('error')
          return
        }
        router.replace(next)
        return
      }

      // Nothing to work with
      setErrorMsg('Invalid or missing confirmation token.')
      setStatus('error')
    }

    handle()
  }, [router, searchParams])

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-neutral-50">
        <div className="card max-w-md w-full text-center py-12 px-6">
          <p className="text-4xl mb-4">⚠️</p>
          <h1 className="font-heading font-bold text-xl text-neutral-900 mb-2">Link problem</h1>
          <p className="font-body text-sm text-neutral-500 mb-6">{errorMsg}</p>
          <a href="/auth/login" className="btn-primary inline-block">Go to Login</a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-[#007BFF] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="font-body text-sm text-neutral-500">Verifying your link…</p>
      </div>
    </div>
  )
}

export default function ConfirmPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="w-8 h-8 border-2 border-[#007BFF] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ConfirmInner />
    </Suspense>
  )
}
