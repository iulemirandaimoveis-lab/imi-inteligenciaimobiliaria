'use client'

import { useState, useEffect, useMemo } from 'react'
import { Building2, BedDouble, Bath, Car, Maximize2, X, MessageCircle, ChevronRight } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { type IMIProperty, type AvailabilityStatus, AVAILABILITY_COLORS } from '@/lib/imi-domain/types'
import FloorSelector from '../../imoveis/jazz-boulevard-garanhuns/components/FloorSelector'

// Map Supabase snake_case row → IMIProperty camelCase
function mapRow(row: Record<string, unknown>): IMIProperty {
  return {
    id: row.id as string,
    developmentId: row.development_id as string,
    kind: row.kind as IMIProperty['kind'],
    code: row.code as string,
    title: (row.title as string) ?? '',
    block: row.block as string | undefined,
    lotNumber: row.lot_number as string | undefined,
    tower: row.tower as string | undefined,
    floor: row.floor as number | undefined,
    unitNumber: row.unit_number as string | undefined,
    privateAreaM2: row.private_area_m2 as number | undefined,
    totalAreaM2: row.total_area_m2 as number | undefined,
    bedrooms: row.bedrooms as number | undefined,
    suites: row.suites as number | undefined,
    bathrooms: row.bathrooms as number | undefined,
    parkingSpaces: row.parking_spaces as number | undefined,
    status: row.status as AvailabilityStatus,
    price: row.price as number | undefined,
    priceVisible: row.price_visible as boolean,
    sceneNodeId: (row.scene_node_id as string) ?? '',
    media: (row.media as IMIProperty['media']) ?? {},
    commercial: (row.commercial as IMIProperty['commercial']) ?? { leadCaptureEnabled: true },
    metadata: (row.metadata as Record<string, unknown>) ?? {},
  }
}

interface Props {
  developmentId: string
  developmentName: string
  whatsappPhone?: string
}

