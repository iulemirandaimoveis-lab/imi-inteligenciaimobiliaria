'use client'

import { useMemo, useState, useEffect } from 'react'
import { Building2, ChevronRight, GitCompare, X as XIcon } from 'lucide-react'
import { type IMIProperty, type AvailabilityStatus, AVAILABILITY_COLORS } from '@/lib/imi-domain/types'
import { createClient } from '@/lib/supabase/client'
import { buildJazzUnits, JAZZ_FLOORS, JAZZ_TOWERS, type JazzPlanType, JAZZ_PLANS } from '../data/jazzUnits'
import FloorSelector from './FloorSelector'
import UnitGrid from './UnitGrid'
import UnitDetailPanel from './UnitDetailPanel'
import AvailabilityLegend from './AvailabilityLegend'

const JAZZ_DEV_SLUG = 'jazz-boulevard'

interface Props {
  whatsappPhone?: string
}

export default function JazzBoulevardViewer({ whatsappPhone = '5581986141487' }: Props) {
  const [selectedTower, setSelectedTower] = useState<'A' | 'B'>('A')
  const [selectedFloor, setSelectedFloor] = useState(1)
  const [selectedUnit, setSelectedUnit] = useState<IMIProperty | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<JazzPlanType | null>(null)
  const [dbStatuses, setDbStatuses] = useState<Record<string, AvailabilityStatus>>({})
  const [compareMode, setCompareMode] = useState(false)
  const [compareUnits, setCompareUnits] = useState<IMIProperty[]>([])

  useEffect(() => {
    const supabase = createClient()
    async function fetchStatuses() {
      const { data: devData } = await supabase
        .from('developments')
        .select('id')
        .eq('slug', JAZZ_DEV_SLUG)
        .single()
      if (!devData?.id) return

      const { data: units } = await supabase
        .from('imi_properties')
        .select('code, status')
        .eq('development_id', devData.id)
      if (!units) return

      const map: Record<string, AvailabilityStatus> = {}
      for (const u of units) {
        map[u.code] = u.status as AvailabilityStatus
      }
      setDbStatuses(map)
    }
    fetchStatuses()
  }, [])

  const allUnits = useMemo(() => {
    const units = buildJazzUnits(selectedTower)
    if (Object.keys(dbStatuses).length === 0) return units
    return units.map(u => ({
      ...u,
      status: dbStatuses[u.code] ?? u.status,
    }))
  }, [selectedTower, dbStatuses])

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

  function handleUnitSelect(unit: IMIProperty) {
    if (!compareMode) { setSelectedUnit(unit); return }
    setCompareUnits(prev => {
      if (prev.some(u => u.id === unit.id)) return prev.filter(u => u.id !== unit.id)
      if (prev.length >= 2) return [prev[1], unit]
      return [...prev, unit]
    })
  }

  function toggleCompareMode() {
    setCompareMode(m => !m)
    setCompareUnits([])
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
        <div className="flex items-center gap-3">
          <button
            onClick={toggleCompareMode}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all"
            style={{
              background: compareMode ? '#0B1928' : '#F8F6F2',
              color: compareMode ? '#C8A44A' : '#948F84',
              border: compareMode ? '1.5px solid #0B1928' : '1px solid rgba(184,179,168,0.3)',
              fontFamily: "var(--fu, 'Outfit', sans-serif)",
            }}
          >
            <GitCompare size={13} />
            {compareMode ? `Comparar (${compareUnits.length}/2)` : 'Comparar'}
          </button>
          <AvailabilityLegend />
        </div>
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
            {compareMode && (
              <p style={{ fontSize: 11, color: '#C8A44A', fontWeight: 700, marginBottom: 8, fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>
                Selecione até 2 unidades para comparar
              </p>
            )}
            <UnitGrid
              units={filteredUnits}
              selectedUnitId={compareMode ? null : (selectedUnit?.id ?? null)}
              compareIds={compareMode ? new Set(compareUnits.map(u => u.id)) : undefined}
              onUnitSelect={handleUnitSelect}
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

      {/* Comparison panel — appears when 2 units selected */}
      {compareMode && compareUnits.length === 2 && (
        <ComparePanel units={compareUnits} whatsappPhone={whatsappPhone} onClose={toggleCompareMode} />
      )}
    </div>
  )
}

// ─── Compare Panel ────────────────────────────────────────────────────────────

const fmtBRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)

function ComparePanel({ units, whatsappPhone, onClose }: { units: IMIProperty[]; whatsappPhone: string; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const [a, b] = units
  const planA = (a.metadata?.planType as string) ?? ''
  const planB = (b.metadata?.planType as string) ?? ''

  const rows: Array<{ label: string; a: string; b: string; highlight?: boolean }> = [
    { label: 'Código', a: a.code, b: b.code },
    { label: 'Torre', a: `Torre ${a.tower}`, b: `Torre ${b.tower}` },
    { label: 'Andar', a: `${a.floor}º`, b: `${b.floor}º` },
    { label: 'Planta', a: planA, b: planB },
    { label: 'Preço', a: a.price ? fmtBRL(a.price) : '—', b: b.price ? fmtBRL(b.price) : '—', highlight: true },
    { label: 'R$/m²', a: a.price && a.privateAreaM2 ? fmtBRL(Math.round(a.price / a.privateAreaM2)) : '—', b: b.price && b.privateAreaM2 ? fmtBRL(Math.round(b.price / b.privateAreaM2)) : '—' },
    { label: 'Área Priv.', a: `${a.privateAreaM2} m²`, b: `${b.privateAreaM2} m²` },
    { label: 'Dormitórios', a: `${a.bedrooms} (${a.suites} suíte${(a.suites ?? 0) !== 1 ? 's' : ''})`, b: `${b.bedrooms} (${b.suites} suíte${(b.suites ?? 0) !== 1 ? 's' : ''})` },
    { label: 'Vagas', a: String(a.parkingSpaces ?? '—'), b: String(b.parkingSpaces ?? '—') },
    { label: 'Orientação', a: (a.metadata?.solarOrientation as string) ?? '—', b: (b.metadata?.solarOrientation as string) ?? '—' },
    { label: 'Vista', a: (a.metadata?.viewLabel as string) ?? '—', b: (b.metadata?.viewLabel as string) ?? '—' },
  ]

  return (
    <>
      <div className="fixed inset-0 z-50" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={onClose} />
      <div
        className="fixed bottom-0 left-0 right-0 sm:bottom-6 sm:left-1/2 sm:-translate-x-1/2 z-[51] rounded-t-[20px] sm:rounded-2xl overflow-hidden"
        style={{ maxHeight: '85vh', width: '100%', maxWidth: 680, background: '#fff', boxShadow: '0 -8px 40px rgba(0,0,0,0.2)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <GitCompare size={16} style={{ color: '#C8A44A' }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: '#0B1928', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>
              Comparação de Unidades
            </span>
          </div>
          <button onClick={onClose} aria-label="Fechar comparação" className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
            <XIcon size={15} style={{ color: '#948F84' }} />
          </button>
        </div>

        {/* Column headers */}
        <div className="grid grid-cols-3 px-5 py-3 bg-gray-50 border-b border-gray-100">
          <div />
          {[a, b].map(u => (
            <div key={u.id} className="text-center">
              <p style={{ fontSize: 13, fontWeight: 800, color: '#0B1928', margin: 0, fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>Apto {u.code}</p>
              <p style={{ fontSize: 10, color: '#948F84', margin: '2px 0 0' }}>Torre {u.tower}</p>
            </div>
          ))}
        </div>

        {/* Rows */}
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(85vh - 160px)' }}>
          {rows.map(row => (
            <div key={row.label} className="grid grid-cols-3 px-5 py-2.5 border-b border-gray-50" style={{ background: row.highlight ? '#FFFDF5' : undefined }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#948F84', alignSelf: 'center' }}>{row.label}</span>
              {[row.a, row.b].map((val, i) => (
                <span key={i} className="text-center" style={{ fontSize: 13, fontWeight: row.highlight ? 800 : 600, color: row.highlight ? '#0B1928' : '#374151', fontFamily: row.highlight ? "var(--fm, 'JetBrains Mono', monospace)" : undefined }}>
                  {val}
                </span>
              ))}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="flex gap-3 px-5 py-4" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 16px), 16px)' }}>
          {[a, b].map(u => (
            <a key={u.id} href={`https://wa.me/${whatsappPhone}?text=${encodeURIComponent(`Olá! Após comparar, tenho interesse no apartamento ${u.code} do Jazz Boulevard. Gostaria de mais informações.`)}`}
              target="_blank" rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold"
              style={{ background: '#0B1928', color: '#C8A44A', fontFamily: "var(--fu, 'Outfit', sans-serif)", textDecoration: 'none' }}>
              Apto {u.code}
            </a>
          ))}
        </div>
      </div>
    </>
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
