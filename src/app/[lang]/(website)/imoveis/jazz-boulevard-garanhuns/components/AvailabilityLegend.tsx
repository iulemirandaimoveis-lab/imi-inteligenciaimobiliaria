'use client'

import { AVAILABILITY_COLORS, type AvailabilityStatus } from '@/lib/imi-domain/types'

const VISIBLE: AvailabilityStatus[] = ['available', 'reserved', 'sold', 'blocked', 'launching']

export default function AvailabilityLegend() {
  return (
    <div className="flex flex-wrap gap-3 items-center">
      {VISIBLE.map(status => {
        const cfg = AVAILABILITY_COLORS[status]
        return (
          <div key={status} className="flex items-center gap-1.5">
            <div style={{ width: 10, height: 10, borderRadius: 3, background: cfg.bg }} />
            <span style={{ fontSize: 11, color: '#948F84', fontWeight: 600 }}>{cfg.label}</span>
          </div>
        )
      })}
    </div>
  )
}
