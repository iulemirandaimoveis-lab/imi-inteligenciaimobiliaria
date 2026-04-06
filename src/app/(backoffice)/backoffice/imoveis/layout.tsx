'use client'

import { usePathname } from 'next/navigation'
import { ImoveisSubNav } from './SubNav'

export default function ImoveisLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isExplorer = pathname.startsWith('/backoffice/imoveis/explorer')

  return (
    <div>
      {!isExplorer && (
        <div className="hidden md:block overflow-x-auto [scrollbar-width:none] [-webkit-overflow-scrolling:touch]">
          <ImoveisSubNav />
        </div>
      )}
      <div style={{ marginTop: 0, paddingTop: isExplorer ? 0 : 8 }}>{children}</div>
    </div>
  )
}
