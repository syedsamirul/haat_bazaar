'use client'

import { track } from '@vercel/analytics'

export default function SupportButton() {
  return (
    <a
      href="https://wa.me/8801981570242"
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => track('support_contact_click')}
      className="fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-flash hover:bg-flash-dark text-[#17140f] font-bold text-xs uppercase tracking-wide px-4 py-3 rounded-full shadow-lg transition-colors"
    >
      Need help?
    </a>
  )
}
