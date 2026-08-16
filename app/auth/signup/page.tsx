'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function SignupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [needsVerification, setNeedsVerification] = useState(false)
  const [profileImage, setProfileImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    shop_name: '',
    instagram_handle: '',
    description: '',
  })

  // Validation functions
  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const validatePassword = (password: string) => {
    return password.length >= 8
  }

  const validateInstagramHandle = (handle: string) => {
    return /^[a-zA-Z0-9_.]{1,30}$/.test(handle)
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!validateEmail(formData.email)) {
      errors.email = 'Invalid email address'
    }

    if (!validatePassword(formData.password)) {
      errors.password = 'Password must be at least 8 characters'
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match'
    }

    if (formData.shop_name.trim().length < 2) {
      errors.shop_name = 'Shop name must be at least 2 characters'
    }

    if (!validateInstagramHandle(formData.instagram_handle)) {
      errors.instagram_handle = 'Invalid Instagram handle'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image must be less than 5MB')
        return
      }

      setProfileImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadProfileImage = async (userId: string) => {
    if (!profileImage) return null

    const fileExt = profileImage.name.split('.').pop()
    const fileName = `${userId}/profile.${fileExt}`

    const { error } = await supabase.storage
      .from('vendor-profiles')
      .upload(fileName, profileImage, { upsert: true })

    if (error) throw error

    const { data } = supabase.storage.from('vendor-profiles').getPublicUrl(fileName)
    return data.publicUrl
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      // Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (authError) throw authError

      if (!authData.user) throw new Error('Signup failed')

      // Upload profile image if provided
      let profileImageUrl = null
      if (profileImage) {
        profileImageUrl = await uploadProfileImage(authData.user.id)
      }

      // Create vendor profile
      const { error: vendorError } = await supabase.from('vendors').insert({
        id: authData.user.id,
        instagram_handle: formData.instagram_handle.toLowerCase(),
        shop_name: formData.shop_name,
        description: formData.description,
        profile_image_url: profileImageUrl,
      })

      if (vendorError) throw vendorError

      setSuccess(true)

      if (authData.session) {
        // Email confirmation is disabled — user is already logged in
        setTimeout(() => {
          router.push('/vendor/dashboard')
        }, 2000)
      } else {
        // Email confirmation required — no session yet
        setNeedsVerification(true)
      }
    } catch (err: any) {
      setError(err.message || 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  if (success && needsVerification) {
    return (
      <div className="min-h-screen bg-canvas text-ink flex items-center justify-center px-4">
        <div className="bg-surface border border-line rounded-lg p-8 w-full max-w-md text-center">
          <div className="mb-4 text-5xl">📧</div>
          <h1 className="font-bold text-xl uppercase tracking-tight mb-2">Check your email</h1>
          <p className="text-sm text-ink-muted mb-4">
            We've sent a confirmation link to <span className="text-ink font-medium">{formData.email}</span>.
            Click the link to verify your account and access your dashboard.
          </p>
          <p className="text-xs text-ink-muted mb-6">
            Didn't get it? Check your spam folder, or{' '}
            <button
              onClick={async () => {
                await supabase.auth.resend({ type: 'signup', email: formData.email })
              }}
              className="text-flash font-bold underline"
            >
              resend the email
            </button>
            .
          </p>
          <Link href="/auth/login" className="inline-block text-flash text-sm font-bold">
            ← Back to login
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
          <h1 className="font-bold text-xl uppercase tracking-tight text-flash mb-2">Account created</h1>
          <p className="text-sm text-ink-muted mb-4">
            Welcome to Haat Bazaar. Your account has been successfully created.
          </p>
          <p className="text-xs text-ink-muted">
            Redirecting to your dashboard...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-canvas text-ink flex items-center justify-center px-4 py-8">
      <div className="bg-surface border border-line rounded-lg p-8 w-full max-w-md">
        <h1 className="font-bold text-xl uppercase tracking-widest text-center mb-2">
          Haat Bazaar
        </h1>
        <p className="text-center text-sm text-ink-muted mb-8">
          Register your Instagram shop
        </p>

        <form onSubmit={handleSignup} className="space-y-4">
          {error && (
            <div className="bg-surface-2 border border-flash/40 text-flash px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Profile Picture Upload */}
          <div>
            <label className="block text-xs uppercase tracking-wide text-ink-muted mb-2">
              Profile picture
            </label>
            <div className="flex flex-col items-center gap-4">
              {previewUrl ? (
                <div className="w-24 h-24 rounded-lg overflow-hidden border border-flash">
                  <img
                    src={previewUrl}
                    alt="Profile preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-24 h-24 rounded-lg border border-dashed border-line flex items-center justify-center bg-surface-2 text-ink-muted">
                  📷
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="block text-sm text-ink-muted file:mr-4 file:px-4 file:py-2 file:rounded-lg file:border-0 file:bg-flash file:text-[#17140f] file:font-bold file:cursor-pointer hover:file:bg-flash-dark"
              />
              <p className="text-xs text-ink-muted">Max 5MB • JPG, PNG, GIF</p>
            </div>
          </div>

          {/* Email */}
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
              className={`w-full px-4 py-2 bg-surface-2 border rounded-lg text-sm text-ink focus:outline-none focus:border-flash ${
                validationErrors.email ? 'border-flash' : 'border-line'
              }`}
              placeholder="your@email.com"
            />
            {validationErrors.email && (
              <p className="text-flash text-xs mt-1">{validationErrors.email}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs uppercase tracking-wide text-ink-muted mb-1">
              Password (min 8 characters) *
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className={`w-full px-4 py-2 bg-surface-2 border rounded-lg text-sm text-ink focus:outline-none focus:border-flash ${
                validationErrors.password ? 'border-flash' : 'border-line'
              }`}
              placeholder="••••••••"
            />
            {validationErrors.password && (
              <p className="text-flash text-xs mt-1">{validationErrors.password}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs uppercase tracking-wide text-ink-muted mb-1">
              Confirm Password *
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className={`w-full px-4 py-2 bg-surface-2 border rounded-lg text-sm text-ink focus:outline-none focus:border-flash ${
                validationErrors.confirmPassword ? 'border-flash' : 'border-line'
              }`}
              placeholder="••••••••"
            />
            {validationErrors.confirmPassword && (
              <p className="text-flash text-xs mt-1">{validationErrors.confirmPassword}</p>
            )}
          </div>

          {/* Shop Name */}
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
              className={`w-full px-4 py-2 bg-surface-2 border rounded-lg text-sm text-ink focus:outline-none focus:border-flash ${
                validationErrors.shop_name ? 'border-flash' : 'border-line'
              }`}
              placeholder="My Awesome Shop"
            />
            {validationErrors.shop_name && (
              <p className="text-flash text-xs mt-1">{validationErrors.shop_name}</p>
            )}
          </div>

          {/* Instagram Handle */}
          <div>
            <label className="block text-xs uppercase tracking-wide text-ink-muted mb-1">
              Instagram Handle *
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
                required
                className={`w-full px-4 py-2 bg-surface-2 border rounded-r-lg text-sm text-ink font-mono focus:outline-none focus:border-flash ${
                  validationErrors.instagram_handle ? 'border-flash' : 'border-line'
                }`}
                placeholder="myshop"
              />
            </div>
            {validationErrors.instagram_handle && (
              <p className="text-flash text-xs mt-1">{validationErrors.instagram_handle}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs uppercase tracking-wide text-ink-muted mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-surface-2 border border-line rounded-lg text-sm text-ink focus:outline-none focus:border-flash"
              placeholder="Tell customers about your shop..."
              rows={3}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-flash hover:bg-flash-dark disabled:opacity-50 text-[#17140f] font-bold text-sm uppercase tracking-wide py-3 rounded-lg transition-colors"
          >
            {loading ? 'Creating your shop...' : 'Create shop account'}
          </button>
        </form>

        <p className="text-center text-sm text-ink-muted mt-6">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-flash font-bold">
            Login
          </Link>
        </p>
      </div>
    </div>
  )
}
