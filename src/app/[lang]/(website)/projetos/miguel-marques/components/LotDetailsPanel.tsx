'use client'

import React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, MapPin, Maximize2, Tag, MessageCircle } from 'lucide-react'
import { type Lot, STATUS_LABELS } from '../data/lotsData'

interface Props {
  lot: Lot | null
  onClose: () => void
  isMobile: boolean
}

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  disponivel:   { bg: '#F0F5EF', text: '#3A6A38', border: '#B8D4B4', dot: '#7EA87A' },
  negociacao:   { bg: '#FAF3E8', text: '#7A5A18', border: '#E8D4A4', dot: '#C8A878' },
  vendido:      { bg: '#F4F3F2', text: '#585450', border: '#D4D0CA', dot: '#B8B4AE' },
  proprietario: { bg: '#EEF0EA', text: '#384828', border: '#B4C0A0', dot: '#6B7C56' },
  igreja:       { bg: '#EEF0F4', text: '#384060', border: '#B4C4D4', dot: '#8090A0' },
}

function formatCurrency(val: number) {
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function getLotPosition(lot: Lot): string {
  if (lot.quadra === 'Z' || lot.isLakefront) return 'Frente ao Lago'
  if (lot.isCorner) return 'Esquina'
  if (lot.metragem > 220) return 'Lote Amplo'
  return 'Padrão'
}

function Placeholder() {
  return (
    <div className="flex flex-col items-center justify-center h-full py-20 px-8 text-center">
      <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-[#E0D8CC] flex items-center justify-center mb-4">
        <MapPin size={24} className="text-[#C8C0B4]" />
      </div>
      <p className="text-sm text-[#8A8278] leading-relaxed">
        Selecione um lote no mapa<br />para ver os detalhes
      </p>
    </div>
  )
}

export default function LotDetailsPanel({ lot, onClose, isMobile }: Props) {
  const panelVariants = isMobile
    ? {
        hidden: { y: '100%', opacity: 0 },
        visible: { y: 0, opacity: 1 },
        exit: { y: '100%', opacity: 0 },
      }
    : {
        hidden: { x: '100%', opacity: 0 },
        visible: { x: 0, opacity: 1 },
        exit: { x: '100%', opacity: 0 },
      }

  const colors = lot ? STATUS_COLORS[lot.status] ?? STATUS_COLORS.disponivel : null

  const whatsappMessage = lot
    ? `Olá! Tenho interesse no Lote ${lot.lote} da Quadra ${lot.quadra} do Loteamento Miguel Marques. Área: ${lot.metragem.toFixed(0)}m². Podemos conversar?`
    : ''

  return (
    <div
      className={
        isMobile
          ? 'fixed bottom-0 left-0 right-0 z-40'
          : 'relative w-[380px] flex-shrink-0 self-stretch'
      }
    >
      <AnimatePresence mode="wait">
        {!lot ? (
          <motion.div
            key="placeholder"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={
              isMobile
                ? 'hidden'
                : 'h-full bg-white border-l border-[#E8E2D8] flex flex-col min-h-[600px]'
            }
          >
            <Placeholder />
          </motion.div>
        ) : (
          <motion.div
            key={lot.id}
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            className={
              isMobile
                ? 'bg-white rounded-t-3xl shadow-2xl border-t border-[#E8E2D8] max-h-[85vh] overflow-y-auto'
                : 'h-full bg-white border-l border-[#E8E2D8] flex flex-col'
            }
          >
            {/* Header */}
            <div className="flex items-start justify-between p-6 pb-4 border-b border-[#F0EBE3]">
              <div>
                {/* Status badge */}
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border mb-3"
                  style={{
                    background: colors!.bg,
                    color: colors!.text,
                    borderColor: colors!.border,
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: colors!.dot }} />
                  {STATUS_LABELS[lot.status]}
                </span>

                <div className="flex items-baseline gap-3">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#8A8278]">
                    Quadra {lot.quadra}
                  </p>
                </div>
                <h2
                  className="text-3xl font-bold text-[#1A1A1A] mt-0.5"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                >
                  Lote {lot.lote}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-[#F5F0EA] flex items-center justify-center text-[#8A8278] hover:bg-[#EDE8E0] transition-colors mt-1"
              >
                <X size={15} />
              </button>
            </div>

            {/* Details */}
            <div className="p-6 flex-1">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#B0A898] mb-4">
                Informações
              </p>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-[#F0EBE3]">
                  <div className="flex items-center gap-2.5 text-sm text-[#6B6B6B]">
                    <Maximize2 size={14} className="text-[#B0A898]" />
                    Área
                  </div>
                  <span
                    className="text-xl font-bold text-[#1A1A1A]"
                    style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                  >
                    {lot.metragem.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} m²
                  </span>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-[#F0EBE3]">
                  <div className="flex items-center gap-2.5 text-sm text-[#6B6B6B]">
                    <Tag size={14} className="text-[#B0A898]" />
                    Valor
                  </div>
                  <span
                    className="text-xl font-bold text-[#1A1A1A]"
                    style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                  >
                    {formatCurrency(lot.valor)}
                  </span>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-[#F0EBE3]">
                  <div className="flex items-center gap-2.5 text-sm text-[#6B6B6B]">
                    <MapPin size={14} className="text-[#B0A898]" />
                    Posição
                  </div>
                  <span className="text-sm font-semibold text-[#3A3A3A]">
                    {getLotPosition(lot)}
                  </span>
                </div>

                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-2.5 text-sm text-[#6B6B6B]">
                    <span className="text-[#B0A898] font-mono text-xs">#</span>
                    Referência
                  </div>
                  <span className="text-sm font-mono text-[#6B6B6B]">
                    {lot.quadra}{lot.lote.toString().padStart(3, '0')}
                  </span>
                </div>
              </div>

              {/* Price per m² */}
              <div className="mt-6 p-4 rounded-2xl bg-[#F5F0EA]">
                <p className="text-xs text-[#8A8278] mb-1">Valor por m²</p>
                <p className="text-lg font-bold text-[#3A3A3A]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                  {formatCurrency(Math.round(lot.valor / lot.metragem))}/m²
                </p>
              </div>
            </div>

            {/* CTA */}
            <div className="p-6 pt-0 space-y-3">
              <a
                href={`https://wa.me/5581997230455?text=${encodeURIComponent(whatsappMessage)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2.5 w-full h-12 rounded-xl bg-[#0D1410] text-white text-sm font-semibold tracking-wide hover:bg-[#1A2820] transition-colors"
              >
                <MessageCircle size={16} />
                Tenho Interesse
              </a>
              <p className="text-center text-xs text-[#B0A898]">
                Resposta em até 24 horas via WhatsApp
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
