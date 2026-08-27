'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Vendor, Product, ProductMedia } from '@/lib/types'
import Link from 'next/link'
import { track } from '@vercel/analytics'
import { isProductLiked, setProductLiked } from '@/lib/likes'

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill={filled ? '#FF5A1F' : 'none'}
      stroke={filled ? '#FF5A1F' : 'currentColor'}
      strokeWidth="2"
    >
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
    </svg>
  )
}

export default function ProductDetailPage() {
  const params = useParams()
  const vendorId = params.id as string
  const productId = params.productId as string

  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [product, setProduct] = useState<Product | null>(null)
  const [media, setMedia] = useState<ProductMedia[]>([])
  const [current, setCurrent] = useState(0)
  const [loading, setLoading] = useState(true)
  const [liked, setLiked] = useState(false)

  useEffect(() => {
    fetchData()
  }, [productId])

  const fetchData = async () => {
    try {
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single()

      if (productError || !productData) throw productError

      setProduct(productData)
      setLiked(isProductLiked(productId))

      const { data: vendorData } = await supabase
        .from('vendors')
        .select('*')
        .eq('id', vendorId)
        .single()

      setVendor(vendorData)

      const { data: mediaData } = await supabase
        .from('product_media')
        .select('*')
        .eq('product_id', productId)
        .order('sort_order', { ascending: true })

      let items = mediaData || []
      // Fall back to the product's single image if no media rows exist
      // (covers products created before this feature)
      if (items.length === 0 && productData.image_url) {
        items = [
          {
            id: 'fallback',
            product_id: productId,
            media_url: productData.image_url,
            media_type: 'image',
            is_cover: true,
            sort_order: 0,
            created_at: '',
          },
        ]
      }
      setMedia(items)

      const coverIdx = items.findIndex((m) => m.is_cover)
      setCurrent(coverIdx >= 0 ? coverIdx : 0)
    } catch (error) {
      console.error('Error fetching product:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async () => {
    const nextLiked = !liked
    setLiked(nextLiked)
    setProduct((prev) =>
      prev ? { ...prev, like_count: Math.max(0, prev.like_count + (nextLiked ? 1 : -1)) } : prev
    )
    setProductLiked(productId, nextLiked)
    await supabase.rpc(nextLiked ? 'like_product' : 'unlike_product', { target_id: productId })
    track(nextLiked ? 'product_like' : 'product_unlike', { product_id: productId })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas text-ink flex items-center justify-center">
        <p className="text-ink-muted text-sm">Loading...</p>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-canvas text-ink flex items-center justify-center">
        <div className="text-center">
          <p className="text-ink-muted text-sm mb-4">Product not found</p>
          <Link href={`/vendors/${vendorId}`} className="text-flash text-sm font-bold">
            ← Back to shop
          </Link>
        </div>
      </div>
    )
  }

  const instagramUrl = vendor?.instagram_handle
    ? `https://instagram.com/${vendor.instagram_handle}`
    : null
  const whatsappUrl = vendor?.whatsapp_number
    ? `https://wa.me/${vendor.whatsapp_number.replace(/^\+/, '')}`
    : null

  const activeMedia = media[current]

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <nav className="flex justify-between items-center px-5 py-4 border-b border-line max-w-2xl mx-auto">
        <Link href={`/vendors/${vendorId}`} className="text-xs text-ink-muted hover:text-ink transition-colors">
          ← Back to shop
        </Link>
      </nav>

      <div className="max-w-2xl mx-auto px-5 py-6">
        {/* Media carousel */}
        <div className="relative aspect-square bg-surface-2 rounded-lg overflow-hidden mb-3">
          {activeMedia ? (
            activeMedia.media_type === 'video' ? (
              <video
                src={activeMedia.media_url}
                className="w-full h-full object-cover"
                controls
                playsInline
              />
            ) : (
              <img
                src={activeMedia.media_url}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            )
          ) : (
            <div className="flex items-center justify-center h-full text-ink-muted text-sm">
              No image
            </div>
          )}

          {media.length > 1 && (
            <>
              <button
                onClick={() => setCurrent((c) => (c - 1 + media.length) % media.length)}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-canvas/70 text-ink flex items-center justify-center"
                aria-label="Previous"
              >
                ‹
              </button>
              <button
                onClick={() => setCurrent((c) => (c + 1) % media.length)}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-canvas/70 text-ink flex items-center justify-center"
                aria-label="Next"
              >
                ›
              </button>
            </>
          )}
        </div>

        {media.length > 1 && (
          <div className="flex gap-2 mb-6 overflow-x-auto">
            {media.map((m, i) => (
              <button
                key={m.id}
                onClick={() => setCurrent(i)}
                className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 ${
                  i === current ? 'border-flash' : 'border-line'
                }`}
              >
                {m.media_type === 'video' ? (
                  <video src={m.media_url} className="w-full h-full object-cover" muted />
                ) : (
                  <img src={m.media_url} className="w-full h-full object-cover" alt="" />
                )}
              </button>
            ))}
          </div>
        )}

        {/* Product info */}
        <div className="flex items-start justify-between gap-4 mb-2">
          <h1 className="font-bold text-lg text-ink">{product.name}</h1>
          <button
            onClick={handleLike}
            className="flex flex-col items-center gap-0.5 flex-shrink-0"
            aria-label={liked ? 'Unlike product' : 'Like product'}
          >
            <HeartIcon filled={liked} />
            <span className="font-mono text-[10px] text-ink-muted">{product.like_count}</span>
          </button>
        </div>
        <p className="font-mono text-xl text-flash mb-4">৳{product.price.toFixed(2)}</p>
        {product.description && (
          <p className="text-sm text-ink-muted leading-relaxed mb-6">{product.description}</p>
        )}

        {/* Vendor mini-card */}
        {vendor && (
          <Link
            href={`/vendors/${vendor.id}`}
            className="flex items-center gap-3 bg-surface border border-line rounded-lg p-3 mb-6 hover:border-ink-muted transition-colors"
          >
            <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-2 flex-shrink-0">
              {vendor.profile_image_url && (
                <img
                  src={vendor.profile_image_url}
                  alt={vendor.shop_name}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-ink truncate">{vendor.shop_name}</p>
              <p className="text-xs text-ink-muted">View shop →</p>
            </div>
          </Link>
        )}

        <div className="flex gap-3">
          {instagramUrl && (
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track('visit_instagram', { vendor_id: vendorId, product_id: productId })}
              className="flex-1 bg-flash hover:bg-flash-dark text-[#17140f] font-bold text-xs uppercase tracking-wide py-3 rounded-lg text-center transition-colors"
            >
              Order on Instagram
            </a>
          )}
          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track('contact_whatsapp', { vendor_id: vendorId, product_id: productId })}
              className={`flex-1 font-bold text-xs uppercase tracking-wide py-3 rounded-lg text-center transition-colors ${
                instagramUrl
                  ? 'border border-line hover:border-ink-muted text-ink'
                  : 'bg-flash hover:bg-flash-dark text-[#17140f]'
              }`}
            >
              WhatsApp
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