export default function GenericBuildingViewer({
  developmentId,
  developmentName,
  whatsappPhone = '5581997230455',
}: Props) {
  const [units, setUnits] = useState<IMIProperty[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTower, setSelectedTower] = useState<string | null>(null)
  const [selectedFloor, setSelectedFloor] = useState(1)
  const [selectedUnit, setSelectedUnit] = useState<IMIProperty | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const res = await fetch(`/api/spatial/developments/${developmentId}/properties?kind=apartment`)
        const json = await res.json()
        if (json.data && Array.isArray(json.data)) {
          const mapped = (json.data as Record<string, unknown>[]).map(mapRow)
          setUnits(mapped)
          const towers = [...new Set(mapped.map(u => u.tower).filter(Boolean))].sort() as string[]
          if (towers.length > 0) setSelectedTower(towers[0])
          const allFloors = [...new Set(mapped.map(u => u.floor).filter((f): f is number => f != null))].sort((a, b) => a - b)
          if (allFloors.length > 0) setSelectedFloor(allFloors[0])
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [developmentId])

  const towers = useMemo(
    () => [...new Set(units.map(u => u.tower).filter(Boolean))].sort() as string[],
    [units],
  )

  const towerUnits = useMemo(
    () => (selectedTower ? units.filter(u => u.tower === selectedTower) : units),
    [units, selectedTower],
  )

  const floors = useMemo(
    () =>
      [...new Set(towerUnits.map(u => u.floor).filter((f): f is number => f != null))].sort(
        (a, b) => a - b,
      ),
    [towerUnits],
  )

  const floorUnits = useMemo(
    () => towerUnits.filter(u => u.floor === selectedFloor),
    [towerUnits, selectedFloor],
  )

  const stats = useMemo(
    () => ({
      available: towerUnits.filter(u => u.status === 'available').length,
      total: towerUnits.length,
    }),
    [towerUnits],
  )

  function handleTowerChange(tower: string) {
    setSelectedTower(tower)
    setSelectedUnit(null)
    const tFloors = [
      ...new Set(
        units.filter(u => u.tower === tower).map(u => u.floor).filter((f): f is number => f != null),
      ),
    ].sort((a, b) => a - b)
    setSelectedFloor(tFloors[0] ?? 1)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 rounded-full animate-pulse" style={{ background: '#C8A44A' }} />
          <p style={{ fontSize: 13, color: '#948F84', fontWeight: 600 }}>Carregando unidades…</p>
        </div>
      </div>
    )
  }

  if (units.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Building2 size={48} className="mb-4 opacity-20" />
        <p style={{ fontSize: 14, color: '#948F84', fontWeight: 600 }}>Unidades em breve.</p>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-1 h-6 rounded-full" style={{ background: '#C8A44A' }} />
            <h2
              style={{
                fontSize: 20, fontWeight: 700, color: '#0B1928', margin: 0,
                fontFamily: "var(--fu, 'Outfit', sans-serif)",
              }}
            >
              Unidades Disponíveis
            </h2>
          </div>
          <p style={{ fontSize: 13, color: '#948F84', margin: 0 }}>
            {selectedTower ? `Torre ${selectedTower} · ` : ''}
            {stats.available} de {stats.total} unidades disponíveis
          </p>
        </div>
        <AvailabilityLegend />
      </div>

      {/* Tower selector */}
      {towers.length > 1 && (
        <div className="flex items-center gap-2 mb-4">
          <span
            style={{
              fontSize: 10, fontWeight: 700, color: '#948F84', textTransform: 'uppercase',
              letterSpacing: '0.15em', fontFamily: "var(--fu, 'Outfit', sans-serif)",
              flexShrink: 0, minWidth: 44,
            }}
          >
            Torre
          </span>
          <div className="flex gap-1">
            {towers.map(tower => (
              <button
                key={tower}
                onClick={() => handleTowerChange(tower)}
                className="flex items-center gap-1.5 rounded-lg transition-all font-bold flex-shrink-0"
                style={{
                  height: 32, padding: '0 12px', fontSize: 13,
                  fontFamily: "var(--fu, 'Outfit', sans-serif)",
                  background: selectedTower === tower ? '#0B1928' : '#F8F6F2',
                  color: selectedTower === tower ? '#fff' : '#948F84',
                  border: selectedTower === tower ? '1.5px solid #0B1928' : '1px solid rgba(184,179,168,0.3)',
                }}
              >
                <Building2 size={12} />
                {tower}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Floor selector + unit grid */}
      <div className="flex flex-col sm:flex-row gap-4">
        {floors.length > 1 && (
          <div className="sm:flex-shrink-0">
            <p
              style={{
                fontSize: 9, fontWeight: 700, color: '#948F84', textTransform: 'uppercase',
                letterSpacing: '0.15em', marginBottom: 8,
                fontFamily: "var(--fu, 'Outfit', sans-serif)",
              }}
            >
              Andar
            </p>
            <FloorSelector
              floors={floors}
              selectedFloor={selectedFloor}
              units={towerUnits}
              onFloorSelect={floor => { setSelectedFloor(floor); setSelectedUnit(null) }}
            />
          </div>
        )}

        <div className="flex-1 min-w-0">
          {/* Breadcrumb */}
          <div
            className="flex items-center gap-1 mb-4"
            style={{ fontSize: 11, color: '#948F84', fontWeight: 600 }}
          >
            <span>{developmentName}</span>
            {selectedTower && (
              <>
                <ChevronRight size={11} />
                <span>Torre {selectedTower}</span>
              </>
            )}
            <ChevronRight size={11} />
            <span style={{ color: '#0B1928', fontWeight: 700 }}>{selectedFloor}º Andar</span>
          </div>

          <FloorStatsBar units={floorUnits} />

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {floorUnits.length === 0 ? (
              <div className="col-span-2 flex items-center justify-center py-12">
                <p style={{ fontSize: 13, color: '#948F84', fontWeight: 600 }}>
                  Nenhuma unidade neste andar.
                </p>
              </div>
            ) : (
              floorUnits.map(unit => (
                <UnitCard
                  key={unit.id}
                  unit={unit}
                  isSelected={unit.id === selectedUnit?.id}
                  onSelect={() => setSelectedUnit(unit)}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Side panel */}
      <UnitDetailPanel
        unit={selectedUnit}
        developmentName={developmentName}
        whatsappPhone={whatsappPhone}
        onClose={() => setSelectedUnit(null)}
      />

      {/* Mobile overlay */}
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

// ─── Sub-components ───────────────────────────────────────────────────────────

function AvailabilityLegend() {
  const shown: AvailabilityStatus[] = ['available', 'reserved', 'sold']
  return (
    <div className="flex flex-wrap gap-2">
      {shown.map(s => {
        const cfg = AVAILABILITY_COLORS[s]
        return (
          <div
            key={s}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
            style={{ background: cfg.light }}
          >
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.bg }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: cfg.dark, letterSpacing: '0.05em' }}>
              {cfg.label}
            </span>
          </div>
        )
      })}
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
      {(Object.entries(counts) as [AvailabilityStatus, number][]).map(([status, count]) => {
        const cfg = AVAILABILITY_COLORS[status]
        return (
          <div
            key={status}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
            style={{ background: cfg.light }}
          >
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.bg }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: cfg.dark }}>
              {count} {cfg.label.toLowerCase()}
              {count !== 1 ? 's' : ''}
            </span>
          </div>
        )
      })}
    </div>
  )
}

const fmtBRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(v)

function UnitCard({
  unit,
  isSelected,
  onSelect,
}: {
  unit: IMIProperty
  isSelected: boolean
  onSelect: () => void
}) {
  const cfg = AVAILABILITY_COLORS[unit.status]
  const label = unit.metadata?.planType as string | undefined
  const isAvailable = unit.status === 'available' || unit.status === 'launching'

  return (
    <button
      onClick={onSelect}
      className="text-left rounded-2xl overflow-hidden transition-all"
      style={{
        border: isSelected ? '2px solid #C8A44A' : '1.5px solid rgba(184,179,168,0.3)',
        background: isSelected ? '#FFFDF5' : '#fff',
        boxShadow: isSelected ? '0 4px 20px rgba(200,164,74,0.15)' : undefined,
        opacity: unit.status === 'hidden' ? 0 : 1,
        cursor: unit.status === 'sold' ? 'default' : 'pointer',
      }}
    >
      <div style={{ height: 3, background: cfg.bg }} />
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <p
              style={{
                fontSize: 15, fontWeight: 800, color: '#0B1928', margin: 0,
                fontFamily: "var(--fu, 'Outfit', sans-serif)",
              }}
            >
              Apto {unit.unitNumber ?? unit.code}
            </p>
            {label && (
              <p style={{ fontSize: 10, color: '#948F84', margin: '1px 0 0', fontWeight: 600 }}>
                {label}
              </p>
            )}
          </div>
          <span
            className="text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-full flex-shrink-0"
            style={{ background: cfg.light, color: cfg.dark }}
          >
            {cfg.label}
          </span>
        </div>

        <div className="flex items-center gap-3 mb-3">
          {unit.bedrooms != null && (
            <div className="flex items-center gap-1">
              <BedDouble size={11} style={{ color: '#948F84' }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: '#948F84' }}>
                {unit.bedrooms} dorms
              </span>
            </div>
          )}
          {unit.privateAreaM2 != null && (
            <div className="flex items-center gap-1">
              <Maximize2 size={11} style={{ color: '#948F84' }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: '#948F84' }}>
                {unit.privateAreaM2} m²
              </span>
            </div>
          )}
        </div>

        {unit.priceVisible && unit.price && (
          <p
            style={{
              fontSize: 16, fontWeight: 800, margin: 0,
              color: isAvailable ? '#0B1928' : '#9CA3AF',
              fontFamily: "var(--fm, 'JetBrains Mono', monospace)",
            }}
          >
            {unit.status === 'sold' ? 'Vendido' : fmtBRL(unit.price)}
          </p>
        )}
      </div>
    </button>
  )
}

