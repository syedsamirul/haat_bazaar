import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-amber-900 mb-4">
            Haat Bazaar
          </h1>
          <p className="text-xl text-amber-700 mb-8">
            Discover authentic products from Instagram-based small businesses
          </p>
        </div>

        {/* Quick Links */}
        <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
          <Link
            href="/vendors"
            className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow text-center"
          >
            <h2 className="text-2xl font-bold text-amber-900 mb-2">
              Browse Vendors
            </h2>
            <p className="text-gray-600">
              Find and follow sellers on Instagram
            </p>
          </Link>

          <Link
            href="/auth/signup"
            className="bg-amber-100 p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow text-center"
          >
            <h2 className="text-2xl font-bold text-amber-900 mb-2">
              Sell on Haat Bazaar
            </h2>
            <p className="text-gray-600">
              Register your Instagram shop
            </p>
          </Link>
        </div>
      </div>
    </main>
  )
}
