'use client'

import { type IMIProperty, AVAILABILITY_COLORS } from '@/lib/imi-domain/types'
import { type JazzPlanType } from '../data/jazzUnits'
import { BedDouble, Maximize2, Eye } from 'lucide-react'

const fmtBRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)

interface Props {
  units: IMIProperty[]
  selectedUnitId: string | null
  onUnitSelect: (unit: IMIProperty) => void
}

export default function UnitGrid({ units, selectedUnitId, onUnitSelect }: Props) {
  if (units.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p style={{ fontSize: 13, color: '#948F84', fontWeight: 600 }}>
          Nenhuma unidade neste andar.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {units.map(unit => {
        const cfg = AVAILABILITY_COLORS[unit.status]
        const isSelected = unit.id === selectedUnitId
        const planType = (unit.metadata?.planType as JazzPlanType | undefined) ?? 'Planta Tipo A'
        const isAvailable = unit.status === 'available' || unit.status === 'launching'

        return (
          <button
            key={unit.id}
            onClick={() => onUnitSelect(unit)}
            className="text-left rounded-2xl overflow-hidden transition-all"
            style={{
              border: isSelected ? '2px solid #C8A44A' : '1.5px solid rgba(184,179,168,0.3)',
              background: isSelected ? '#FFFDF5' : '#fff',
              boxShadow: isSelected ? '0 4px 20px rgba(200,164,74,0.15)' : undefined,
              opacity: unit.status === 'hidden' ? 0 : 1,
              cursor: unit.status === 'sold' ? 'default' : 'pointer',
            }}
          >
            {/* Status stripe */}
            <div style={{ height: 3, background: cfg.bg }} />

            <div className="p-4">
              {/* Header row */}
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p style={{ fontSize: 15, fontWeight: 800, color: '#0B1928', margin: 0, fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>
                    Apto {unit.code}
                  </p>
                  <p style={{ fontSize: 10, color: '#948F84', margin: '1px 0 0', fontWeight: 600 }}>
                    {planType}
                  </p>
                </div>
                <span
                  className="text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-full flex-shrink-0"
                  style={{ background: cfg.light, color: cfg.dark }}
                >
                  {cfg.label}
                </span>
              </div>

              {/* Specs row */}
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <div className="flex items-center gap-1">
                  <BedDouble size={11} style={{ color: '#948F84' }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#948F84' }}>{unit.bedrooms} dorms</span>
                </div>
                <div className="flex items-center gap-1">
                  <Maximize2 size={11} style={{ color: '#948F84' }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#948F84' }}>{unit.privateAreaM2} m²</span>
                </div>
                {typeof unit.metadata?.viewLabel === 'string' && (
                  <div className="flex items-center gap-1">
                    <Eye size={11} style={{ color: '#948F84' }} />
                    <span style={{ fontSize: 10, fontWeight: 600, color: '#948F84' }}>{unit.metadata.viewLabel}</span>
                  </div>
                )}
              </div>

              {/* Price */}
              {unit.priceVisible && unit.price && (
                <div>
                  <p style={{
                    fontSize: 16, fontWeight: 800, color: isAvailable ? '#0B1928' : '#9CA3AF',
                    fontFamily: "var(--fm, 'JetBrains Mono', monospace)", margin: 0,
                  }}>
                    {unit.status === 'sold' ? 'Vendido' : fmtBRL(unit.price)}
                  </p>
                  {isAvailable && (unit.privateAreaM2 ?? 0) > 0 && (
                    <p style={{ fontSize: 10, fontWeight: 600, color: '#948F84', margin: '2px 0 0' }}>
                      {fmtBRL(Math.round(unit.price / unit.privateAreaM2!))}/m²
                    </p>
                  )}
                </div>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}
