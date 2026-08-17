const VENDOR_KEY = 'hb_liked_vendors'
const PRODUCT_KEY = 'hb_liked_products'

function getSet(key: string): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem(key)
    return new Set(raw ? JSON.parse(raw) : [])
  } catch {
    return new Set()
  }
}

function saveSet(key: string, set: Set<string>) {
  localStorage.setItem(key, JSON.stringify(Array.from(set)))
}

export function isVendorLiked(vendorId: string): boolean {
  return getSet(VENDOR_KEY).has(vendorId)
}

export function setVendorLiked(vendorId: string, liked: boolean) {
  const set = getSet(VENDOR_KEY)
  liked ? set.add(vendorId) : set.delete(vendorId)
  saveSet(VENDOR_KEY, set)
}

export function isProductLiked(productId: string): boolean {
  return getSet(PRODUCT_KEY).has(productId)
}

export function setProductLiked(productId: string, liked: boolean) {
  const set = getSet(PRODUCT_KEY)
  liked ? set.add(productId) : set.delete(productId)
  saveSet(PRODUCT_KEY, set)
}
