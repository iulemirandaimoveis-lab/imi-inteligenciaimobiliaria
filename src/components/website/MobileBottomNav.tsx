'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Building2, BookOpen, MessageCircle, Menu } from 'lucide-react'
import { useState } from 'react'

interface MobileBottomNavProps {
  lang: string
}

const NAV_ITEMS = [
  { key: 'home', label: 'Home', icon: Home, href: (lang: string) => `/${lang}` },
  { key: 'imoveis', label: 'Imóveis', icon: Building2, href: (lang: string) => `/${lang}/imoveis` },
  { key: 'biblioteca', label: 'Biblioteca', icon: BookOpen, href: (lang: string) => `/${lang}/biblioteca` },
  { key: 'contato', label: 'Contato', icon: MessageCircle, href: (lang: string) => `/${lang}/contato` },
  { key: 'menu', label: 'Menu', icon: Menu, href: () => '#' },
]

export default function MobileBottomNav({ lang }: MobileBottomNavProps) {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  const isActive = (key: string) => {
    if (key === 'home') {
      return pathname === `/${lang}` || pathname === `/${lang}/`
    }
    return pathname?.includes(`/${key}`)
  }

  const handleMenuClick = () => {
    // Trigger the header mobile menu by clicking its toggle button
    const menuButton = document.querySelector('button[aria-label="Abrir menu"]') as HTMLButtonElement
    if (menuButton) {
      menuButton.click()
    }
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-[150] md:hidden"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        background: 'rgba(11, 25, 40, 0.85)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderTop: '1px solid rgba(200, 164, 74, 0.12)',
        boxShadow: '0 -4px 30px rgba(0, 0, 0, 0.3)',
      }}
    >
      <div className="flex items-center justify-around h-[64px] max-w-lg mx-auto px-2">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.key)
          const Icon = item.icon

          if (item.key === 'menu') {
            return (
              <button
                key={item.key}
                onClick={handleMenuClick}
                className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors duration-200"
              >
                <Icon
                  size={22}
                  strokeWidth={active ? 2.5 : 1.8}
                  className="transition-colors duration-200"
                  style={{ color: active ? '#C8A44A' : 'rgba(255,255,255,0.45)' }}
                />
                <span
                  className="text-[10px] font-semibold transition-colors duration-200"
                  style={{ color: active ? '#C8A44A' : 'rgba(255,255,255,0.45)' }}
                >
                  {item.label}
                </span>
              </button>
            )
          }

          return (
            <Link
              key={item.key}
              href={item.href(lang)}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors duration-200"
            >
              <Icon
                size={22}
                strokeWidth={active ? 2.5 : 1.8}
                className="transition-colors duration-200"
                style={{ color: active ? '#C8A44A' : 'rgba(255,255,255,0.45)' }}
              />
              <span
                className="text-[10px] font-semibold transition-colors duration-200"
                style={{ color: active ? '#C8A44A' : 'rgba(255,255,255,0.45)' }}
              >
                {item.label}
              </span>
              {active && (
                <span
                  className="absolute top-0 h-[2px] w-8 rounded-full"
                  style={{ background: 'linear-gradient(90deg, transparent, #C8A44A, transparent)' }}
                />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
