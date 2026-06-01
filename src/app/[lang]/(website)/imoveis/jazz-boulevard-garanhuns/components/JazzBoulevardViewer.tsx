'use client'

import { useMemo, useState } from 'react'
import { Building2, ChevronRight } from 'lucide-react'
import { type IMIProperty, AVAILABILITY_COLORS } from '@/lib/imi-domain/types'
import { buildJazzUnits, JAZZ_FLOORS, JAZZ_TOWERS, type JazzPlanType, JAZZ_PLANS } from '../data/jazzUnits'
import FloorSelector from './FloorSelector'
import UnitGrid from './UnitGrid'
import UnitDetailPanel from './UnitDetailPanel'
import AvailabilityLegend from './AvailabilityLegend'

interface Props {
  whatsappPhone?: string
}

export default function JazzBoulevardViewer({ whatsappPhone = '5581997230455' }: Props) {
  const [selectedTower, setSelectedTower] = useState<'A' | 'B'>('A')
  const [selectedFloor, setSelectedFloor] = useState(1)
  const [selectedUnit, setSelectedUnit] = useState<IMIProperty | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<JazzPlanType | null>(null)

  const allUnits = useMemo(() => buildJazzUnits(selectedTower), [selectedTower])

  const floorUnits = useMemo(
    () => allUnits.filter(u => u.floor === selectedFloor),
    [allUnits, selectedFloor]
  )

  const filteredUnits = useMemo(() => {
    if (!selectedPlan) return floorUnits
    return floorUnits.filter(u => u.metadata?.planType === selectedPlan)
  }, [floorUnits, selectedPlan])

  const towerStats = useMemo(() => {
    const available = allUnits.filter(u => u.status === 'available').length
    const total = allUnits.length
    return { available, total }
  }, [allUnits])

  function handleTowerChange(tower: 'A' | 'B') {
    setSelectedTower(tower)
    setSelectedUnit(null)
    setSelectedFloor(1)
  }

  function handleFloorChange(floor: number) {
    setSelectedFloor(floor)
    setSelectedUnit(null)
  }

  return (
    <div className="relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-1 h-6 rounded-full" style={{ background: '#C8A44A' }} />
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0B1928', margin: 0, fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>
              Unidades Disponíveis
            </h2>
          </div>
          <p style={{ fontSize: 13, color: '#948F84', margin: 0 }}>
            Torre {selectedTower} · {towerStats.available} de {towerStats.total} unidades disponíveis
          </p>
        </div>
        <AvailabilityLegend />
      </div>

      {/* Tower + Plan Selectors — two clean rows on mobile */}
      <div className="flex flex-col gap-2.5 mb-6">
        {/* Torre row */}
        <div className="flex items-center gap-2">
          <span style={{ fontSize: 10, fontWeight: 700, color: '#948F84', textTransform: 'uppercase', letterSpacing: '0.15em', fontFamily: "var(--fu, 'Outfit', sans-serif)", flexShrink: 0, minWidth: 44 }}>
            Torre
          </span>
          <div className="flex gap-1">
            {JAZZ_TOWERS.map(tower => (
              <button
                key={tower}
                onClick={() => handleTowerChange(tower)}
                className="flex items-center gap-1.5 rounded-lg transition-all font-bold flex-shrink-0"
                style={{
                  height: 32, padding: '0 12px',
                  background: selectedTower === tower ? '#0B1928' : '#F8F6F2',
                  color: selectedTower === tower ? '#fff' : '#948F84',
                  border: selectedTower === tower ? '1.5px solid #0B1928' : '1px solid rgba(184,179,168,0.3)',
                  fontSize: 13,
                  fontFamily: "var(--fu, 'Outfit', sans-serif)",
                }}
              >
                <Building2 size={12} />
                {tower}
              </button>
            ))}
          </div>
        </div>

        {/* Planta row — label pinned left, buttons scroll right */}
        <div className="flex items-center gap-2 min-w-0">
          <span style={{ fontSize: 10, fontWeight: 700, color: '#948F84', textTransform: 'uppercase', letterSpacing: '0.15em', fontFamily: "var(--fu, 'Outfit', sans-serif)", flexShrink: 0, minWidth: 44 }}>
            Planta
          </span>
          <div className="flex gap-1 overflow-x-auto no-scrollbar flex-1 pb-0.5">
            <button
              onClick={() => setSelectedPlan(null)}
              className="rounded-lg text-xs font-bold transition-all flex-shrink-0"
              style={{
                height: 28, padding: '0 10px',
                background: selectedPlan === null ? '#0B1928' : '#F8F6F2',
                color: selectedPlan === null ? '#fff' : '#948F84',
                border: selectedPlan === null ? '1.5px solid #0B1928' : '1px solid rgba(184,179,168,0.3)',
                fontFamily: "var(--fu, 'Outfit', sans-serif)",
                whiteSpace: 'nowrap',
              }}
            >
              Todas
            </button>
            {(Object.keys(JAZZ_PLANS) as JazzPlanType[]).map(plan => (
              <button
                key={plan}
                onClick={() => setSelectedPlan(p => p === plan ? null : plan)}
                className="rounded-lg text-xs font-bold transition-all flex-shrink-0"
                style={{
                  height: 28, padding: '0 10px',
                  background: selectedPlan === plan ? '#C8A44A' : '#F8F6F2',
                  color: selectedPlan === plan ? '#0B1928' : '#948F84',
                  border: selectedPlan === plan ? '1.5px solid #C8A44A' : '1px solid rgba(184,179,168,0.3)',
                  fontFamily: "var(--fu, 'Outfit', sans-serif)",
                  whiteSpace: 'nowrap',
                }}
              >
                {plan}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main grid: floor selector + units — stacked on mobile, side-by-side on sm+ */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Floor column */}
        <div className="sm:flex-shrink-0">
          <p style={{ fontSize: 9, fontWeight: 700, color: '#948F84', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 8, fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>
            Andar
          </p>
          <FloorSelector
            floors={JAZZ_FLOORS}
            selectedFloor={selectedFloor}
            units={allUnits}
            onFloorSelect={handleFloorChange}
          />
        </div>

        {/* Units area */}
        <div className="flex-1 min-w-0">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1 mb-4" style={{ fontSize: 11, color: '#948F84', fontWeight: 600 }}>
            <span>Jazz Boulevard</span>
            <ChevronRight size={11} />
            <span>Torre {selectedTower}</span>
            <ChevronRight size={11} />
            <span style={{ color: '#0B1928', fontWeight: 700 }}>
              {selectedFloor === 12 ? 'Cobertura' : `${selectedFloor}º Andar`}
              {selectedPlan && ` · ${selectedPlan}`}
            </span>
          </div>

          {/* Floor stats */}
          <FloorStatsBar units={floorUnits} />

          {/* Unit cards */}
          <div className="mt-4">
            <UnitGrid
              units={filteredUnits}
              selectedUnitId={selectedUnit?.id ?? null}
              onUnitSelect={setSelectedUnit}
            />
          </div>
        </div>
      </div>

      {/* Unit Detail Side Panel */}
      <UnitDetailPanel
        unit={selectedUnit}
        whatsappPhone={whatsappPhone}
        onClose={() => setSelectedUnit(null)}
      />

      {/* Overlay when panel is open */}
      {selectedUnit && (
        <div
          className="fixed inset-0 z-40 sm:hidden"
          style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={() => setSelectedUnit(null)}
        />
      )}
    </div>
  )
}

function FloorStatsBar({ units }: { units: IMIProperty[] }) {
  const counts = units.reduce<Record<string, number>>((acc, u) => {
    acc[u.status] = (acc[u.status] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="flex flex-wrap gap-2">
      {(Object.entries(counts) as [IMIProperty['status'], number][]).map(([status, count]) => {
        const cfg = AVAILABILITY_COLORS[status]
        return (
          <div
            key={status}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
            style={{ background: cfg.light }}
          >
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.bg }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: cfg.dark }}>
              {count} {cfg.label.toLowerCase()}{count !== 1 ? 's' : ''}
            </span>
          </div>
        )
      })}
    </div>
  )
}
