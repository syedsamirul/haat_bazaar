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
    <div className="bg-surface border border-line rounded-lg p-4 mb-6">
      <div className="space-y-3">
        <input
          type="text"
          placeholder="Search shops, products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-2 bg-surface-2 border border-line rounded-lg text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-flash"
        />

        <div className="flex gap-3 flex-wrap items-center">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-3 py-2 bg-surface-2 border border-line rounded-lg text-sm text-ink focus:outline-none focus:border-flash"
          >
            <option value="">All categories</option>
            <option value="clothing">Clothing</option>
            <option value="accessories">Accessories</option>
            <option value="beauty">Beauty</option>
            <option value="crafts">Crafts</option>
            <option value="food">Food</option>
            <option value="other">Other</option>
          </select>

          <label className="flex items-center gap-2 cursor-pointer text-sm text-ink-muted">
            <input
              type="checkbox"
              checked={verifiedOnly}
              onChange={(e) => setVerifiedOnly(e.target.checked)}
              className="w-4 h-4 accent-flash"
            />
            Verified only
          </label>

          <button
            onClick={handleSearch}
            className="ml-auto bg-flash hover:bg-flash-dark text-[#17140f] font-bold text-xs uppercase tracking-wide px-4 py-2 rounded-lg transition-colors"
          >
            Search
          </button>
        </div>
      </div>
    </div>
  )
}
