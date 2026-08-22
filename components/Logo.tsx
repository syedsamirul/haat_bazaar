export default function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={`font-bold tracking-tight uppercase ${className}`}>
      <span className="text-flash">Bazaar</span>
      <span className="text-ink">ly</span>
    </span>
  )
}
