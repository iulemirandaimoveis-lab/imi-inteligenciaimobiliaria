'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Building2, BarChart2, LineChart, Scale, List, Plus } from 'lucide-react'

const tabs = [
  { href: '/backoffice/imoveis', label: 'Listagem', icon: Building2 },
  { href: '/backoffice/imoveis/explorer', label: 'Explorer', icon: BarChart2 },
  { href: '/backoffice/imoveis/portfolio', label: 'Portfolio', icon: LineChart },
  { href: '/backoffice/imoveis/comparar', label: 'Comparar', icon: Scale },
  { href: '/backoffice/imoveis/inventario', label: 'Inventário', icon: List },
  { href: '/backoffice/imoveis/novo', label: 'Novo', icon: Plus },
]

export function ImoveisSubNav() {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/backoffice/imoveis') return pathname === href
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
