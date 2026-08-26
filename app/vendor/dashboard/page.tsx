'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Vendor, Product } from '@/lib/types'
import Link from 'next/link'
import Logo from '@/components/Logo'

export default function VendorDashboard() {
  const router = useRouter()
  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      // Fetch vendor data
      const { data: vendorData, error: vendorError } = await supabase
        .from('vendors')
        .select('*')
        .eq('id', user.id)
        .single()

      if (vendorError || !vendorData) {
        router.push('/auth/signup')
        return
      }

      setVendor(vendorData)

      // Fetch products
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .eq('vendor_id', user.id)
        .order('created_at', { ascending: false })

      setProducts(productsData || [])
    } catch (error) {
      console.error('Auth check failed:', error)
      router.push('/auth/login')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Delete this product?')) return

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId)

    if (error) {
      alert('Error deleting product')
      return
    }

    setProducts(products.filter((p) => p.id !== productId))
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
        <p className="text-ink-muted text-sm">Vendor not found</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-canvas text-ink">
      {/* Header */}
      <div className="border-b border-line">
        <div className="max-w-5xl mx-auto px-5 py-6 flex justify-between items-center">
          <Link href="/"><Logo className="text-2xl" /></Link>
          <button
            onClick={handleLogout}
            className="text-xs text-ink-muted hover:text-ink transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-5 py-8">
        {/* Vendor Info */}
        <div className="bg-surface border border-line rounded-lg p-6 mb-8">
          <div className="flex justify-between items-start gap-6 flex-wrap">
            <div className="flex gap-5">
              <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-surface-2 border border-line">
                {vendor.profile_image_url ? (
                  <img
                    src={vendor.profile_image_url}
                    alt={vendor.shop_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-ink-muted text-2xl">
                    📷
                  </div>
                )}
              </div>
              <div>
                <h1 className="font-bold text-xl uppercase tracking-tight mb-1">
                  {vendor.shop_name}
                </h1>
                {vendor.instagram_handle && (
                  <p className="font-mono text-xs text-ink-muted mb-1">@{vendor.instagram_handle}</p>
                )}
                {vendor.website_url && (
                  <a
                    href={vendor.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs text-flash hover:underline block mb-2"
                  >
                    {vendor.website_url.replace(/^https?:\/\//, '')}
                  </a>
                )}
                <p className="text-sm text-ink-muted">{vendor.description}</p>
              </div>
            </div>
            <Link
              href={`/vendor/dashboard/edit`}
              className="border border-line hover:border-ink-muted text-ink text-xs font-bold uppercase tracking-wide px-4 py-2 rounded-lg whitespace-nowrap transition-colors"
            >
              Edit profile
            </Link>
          </div>

          <div className="flex gap-6 mt-5 pt-5 border-t border-line">
            <div>
              <p className="font-mono text-lg font-bold">{vendor.view_count.toLocaleString()}</p>
              <p className="text-[10px] uppercase tracking-wide text-ink-muted">Page views</p>
            </div>
            <div>
              <p className="font-mono text-lg font-bold text-flash">{vendor.like_count.toLocaleString()}</p>
              <p className="text-[10px] uppercase tracking-wide text-ink-muted">Page likes</p>
            </div>
          </div>
        </div>

        {/* Products Section */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-sm uppercase tracking-wide text-ink-muted">Your products</h2>
            <Link
              href="/vendor/dashboard/products/new"
              className="bg-flash hover:bg-flash-dark text-[#17140f] text-xs font-bold uppercase tracking-wide px-4 py-2 rounded-lg transition-colors"
            >
              Add product
            </Link>
          </div>

          {products.length === 0 ? (
            <div className="border border-line rounded-lg p-12 text-center">
              <p className="text-ink-muted text-sm mb-4">No products yet</p>
              <Link
                href="/vendor/dashboard/products/new"
                className="inline-block bg-flash hover:bg-flash-dark text-[#17140f] text-xs font-bold uppercase tracking-wide px-6 py-2.5 rounded-lg transition-colors"
              >
                Add your first product
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="bg-surface border border-line rounded-lg overflow-hidden"
                >
                  <div className="aspect-square bg-surface-2">
                    {product.image_url && (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-medium text-sm text-ink mb-1 truncate">
                      {product.name}
                    </h3>
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-mono text-sm text-flash">
                        ৳{product.price}
                      </p>
                      <p className="font-mono text-[10px] text-ink-muted">{product.like_count} likes</p>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        href={`/vendor/dashboard/products/${product.id}/edit`}
                        className="flex-1 border border-line hover:border-ink-muted text-ink px-3 py-1.5 rounded-lg text-center text-xs font-bold uppercase transition-colors"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="flex-1 border border-flash/40 hover:border-flash text-flash px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
