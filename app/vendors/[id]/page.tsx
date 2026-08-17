'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Vendor, Product } from '@/lib/types'
import Link from 'next/link'
import { track } from '@vercel/analytics'
import { isVendorLiked, setVendorLiked, isProductLiked, setProductLiked } from '@/lib/likes'

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill={filled ? '#FF5A1F' : 'none'}
      stroke={filled ? '#FF5A1F' : 'currentColor'}
      strokeWidth="2"
    >
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
    </svg>
  )
}

export default function VendorDetailPage() {
  const params = useParams()
  const vendorId = params.id as string

  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [vendorLiked, setVendorLikedState] = useState(false)
  const [likedProducts, setLikedProducts] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchVendorAndProducts()
    supabase.rpc('increment_vendor_view', { target_id: vendorId })
  }, [vendorId])

  const fetchVendorAndProducts = async () => {
    try {
      const { data: vendorData, error: vendorError } = await supabase
        .from('vendors')
        .select('*')
        .eq('id', vendorId)
        .single()

      if (vendorError || !vendorData) throw vendorError

      setVendor(vendorData)
      setVendorLikedState(isVendorLiked(vendorId))

      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .eq('vendor_id', vendorId)
        .eq('in_stock', true)
        .order('created_at', { ascending: false })

      setProducts(productsData || [])
      setLikedProducts(
        new Set((productsData || []).map((p) => p.id).filter((id) => isProductLiked(id)))
      )
    } catch (error) {
      console.error('Error fetching vendor:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleVendorLike = async () => {
    if (!vendor) return
    const nextLiked = !vendorLiked
    setVendorLikedState(nextLiked)
    setVendor({ ...vendor, like_count: Math.max(0, vendor.like_count + (nextLiked ? 1 : -1)) })
    setVendorLiked(vendorId, nextLiked)
    await supabase.rpc(nextLiked ? 'like_vendor' : 'unlike_vendor', { target_id: vendorId })
    track(nextLiked ? 'vendor_like' : 'vendor_unlike', { vendor_id: vendorId })
  }

  const handleProductLike = async (e: React.MouseEvent, product: Product) => {
    e.preventDefault()
    e.stopPropagation()

    const nextLiked = !likedProducts.has(product.id)
    setLikedProducts((prev) => {
      const next = new Set(prev)
      nextLiked ? next.add(product.id) : next.delete(product.id)
      return next
    })
    setProducts((prev) =>
      prev.map((p) =>
        p.id === product.id
          ? { ...p, like_count: Math.max(0, p.like_count + (nextLiked ? 1 : -1)) }
          : p
      )
    )
    setProductLiked(product.id, nextLiked)
    await supabase.rpc(nextLiked ? 'like_product' : 'unlike_product', { target_id: product.id })
    track(nextLiked ? 'product_like' : 'product_unlike', { product_id: product.id })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas text-ink flex items-center justify-center">
        <p className="text-ink-muted text-sm">Loading...</p>
      </div>
    )
  }

  if (!vendor) {
    return (
      <div className="min-h-screen bg-canvas text-ink flex items-center justify-center">
        <div className="text-center">
          <p className="text-ink-muted text-sm mb-4">Vendor not found</p>
          <Link href="/vendors" className="text-flash text-sm font-bold">
            ← Back to vendors
          </Link>
        </div>
      </div>
    )
  }

  const instagramUrl = vendor.instagram_handle
    ? `https://instagram.com/${vendor.instagram_handle}`
    : null
  const whatsappUrl = vendor.whatsapp_number
    ? `https://wa.me/${vendor.whatsapp_number.replace(/^\+/, '')}`
    : null
  // Product tiles link out to whichever contact method the vendor provided
  const productLinkUrl = instagramUrl || whatsappUrl!
  const productLinkLabel = instagramUrl ? 'View on Instagram' : 'Message on WhatsApp'

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <nav className="flex justify-between items-center px-5 py-4 border-b border-line max-w-3xl mx-auto">
        <Link href="/vendors" className="text-xs text-ink-muted hover:text-ink transition-colors">
          ← Back to vendors
        </Link>
      </nav>

      <div className="max-w-3xl mx-auto px-5 py-8">
        {/* Vendor header with story-ring avatar */}
        <div className="flex items-center gap-4 mb-2">
          <div className="w-20 h-20 rounded-full p-[3px] flex-shrink-0" style={{ background: 'conic-gradient(#FF5A1F, #FFB199, #FF5A1F)' }}>
            <div className="w-full h-full rounded-full bg-canvas p-[3px]">
              <div className="w-full h-full rounded-full overflow-hidden bg-surface-2">
                {vendor.profile_image_url && (
                  <img
                    src={vendor.profile_image_url}
                    alt={vendor.shop_name}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg uppercase tracking-tight truncate">
                {vendor.shop_name}
              </h1>
              {vendor.verified && <span className="text-flash text-sm flex-shrink-0">✓</span>}
            </div>
            {vendor.instagram_handle && (
              <p className="font-mono text-xs text-ink-muted">@{vendor.instagram_handle}</p>
            )}
            <p className="font-mono text-[11px] text-ink-muted mt-0.5">
              {vendor.follower_count.toLocaleString()} followers
            </p>
          </div>
          <button
            onClick={handleVendorLike}
            className="flex flex-col items-center gap-1 flex-shrink-0 px-2"
            aria-label={vendorLiked ? 'Unlike shop' : 'Like shop'}
          >
            <HeartIcon filled={vendorLiked} />
            <span className="font-mono text-[10px] text-ink-muted">{vendor.like_count}</span>
          </button>
        </div>

        <p className="font-mono text-[11px] text-ink-muted mb-6">
          {vendor.view_count.toLocaleString()} views
        </p>

        <p className="text-sm text-ink-muted leading-relaxed mb-6">{vendor.description}</p>

        <div className="flex gap-3 mb-8">
          {instagramUrl && (
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track('visit_instagram', { vendor_id: vendor.id, shop_name: vendor.shop_name })}
              className="flex-1 bg-flash hover:bg-flash-dark text-[#17140f] font-bold text-xs uppercase tracking-wide py-3 rounded-lg text-center transition-colors"
            >
              Visit on Instagram
            </a>
          )}
          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track('contact_whatsapp', { vendor_id: vendor.id, shop_name: vendor.shop_name })}
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

        {/* Product grid */}
        <div>
          <p className="font-mono text-xs text-ink-muted uppercase tracking-wide mb-3">
            {products.length} products
          </p>

          {products.length === 0 ? (
            <div className="border border-line rounded-lg p-12 text-center">
              <p className="text-ink-muted text-sm">No products available yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {products.map((product) => (
                <a
                  key={product.id}
                  href={productLinkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => track('product_click', { vendor_id: vendor.id, product_name: product.name })}
                  className="group block"
                >
                  <div className="aspect-square bg-surface-2 rounded-lg overflow-hidden mb-2 relative">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-ink-muted text-xs">
                        No image
                      </div>
                    )}
                    <div className="absolute inset-0 bg-canvas/0 group-hover:bg-canvas/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <span className="text-xs font-bold uppercase tracking-wide text-ink">
                        {productLinkLabel}
                      </span>
                    </div>
                    <button
                      onClick={(e) => handleProductLike(e, product)}
                      className="absolute top-2 right-2 bg-canvas/70 rounded-full p-1.5 flex items-center gap-1"
                      aria-label={likedProducts.has(product.id) ? 'Unlike product' : 'Like product'}
                    >
                      <HeartIcon filled={likedProducts.has(product.id)} />
                    </button>
                  </div>
                  <p className="text-xs font-medium text-ink truncate">{product.name}</p>
                  <div className="flex items-center justify-between">
                    <p className="font-mono text-xs text-flash">৳{product.price.toFixed(2)}</p>
                    <p className="font-mono text-[10px] text-ink-muted">{product.like_count} likes</p>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
