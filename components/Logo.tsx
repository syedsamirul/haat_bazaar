export default function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={`font-bold tracking-tight uppercase ${className}`}>
      <span className="text-flash">Haat</span>
      <span className="text-ink-muted mx-1">·</span>
      <span className="text-ink">Bazaar</span>
    </span>
  )
}
