'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Vendor, SearchFilters } from '@/lib/types'
import VendorCard from '@/components/VendorCard'
import SearchBar from '@/components/SearchBar'

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<SearchFilters>({})

  useEffect(() => {
    fetchVendors()
  }, [filters])

  const fetchVendors = async () => {
    setLoading(true)
    try {
      let query = supabase.from('vendors').select('*')

      if (filters.search) {
        query = query.or(
          `shop_name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
        )
      }

      if (filters.category) {
        query = query.eq('category', filters.category)
      }

      if (filters.verified_only) {
        query = query.eq('verified', true)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw error
      setVendors(data || [])
    } catch (error) {
      console.error('Error fetching vendors:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          Find Vendors
        </h1>

        <SearchBar onFiltersChange={setFilters} />

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading vendors...</p>
          </div>
        ) : vendors.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No vendors found</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vendors.map((vendor) => (
              <VendorCard key={vendor.id} vendor={vendor} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
