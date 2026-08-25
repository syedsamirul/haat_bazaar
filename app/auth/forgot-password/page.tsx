'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import Logo from '@/components/Logo'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) throw error

      setSent(true)
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-canvas text-ink flex items-center justify-center px-4">
        <div className="bg-surface border border-line rounded-lg p-8 w-full max-w-md text-center">
          <div className="mb-4 text-5xl">📧</div>
          <h1 className="font-bold text-xl uppercase tracking-tight mb-2">Check your email</h1>
          <p className="text-sm text-ink-muted mb-6">
            If an account exists for <span className="text-ink font-medium">{email}</span>,
            we've sent a link to reset your password.
          </p>
          <Link href="/auth/login" className="inline-block text-flash text-sm font-bold">
            ← Back to login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-canvas text-ink flex items-center justify-center px-4">
      <div className="bg-surface border border-line rounded-lg p-8 w-full max-w-md">
        <div className="text-center mb-2">
          <Logo className="text-xl" />
        </div>
        <p className="text-center text-sm text-ink-muted mb-8">
          Reset your password
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-surface-2 border border-flash/40 text-flash px-4 py-3 rounded-lg text-sm">
              {error}
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

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-flash hover:bg-flash-dark disabled:opacity-50 text-[#17140f] font-bold text-sm uppercase tracking-wide py-3 rounded-lg transition-colors"
          >
            {loading ? 'Sending...' : 'Send reset link'}
          </button>
        </form>

        <p className="text-center text-sm text-ink-muted mt-6">
          <Link href="/auth/login" className="text-flash font-bold">
            ← Back to login
          </Link>
        </p>
      </div>
    </div>
  )
}
