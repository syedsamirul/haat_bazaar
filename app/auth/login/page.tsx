'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import Logo from '@/components/Logo'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [unverified, setUnverified] = useState(false)
  const [resent, setResent] = useState(false)
  const [resending, setResending] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setUnverified(false)
    setResent(false)
    setLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      router.push('/vendor/dashboard')
    } catch (err: any) {
      if (err.code === 'email_not_confirmed' || /email.*not.*confirm/i.test(err.message || '')) {
        setUnverified(true)
        setError('Your email isn\'t verified yet. Check your inbox for the confirmation link.')
      } else {
        setError(err.message || 'Login failed')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setResending(true)
    setResent(false)
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email })
      if (error) throw error
      setResent(true)
    } catch (err: any) {
      setError(err.message || 'Failed to resend email')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="min-h-screen bg-canvas text-ink flex items-center justify-center px-4">
      <div className="bg-surface border border-line rounded-lg p-8 w-full max-w-md">
        <div className="text-center mb-2">
          <Logo className="text-xl" />
        </div>
        <p className="text-center text-sm text-ink-muted mb-8">
          Vendor login
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="bg-surface-2 border border-flash/40 text-flash px-4 py-3 rounded-lg text-sm">
              <p>{error}</p>
              {unverified && (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending || resent}
                  className="mt-2 text-xs font-bold uppercase underline disabled:opacity-50"
                >
                  {resent ? 'Email sent — check your inbox' : resending ? 'Sending...' : 'Resend verification email'}
                </button>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs uppercase tracking-wide text-ink-muted mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 bg-surface-2 border border-line rounded-lg text-sm text-ink focus:outline-none focus:border-flash"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wide text-ink-muted mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 bg-surface-2 border border-line rounded-lg text-sm text-ink focus:outline-none focus:border-flash"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-flash hover:bg-flash-dark disabled:opacity-50 text-[#17140f] font-bold text-sm uppercase tracking-wide py-3 rounded-lg transition-colors"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="text-center text-sm text-ink-muted mt-6">
          Don't have an account?{' '}
          <Link href="/auth/signup" className="text-flash font-bold">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
