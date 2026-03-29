'use client'

import { usePathname } from 'next/navigation'
import { ImoveisSubNav } from './SubNav'

export default function ImoveisLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isExplorer = pathname.startsWith('/backoffice/imoveis/explorer')

  return (
    <div>
      {!isExplorer && <ImoveisSubNav />}
      <div style={{ marginTop: 0, paddingTop: isExplorer ? 0 : 8 }}>{children}</div>
    </div>
  )
}
