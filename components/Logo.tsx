export default function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-bold tracking-tight uppercase ${className}`}>
      <svg
        width="1.3em"
        height="1em"
        viewBox="0 0 54 40"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="flex-shrink-0"
      >
        <path d="M4 16 L16 6 L38 6 L50 16 Z" fill="#FF5A1F" />
        <path d="M14.7 16 L16.9 6 L21 6 L18.9 16 Z" fill="#121113" />
        <path d="M23.9 16 L23.9 6 L28.7 6 L28.7 16 Z" fill="#121113" />
        <path d="M33.1 16 L31.1 6 L35.1 6 L37.3 16 Z" fill="#121113" />
        <line x1="12" y1="16" x2="12" y2="36" stroke="#FF5A1F" strokeWidth="3.5" strokeLinecap="round" />
        <line x1="42" y1="16" x2="42" y2="36" stroke="#FF5A1F" strokeWidth="3.5" strokeLinecap="round" />
        <line x1="8" y1="36" x2="46" y2="36" stroke="#FF5A1F" strokeWidth="3.5" strokeLinecap="round" />
      </svg>
      <span>
        <span className="text-flash">Bazaar</span>
        <span className="text-ink">ly</span>
      </span>
    </span>
  )
}
