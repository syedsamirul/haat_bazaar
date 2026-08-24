export type Vendor = {
  id: string
  instagram_handle: string | null
  whatsapp_number: string | null
  website_url: string | null
  shop_name: string
  description: string
  profile_image_url: string
  follower_count: number
  category: string
  verified: boolean
  view_count: number
  like_count: number
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
  like_count: number
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
