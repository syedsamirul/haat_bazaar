'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Vendor, Product } from '@/lib/types'
import Link from 'next/link'

export default function VendorDetailPage() {
  const params = useParams()
  const vendorId = params.id as string

  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchVendorAndProducts()
  }, [vendorId])

  const fetchVendorAndProducts = async () => {
    try {
      // Fetch vendor
      const { data: vendorData, error: vendorError } = await supabase
        .from('vendors')
        .select('*')
        .eq('id', vendorId)
        .single()

      if (vendorError || !vendorData) throw vendorError

      setVendor(vendorData)

      // Fetch products
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .eq('vendor_id', vendorId)
        .eq('in_stock', true)
        .order('created_at', { ascending: false })

      setProducts(productsData || [])
    } catch (error) {
      console.error('Error fetching vendor:', error)
    } finally {
      setLoading(false)
    }
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
        <div className="text-center">
          <p className="text-gray-600 mb-4">Vendor not found</p>
          <Link href="/vendors" className="text-amber-600 hover:text-amber-700 font-semibold">
            ← Back to vendors
          </Link>
        </div>
      </div>
    )
  }

  const instagramUrl = `https://instagram.com/${vendor.instagram_handle}`

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm mb-8">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link href="/vendors" className="text-amber-600 hover:text-amber-700 font-semibold">
            ← Back to vendors
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-12">
        {/* Vendor Header */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <div className="flex gap-8">
            {vendor.profile_image_url && (
              <div className="w-32 h-32 flex-shrink-0">
                <img
                  src={vendor.profile_image_url}
                  alt={vendor.shop_name}
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-4xl font-bold text-gray-900">
                    {vendor.shop_name}
                  </h1>
                  <p className="text-lg text-gray-600">@{vendor.instagram_handle}</p>
                </div>
                {vendor.verified && (
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-semibold">
                    ✓ Verified
                  </span>
                )}
              </div>

              <p className="text-gray-700 mb-6">{vendor.description}</p>

              <div className="flex flex-wrap gap-4">
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 hover:opacity-90 text-white font-semibold py-2 px-6 rounded-lg transition-opacity"
                >
                  Visit on Instagram
                </a>
                <a
                  href={`https://wa.me/${vendor.instagram_handle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
                >
                  Message on WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Products Section */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Products ({products.length})
          </h2>

          {products.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <p className="text-gray-600">No products available yet</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="aspect-square bg-gray-200 relative group">
                    {product.image_url ? (
                      <>
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <a
                            href={instagramUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-white text-gray-900 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                          >
                            View on Instagram
                          </a>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400">
                        No image
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-lg text-gray-900 mb-2">
                      {product.name}
                    </h3>
                    {product.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {product.description}
                      </p>
                    )}
                    <p className="text-2xl font-bold text-amber-600 mb-4">
                      ৳{product.price.toFixed(2)}
                    </p>
                    <a
                      href={instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 hover:opacity-90 text-white font-semibold py-2 px-4 rounded-lg text-center transition-opacity"
                    >
                      Order on Instagram
                    </a>
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
