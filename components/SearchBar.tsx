'use client'

import { useState } from 'react'
import { SearchFilters } from '@/lib/types'

interface SearchBarProps {
  onFiltersChange: (filters: SearchFilters) => void
}

export default function SearchBar({ onFiltersChange }: SearchBarProps) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [verifiedOnly, setVerifiedOnly] = useState(false)

  const handleSearch = () => {
    onFiltersChange({
      search: search || undefined,
      category: category || undefined,
      verified_only: verifiedOnly,
    })
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-8">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search
          </label>
          <input
            type="text"
            placeholder="Search by vendor name or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              <option value="">All Categories</option>
              <option value="clothing">Clothing</option>
              <option value="accessories">Accessories</option>
              <option value="beauty">Beauty</option>
              <option value="crafts">Crafts</option>
              <option value="food">Food</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="flex items-end">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={verifiedOnly}
                onChange={(e) => setVerifiedOnly(e.target.checked)}
                className="w-4 h-4 text-amber-600 rounded focus:ring-2 focus:ring-amber-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                Verified vendors only
              </span>
            </label>
          </div>
        </div>

        <button
          onClick={handleSearch}
          className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
        >
          Search
        </button>
      </div>
    </div>
  )
}
