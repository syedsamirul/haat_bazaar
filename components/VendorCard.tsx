import Link from 'next/link'
import { Vendor } from '@/lib/types'

export default function VendorCard({ vendor }: { vendor: Vendor }) {
  return (
    <Link href={`/vendors/${vendor.id}`}>
      <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden cursor-pointer">
        <div className="aspect-square bg-gray-200 relative">
          {vendor.profile_image_url && (
            <img
              src={vendor.profile_image_url}
              alt={vendor.shop_name}
              className="w-full h-full object-cover"
            />
          )}
        </div>
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-bold text-lg text-gray-900">
              {vendor.shop_name}
            </h3>
            {vendor.verified && (
              <span className="text-blue-600 text-sm font-semibold">✓</span>
            )}
          </div>
          <p className="text-sm text-gray-600 mb-2">
            @{vendor.instagram_handle}
          </p>
          <p className="text-xs text-gray-500 mb-3">
            {vendor.follower_count.toLocaleString()} followers
          </p>
          <span className="inline-block bg-amber-100 text-amber-800 text-xs font-semibold px-2 py-1 rounded">
            {vendor.category}
          </span>
        </div>
      </div>
    </Link>
  )
}
