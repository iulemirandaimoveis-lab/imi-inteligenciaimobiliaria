'use client'

import React, { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { ALL_LOTS, type Lot } from '../data/lotsData'
import MasterplanFilters from './MasterplanFilters'
import LotDetailsPanel from './LotDetailsPanel'

const InteractiveMasterplan = dynamic(() => import('./InteractiveMasterplan'), { ssr: false })

const LEGEND = [
  { status: 'disponivel',   label: 'Disponível',      color: '#7EA87A' },
  { status: 'negociacao',   label: 'Em Negociação',   color: '#C8A878' },
  { status: 'vendido',      label: 'Vendido',         color: '#B8B4AE' },
  { status: 'proprietario', label: 'Proprietário',    color: '#6B7C56' },
]

export default function MasterplanSection() {
  const [selectedLot, setSelectedLot] = useState<Lot | null>(null)
  const [filteredIds, setFilteredIds] = useState<Set<string> | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  return (
    <>
      <MasterplanFilters onFilterChange={setFilteredIds} />

      <section className="bg-[#F5F0EA]">
        {/* Map + Panel */}
        <div className="flex flex-col lg:flex-row relative" style={{ minHeight: isMobile ? '70vh' : '80vh' }}>
          {/* SVG Map container */}
          <div
            className="flex-1 relative overflow-hidden"
            style={{ minHeight: isMobile ? '65vh' : '80vh' }}
          >
            <InteractiveMasterplan
              lots={ALL_LOTS}
              selectedLotId={selectedLot?.id ?? null}
              filteredLotIds={filteredIds}
              onLotSelect={setSelectedLot}
            />
          </div>

          {/* Desktop panel */}
          {!isMobile && (
            <LotDetailsPanel
              lot={selectedLot}
              onClose={() => setSelectedLot(null)}
              isMobile={false}
            />
          )}
        </div>

        {/* Mobile bottom sheet */}
        {isMobile && (
          <LotDetailsPanel
            lot={selectedLot}
            onClose={() => setSelectedLot(null)}
            isMobile={true}
          />
        )}

        {/* Legend */}
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-5 border-t border-[#E8E2D8]">
          <div className="flex flex-wrap items-center gap-5">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#9A9088] mr-2">
              Legenda
            </span>
            {LEGEND.map(item => (
              <div key={item.status} className="flex items-center gap-2">
                <span
                  className="w-3.5 h-3.5 rounded-sm flex-shrink-0"
                  style={{ background: item.color }}
                />
                <span className="text-xs text-[#5A5A5A]">{item.label}</span>
              </div>
            ))}
            <div className="flex items-center gap-2 ml-auto">
              <span className="w-3.5 h-3.5 rounded-sm border-2 border-[#C8A44A] flex-shrink-0" />
              <span className="text-xs text-[#5A5A5A]">Selecionado</span>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
