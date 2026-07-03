'use client'

import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, MessageCircle, BedDouble, Bath, Car, Maximize2, Image as ImageIcon, Compass, Eye } from 'lucide-react'
import { type IMIProperty, AVAILABILITY_COLORS } from '@/lib/imi-domain/types'
import { type JazzPlanType, JAZZ_PLANS } from '../data/jazzUnits'

const fmtBRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)

interface Props {
  unit: IMIProperty | null
  whatsappPhone: string
  onClose: () => void
}

export default function UnitDetailPanel({ unit, whatsappPhone, onClose }: Props) {
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
          <UnitPanelContent unit={unit} whatsappPhone={whatsappPhone} onClose={onClose} />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function UnitPanelContent({ unit, whatsappPhone, onClose }: { unit: IMIProperty; whatsappPhone: string; onClose: () => void }) {
  // Escape fecha o painel — paridade com os painéis de lote do Alto Bellevue.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const cfg = AVAILABILITY_COLORS[unit.status]
  const isAvailable = unit.status === 'available' || unit.status === 'launching'
  const planType = (unit.metadata?.planType as JazzPlanType | undefined) ?? 'Planta Tipo A'
  const planDef = JAZZ_PLANS[planType] ?? JAZZ_PLANS['Planta Tipo A']

  const solarOrientation = unit.metadata?.solarOrientation as string | undefined
  const viewLabel = unit.metadata?.viewLabel as string | undefined

  const waMsg = encodeURIComponent(
    `Olá! Tenho interesse no apartamento ${unit.code} do Jazz Boulevard (Torre ${unit.tower}, ${unit.floor}º andar, ${planType}). Gostaria de mais informações.`
  )

  return (
    <div>
      {/* Status bar */}
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
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: '#F0EDE5', color: '#948F84' }}
            >
              {planType}
            </span>
          </div>
          <h3 style={{ fontSize: 22, fontWeight: 800, color: '#0B1928', fontFamily: "var(--fu, 'Outfit', sans-serif)", margin: '4px 0 0' }}>
            Apto {unit.code}
          </h3>
          <p style={{ fontSize: 12, color: '#948F84', margin: '2px 0 0' }}>
            Torre {unit.tower} · {unit.floor}º andar
          </p>
        </div>
        <button
          onClick={onClose}
          aria-label="Fechar detalhes da unidade"
          className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors flex-shrink-0"
        >
          <X size={16} />
        </button>
      </div>

      {/* Specs grid */}
      <div className="grid grid-cols-2 gap-3 px-5 pb-4">
        {unit.priceVisible && unit.price && (
          <div
            className="col-span-2"
            style={{ background: isAvailable ? '#0B1928' : '#F8F6F2', borderRadius: 14, padding: '14px 16px' }}
          >
            <p style={{ fontSize: 10, fontWeight: 700, color: isAvailable ? '#C8A44A' : '#948F84', textTransform: 'uppercase', letterSpacing: '0.15em', margin: '0 0 4px', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>
              Valor
            </p>
            <p style={{ fontSize: 24, fontWeight: 800, color: isAvailable ? '#fff' : '#0B1928', fontFamily: "var(--fm, 'JetBrains Mono', monospace)", margin: 0 }}>
              {fmtBRL(unit.price)}
            </p>
            {(unit.privateAreaM2 ?? 0) > 0 && (
              <p style={{ fontSize: 11, fontWeight: 600, color: isAvailable ? 'rgba(255,255,255,0.5)' : '#948F84', margin: '4px 0 0' }}>
                {fmtBRL(Math.round(unit.price / unit.privateAreaM2!))}/m²
              </p>
            )}
          </div>
        )}

        {[
          { icon: <Maximize2 size={13} />, label: 'Área Privativa', value: `${unit.privateAreaM2} m²` },
          { icon: <Maximize2 size={13} />, label: 'Área Total', value: `${unit.totalAreaM2} m²` },
          { icon: <BedDouble size={13} />, label: 'Dormitórios', value: `${unit.bedrooms} (${unit.suites} suíte${(unit.suites ?? 0) > 1 ? 's' : ''})` },
          { icon: <Bath size={13} />, label: 'Banheiros', value: String(unit.bathrooms) },
          { icon: <Car size={13} />, label: 'Vagas', value: String(unit.parkingSpaces) },
          ...(solarOrientation ? [{ icon: <Compass size={13} />, label: 'Orientação', value: solarOrientation }] : []),
          ...(viewLabel ? [{ icon: <Eye size={13} />, label: 'Vista', value: viewLabel }] : []),
        ].map(item => (
          <div key={item.label} style={{ background: '#F8F6F2', borderRadius: 14, padding: '12px 14px' }}>
            <div className="flex items-center gap-1.5 mb-1">
              <span style={{ color: '#948F84' }}>{item.icon}</span>
              <span style={{ fontSize: 9, fontWeight: 700, color: '#948F84', textTransform: 'uppercase', letterSpacing: '0.12em', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>
                {item.label}
              </span>
            </div>
            <p style={{ fontSize: 14, fontWeight: 800, color: '#0B1928', fontFamily: "var(--fm, 'JetBrains Mono', monospace)", margin: 0 }}>
              {item.value}
            </p>
          </div>
        ))}
      </div>

      {/* Plan description */}
      <div className="px-5 pb-4">
        <p style={{ fontSize: 12, color: '#948F84', background: '#F8F6F2', borderRadius: 10, padding: '10px 14px', margin: 0, lineHeight: 1.6 }}>
          {planDef.description}
        </p>
      </div>

      {/* Floor plan placeholder */}
      <div className="px-5 pb-4">
        <div
          className="flex items-center justify-center gap-2 rounded-xl"
          style={{ height: 200, background: '#F0EDE5', border: '1.5px dashed #D4CFC7' }}
        >
          <ImageIcon size={24} style={{ color: '#C8C0B8' }} />
          <span style={{ fontSize: 12, color: '#C8C0B8', fontWeight: 600 }}>
            Planta Baixa · {planType}
          </span>
        </div>
      </div>

      {/* Data provenance */}
      <div className="px-5 pb-3">
        <p style={{ fontSize: 9, color: '#C8C0B8', fontWeight: 600, textAlign: 'center', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Preços · dados simulados para demonstração · sujeitos a alteração
        </p>
      </div>

      {/* CTA */}
      <div className="px-5 pb-8">
        {isAvailable ? (
          <a
            href={`https://wa.me/${whatsappPhone}?text=${waMsg}`}
            target="_blank"
            rel="noopener noreferrer"
            className="relative flex items-center justify-center gap-2 w-full h-12 rounded-xl text-[13px] font-bold uppercase tracking-wider overflow-hidden"
            style={{ background: '#0B1928', color: '#fff', fontFamily: "var(--fu, 'Outfit', sans-serif)", textDecoration: 'none' }}
          >
            <MessageCircle size={15} />
            Tenho Interesse
            <span style={{ position: 'absolute', bottom: 0, left: '15%', right: '15%', height: 2, background: 'linear-gradient(90deg, transparent, #C8A44A, transparent)', opacity: 0.6 }} />
          </a>
        ) : (
          <a
            href={`https://wa.me/${whatsappPhone}?text=${encodeURIComponent('Olá! Gostaria de ver unidades disponíveis no Jazz Boulevard.')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full h-12 rounded-xl text-[13px] font-bold border border-gray-200 transition-colors"
            style={{ color: '#0B1928', fontFamily: "var(--fu, 'Outfit', sans-serif)", textDecoration: 'none' }}
          >
            <MessageCircle size={15} />
            Ver Outras Unidades
          </a>
        )}
      </div>
    </div>
  )
}
