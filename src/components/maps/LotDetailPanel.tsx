'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingCart, MessageCircle, ChevronDown } from 'lucide-react';
import type { LotMapEntry } from './useLotMap';

const GOLD = '#C8A44A';

function fmt(n: number) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
}

interface PaymentOption {
  label: string;
  months: number;
  discount: number;
  entry: number; // % entrada
}

const PAYMENT_OPTIONS: PaymentOption[] = [
  { label: 'À vista', months: 0, discount: 20, entry: 0 },
  { label: '12 meses', months: 12, discount: 15, entry: 10 },
  { label: '36 meses', months: 36, discount: 8, entry: 10 },
];

function calcPrice(base: number, discPct: number, entryPct: number) {
  const afterDisc = base * (1 - discPct / 100);
  return afterDisc;
}

interface LotDetailPanelProps {
  lot: LotMapEntry | null;
  onClose: () => void;
  isMobile: boolean;
}

export default function LotDetailPanel({ lot, onClose, isMobile }: LotDetailPanelProps) {
  const [pricingMode, setPricingMode] = useState<'avista' | 'tabela'>('avista');

  const tablePrice = lot?.price;
  const discPct = lot?.discountPct ?? 20;

  const statusLabel = {
    disponivel: 'DISPONÍVEL',
    vendido: 'VENDIDO',
    negociacao: 'EM NEGOCIAÇÃO',
  }[lot?.status ?? 'disponivel'];

  const statusColor = {
    disponivel: '#22c55e',
    vendido: '#ef4444',
    negociacao: '#eab308',
  }[lot?.status ?? 'disponivel'];

  const content = lot ? (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <span
            className="inline-block text-[10px] font-bold tracking-[0.15em] px-2.5 py-1 rounded-full mb-2"
            style={{ background: statusColor + '22', color: statusColor, border: `1px solid ${statusColor}44` }}
          >
            {statusLabel}
          </span>
          <p className="text-[13px] text-gray-500 font-medium">
            Quadra {lot.quadra} · Lote {lot.lote}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-full hover:bg-gray-100 transition-colors text-gray-400"
          aria-label="Fechar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Price tabs */}
      {lot.status === 'disponivel' && tablePrice ? (
        <>
          <div className="grid grid-cols-2 gap-2 mb-5">
            {/* À Vista */}
            <button
              onClick={() => setPricingMode('avista')}
              className={`rounded-xl p-3 border-2 text-left transition-all ${pricingMode === 'avista' ? 'border-green-400 bg-green-50' : 'border-gray-100 bg-gray-50'}`}
            >
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">À VISTA</p>
              <p className="text-lg font-black" style={{ color: pricingMode === 'avista' ? '#16a34a' : '#374151' }}>
                {fmt(tablePrice * (1 - discPct / 100))}
              </p>
              <p className="text-[10px] text-green-600 font-semibold">{discPct}% desconto</p>
            </button>

            {/* Tabela */}
            <button
              onClick={() => setPricingMode('tabela')}
              className={`rounded-xl p-3 border-2 text-left transition-all ${pricingMode === 'tabela' ? 'border-amber-400 bg-amber-50' : 'border-gray-100 bg-gray-50'}`}
            >
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">TABELA</p>
              <p className="text-lg font-black text-gray-700">
                {fmt(tablePrice)}
              </p>
              {lot.area > 0 && (
                <p className="text-[10px] text-gray-500">
                  {fmt(tablePrice / lot.area)}/m²
                </p>
              )}
            </button>
          </div>

          {/* Area */}
          <div className="mb-5 px-3 py-2.5 bg-gray-50 rounded-lg">
            <p className="text-[11px] uppercase tracking-widest text-gray-400 font-bold mb-0.5">Área do lote</p>
            <p className="text-base font-bold text-gray-800">{lot.area > 0 ? `${lot.area} m²` : '—'}</p>
          </div>

          {/* Payment conditions */}
          <div className="mb-6">
            <p className="text-[11px] uppercase tracking-widest text-gray-400 font-bold mb-3">Condições de Pagamento</p>
            <div className="space-y-2">
              {PAYMENT_OPTIONS.map(opt => {
                const price = calcPrice(tablePrice, opt.discount, opt.entry);
                return (
                  <div
                    key={opt.months}
                    className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <span className="text-[12px] font-semibold text-gray-700">{opt.label}</span>
                      <span className="text-[11px] text-gray-400 ml-2">
                        {opt.discount}% desc{opt.entry > 0 ? ` + ${opt.entry}% ent.` : ''}
                      </span>
                    </div>
                    <span className="text-[13px] font-bold text-gray-800">{fmt(price)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : lot.status === 'disponivel' ? (
        <div className="mb-6 py-8 text-center bg-gray-50 rounded-xl">
          <p className="text-gray-400 text-sm">Preço sob consulta</p>
        </div>
      ) : (
        <div className="mb-6 py-8 text-center bg-gray-50 rounded-xl">
          <p className="text-gray-500 font-semibold text-sm">
            {lot.status === 'vendido' ? 'Este lote já foi vendido.' : 'Este lote está em processo de negociação.'}
          </p>
          <p className="text-gray-400 text-xs mt-1">Consulte outros lotes disponíveis.</p>
        </div>
      )}

      {/* CTAs */}
      <div className="mt-auto space-y-2">
        {lot.status === 'disponivel' && (
          <button
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white transition-all active:scale-[0.98]"
            style={{ background: GOLD }}
            onClick={() => {
              const msg = encodeURIComponent(
                `Olá! Tenho interesse no Lote ${lot.lote}, Quadra ${lot.quadra} do Alto Bellevue (${lot.area}m²). Gostaria de mais informações e condições de pagamento.`
              );
              window.open(`https://wa.me/5581997230455?text=${msg}`, '_blank');
            }}
          >
            <ShoppingCart className="w-4 h-4" />
            Adicionar à proposta
          </button>
        )}
        <button
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm text-gray-600 border border-gray-200 hover:bg-gray-50 transition-all"
          onClick={() => {
            const msg = encodeURIComponent(
              `Olá! Tenho interesse no Alto Bellevue e gostaria de falar com um especialista.`
            );
            window.open(`https://wa.me/5581997230455?text=${msg}`, '_blank');
          }}
        >
          <MessageCircle className="w-4 h-4" />
          Falar com especialista
        </button>
      </div>
    </div>
  ) : null;

  if (isMobile) {
    return (
      <AnimatePresence>
        {lot && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 z-40"
              onClick={onClose}
            />
            {/* Bottom sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              drag="y"
              dragConstraints={{ top: 0 }}
              dragElastic={0.1}
              onDragEnd={(_, info) => {
                if (info.offset.y > 120) onClose();
              }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl p-5 pb-8 max-h-[85vh] overflow-y-auto"
            >
              {/* Drag handle */}
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
              {content}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }

  // Desktop sidebar
  return (
    <AnimatePresence>
      {lot && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 250 }}
          className="absolute top-0 right-0 bottom-0 w-[300px] bg-white shadow-2xl rounded-r-xl p-5 overflow-y-auto z-20"
          style={{ borderLeft: '1px solid #f1f5f9' }}
        >
          {content}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
