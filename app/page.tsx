import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-canvas text-ink flex flex-col">
      <nav className="flex justify-between items-center px-5 py-4 border-b border-line">
        <span className="font-bold text-sm tracking-widest uppercase">
          Haat Bazaar
        </span>
        <div className="flex gap-5 text-xs text-ink-muted">
          <Link href="/vendors" className="hover:text-ink transition-colors">
            Browse
          </Link>
          <Link href="/auth/signup" className="hover:text-ink transition-colors">
            Sell
          </Link>
        </div>
      </nav>

      <div className="flex-1 flex flex-col justify-center px-5 py-16 max-w-md mx-auto w-full text-center">
        <p className="font-mono text-xs text-flash mb-4 tracking-wide">
          142 vendors · updated daily
        </p>
        <h1 className="text-3xl font-bold uppercase tracking-tight leading-tight mb-4 text-balance">
          Your favorite Insta shops, all in one haat.
        </h1>
        <p className="text-sm text-ink-muted mb-10 leading-relaxed">
          Browse Instagram-based small businesses from across Bangladesh — search,
          filter, and jump straight to their page to order.
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href="/vendors"
            className="bg-flash hover:bg-flash-dark text-[#17140f] font-bold text-sm uppercase tracking-wide py-3 rounded-lg transition-colors"
          >
            Browse vendors
          </Link>
          <Link
            href="/auth/signup"
            className="border border-line hover:border-ink-muted text-ink font-bold text-sm uppercase tracking-wide py-3 rounded-lg transition-colors"
          >
            Sell on Haat Bazaar
          </Link>
        </div>
      </div>

      {/* Preview grid strip */}
      <div className="grid grid-cols-4 gap-0.5 mt-auto">
        {['#7A1F2B', '#9C7A2E', '#C98A1E', '#2E5C63'].map((color) => (
          <div key={color} className="aspect-square" style={{ backgroundColor: color }} />
        ))}
      </div>
    </main>
  )
}
