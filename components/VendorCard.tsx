import Link from 'next/link'
import { Vendor } from '@/lib/types'

export default function VendorCard({ vendor }: { vendor: Vendor }) {
  return (
    <Link href={`/vendors/${vendor.id}`}>
      <div className="bg-surface border border-line rounded-lg overflow-hidden hover:border-ink-muted transition-colors cursor-pointer">
        <div className="aspect-square bg-surface-2 relative">
          {vendor.profile_image_url && (
            <img
              src={vendor.profile_image_url}
              alt={vendor.shop_name}
              className="w-full h-full object-cover"
            />
          )}
        </div>
        <div className="p-3">
          <div className="flex items-start justify-between mb-1 gap-2">
            <h3 className="font-bold text-sm text-ink truncate">
              {vendor.shop_name}
            </h3>
            {vendor.verified && (
              <span className="text-flash text-xs flex-shrink-0">✓</span>
            )}
          </div>
          <p className="font-mono text-xs text-ink-muted mb-2">
            @{vendor.instagram_handle}
          </p>
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] text-ink-muted">
              {vendor.follower_count.toLocaleString()} followers
            </span>
            <span className="text-[10px] uppercase tracking-wide text-flash border border-flash/40 rounded px-1.5 py-0.5">
              {vendor.category}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
