'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ProductMedia } from '@/lib/types'
import Link from 'next/link'

type NewMediaItem = {
  file: File
  previewUrl: string
  type: 'image' | 'video'
}

export default function EditProductPage() {
  const router = useRouter()
  const params = useParams()
  const productId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [existingMedia, setExistingMedia] = useState<ProductMedia[]>([])
  const [removedMediaIds, setRemovedMediaIds] = useState<string[]>([])
  const [newMediaItems, setNewMediaItems] = useState<NewMediaItem[]>([])
  // Cover reference: either an existing media id, or "new:<index>"
  const [coverKey, setCoverKey] = useState<string | null>(null)

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

      const { data: media, error: mediaError } = await supabase
        .from('product_media')
        .select('*')
        .eq('product_id', productId)
        .order('sort_order', { ascending: true })

      if (mediaError) throw mediaError

      setExistingMedia(media || [])
      const cover = (media || []).find((m) => m.is_cover)
      setCoverKey(cover ? cover.id : media && media[0] ? media[0].id : null)
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

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    const oversized = files.find((f) => f.size > 25 * 1024 * 1024)
    if (oversized) {
      setError(`"${oversized.name}" is over 25MB — please use a smaller file`)
      return
    }

    const newItems: NewMediaItem[] = files.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
      type: file.type.startsWith('video') ? 'video' : 'image',
    }))

    setNewMediaItems((prev) => [...prev, ...newItems])
    if (!coverKey && newItems.length > 0) setCoverKey(`new:0`)
    setError(null)
    e.target.value = ''
  }

  const removeExisting = (media: ProductMedia) => {
    setExistingMedia((prev) => prev.filter((m) => m.id !== media.id))
    setRemovedMediaIds((prev) => [...prev, media.id])
    if (coverKey === media.id) setCoverKey(null)
  }

  const removeNew = (index: number) => {
    setNewMediaItems((prev) => prev.filter((_, i) => i !== index))
    if (coverKey === `new:${index}`) setCoverKey(null)
  }

  const uploadNewMedia = async (vendorId: string) => {
    const uploaded: { url: string; type: 'image' | 'video' }[] = []

    for (let i = 0; i < newMediaItems.length; i++) {
      const item = newMediaItems[i]
      const fileExt = item.file.name.split('.').pop()
      const fileName = `${vendorId}/${productId}-${i}-${Date.now()}.${fileExt}`

      const { error } = await supabase.storage
        .from('product-images')
        .upload(fileName, item.file)

      if (error) throw error

      const { data } = supabase.storage.from('product-images').getPublicUrl(fileName)
      uploaded.push({ url: data.publicUrl, type: item.type })
    }

    return uploaded
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (existingMedia.length === 0 && newMediaItems.length === 0) {
      setError('A product needs at least one photo or video')
      return
    }

    setSaving(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      // Remove any media the vendor deleted
      if (removedMediaIds.length > 0) {
        const { error: delError } = await supabase
          .from('product_media')
          .delete()
          .in('id', removedMediaIds)
        if (delError) throw delError
      }

      // Upload and insert any newly added media
      const uploaded = await uploadNewMedia(user.id)
      const startOrder = existingMedia.length
      let newRows: { id?: string; url: string }[] = []

      if (uploaded.length > 0) {
        const rows = uploaded.map((m, i) => ({
          product_id: productId,
          media_url: m.url,
          media_type: m.type,
          is_cover: false,
          sort_order: startOrder + i,
        }))

        const { data: inserted, error: mediaError } = await supabase
          .from('product_media')
          .insert(rows)
          .select()

        if (mediaError) throw mediaError
        newRows = (inserted || []).map((r) => ({ id: r.id, url: r.media_url }))
      }

      // Resolve which media is the cover and reset all is_cover flags accordingly
      let coverUrl: string | null = null

      if (coverKey && coverKey.startsWith('new:')) {
        const idx = parseInt(coverKey.split(':')[1], 10)
        coverUrl = newRows[idx]?.url || null
      } else if (coverKey) {
        coverUrl = existingMedia.find((m) => m.id === coverKey)?.media_url || null
      }
      if (!coverUrl) {
        coverUrl = existingMedia[0]?.media_url || newRows[0]?.url || null
      }

      await supabase.from('product_media').update({ is_cover: false }).eq('product_id', productId)

      if (coverKey && coverKey.startsWith('new:')) {
        const idx = parseInt(coverKey.split(':')[1], 10)
        if (newRows[idx]?.id) {
          await supabase.from('product_media').update({ is_cover: true }).eq('id', newRows[idx].id!)
        }
      } else if (coverKey) {
        await supabase.from('product_media').update({ is_cover: true }).eq('id', coverKey)
      }

      const { error: updateError } = await supabase
        .from('products')
        .update({
          name: formData.name,
          description: formData.description,
          price: parseFloat(formData.price),
          category: formData.category,
          image_url: coverUrl,
          updated_at: new Date(),
        })
        .eq('id', productId)

      if (updateError) throw updateError

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
                Photos & Videos
              </label>

              {(existingMedia.length > 0 || newMediaItems.length > 0) && (
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {existingMedia.map((m) => (
                    <div key={m.id} className="relative">
                      <div
                        className={`aspect-square rounded-lg overflow-hidden border-2 ${
                          coverKey === m.id ? 'border-flash' : 'border-line'
                        }`}
                      >
                        {m.media_type === 'video' ? (
                          <video src={m.media_url} className="w-full h-full object-cover" muted />
                        ) : (
                          <img src={m.media_url} className="w-full h-full object-cover" alt="" />
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeExisting(m)}
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-flash text-[#17140f] text-xs font-bold flex items-center justify-center"
                        aria-label="Remove"
                      >
                        ✕
                      </button>
                      <button
                        type="button"
                        onClick={() => setCoverKey(m.id)}
                        className={`w-full mt-1 text-[10px] font-bold uppercase tracking-wide py-1 rounded ${
                          coverKey === m.id
                            ? 'bg-flash text-[#17140f]'
                            : 'border border-line text-ink-muted hover:border-ink-muted'
                        }`}
                      >
                        {coverKey === m.id ? 'Cover' : 'Set as cover'}
                      </button>
                    </div>
                  ))}

                  {newMediaItems.map((item, i) => (
                    <div key={`new-${i}`} className="relative">
                      <div
                        className={`aspect-square rounded-lg overflow-hidden border-2 ${
                          coverKey === `new:${i}` ? 'border-flash' : 'border-line'
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
                        onClick={() => removeNew(i)}
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-flash text-[#17140f] text-xs font-bold flex items-center justify-center"
                        aria-label="Remove"
                      >
                        ✕
                      </button>
                      <button
                        type="button"
                        onClick={() => setCoverKey(`new:${i}`)}
                        className={`w-full mt-1 text-[10px] font-bold uppercase tracking-wide py-1 rounded ${
                          coverKey === `new:${i}`
                            ? 'bg-flash text-[#17140f]'
                            : 'border border-line text-ink-muted hover:border-ink-muted'
                        }`}
                      >
                        {coverKey === `new:${i}` ? 'Cover' : 'Set as cover'}
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
