'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingCart, MessageCircle, Lock, Unlock, AlertCircle, Calculator } from 'lucide-react';
import type { LotMapEntry } from './useLotMap';
import LotFinancingSimulator from './LotFinancingSimulator';

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

// Returns total (à vista) or monthly installment (parceled)
function calcPrice(base: number, discPct: number, entryPct: number, months: number): number {
  const afterDisc = base * (1 - discPct / 100);
  if (months === 0) return afterDisc;
  const remaining = afterDisc * (1 - entryPct / 100);
  return remaining / months;
}

interface LotDetailPanelProps {
  lot: LotMapEntry | null;
  onClose: () => void;
  isMobile: boolean;
  whatsappContact?: string;
  // Parte 2.1 — ações de reserva (somente corretor/gestor)
  isManager?: boolean;
  actionLoading?: boolean;
  actionError?: string | null;
  onReserve?: (opts: { clientName?: string; clientPhone?: string }) => void;
  onRelease?: () => void;
}

export default function LotDetailPanel({
  lot, onClose, isMobile, whatsappContact = '5581997230455',
  isManager = false, actionLoading = false, actionError = null, onReserve, onRelease,
}: LotDetailPanelProps) {
  const [pricingMode, setPricingMode] = useState<'avista' | 'tabela'>('avista');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [showSim, setShowSim] = useState(false);

  const canSimulate = !!(lot && lot.status === 'disponivel' && (lot.valor || lot.price));

  const tablePrice = lot?.price;
  const discPct = lot?.discountPct ?? 20;

  const statusLabel = {
    disponivel: 'DISPONÍVEL',
    reservado: 'RESERVADO',
    vendido: 'VENDIDO',
    negociacao: 'EM NEGOCIAÇÃO',
  }[lot?.status ?? 'disponivel'];

  const statusColor = {
    disponivel: '#22c55e',
    reservado: '#3b82f6',
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
                const price = calcPrice(tablePrice, opt.discount, opt.entry, opt.months);
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
                    <span className="text-[13px] font-bold text-gray-800">
                      {fmt(price)}{opt.months > 0 ? '/mês' : ''}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : lot.status === 'disponivel' ? (
        <>
          {/* Area always visible */}
          <div className="mb-4 px-3 py-2.5 bg-gray-50 rounded-lg">
            <p className="text-[11px] uppercase tracking-widest text-gray-400 font-bold mb-0.5">Área do lote</p>
            <p className="text-base font-bold text-gray-800">{lot.area > 0 ? `${lot.area} m²` : '—'}</p>
          </div>
          <div className="mb-6 py-6 text-center bg-amber-50 rounded-xl border border-amber-100">
            <p className="text-amber-700 font-semibold text-sm">Preço sob consulta</p>
            <p className="text-amber-500 text-xs mt-1">Fale com nosso especialista para obter os valores</p>
          </div>
        </>
      ) : (
        <>
          <div className="mb-4 px-3 py-2.5 bg-gray-50 rounded-lg">
            <p className="text-[11px] uppercase tracking-widest text-gray-400 font-bold mb-0.5">Área do lote</p>
            <p className="text-base font-bold text-gray-800">{lot.area > 0 ? `${lot.area} m²` : '—'}</p>
          </div>
          <div className="mb-6 py-6 text-center bg-gray-50 rounded-xl">
            <p className="text-gray-500 font-semibold text-sm">
              {lot.status === 'vendido'
                ? 'Este lote já foi vendido.'
                : lot.status === 'reservado'
                  ? 'Este lote está reservado.'
                  : 'Este lote está em processo de negociação.'}
            </p>
            <p className="text-gray-400 text-xs mt-1">Consulte outros lotes disponíveis.</p>
          </div>
        </>
      )}

      {/* Painel do corretor/gestor — Reserva com lock transacional (48h) */}
      {isManager && (lot.status === 'disponivel' || lot.status === 'reservado') && (
        <div className="mb-4 p-3 rounded-xl border border-blue-100 bg-blue-50/60">
          <p className="text-[10px] uppercase tracking-widest text-blue-600 font-bold mb-2 flex items-center gap-1">
            <Lock className="w-3 h-3" /> Painel do corretor
          </p>

          {lot.status === 'disponivel' ? (
            <>
              <input
                value={clientName}
                onChange={e => setClientName(e.target.value)}
                placeholder="Cliente (opcional)"
                className="w-full mb-2 px-2.5 py-2 text-[13px] rounded-lg border border-gray-200 focus:border-blue-400 outline-none"
              />
              <input
                value={clientPhone}
                onChange={e => setClientPhone(e.target.value)}
                placeholder="Telefone (opcional)"
                className="w-full mb-2 px-2.5 py-2 text-[13px] rounded-lg border border-gray-200 focus:border-blue-400 outline-none"
              />
              <button
                disabled={actionLoading}
                onClick={() => onReserve?.({ clientName: clientName || undefined, clientPhone: clientPhone || undefined })}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-all active:scale-[0.98]"
              >
                <Lock className="w-4 h-4" />
                {actionLoading ? 'Reservando…' : 'Reservar por 48h'}
              </button>
            </>
          ) : (
            <button
              disabled={actionLoading}
              onClick={() => onRelease?.()}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold text-sm text-blue-700 border border-blue-300 hover:bg-blue-100 disabled:opacity-50 transition-all active:scale-[0.98]"
            >
              <Unlock className="w-4 h-4" />
              {actionLoading ? 'Liberando…' : 'Liberar reserva'}
            </button>
          )}

          {actionError && (
            <p className="mt-2 text-[12px] text-red-600 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> {actionError}
            </p>
          )}
        </div>
      )}

      {/* Simulador financeiro (Parte 2.2) */}
      {canSimulate && showSim && (
        <div className="mb-4">
          <LotFinancingSimulator lot={lot} />
        </div>
      )}

      {/* CTAs */}
      <div className="mt-auto space-y-2">
        {canSimulate && (
          <button
            onClick={() => setShowSim(s => !s)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm border transition-all active:scale-[0.98]"
            style={{ borderColor: GOLD, color: GOLD }}
          >
            <Calculator className="w-4 h-4" />
            {showSim ? 'Ocultar simulação' : 'Simular financiamento'}
          </button>
        )}
        {lot.status === 'disponivel' && (
          <button
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white transition-all active:scale-[0.98]"
            style={{ background: GOLD }}
            onClick={() => {
              const msg = encodeURIComponent(
                `Olá! Tenho interesse no Lote ${lot.lote}, Quadra ${lot.quadra} (${lot.area}m²). Gostaria de mais informações e condições de pagamento.`
              );
              window.open(`https://wa.me/${whatsappContact}?text=${msg}`, '_blank');
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
              `Olá! Tenho interesse neste empreendimento e gostaria de falar com um especialista.`
            );
            window.open(`https://wa.me/${whatsappContact}?text=${msg}`, '_blank');
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
