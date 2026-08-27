'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Vendor } from '@/lib/types'
import Link from 'next/link'
import Logo from '@/components/Logo'

export default function AdminDashboard() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [productCounts, setProductCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'verified' | 'unverified'>('all')

  useEffect(() => {
    checkAdminAndLoad()
  }, [])

  const checkAdminAndLoad = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data: adminRow } = await supabase
        .from('admins')
        .select('id')
        .eq('id', user.id)
        .maybeSingle()

      if (!adminRow) {
        setIsAdmin(false)
        setChecking(false)
        return
      }

      setIsAdmin(true)
      setChecking(false)

      await loadVendors()
    } catch (err: any) {
      setError(err.message || 'Failed to load admin dashboard')
      setChecking(false)
    }
  }

  const loadVendors = async () => {
    setLoading(true)
    try {
      const { data: vendorData, error: vendorError } = await supabase
        .from('vendors')
        .select('*')
        .order('created_at', { ascending: false })

      if (vendorError) throw vendorError
      setVendors(vendorData || [])

      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('vendor_id')

      if (productError) throw productError

      const counts: Record<string, number> = {}
      for (const p of productData || []) {
        counts[p.vendor_id] = (counts[p.vendor_id] || 0) + 1
      }
      setProductCounts(counts)
    } catch (err: any) {
      setError(err.message || 'Failed to load vendors')
    } finally {
      setLoading(false)
    }
  }

  const toggleVerified = async (vendor: Vendor) => {
    const { error } = await supabase
      .from('vendors')
      .update({ verified: !vendor.verified })
      .eq('id', vendor.id)

    if (error) {
      alert('Error updating vendor: ' + error.message)
      return
    }

    setVendors((prev) =>
      prev.map((v) => (v.id === vendor.id ? { ...v, verified: !v.verified } : v))
    )
  }

  const deleteVendor = async (vendor: Vendor) => {
    if (
      !confirm(
        `Delete "${vendor.shop_name}" and all their products? This cannot be undone.`
      )
    )
      return

    const { error } = await supabase.from('vendors').delete().eq('id', vendor.id)

    if (error) {
      alert('Error deleting vendor: ' + error.message)
      return
    }

    setVendors((prev) => prev.filter((v) => v.id !== vendor.id))
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-canvas text-ink flex items-center justify-center">
        <p className="text-ink-muted text-sm">Checking access...</p>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-canvas text-ink flex items-center justify-center px-4">
        <div className="bg-surface border border-line rounded-lg p-8 max-w-md text-center">
          <div className="text-5xl mb-4">🔒</div>
          <h1 className="font-bold text-lg uppercase tracking-tight mb-2">Access denied</h1>
          <p className="text-sm text-ink-muted mb-6">
            You don't have admin access to this page.
          </p>
          <Link href="/" className="text-flash text-sm font-bold">
            ← Back to home
          </Link>
        </div>
      </div>
    )
  }

  const filteredVendors = vendors.filter((v) => {
    if (filter === 'verified') return v.verified
    if (filter === 'unverified') return !v.verified
    return true
  })

  const totalProducts = Object.values(productCounts).reduce((a, b) => a + b, 0)

  return (
    <div className="min-h-screen bg-canvas text-ink">
      {/* Header */}
      <div className="border-b border-line">
        <div className="max-w-6xl mx-auto px-5 py-6 flex justify-between items-center">
          <Link href="/" className="flex items-baseline gap-2">
            <Logo className="text-2xl" />
            <span className="text-ink-muted text-xs">Admin</span>
          </Link>
          <button
            onClick={handleLogout}
            className="text-xs text-ink-muted hover:text-ink transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-5 py-8">
        {error && (
          <div className="bg-surface-2 border border-flash/40 text-flash px-4 py-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        <div className="flex justify-end mb-6">
          <Link
            href="/admin/add-vendor"
            className="bg-flash hover:bg-flash-dark text-[#17140f] text-xs font-bold uppercase tracking-wide px-4 py-2 rounded-lg transition-colors"
          >
            + Add vendor manually
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-surface border border-line rounded-lg p-5">
            <p className="text-xs uppercase tracking-wide text-ink-muted mb-1">Total vendors</p>
            <p className="text-2xl font-bold font-mono">{vendors.length}</p>
          </div>
          <div className="bg-surface border border-line rounded-lg p-5">
            <p className="text-xs uppercase tracking-wide text-ink-muted mb-1">Verified</p>
            <p className="text-2xl font-bold font-mono text-flash">
              {vendors.filter((v) => v.verified).length}
            </p>
          </div>
          <div className="bg-surface border border-line rounded-lg p-5">
            <p className="text-xs uppercase tracking-wide text-ink-muted mb-1">Unverified</p>
            <p className="text-2xl font-bold font-mono">
              {vendors.filter((v) => !v.verified).length}
            </p>
          </div>
          <div className="bg-surface border border-line rounded-lg p-5">
            <p className="text-xs uppercase tracking-wide text-ink-muted mb-1">Total products</p>
            <p className="text-2xl font-bold font-mono">{totalProducts}</p>
          </div>
        </div>

        {/* Vendor List */}
        <div className="bg-surface border border-line rounded-lg">
          <div className="p-5 border-b border-line flex justify-between items-center flex-wrap gap-4">
            <h2 className="font-bold text-sm uppercase tracking-wide">Vendors</h2>
            <div className="flex gap-2">
              {(['all', 'verified', 'unverified'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold uppercase transition-colors ${
                    filter === f
                      ? 'bg-flash text-[#17140f]'
                      : 'border border-line text-ink-muted hover:border-ink-muted'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <p className="p-6 text-ink-muted text-sm">Loading vendors...</p>
          ) : filteredVendors.length === 0 ? (
            <p className="p-6 text-ink-muted text-sm">No vendors found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="text-xs uppercase tracking-wide text-ink-muted">
                  <tr>
                    <th className="px-5 py-3 font-medium">Shop</th>
                    <th className="px-5 py-3 font-medium">Instagram</th>
                    <th className="px-5 py-3 font-medium">Category</th>
                    <th className="px-5 py-3 font-medium">Products</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Joined</th>
                    <th className="px-5 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {filteredVendors.map((vendor) => (
                    <tr key={vendor.id}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg overflow-hidden bg-surface-2 flex-shrink-0">
                            {vendor.profile_image_url && (
                              <img
                                src={vendor.profile_image_url}
                                alt={vendor.shop_name}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                          <Link
                            href={`/vendors/${vendor.id}`}
                            className="font-medium text-sm text-ink hover:text-flash transition-colors"
                          >
                            {vendor.shop_name}
                          </Link>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-ink-muted font-mono text-sm">
                        {vendor.instagram_handle ? `@${vendor.instagram_handle}` : '—'}
                      </td>
                      <td className="px-5 py-3 text-ink-muted text-sm capitalize">
                        {vendor.category}
                      </td>
                      <td className="px-5 py-3 text-ink-muted font-mono text-sm">
                        {productCounts[vendor.id] || 0}
                      </td>
                      <td className="px-5 py-3">
                        {vendor.verified ? (
                          <span className="border border-flash/40 text-flash text-[10px] font-bold uppercase px-2 py-1 rounded-full">
                            Verified
                          </span>
                        ) : (
                          <span className="border border-line text-ink-muted text-[10px] font-bold uppercase px-2 py-1 rounded-full">
                            Unverified
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-ink-muted text-xs font-mono">
                        {new Date(vendor.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => toggleVerified(vendor)}
                            className={`text-[11px] font-bold uppercase px-3 py-1.5 rounded-lg transition-colors ${
                              vendor.verified
                                ? 'border border-line text-ink-muted hover:border-ink-muted'
                                : 'bg-flash text-[#17140f] hover:bg-flash-dark'
                            }`}
                          >
                            {vendor.verified ? 'Unverify' : 'Verify'}
                          </button>
                          <button
                            onClick={() => deleteVendor(vendor)}
                            className="text-[11px] font-bold uppercase px-3 py-1.5 rounded-lg border border-flash/40 text-flash hover:border-flash transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
