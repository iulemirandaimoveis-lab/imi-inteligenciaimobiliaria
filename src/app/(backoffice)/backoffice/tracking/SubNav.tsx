'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart2, Link2, QrCode } from 'lucide-react'

const tabs = [
  { href: '/backoffice/tracking', label: 'Dashboard', icon: BarChart2 },
  { href: '/backoffice/tracking/links', label: 'Links', icon: Link2 },
  { href: '/backoffice/tracking/qr', label: 'QR Codes', icon: QrCode },
]

export function TrackingSubNav() {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/backoffice/tracking') return pathname === href
    return pathname.startsWith(href)
  }

  return (
    <nav
      style={{
        display: 'flex',
        gap: 4,
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        padding: '0 4px',
      }}
    >
      <style>{`nav::-webkit-scrollbar { display: none; }`}</style>
      {tabs.map(({ href, label, icon: Icon }) => {
        const active = isActive(href)
        return (
          <Link
            key={href}
            href={href}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '0 14px',
              minHeight: 44,
              borderRadius: 8,
              fontSize: 13,
              fontWeight: active ? 600 : 400,
              whiteSpace: 'nowrap',
              textDecoration: 'none',
              color: active ? '#C9A84C' : '#888',
              background: active ? 'rgba(201,168,76,0.10)' : 'transparent',
              borderBottom: active ? '2px solid #C9A84C' : '2px solid transparent',
              transition: 'all 0.15s ease',
            }}
          >
            <Icon size={16} strokeWidth={active ? 2.2 : 1.6} />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
