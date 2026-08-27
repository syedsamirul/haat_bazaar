'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function EditProductPage() {
  const router = useRouter()
  const params = useParams()
  const productId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'other',
  })

  useEffect(() => {
    fetchProduct()
  }, [])

  const fetchProduct = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single()

      if (error || !data) throw error

      setFormData({
        name: data.name,
        description: data.description || '',
        price: data.price.toString(),
        category: data.category || 'other',
      })
      setPreviewUrl(data.image_url || null)
    } catch (err: any) {
      setError(err.message || 'Failed to load product')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image must be less than 5MB')
        return
      }

      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadProductImage = async (vendorId: string) => {
    if (!imageFile) return null

    const fileExt = imageFile.name.split('.').pop()
    const fileName = `${vendorId}/${productId}-${Date.now()}.${fileExt}`

    const { error } = await supabase.storage
      .from('product-images')
      .upload(fileName, imageFile, { upsert: true })

    if (error) throw error

    const { data } = supabase.storage.from('product-images').getPublicUrl(fileName)
    return data.publicUrl
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaving(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      const updates: Record<string, any> = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        category: formData.category,
        updated_at: new Date(),
      }

      if (imageFile) {
        updates.image_url = await uploadProductImage(user.id)
      }

      const { error } = await supabase.from('products').update(updates).eq('id', productId)

      if (error) throw error

      router.push('/vendor/dashboard')
    } catch (err: any) {
      setError(err.message || 'Failed to update product')
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
        <Link href="/vendor/dashboard" className="text-xs text-ink-muted hover:text-ink transition-colors">
          ← Back to dashboard
        </Link>

        <div className="bg-surface border border-line rounded-lg p-8 mt-6">
          <h1 className="font-bold text-xl uppercase tracking-tight mb-6">Edit product</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-surface-2 border border-flash/40 text-flash px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs uppercase tracking-wide text-ink-muted mb-2">
                Product Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 bg-surface-2 border border-line rounded-lg text-sm text-ink focus:outline-none focus:border-flash"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wide text-ink-muted mb-2">
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wide text-ink-muted mb-2">
                  Price (৳) *
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  required
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-2 bg-surface-2 border border-line rounded-lg text-sm text-ink font-mono focus:outline-none focus:border-flash"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wide text-ink-muted mb-2">
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
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wide text-ink-muted mb-2">
                Product Photo
              </label>
              <div className="flex items-center gap-4">
                {previewUrl ? (
                  <div className="w-24 h-24 rounded-lg overflow-hidden border border-flash flex-shrink-0">
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-lg border border-dashed border-line flex items-center justify-center bg-surface-2 text-ink-muted flex-shrink-0">
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
                  <p className="text-xs text-ink-muted mt-1">Max 5MB • Leave blank to keep current photo</p>
                </div>
              </div>
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
