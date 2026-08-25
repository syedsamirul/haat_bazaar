import Link from 'next/link'
import { Product, Vendor } from '@/lib/types'

type ProductWithVendor = Product & {
  vendor: Pick<Vendor, 'id' | 'shop_name' | 'instagram_handle' | 'verified'>
}

export default function ProductCard({ product }: { product: ProductWithVendor }) {
  return (
    <Link href={`/vendors/${product.vendor.id}`}>
      <div className="bg-surface border border-line rounded-lg overflow-hidden hover:border-ink-muted transition-colors cursor-pointer">
        <div className="aspect-square bg-surface-2 relative">
          {product.image_url && (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          )}
        </div>
        <div className="p-3">
          <h3 className="font-medium text-sm text-ink truncate mb-1">{product.name}</h3>
          <p className="font-mono text-sm text-flash mb-2">৳{product.price.toFixed(2)}</p>
          <div className="flex items-center gap-1 text-xs text-ink-muted truncate">
            <span className="truncate">{product.vendor.shop_name}</span>
            {product.vendor.verified && <span className="text-flash flex-shrink-0">✓</span>}
          </div>
        </div>
      </div>
    </Link>
  )
}
