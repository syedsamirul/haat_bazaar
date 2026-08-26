'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Vendor, Product, SearchFilters } from '@/lib/types'
import VendorCard from '@/components/VendorCard'
import ProductCard from '@/components/ProductCard'
import SearchBar from '@/components/SearchBar'
import Logo from '@/components/Logo'

type ProductWithVendor = Product & {
  vendor: Pick<Vendor, 'id' | 'shop_name' | 'instagram_handle' | 'verified'>
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [products, setProducts] = useState<ProductWithVendor[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<SearchFilters>({})

  const showProducts = Boolean(
    filters.search ||
      filters.category ||
      filters.min_price !== undefined ||
      filters.max_price !== undefined
  )

  useEffect(() => {
    fetchResults()
  }, [filters])

  const fetchResults = async () => {
    setLoading(true)
    try {
      let vendorQuery = supabase.from('vendors').select('*')

      if (filters.search) {
        vendorQuery = vendorQuery.or(
          `shop_name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
        )
      }
      if (filters.category) {
        vendorQuery = vendorQuery.eq('category', filters.category)
      }
      if (filters.verified_only) {
        vendorQuery = vendorQuery.eq('verified', true)
      }

      const { data: vendorData, error: vendorError } = await vendorQuery.order('created_at', {
        ascending: false,
      })
      if (vendorError) throw vendorError
      setVendors(vendorData || [])

      // Product search only kicks in when there's a search term, category, or
      // price range set — otherwise the default browse experience is just vendors.
      if (
        filters.search ||
        filters.category ||
        filters.min_price !== undefined ||
        filters.max_price !== undefined
      ) {
        let productQuery = supabase
          .from('products')
          .select('*, vendor:vendors(id, shop_name, instagram_handle, verified)')
          .eq('in_stock', true)

        if (filters.search) {
          productQuery = productQuery.or(
            `name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
          )
        }
        if (filters.category) {
          productQuery = productQuery.eq('category', filters.category)
        }
        if (filters.min_price !== undefined) {
          productQuery = productQuery.gte('price', filters.min_price)
        }
        if (filters.max_price !== undefined) {
          productQuery = productQuery.lte('price', filters.max_price)
        }

        const { data: productData, error: productError } = await productQuery.order(
          'created_at',
          { ascending: false }
        )
        if (productError) throw productError
        setProducts((productData as any) || [])
      } else {
        setProducts([])
      }
    } catch (error) {
      console.error('Error fetching results:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-canvas text-ink">
      <nav className="flex justify-between items-center px-5 py-6 border-b border-line max-w-5xl mx-auto">
        <a href="/"><Logo className="text-2xl" /></a>
        <a href="/auth/signup" className="text-xs text-ink-muted hover:text-ink transition-colors">
          Sell
        </a>
      </nav>

      <div className="max-w-5xl mx-auto px-5 py-8">
        <h1 className="font-bold text-xl uppercase tracking-tight mb-6">
          Browse vendors
        </h1>

        <SearchBar onFiltersChange={setFilters} />

        {loading ? (
          <div className="text-center py-16">
            <p className="text-ink-muted text-sm">Loading...</p>
          </div>
        ) : (
          <>
            {showProducts && (
              <div className="mb-10">
                <p className="font-mono text-xs text-ink-muted uppercase tracking-wide mb-3">
                  {products.length} product{products.length !== 1 ? 's' : ''}
                </p>
                {products.length === 0 ? (
                  <div className="border border-line rounded-lg p-8 text-center mb-2">
                    <p className="text-ink-muted text-sm">No matching products</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {products.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                )}
              </div>
            )}

            <div>
              {showProducts && (
                <p className="font-mono text-xs text-ink-muted uppercase tracking-wide mb-3">
                  {vendors.length} vendor{vendors.length !== 1 ? 's' : ''}
                </p>
              )}
              {vendors.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-ink-muted text-sm">No vendors found</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {vendors.map((vendor) => (
                    <VendorCard key={vendor.id} vendor={vendor} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  )
}
