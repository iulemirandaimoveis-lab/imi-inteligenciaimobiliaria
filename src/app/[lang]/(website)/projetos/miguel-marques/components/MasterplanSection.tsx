'use client'

import dynamic from 'next/dynamic'

const MiguelMarquesPlanView = dynamic(() => import('./MiguelMarquesPlanView'), { ssr: false })

export default function MasterplanSection() {
  return (
    <section style={{ height: '85vh', minHeight: 560 }}>
      <MiguelMarquesPlanView />
    </section>
  )
}
