'use client'

import { type IMIProperty, AVAILABILITY_COLORS } from '@/lib/imi-domain/types'

interface Props {
  floors: number[]
  selectedFloor: number
  units: IMIProperty[]
  onFloorSelect: (floor: number) => void
}

export default function FloorSelector({ floors, selectedFloor, units, onFloorSelect }: Props) {
  const availableByFloor = (floor: number) =>
    units.filter(u => u.floor === floor && u.status === 'available').length

  const totalByFloor = (floor: number) =>
    units.filter(u => u.floor === floor).length

  return (
    // Mobile: horizontal scroll row | sm+: vertical column (reversed = top floor on top)
    <div
      className="flex flex-row gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:flex-col-reverse sm:overflow-y-auto sm:overflow-x-hidden sm:pb-0 sm:max-h-[480px]"
      style={{ scrollbarWidth: 'thin' }}
    >
      {floors.map(floor => {
        const avail = availableByFloor(floor)
        const total = totalByFloor(floor)
        const pct = total > 0 ? avail / total : 0
        const isSelected = floor === selectedFloor
        const isTop = floor === Math.max(...floors)

        return (
          <button
            key={floor}
            onClick={() => onFloorSelect(floor)}
            className="relative flex items-center gap-2 rounded-lg transition-all text-left flex-shrink-0"
            style={{
              background: isSelected ? '#0B1928' : '#F8F6F2',
              border: isSelected ? '1.5px solid #0B1928' : '1px solid rgba(184,179,168,0.3)',
              minWidth: 60,
              padding: '6px 8px',
            }}
          >
            {/* Availability dot */}
            <div
              style={{
                width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                background: avail > 0 ? AVAILABILITY_COLORS.available.bg : '#D1D5DB',
              }}
            />
            <div className="flex-1 min-w-0">
              <p style={{ fontSize: 12, fontWeight: 800, color: isSelected ? '#fff' : '#0B1928', margin: 0, fontFamily: "var(--fm, 'JetBrains Mono', monospace)" }}>
                {isTop && floor === 12 ? 'Cob' : `${floor}º`}
              </p>
            </div>
            {/* Availability bar */}
            <div style={{ width: 22, height: 2.5, background: isSelected ? 'rgba(255,255,255,0.2)' : '#E5E0D8', borderRadius: 2, overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${pct * 100}%`,
                  background: isSelected ? '#C8A44A' : AVAILABILITY_COLORS.available.bg,
                  borderRadius: 2,
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </button>
        )
      })}
    </div>
  )
}
