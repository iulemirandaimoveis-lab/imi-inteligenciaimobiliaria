'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Building2, BookOpen, MessageCircle, Menu } from 'lucide-react'
import { motion } from 'framer-motion'

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

const SPRING = { type: 'spring' as const, stiffness: 500, damping: 35 }
const ITEM_WIDTH = 100 / NAV_ITEMS.length

export default function MobileBottomNav({ lang }: MobileBottomNavProps) {
  const pathname = usePathname()

  const isActive = (key: string) => {
    if (key === 'home') {
      return pathname === `/${lang}` || pathname === `/${lang}/`
    }
    return pathname?.includes(`/${key}`)
  }

  const handleMenuClick = () => {
    const menuButton = document.querySelector('button[aria-label="Abrir menu"]') as HTMLButtonElement
    if (menuButton) {
      menuButton.click()
    }
  }

  const activeIndex = NAV_ITEMS.findIndex((item) => isActive(item.key))

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-[150] md:hidden"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        background: 'rgba(11, 25, 40, 0.92)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderTop: '1px solid rgba(200, 164, 74, 0.12)',
        boxShadow: '0 -4px 30px rgba(0, 0, 0, 0.3)',
        overflow: 'visible',
      }}
    >
      <div
        className="relative flex items-center justify-around h-[64px] max-w-lg mx-auto px-2"
        style={{ overflow: 'visible' }}
      >
        {/* Sliding bubble indicator */}
        {activeIndex >= 0 && (
          <motion.div
            className="absolute pointer-events-none flex items-center justify-center"
            style={{ width: `${ITEM_WIDTH}%`, top: 0, bottom: 0 }}
            animate={{ left: `${activeIndex * ITEM_WIDTH}%` }}
            initial={false}
            transition={SPRING}
          >
            <div
              style={{
                width: 54,
                height: 54,
                borderRadius: '50%',
                background: 'linear-gradient(145deg, rgba(200,164,74,0.22), rgba(200,164,74,0.07))',
                border: '1.5px solid rgba(200,164,74,0.5)',
                boxShadow: '0 -6px 18px rgba(200,164,74,0.22), inset 0 1px 0 rgba(255,255,255,0.08)',
                transform: 'translateY(-14px)',
              }}
            />
          </motion.div>
        )}

        {NAV_ITEMS.map((item) => {
          const active = isActive(item.key)
          const Icon = item.icon

          const itemContent = (
            <>
              <motion.div
                animate={{ y: active ? -14 : 0 }}
                transition={SPRING}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Icon
                  size={22}
                  strokeWidth={active ? 2.5 : 1.8}
                  style={{ color: active ? '#C8A44A' : 'rgba(255,255,255,0.45)' }}
                />
              </motion.div>

              <motion.span
                animate={{ opacity: active ? 0 : 1, y: active ? 6 : 0 }}
                transition={{ duration: 0.18 }}
                className="text-[10px] font-semibold"
                style={{
                  color: 'rgba(255,255,255,0.45)',
                  position: 'absolute',
                  bottom: 6,
                  pointerEvents: 'none',
                }}
              >
                {item.label}
              </motion.span>
            </>
          )

          const sharedClass =
            'relative flex flex-col items-center justify-center flex-1 h-full min-w-[44px] min-h-[44px]'
          const sharedStyle = { WebkitTapHighlightColor: 'transparent', overflow: 'visible' as const }

          if (item.key === 'menu') {
            return (
              <button
                key={item.key}
                onClick={handleMenuClick}
                className={sharedClass}
                style={sharedStyle}
              >
                {itemContent}
              </button>
            )
          }

          return (
            <Link
              key={item.key}
              href={item.href(lang)}
              prefetch={true}
              className={sharedClass}
              style={sharedStyle}
            >
              {itemContent}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