function UnitDetailPanel({
  unit,
  developmentName,
  whatsappPhone,
  onClose,
}: {
  unit: IMIProperty | null
  developmentName: string
  whatsappPhone: string
  onClose: () => void
}) {
  return (
    <AnimatePresence>
      {unit && (
        <motion.div
          key={unit.id}
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="fixed right-0 top-0 bottom-0 z-50 w-full sm:w-[380px] overflow-y-auto"
          style={{ background: '#fff', boxShadow: '-8px 0 40px rgba(0,0,0,0.18)' }}
        >
          <PanelContent
            unit={unit}
            developmentName={developmentName}
            whatsappPhone={whatsappPhone}
            onClose={onClose}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function PanelContent({
  unit,
  developmentName,
  whatsappPhone,
  onClose,
}: {
  unit: IMIProperty
  developmentName: string
  whatsappPhone: string
  onClose: () => void
}) {
  const cfg = AVAILABILITY_COLORS[unit.status]
  const isAvailable = unit.status === 'available' || unit.status === 'launching'
  const label = unit.metadata?.planType as string | undefined

  const locationParts = [
    unit.tower ? `Torre ${unit.tower}` : null,
    unit.floor ? `${unit.floor}º andar` : null,
  ].filter(Boolean).join(' · ')

  const waMsg = encodeURIComponent(
    `Olá! Tenho interesse na unidade ${unit.code} do ${developmentName}${locationParts ? ` (${locationParts})` : ''}. Gostaria de mais informações.`,
  )

  return (
    <div>
      <div style={{ height: 4, background: cfg.bg }} />

      {/* Header */}
      <div className="flex items-start justify-between p-5 pb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full"
              style={{ background: cfg.light, color: cfg.dark }}
            >
              {cfg.label}
            </span>
            {label && (
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: '#F0EDE5', color: '#948F84' }}
              >
                {label}
              </span>
            )}
          </div>
          <h3
            style={{
              fontSize: 22, fontWeight: 800, color: '#0B1928', margin: '4px 0 0',
              fontFamily: "var(--fu, 'Outfit', sans-serif)",
            }}
          >
            Apto {unit.unitNumber ?? unit.code}
          </h3>
          {locationParts && (
            <p style={{ fontSize: 12, color: '#948F84', margin: '2px 0 0' }}>{locationParts}</p>
          )}
        </div>
        <button
          onClick={onClose}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors flex-shrink-0"
        >
          <X size={16} />
        </button>
      </div>

      {/* Floor plan */}
      {unit.media?.floorPlanImage && (
        <div className="mx-5 mb-4 rounded-2xl overflow-hidden bg-gray-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={unit.media.floorPlanImage}
            alt="Planta baixa"
            className="w-full object-cover"
            style={{ maxHeight: 220 }}
          />
        </div>
      )}

      {/* Specs grid */}
      <div className="mx-5 mb-5 grid grid-cols-2 gap-2">
        {unit.bedrooms != null && (
          <SpecTile icon={<BedDouble size={16} style={{ color: '#948F84' }} />} value={unit.bedrooms} label="Dorms" />
        )}
        {unit.suites != null && unit.suites > 0 && (
          <SpecTile icon={<BedDouble size={16} style={{ color: '#C8A44A' }} />} value={unit.suites} label={`Suíte${unit.suites !== 1 ? 's' : ''}`} />
        )}
        {unit.bathrooms != null && (
          <SpecTile icon={<Bath size={16} style={{ color: '#948F84' }} />} value={unit.bathrooms} label={`Banheiro${unit.bathrooms !== 1 ? 's' : ''}`} />
        )}
        {unit.parkingSpaces != null && unit.parkingSpaces > 0 && (
          <SpecTile icon={<Car size={16} style={{ color: '#948F84' }} />} value={unit.parkingSpaces} label={`Vaga${unit.parkingSpaces !== 1 ? 's' : ''}`} />
        )}
        {unit.privateAreaM2 != null && (
          <SpecTile icon={<Maximize2 size={16} style={{ color: '#948F84' }} />} value={`${unit.privateAreaM2} m²`} label="Privativo" />
        )}
        {unit.totalAreaM2 != null && unit.totalAreaM2 !== unit.privateAreaM2 && (
          <SpecTile icon={<Maximize2 size={16} style={{ color: '#C8A44A' }} />} value={`${unit.totalAreaM2} m²`} label="Total" />
        )}
      </div>

      {/* Price */}
      {unit.priceVisible && unit.price && (
        <div className="mx-5 mb-5 p-4 rounded-2xl" style={{ background: '#0B1928' }}>
          <p
            style={{
              fontSize: 11, color: 'rgba(255,255,255,0.5)', margin: '0 0 4px',
              fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em',
            }}
          >
            Valor
          </p>
          <p
            style={{
              fontSize: 26, fontWeight: 800, color: '#C8A44A', margin: 0,
              fontFamily: "var(--fm, 'JetBrains Mono', monospace)",
            }}
          >
            {fmtBRL(unit.price)}
          </p>
        </div>
      )}

      {/* CTA */}
      {isAvailable && (
        <div className="mx-5 mb-8">
          <a
            href={`https://wa.me/${whatsappPhone}?text=${waMsg}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full rounded-2xl transition-all"
            style={{
              height: 50, background: '#16A34A', color: '#fff',
              fontWeight: 700, fontSize: 14, textDecoration: 'none',
              fontFamily: "var(--fu, 'Outfit', sans-serif)",
            }}
          >
            <MessageCircle size={18} />
            Tenho interesse
          </a>
        </div>
      )}
    </div>
  )
}

function SpecTile({ icon, value, label }: { icon: React.ReactNode; value: string | number; label: string }) {
  return (
    <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: '#F8F6F2' }}>
      {icon}
      <div>
        <p style={{ fontSize: 16, fontWeight: 800, color: '#0B1928', margin: 0 }}>{value}</p>
        <p style={{ fontSize: 10, color: '#948F84', margin: 0 }}>{label}</p>
      </div>
    </div>
  )
}
