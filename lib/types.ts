export type Vendor = {
  id: string
  instagram_handle: string
  shop_name: string
  description: string
  profile_image_url: string
  follower_count: number
  category: string
  verified: boolean
  created_at: string
  updated_at: string
}

export type Product = {
  id: string
  vendor_id: string
  name: string
  description: string
  price: number
  image_url: string
  category: string
  in_stock: boolean
  created_at: string
  updated_at: string
}

export type SearchFilters = {
  search?: string
  category?: string
  min_price?: number
  max_price?: number
  verified_only?: boolean
}
