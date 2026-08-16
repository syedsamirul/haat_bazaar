'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Vendor, Product } from '@/lib/types'
import Link from 'next/link'

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    )
  }

  if (!vendor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Vendor not found</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-amber-900">
            Haat Bazaar
          </Link>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-600 hover:text-gray-900 font-medium"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Vendor Info */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex justify-between items-start gap-6">
            <div className="flex gap-6">
              <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200 border border-gray-200">
                {vendor.profile_image_url ? (
                  <img
                    src={vendor.profile_image_url}
                    alt={vendor.shop_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-3xl">
                    📷
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {vendor.shop_name}
                </h1>
                <p className="text-gray-600 mb-2">@{vendor.instagram_handle}</p>
                <p className="text-gray-600">{vendor.description}</p>
              </div>
            </div>
            <Link
              href={`/vendor/dashboard/edit`}
              className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg whitespace-nowrap"
            >
              Edit Profile
            </Link>
          </div>
        </div>

        {/* Products Section */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Your Products</h2>
            <Link
              href="/vendor/dashboard/products/new"
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
            >
              Add Product
            </Link>
          </div>

          {products.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <p className="text-gray-600 mb-4">No products yet</p>
              <Link
                href="/vendor/dashboard/products/new"
                className="inline-block bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg"
              >
                Add Your First Product
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden"
                >
                  <div className="aspect-square bg-gray-200">
                    {product.image_url && (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-lg text-gray-900 mb-1">
                      {product.name}
                    </h3>
                    <p className="text-2xl font-bold text-amber-600 mb-3">
                      ৳{product.price}
                    </p>
                    <div className="flex gap-2">
                      <Link
                        href={`/vendor/dashboard/products/${product.id}/edit`}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-center text-sm"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm"
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
