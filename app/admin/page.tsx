'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Vendor } from '@/lib/types'
import Link from 'next/link'

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Checking access...</p>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md text-center">
          <div className="text-5xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-6">
            You don't have admin access to this page.
          </p>
          <Link href="/" className="text-amber-600 hover:text-amber-700 font-semibold">
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-amber-900">
            Haat Bazaar <span className="text-sm font-normal text-gray-500">Admin</span>
          </Link>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-600 hover:text-gray-900 font-medium"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-sm text-gray-600 mb-1">Total Vendors</p>
            <p className="text-3xl font-bold text-gray-900">{vendors.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-sm text-gray-600 mb-1">Verified</p>
            <p className="text-3xl font-bold text-green-600">
              {vendors.filter((v) => v.verified).length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-sm text-gray-600 mb-1">Unverified</p>
            <p className="text-3xl font-bold text-amber-600">
              {vendors.filter((v) => !v.verified).length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-sm text-gray-600 mb-1">Total Products</p>
            <p className="text-3xl font-bold text-gray-900">{totalProducts}</p>
          </div>
        </div>

        {/* Vendor List */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b flex justify-between items-center flex-wrap gap-4">
            <h2 className="text-xl font-bold text-gray-900">Vendors</h2>
            <div className="flex gap-2">
              {(['all', 'verified', 'unverified'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium capitalize ${
                    filter === f
                      ? 'bg-amber-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <p className="p-6 text-gray-600">Loading vendors...</p>
          ) : filteredVendors.length === 0 ? (
            <p className="p-6 text-gray-600">No vendors found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-sm text-gray-600">
                  <tr>
                    <th className="px-6 py-3 font-medium">Shop</th>
                    <th className="px-6 py-3 font-medium">Instagram</th>
                    <th className="px-6 py-3 font-medium">Category</th>
                    <th className="px-6 py-3 font-medium">Products</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium">Joined</th>
                    <th className="px-6 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredVendors.map((vendor) => (
                    <tr key={vendor.id}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
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
                            className="font-medium text-gray-900 hover:text-amber-600"
                          >
                            {vendor.shop_name}
                          </Link>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        @{vendor.instagram_handle}
                      </td>
                      <td className="px-6 py-4 text-gray-600 capitalize">
                        {vendor.category}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {productCounts[vendor.id] || 0}
                      </td>
                      <td className="px-6 py-4">
                        {vendor.verified ? (
                          <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded-full">
                            Verified
                          </span>
                        ) : (
                          <span className="bg-gray-100 text-gray-600 text-xs font-semibold px-2 py-1 rounded-full">
                            Unverified
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-sm">
                        {new Date(vendor.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => toggleVerified(vendor)}
                            className={`text-xs font-semibold px-3 py-1.5 rounded-lg ${
                              vendor.verified
                                ? 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                            }`}
                          >
                            {vendor.verified ? 'Unverify' : 'Verify'}
                          </button>
                          <button
                            onClick={() => deleteVendor(vendor)}
                            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white"
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
