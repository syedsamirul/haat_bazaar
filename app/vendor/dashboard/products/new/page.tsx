'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

type MediaItem = {
  file: File
  previewUrl: string
  type: 'image' | 'video'
}

export default function NewProductPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [coverIndex, setCoverIndex] = useState(0)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'other',
  })

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    const oversized = files.find((f) => f.size > 25 * 1024 * 1024)
    if (oversized) {
      setError(`"${oversized.name}" is over 25MB — please use a smaller file`)
      return
    }

    const newItems: MediaItem[] = files.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
      type: file.type.startsWith('video') ? 'video' : 'image',
    }))

    setMediaItems((prev) => [...prev, ...newItems])
    setError(null)
    e.target.value = ''
  }

  const removeMedia = (index: number) => {
    setMediaItems((prev) => prev.filter((_, i) => i !== index))
    setCoverIndex((prev) => {
      if (index === prev) return 0
      if (index < prev) return prev - 1
      return prev
    })
  }

  const uploadAllMedia = async (vendorId: string, productId: string) => {
    const uploaded: { url: string; type: 'image' | 'video' }[] = []

    for (let i = 0; i < mediaItems.length; i++) {
      const item = mediaItems[i]
      const fileExt = item.file.name.split('.').pop()
      const fileName = `${vendorId}/${productId}-${i}-${Date.now()}.${fileExt}`

      const { error } = await supabase.storage
        .from('product-images')
        .upload(fileName, item.file, { upsert: true })

      if (error) throw error

      const { data } = supabase.storage.from('product-images').getPublicUrl(fileName)
      uploaded.push({ url: data.publicUrl, type: item.type })
    }

    return uploaded
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (mediaItems.length === 0) {
      setError('Add at least one photo or video')
      return
    }

    setLoading(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      // Create the product first so we have an id to namespace media under
      const { data: product, error: productError } = await supabase
        .from('products')
        .insert({
          vendor_id: user.id,
          name: formData.name,
          description: formData.description,
          price: parseFloat(formData.price),
          category: formData.category,
          in_stock: true,
        })
        .select()
        .single()

      if (productError || !product) throw productError

      const uploaded = await uploadAllMedia(user.id, product.id)

      const mediaRows = uploaded.map((m, i) => ({
        product_id: product.id,
        media_url: m.url,
        media_type: m.type,
        is_cover: i === coverIndex,
        sort_order: i,
      }))

      const { error: mediaError } = await supabase.from('product_media').insert(mediaRows)
      if (mediaError) throw mediaError

      // Keep products.image_url synced to the cover image for places that
      // only show a single thumbnail (vendor page grid, search results)
      const { error: coverError } = await supabase
        .from('products')
        .update({ image_url: uploaded[coverIndex].url })
        .eq('id', product.id)

      if (coverError) throw coverError

      router.push('/vendor/dashboard')
    } catch (err: any) {
      setError(err.message || 'Failed to create product')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <div className="max-w-xl mx-auto px-5 py-8">
        <Link href="/vendor/dashboard" className="text-xs text-ink-muted hover:text-ink transition-colors">
          ← Back to dashboard
        </Link>

        <div className="bg-surface border border-line rounded-lg p-8 mt-6">
          <h1 className="font-bold text-xl uppercase tracking-tight mb-6">Add new product</h1>

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
                placeholder="e.g., Handmade Saree"
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
                placeholder="Tell customers about this product..."
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
                  placeholder="0"
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
                Photos & Videos
              </label>

              {mediaItems.length > 0 && (
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {mediaItems.map((item, i) => (
                    <div key={i} className="relative">
                      <div
                        className={`aspect-square rounded-lg overflow-hidden border-2 ${
                          i === coverIndex ? 'border-flash' : 'border-line'
                        }`}
                      >
                        {item.type === 'video' ? (
                          <video src={item.previewUrl} className="w-full h-full object-cover" muted />
                        ) : (
                          <img src={item.previewUrl} className="w-full h-full object-cover" alt="" />
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeMedia(i)}
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-flash text-[#17140f] text-xs font-bold flex items-center justify-center"
                        aria-label="Remove"
                      >
                        ✕
                      </button>
                      <button
                        type="button"
                        onClick={() => setCoverIndex(i)}
                        className={`w-full mt-1 text-[10px] font-bold uppercase tracking-wide py-1 rounded ${
                          i === coverIndex
                            ? 'bg-flash text-[#17140f]'
                            : 'border border-line text-ink-muted hover:border-ink-muted'
                        }`}
                      >
                        {i === coverIndex ? 'Cover' : 'Set as cover'}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <input
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={handleFilesChange}
                className="block text-sm text-ink-muted file:mr-4 file:px-4 file:py-2 file:rounded-lg file:border-0 file:bg-flash file:text-[#17140f] file:font-bold file:cursor-pointer hover:file:bg-flash-dark"
              />
              <p className="text-xs text-ink-muted mt-1">
                Max 25MB each • The cover photo shows on your shop page
              </p>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-flash hover:bg-flash-dark disabled:opacity-50 text-[#17140f] font-bold text-sm uppercase tracking-wide py-3 rounded-lg transition-colors"
              >
                {loading ? 'Creating...' : 'Create product'}
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
