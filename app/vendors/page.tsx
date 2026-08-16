'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Vendor, SearchFilters } from '@/lib/types'
import VendorCard from '@/components/VendorCard'
import SearchBar from '@/components/SearchBar'
import Logo from '@/components/Logo'

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
    <main className="min-h-screen bg-canvas text-ink">
      <nav className="flex justify-between items-center px-5 py-4 border-b border-line max-w-5xl mx-auto">
        <a href="/"><Logo className="text-sm" /></a>
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
            <p className="text-ink-muted text-sm">Loading vendors...</p>
          </div>
        ) : vendors.length === 0 ? (
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
    </main>
  )
}
