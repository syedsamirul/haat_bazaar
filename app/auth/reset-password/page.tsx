'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import Logo from '@/components/Logo'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [validLink, setValidLink] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    // Supabase fires PASSWORD_RECOVERY once it parses the recovery token
    // from the URL and establishes a temporary session for this flow.
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setValidLink(true)
        setChecking(false)
      }
    })

    // Fallback in case the event already fired before this mounted,
    // or the client auto-detected the session from the URL already.
    const checkExisting = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (session) {
        setValidLink(true)
      }
      setChecking(false)
    }
    const timeout = setTimeout(checkExisting, 1500)

    return () => {
      listener.subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [])

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%'
    const values = new Uint32Array(14)
    window.crypto.getRandomValues(values)
    const pwd = Array.from(values, (n) => chars[n % chars.length]).join('')
    setPassword(pwd)
    setConfirmPassword(pwd)
    setShowPassword(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error

      setDone(true)
      setTimeout(() => router.push('/vendor/dashboard'), 2000)
    } catch (err: any) {
      setError(err.message || 'Failed to update password')
    } finally {
      setSaving(false)
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-canvas text-ink flex items-center justify-center px-4">
        <p className="text-ink-muted text-sm">Verifying reset link...</p>
      </div>
    )
  }

  if (!validLink) {
    return (
      <div className="min-h-screen bg-canvas text-ink flex items-center justify-center px-4">
        <div className="bg-surface border border-line rounded-lg p-8 w-full max-w-md text-center">
          <div className="mb-4 text-5xl">⚠️</div>
          <h1 className="font-bold text-lg uppercase tracking-tight mb-2">Link invalid or expired</h1>
          <p className="text-sm text-ink-muted mb-6">
            Password reset links only work once and expire after a while. Request a new one.
          </p>
          <Link
            href="/auth/forgot-password"
            className="inline-block bg-flash hover:bg-flash-dark text-[#17140f] font-bold text-sm uppercase tracking-wide py-2 px-6 rounded-lg transition-colors"
          >
            Request new link
          </Link>
        </div>
      </div>
    )
  }

  if (done) {
    return (
      <div className="min-h-screen bg-canvas text-ink flex items-center justify-center px-4">
        <div className="bg-surface border border-line rounded-lg p-8 w-full max-w-md text-center">
          <div className="mb-4 text-5xl">✓</div>
          <h1 className="font-bold text-xl uppercase tracking-tight text-flash mb-2">Password updated</h1>
          <p className="text-sm text-ink-muted">Redirecting to your dashboard...</p>
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
          Set a new password
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-surface-2 border border-flash/40 text-flash px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs uppercase tracking-wide text-ink-muted">
                New password (min 8 characters)
              </label>
              <button
                type="button"
                onClick={generatePassword}
                className="text-[11px] font-bold uppercase text-flash"
              >
                Generate one
              </button>
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 bg-surface-2 border border-line rounded-lg text-sm text-ink font-mono focus:outline-none focus:border-flash"
              placeholder="••••••••"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs uppercase tracking-wide text-ink-muted">
                Confirm password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="text-[11px] font-bold uppercase text-ink-muted hover:text-ink transition-colors"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-4 py-2 bg-surface-2 border border-line rounded-lg text-sm text-ink font-mono focus:outline-none focus:border-flash"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-flash hover:bg-flash-dark disabled:opacity-50 text-[#17140f] font-bold text-sm uppercase tracking-wide py-3 rounded-lg transition-colors"
          >
            {saving ? 'Saving...' : 'Update password'}
          </button>
        </form>
      </div>
    </div>
  )
}
