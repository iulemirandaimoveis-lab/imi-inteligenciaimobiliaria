'use client'

import { usePathname } from 'next/navigation'
import { ImoveisSubNav } from './SubNav'
import { useIsMobile } from '@/hooks/use-is-mobile'

export default function ImoveisLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isMobile = useIsMobile()
  const isExplorer = pathname.startsWith('/backoffice/imoveis/explorer')

  // On mobile, the MobileImoveisList renders its own MobileAppBar,
  // so we only show SubNav on desktop. On the main list page,
  // SubNav is not needed on mobile since MobileImoveisList has its own navigation.
  const isMainList = pathname === '/backoffice/imoveis'

  return (
    <div>
      {!isExplorer && !(isMobile && isMainList) && (
        <div className="overflow-x-auto [scrollbar-width:none] [-webkit-overflow-scrolling:touch]">
          <ImoveisSubNav />
        </div>
      )}
      <div style={{ marginTop: 0, paddingTop: isExplorer ? 0 : 8 }}>{children}</div>
    </div>
  )
}
