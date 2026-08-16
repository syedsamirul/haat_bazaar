'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function AuthCallbackPage() {
  const router = useRouter()
  const [status, setStatus] = useState<'checking' | 'success' | 'error'>('checking')

  useEffect(() => {
    const handleCallback = async () => {
      // The Supabase client auto-detects the session from the URL
      // (access_token / refresh_token in the hash, or a PKCE `code` param).
      // Give it a moment to parse and store the session.
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session) {
        setStatus('success')
        setTimeout(() => {
          router.push('/vendor/dashboard')
        }, 1500)
        return
      }

      // Fallback: some Supabase email templates use a `code` query param
      const params = new URLSearchParams(window.location.search)
      const code = params.get('code')

      if (code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error && data.session) {
          setStatus('success')
          setTimeout(() => {
            router.push('/vendor/dashboard')
          }, 1500)
          return
        }
      }

      setStatus('error')
    }

    handleCallback()
  }, [router])

  return (
    <div className="min-h-screen bg-canvas text-ink flex items-center justify-center px-4">
      <div className="bg-surface border border-line rounded-lg p-8 w-full max-w-md text-center">
        {status === 'checking' && (
          <>
            <div className="mb-4 text-5xl">⏳</div>
            <h1 className="font-bold text-lg uppercase tracking-tight mb-2">Verifying...</h1>
            <p className="text-sm text-ink-muted">Confirming your email, one moment.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="mb-4 text-5xl">✓</div>
            <h1 className="font-bold text-lg uppercase tracking-tight text-flash mb-2">Email verified</h1>
            <p className="text-sm text-ink-muted">Redirecting to your dashboard...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="mb-4 text-5xl">⚠️</div>
            <h1 className="font-bold text-lg uppercase tracking-tight mb-2">
              Verification link invalid or expired
            </h1>
            <p className="text-sm text-ink-muted mb-6">
              Please try logging in, or request a new confirmation email.
            </p>
            <Link
              href="/auth/login"
              className="inline-block bg-flash hover:bg-flash-dark text-[#17140f] font-bold text-sm uppercase tracking-wide py-2 px-6 rounded-lg transition-colors"
            >
              Go to login
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
