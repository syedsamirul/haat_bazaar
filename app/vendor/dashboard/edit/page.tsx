'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function EditProfilePage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const [profileImage, setProfileImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState({
    shop_name: '',
    instagram_handle: '',
    whatsapp_number: '',
    description: '',
  })

  useEffect(() => {
    fetchVendor()
  }, [])

  const fetchVendor = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      setUserId(user.id)

      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error || !data) throw error

      setFormData({
        shop_name: data.shop_name,
        instagram_handle: data.instagram_handle,
        whatsapp_number: data.whatsapp_number || '',
        description: data.description || '',
      })
      setPreviewUrl(data.profile_image_url || null)
    } catch (err: any) {
      setError(err.message || 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const validateInstagramHandle = (handle: string) => {
    return /^[a-zA-Z0-9_.]{1,30}$/.test(handle)
  }

  const validateWhatsapp = (number: string) => {
    if (!number) return true // optional field
    return /^\+?[0-9]{8,15}$/.test(number.replace(/[\s-]/g, ''))
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (formData.shop_name.trim().length < 2) {
      errors.shop_name = 'Shop name must be at least 2 characters'
    }

    if (!validateInstagramHandle(formData.instagram_handle)) {
      errors.instagram_handle = 'Invalid Instagram handle'
    }

    if (!validateWhatsapp(formData.whatsapp_number)) {
      errors.whatsapp_number = 'Enter a valid number with country code, e.g. +8801XXXXXXXXX'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
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

  const uploadProfileImage = async (uid: string) => {
    if (!profileImage) return null

    const fileExt = profileImage.name.split('.').pop()
    const fileName = `${uid}/profile.${fileExt}`

    const { error } = await supabase.storage
      .from('vendor-profiles')
      .upload(fileName, profileImage, { upsert: true })

    if (error) throw error

    const { data } = supabase.storage.from('vendor-profiles').getPublicUrl(fileName)
    // cache-bust so the new image shows immediately
    return `${data.publicUrl}?t=${Date.now()}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaved(false)

    if (!validateForm() || !userId) return

    setSaving(true)

    try {
      let profileImageUrl: string | undefined

      if (profileImage) {
        profileImageUrl = (await uploadProfileImage(userId)) || undefined
      }

      const updates: Record<string, any> = {
        shop_name: formData.shop_name,
        instagram_handle: formData.instagram_handle.toLowerCase(),
        whatsapp_number: formData.whatsapp_number.replace(/[\s-]/g, '') || null,
        description: formData.description,
        updated_at: new Date(),
      }

      if (profileImageUrl) {
        updates.profile_image_url = profileImageUrl
      }

      const { error } = await supabase.from('vendors').update(updates).eq('id', userId)

      if (error) throw error

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas text-ink flex items-center justify-center">
        <p className="text-ink-muted text-sm">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <div className="max-w-xl mx-auto px-5 py-8">
        <Link href="/vendor/dashboard" className="text-xs text-ink-muted hover:text-ink mb-6 inline-block transition-colors">
          ← Back to dashboard
        </Link>

        <div className="bg-surface border border-line rounded-lg p-8">
          <h1 className="font-bold text-xl uppercase tracking-tight mb-6">Edit profile</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-surface-2 border border-flash/40 text-flash px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {saved && (
              <div className="bg-surface-2 border border-flash/40 text-flash px-4 py-3 rounded-lg text-sm">
                Profile updated successfully!
              </div>
            )}

            {/* Profile Picture */}
            <div>
              <label className="block text-xs uppercase tracking-wide text-ink-muted mb-2">
                Profile picture
              </label>
              <div className="flex items-center gap-4">
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
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="block text-sm text-ink-muted file:mr-4 file:px-4 file:py-2 file:rounded-lg file:border-0 file:bg-flash file:text-[#17140f] file:font-bold file:cursor-pointer hover:file:bg-flash-dark"
                  />
                  <p className="text-xs text-ink-muted mt-1">Max 5MB • JPG, PNG, GIF</p>
                </div>
              </div>
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
                />
              </div>
              {validationErrors.instagram_handle && (
                <p className="text-flash text-xs mt-1">{validationErrors.instagram_handle}</p>
              )}
            </div>

            {/* WhatsApp Number */}
            <div>
              <label className="block text-xs uppercase tracking-wide text-ink-muted mb-1">
                WhatsApp number
              </label>
              <input
                type="tel"
                name="whatsapp_number"
                value={formData.whatsapp_number}
                onChange={handleChange}
                className={`w-full px-4 py-2 bg-surface-2 border rounded-lg text-sm text-ink font-mono focus:outline-none focus:border-flash ${
                  validationErrors.whatsapp_number ? 'border-flash' : 'border-line'
                }`}
                placeholder="+8801XXXXXXXXX"
              />
              <p className="text-xs text-ink-muted mt-1">Optional, but lets buyers message you directly.</p>
              {validationErrors.whatsapp_number && (
                <p className="text-flash text-xs mt-1">{validationErrors.whatsapp_number}</p>
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
                rows={4}
              />
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-flash hover:bg-flash-dark disabled:opacity-50 text-[#17140f] font-bold text-sm uppercase tracking-wide py-3 rounded-lg transition-colors"
              >
                {saving ? 'Saving...' : 'Save changes'}
              </button>
              <Link
                href="/vendor/dashboard"
                className="flex-1 border border-line hover:border-ink-muted text-ink font-bold text-sm uppercase tracking-wide py-3 rounded-lg text-center transition-colors"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
