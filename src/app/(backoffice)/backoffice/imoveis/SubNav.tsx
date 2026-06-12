'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Building2, BarChart2, LineChart, Scale, List, Plus, Key, MapPin } from 'lucide-react'

const tabs = [
  { href: '/backoffice/imoveis',           label: 'Listagem',   icon: Building2  },
  { href: '/backoffice/imoveis/explorer',  label: 'Mapa',       icon: MapPin     },
  { href: '/backoffice/imoveis/portfolio', label: 'Portfolio',  icon: LineChart  },
  { href: '/backoffice/imoveis/comparar',  label: 'Comparar',   icon: Scale      },
  { href: '/backoffice/imoveis/inventario',label: 'Inventário', icon: List       },
  { href: '/backoffice/rentals',           label: 'Rentals',    icon: Key        },
  { href: '/backoffice/imoveis/novo',      label: 'Novo',       icon: Plus       },
]

export function ImoveisSubNav() {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/backoffice/imoveis') return pathname === href
    return pathname.startsWith(href)
  }

  return (
    <div style={{ position: 'relative' }}>
      <nav
        style={{
          display: 'flex',
          gap: 2,
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          padding: '6px 8px',
          paddingRight: 44,
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
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '0 14px',
                minHeight: 36,
                borderRadius: 9,
                fontSize: 13,
                fontWeight: active ? 600 : 400,
                whiteSpace: 'nowrap',
                textDecoration: 'none',
                color: active ? 'var(--text-gold, #C8A44A)' : 'var(--text-tertiary, #4F5B6B)',
                background: active
                  ? 'linear-gradient(135deg, rgba(200,164,74,0.14) 0%, rgba(200,164,74,0.07) 100%)'
                  : 'transparent',
                border: active
                  ? '1px solid rgba(200,164,74,0.25)'
                  : '1px solid transparent',
                boxShadow: active
                  ? '0 1px 6px rgba(200,164,74,0.10), inset 0 1px 0 rgba(255,255,255,0.05)'
                  : 'none',
                transition: 'all 0.18s cubic-bezier(0.16,1,0.3,1)',
                letterSpacing: active ? '-0.01em' : '0',
              }}
            >
              <Icon
                size={14}
                strokeWidth={active ? 2.2 : 1.6}
                style={{
                  color: active ? 'var(--text-gold, #C8A44A)' : 'var(--text-tertiary, #4F5B6B)',
                  transition: 'color 0.15s',
                  flexShrink: 0,
                }}
              />
              {label}
            </Link>
          )
        })}
      </nav>
      {/* Fade-out on right edge */}
      <div style={{
        position: 'absolute',
        right: 0, top: 0, bottom: 0,
        width: 44,
        background: 'linear-gradient(to right, transparent, var(--bg-base))',
        pointerEvents: 'none',
      }} />
    </div>
  )
}
