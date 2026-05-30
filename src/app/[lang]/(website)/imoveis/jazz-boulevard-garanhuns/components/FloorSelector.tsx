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
    <div
      className="flex flex-col-reverse gap-1 overflow-y-auto"
      style={{ maxHeight: 480, scrollbarWidth: 'thin' }}
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
            className="relative flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-left"
            style={{
              background: isSelected ? '#0B1928' : '#F8F6F2',
              border: isSelected ? 'none' : '1px solid rgba(184,179,168,0.3)',
              minWidth: 72,
            }}
          >
            {/* Availability dot */}
            <div
              style={{
                width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                background: avail > 0
                  ? AVAILABILITY_COLORS.available.bg
                  : '#D1D5DB',
              }}
            />
            <div className="flex-1 min-w-0">
              <p style={{ fontSize: 13, fontWeight: 800, color: isSelected ? '#fff' : '#0B1928', margin: 0, fontFamily: "var(--fm, 'JetBrains Mono', monospace)" }}>
                {isTop && floor === 12 ? 'Cob' : `${floor}º`}
              </p>
            </div>
            {/* Availability bar */}
            <div style={{ width: 28, height: 3, background: isSelected ? 'rgba(255,255,255,0.2)' : '#E5E0D8', borderRadius: 2, overflow: 'hidden' }}>
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
