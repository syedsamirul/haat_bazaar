'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import Logo from '@/components/Logo'

export default function AdminAddVendorPage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    shop_name: '',
    instagram_handle: '',
    whatsapp_number: '',
    website_url: '',
    description: '',
    category: 'other',
  })

  useEffect(() => {
    checkAdmin()
  }, [])

  const checkAdmin = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push('/auth/login')
      return
    }

    const { data: adminRow } = await supabase
      .from('admins')
      .select('id')
      .eq('id', user.id)
      .maybeSingle()

    setIsAdmin(!!adminRow)
    setChecking(false)
  }

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%'
    const values = new Uint32Array(14)
    window.crypto.getRandomValues(values)
    const pwd = Array.from(values, (n) => chars[n % chars.length]).join('')
    setFormData((prev) => ({ ...prev, password: pwd }))
    setShowPassword(true)
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.instagram_handle && !formData.whatsapp_number) {
      setError('Add at least an Instagram handle or WhatsApp number')
      return
    }

    setLoading(true)

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        setError('Your session expired — log in again')
        return
      }

      const website_url = formData.website_url
        ? formData.website_url.match(/^https?:\/\//)
          ? formData.website_url
          : `https://${formData.website_url}`
        : null

      const res = await fetch('/api/admin/create-vendor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ ...formData, website_url }),
      })

      const result = await res.json()

      if (!res.ok) throw new Error(result.error || 'Failed to create vendor')

      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'Failed to create vendor')
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-canvas text-ink flex items-center justify-center">
        <p className="text-ink-muted text-sm">Checking access...</p>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-canvas text-ink flex items-center justify-center px-4">
        <div className="bg-surface border border-line rounded-lg p-8 max-w-md text-center">
          <div className="text-5xl mb-4">🔒</div>
          <h1 className="font-bold text-lg uppercase tracking-tight mb-2">Access Denied</h1>
          <p className="text-sm text-ink-muted mb-6">You don't have admin access.</p>
          <Link href="/" className="text-flash text-sm font-bold">
            ← Back to home
          </Link>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-canvas text-ink flex items-center justify-center px-4">
        <div className="bg-surface border border-line rounded-lg p-8 w-full max-w-md text-center">
          <div className="mb-4 text-5xl">✓</div>
          <h1 className="font-bold text-xl uppercase tracking-tight text-flash mb-2">
            Vendor created
          </h1>
          <p className="text-sm text-ink-muted mb-6">
            No verification email needed — this account is ready to log in immediately. Share
            these credentials with the vendor:
          </p>
          <div className="bg-surface-2 border border-line rounded-lg p-4 text-left mb-6">
            <p className="text-xs uppercase tracking-wide text-ink-muted mb-1">Email</p>
            <p className="font-mono text-sm mb-3">{formData.email}</p>
            <p className="text-xs uppercase tracking-wide text-ink-muted mb-1">Password</p>
            <p className="font-mono text-sm">{formData.password}</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/admin/add-vendor"
              onClick={() => window.location.reload()}
              className="flex-1 bg-flash hover:bg-flash-dark text-[#17140f] font-bold text-sm uppercase tracking-wide py-3 rounded-lg text-center transition-colors"
            >
              Add another
            </Link>
            <Link
              href="/admin"
              className="flex-1 border border-line hover:border-ink-muted text-ink font-bold text-sm uppercase tracking-wide py-3 rounded-lg text-center transition-colors"
            >
              Back to admin
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <div className="max-w-xl mx-auto px-5 py-8">
        <Link href="/admin" className="text-xs text-ink-muted hover:text-ink transition-colors">
          ← Back to admin
        </Link>

        <div className="bg-surface border border-line rounded-lg p-8 mt-6">
          <div className="mb-2">
            <Logo className="text-lg" />
          </div>
          <h1 className="font-bold text-xl uppercase tracking-tight mb-1">Add vendor manually</h1>
          <p className="text-sm text-ink-muted mb-6">
            Creates an account with email verification already bypassed — ready to log in
            immediately.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-surface-2 border border-flash/40 text-flash px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs uppercase tracking-wide text-ink-muted mb-1">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 bg-surface-2 border border-line rounded-lg text-sm text-ink focus:outline-none focus:border-flash"
                placeholder="vendor@email.com"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs uppercase tracking-wide text-ink-muted">
                  Password *
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
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={8}
                className="w-full px-4 py-2 bg-surface-2 border border-line rounded-lg text-sm text-ink font-mono focus:outline-none focus:border-flash"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wide text-ink-muted mb-1">
                Shop Name *
              </label>
              <input
                type="text"
                name="shop_name"
                value={formData.shop_name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 bg-surface-2 border border-line rounded-lg text-sm text-ink focus:outline-none focus:border-flash"
                placeholder="My Awesome Shop"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wide text-ink-muted mb-1">
                Instagram Handle
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-3 bg-surface-2 text-ink-muted border border-r-0 border-line rounded-l-lg font-mono text-sm">
                  @
                </span>
                <input
                  type="text"
                  name="instagram_handle"
                  value={formData.instagram_handle}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-surface-2 border border-line rounded-r-lg text-sm text-ink font-mono focus:outline-none focus:border-flash"
                  placeholder="myshop"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wide text-ink-muted mb-1">
                WhatsApp Number
              </label>
              <input
                type="tel"
                name="whatsapp_number"
                value={formData.whatsapp_number}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-surface-2 border border-line rounded-lg text-sm text-ink font-mono focus:outline-none focus:border-flash"
                placeholder="+8801XXXXXXXXX"
              />
              <p className="text-xs text-ink-muted mt-1">At least Instagram or WhatsApp is required.</p>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wide text-ink-muted mb-1">
                Website
              </label>
              <input
                type="text"
                name="website_url"
                value={formData.website_url}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-surface-2 border border-line rounded-lg text-sm text-ink font-mono focus:outline-none focus:border-flash"
                placeholder="myshop.com"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wide text-ink-muted mb-1">
                Category
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-surface-2 border border-line rounded-lg text-sm text-ink focus:outline-none focus:border-flash"
              >
                <option value="clothing">Clothing</option>
                <option value="accessories">Accessories</option>
                <option value="beauty">Beauty</option>
                <option value="crafts">Crafts</option>
                <option value="food">Food</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wide text-ink-muted mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-surface-2 border border-line rounded-lg text-sm text-ink focus:outline-none focus:border-flash"
                rows={3}
                placeholder="Tell buyers about this shop..."
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-flash hover:bg-flash-dark disabled:opacity-50 text-[#17140f] font-bold text-sm uppercase tracking-wide py-3 rounded-lg transition-colors"
            >
              {loading ? 'Creating...' : 'Create vendor account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
