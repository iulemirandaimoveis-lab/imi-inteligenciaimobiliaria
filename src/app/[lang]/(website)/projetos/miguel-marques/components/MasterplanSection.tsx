'use client'

import dynamic from 'next/dynamic'
import { useMemo } from 'react'
import { ALL_LOTS } from '../data/lotsData'

const MiguelMarquesPlanView = dynamic(() => import('./MiguelMarquesPlanView'), { ssr: false })

const PAYMENT_CONDITIONS = {
  entrada: '1+1 — R$ 1.450 (5%)',
  parcelas: 150,
  parcelValue: 'a partir de R$ 183',
  method: 'Carnê',
  seller: 'Mano Imóveis',
}

export default function MasterplanSection() {
  const stats = useMemo(() => {
    const disponivel = ALL_LOTS.filter(l => l.status === 'disponivel').length
    const vendido = ALL_LOTS.filter(l => l.status === 'vendido').length
    const proprietario = ALL_LOTS.filter(l => l.status === 'proprietario').length
    const negociacao = ALL_LOTS.filter(l => l.status === 'negociacao').length
    const availLots = ALL_LOTS.filter(l => l.status === 'disponivel' && l.valor > 0)
    const priceMin = availLots.length > 0 ? Math.min(...availLots.map(l => l.valor)) : 0
    const priceMax = availLots.length > 0 ? Math.max(...availLots.map(l => l.valor)) : 0
    const areaMin = availLots.length > 0 ? Math.min(...availLots.map(l => l.metragem)) : 0
    return { disponivel, vendido, proprietario, negociacao, total: ALL_LOTS.length, priceMin, priceMax, areaMin }
  }, [])

  const fmtBRL = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)

  return (
    <section className="bg-[#F5F0EA] px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
      <div className="max-w-6xl mx-auto">

        {/* Section header */}
        <div className="mb-6">
          <p className="text-[#C8A44A] text-[11px] font-bold uppercase tracking-[0.3em] mb-2">
            Mapa do Loteamento
          </p>
          <h2
            className="text-2xl lg:text-3xl font-bold text-[#0D1410] leading-tight mb-1"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Escolha o seu lote
          </h2>
          <p className="text-sm text-[#948F84]">
            {stats.disponivel} de {stats.total} lotes disponíveis
          </p>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {([
            { label: 'Disponíveis', value: stats.disponivel, color: '#16A34A', bg: '#DCFCE7' },
            { label: 'Vendidos',    value: stats.vendido,    color: '#DC2626', bg: '#FEE2E2' },
            { label: 'Negociação',  value: stats.negociacao, color: '#D97706', bg: '#FEF3C7' },
            { label: 'Proprietários', value: stats.proprietario, color: '#2563EB', bg: '#DBEAFE' },
          ]).map(item => (
            <div
              key={item.label}
              style={{ background: item.bg, borderRadius: 14, padding: '14px 16px' }}
            >
              <p style={{ fontSize: 22, fontWeight: 800, color: item.color, fontFamily: "'JetBrains Mono', monospace", margin: '0 0 2px' }}>
                {item.value}
              </p>
              <p style={{ fontSize: 10, fontWeight: 700, color: item.color, textTransform: 'uppercase', letterSpacing: '0.15em', margin: 0, fontFamily: "'Outfit', sans-serif" }}>
                {item.label}
              </p>
            </div>
          ))}
        </div>

        {/* Price range */}
        {stats.priceMin > 0 && (
          <div
            className="mb-4 flex flex-wrap items-center gap-2"
            style={{ background: '#F0EBE3', borderRadius: 12, padding: '12px 16px' }}
          >
            <span style={{ fontSize: 12, color: '#948F84', fontWeight: 600 }}>Lotes disponíveis:</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: '#0D1410', fontFamily: "'JetBrains Mono', monospace" }}>
              {fmtBRL(stats.priceMin)} — {fmtBRL(stats.priceMax)}
            </span>
            {stats.areaMin > 0 && (
              <span style={{ fontSize: 11, color: '#948F84' }}>· a partir de {Math.round(stats.areaMin)} m²</span>
            )}
          </div>
        )}

        {/* Payment conditions */}
        <div
          className="mb-5"
          style={{ background: '#0D1410', borderRadius: 16, padding: '18px 20px' }}
        >
          <div className="flex items-center gap-2 mb-3">
            <div style={{ width: 20, height: 2, borderRadius: 1, background: '#C8A44A' }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: '#C8A44A', textTransform: 'uppercase', letterSpacing: '0.2em', fontFamily: "'Outfit', sans-serif" }}>
              Condições de Pagamento
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {([
              { label: 'Entrada', value: PAYMENT_CONDITIONS.entrada },
              { label: 'Parcelas', value: `${PAYMENT_CONDITIONS.parcelas}× ${PAYMENT_CONDITIONS.parcelValue}`, gold: true },
              { label: 'Forma', value: PAYMENT_CONDITIONS.method },
              { label: 'Direto com', value: PAYMENT_CONDITIONS.seller },
            ]).map(item => (
              <div key={item.label}>
                <p style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.15em', margin: '0 0 4px', fontFamily: "'Outfit', sans-serif" }}>
                  {item.label}
                </p>
                <p style={{ fontSize: 13, fontWeight: 800, color: item.gold ? '#C8A44A' : '#fff', margin: 0, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.4 }}>
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Interactive plan view */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ height: 'clamp(480px, 72vh, 760px)' }}
        >
          <MiguelMarquesPlanView />
        </div>

      </div>
    </section>
  )
}
