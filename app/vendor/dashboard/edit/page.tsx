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

  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (formData.shop_name.trim().length < 2) {
      errors.shop_name = 'Shop name must be at least 2 characters'
    }

    if (!validateInstagramHandle(formData.instagram_handle)) {
      errors.instagram_handle = 'Invalid Instagram handle'
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link href="/vendor/dashboard" className="text-amber-600 hover:text-amber-700 mb-6 inline-block">
          ← Back to Dashboard
        </Link>

        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Edit Profile</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-sm">
                {error}
              </div>
            )}

            {saved && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded text-sm">
                Profile updated successfully!
              </div>
            )}

            {/* Profile Picture */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Profile Picture
              </label>
              <div className="flex items-center gap-4">
                {previewUrl ? (
                  <div className="w-24 h-24 rounded-lg overflow-hidden border-2 border-amber-300">
                    <img
                      src={previewUrl}
                      alt="Profile preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 text-gray-400">
                    📷
                  </div>
                )}
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="block text-sm text-gray-600 file:mr-4 file:px-4 file:py-2 file:rounded-lg file:border-0 file:bg-amber-600 file:text-white file:cursor-pointer hover:file:bg-amber-700"
                  />
                  <p className="text-xs text-gray-700 mt-1">Max 5MB • JPG, PNG, GIF</p>
                </div>
              </div>
            </div>

            {/* Shop Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Shop Name *
              </label>
              <input
                type="text"
                name="shop_name"
                value={formData.shop_name}
                onChange={handleChange}
                required
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
                  validationErrors.shop_name ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {validationErrors.shop_name && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.shop_name}</p>
              )}
            </div>

            {/* Instagram Handle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Instagram Handle *
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-3 bg-gray-100 text-gray-600 border border-r-0 border-gray-300 rounded-l-lg">
                  @
                </span>
                <input
                  type="text"
                  name="instagram_handle"
                  value={formData.instagram_handle}
                  onChange={handleChange}
                  required
                  className={`w-full px-4 py-2 border rounded-r-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
                    validationErrors.instagram_handle ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              </div>
              {validationErrors.instagram_handle && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.instagram_handle}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                rows={4}
              />
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <Link
                href="/vendor/dashboard"
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-900 font-semibold py-2 px-4 rounded-lg text-center transition-colors"
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
