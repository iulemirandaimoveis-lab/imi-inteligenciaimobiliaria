'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, MessageCircle, Lock, Unlock, AlertCircle, Calculator, PhoneCall } from 'lucide-react';
import type { LotMapEntry } from './useLotMap';
import LotFinancingSimulator from './LotFinancingSimulator';

const GOLD = '#C8A44A';
const NAVY = '#0B1928';
const SURFACE = '#0F2035';
const SURFACE2 = '#162840';
const TEXT1 = '#E8E4DC';
const TEXT2 = '#8E99AB';
const TEXT3 = '#4F5B6B';
const BORDER = 'rgba(200,164,74,0.14)';

function fmt(n: number) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
}

interface PaymentOption {
  label: string;
  months: number;
  discount: number;
  entry: number;
}

const PAYMENT_OPTIONS: PaymentOption[] = [
  { label: 'À vista', months: 0, discount: 20, entry: 0 },
  { label: '12 meses', months: 12, discount: 15, entry: 10 },
  { label: '36 meses', months: 36, discount: 8, entry: 10 },
];

function calcPrice(base: number, discPct: number, entryPct: number, months: number): number {
  const afterDisc = base * (1 - discPct / 100);
  if (months === 0) return afterDisc;
  const remaining = afterDisc * (1 - entryPct / 100);
  return remaining / months;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  disponivel: {
    label: 'DISPONÍVEL',
    color: '#4ADE80',
    bg: 'rgba(74,222,128,0.06)',
    border: 'rgba(74,222,128,0.18)',
  },
  reservado: {
    label: 'RESERVADO',
    color: '#60A5FA',
    bg: 'rgba(96,165,250,0.06)',
    border: 'rgba(96,165,250,0.18)',
  },
  vendido: {
    label: 'VENDIDO',
    color: '#F87171',
    bg: 'rgba(248,113,113,0.06)',
    border: 'rgba(248,113,113,0.18)',
  },
  negociacao: {
    label: 'EM NEGOCIAÇÃO',
    color: '#FBBF24',
    bg: 'rgba(251,191,36,0.06)',
    border: 'rgba(251,191,36,0.18)',
  },
};

interface LotDetailPanelProps {
  lot: LotMapEntry | null;
  onClose: () => void;
  isMobile: boolean;
  whatsappContact?: string;
  isManager?: boolean;
  actionLoading?: boolean;
  actionError?: string | null;
  onReserve?: (opts: { clientName?: string; clientPhone?: string }) => void;
  onRelease?: () => void;
}

export default function LotDetailPanel({
  lot, onClose, isMobile, whatsappContact = '5581986141487',
  isManager = false, actionLoading = false, actionError = null, onReserve, onRelease,
}: LotDetailPanelProps) {
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [showSim, setShowSim] = useState(false);

  const canSimulate = !!(lot && lot.status === 'disponivel' && (lot.valor || lot.price));
  const tablePrice = lot?.price;
  const discPct = lot?.discountPct ?? 20;
  const statusCfg = STATUS_CONFIG[lot?.status ?? 'disponivel'] ?? STATUS_CONFIG.disponivel;

  const content = lot ? (
    <div className="flex flex-col h-full" style={{ color: TEXT1 }}>

      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-5">
        <div className="flex-1 min-w-0 pr-3">
          {/* Status badge */}
          <span
            className="inline-flex items-center gap-1.5 text-[9px] font-bold tracking-[0.18em] px-2.5 py-1 rounded-full mb-3"
            style={{
              background: statusCfg.bg,
              color: statusCfg.color,
              border: `1px solid ${statusCfg.border}`,
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: statusCfg.color }} />
            {statusCfg.label}
          </span>
          {/* Lot title — Playfair Display editorial */}
          <h2
            className="text-2xl font-semibold leading-tight mb-0.5"
            style={{ fontFamily: 'var(--font-serif, Georgia, serif)', color: TEXT1, letterSpacing: '-0.01em' }}
          >
            Lote {lot.lote}
          </h2>
          <p
            className="text-[11px] font-medium uppercase tracking-[0.14em]"
            style={{ color: TEXT3, fontFamily: 'var(--font-sans, sans-serif)' }}
          >
            Quadra {lot.quadra}
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-9 h-9 flex items-center justify-center rounded-full transition-all hover:scale-105 active:scale-95 shrink-0"
          style={{ color: TEXT2, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
          aria-label="Fechar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* ── Area ── */}
      <div
        className="mb-4 px-3 py-2.5 rounded-xl"
        style={{ background: SURFACE2, border: `1px solid ${BORDER}` }}
      >
        <p className="text-[9px] uppercase tracking-[0.2em] font-bold mb-1" style={{ color: TEXT3 }}>Área do Lote</p>
        <p
          className="text-xl font-semibold"
          style={{ fontFamily: 'var(--font-mono, monospace)', color: TEXT1 }}
        >
          {lot.area > 0 ? `${lot.area} m²` : '—'}
        </p>
        {tablePrice && lot.area > 0 && (
          <p className="text-[10px] mt-0.5" style={{ color: TEXT3, fontFamily: 'var(--font-mono, monospace)' }}>
            {fmt(tablePrice / lot.area)}/m² (tabela)
          </p>
        )}
      </div>

      {/* ── Pricing (disponivel only) ── */}
      {lot.status === 'disponivel' && tablePrice ? (
        <>
          {/* Price cards */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            {/* À Vista */}
            <div
              className="rounded-xl p-3 text-left"
              style={{ background: 'rgba(74,222,128,0.05)', border: '1px solid rgba(74,222,128,0.18)' }}
            >
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] mb-1" style={{ color: 'rgba(74,222,128,0.6)' }}>
                À VISTA
              </p>
              <p
                className="text-lg font-bold"
                style={{ color: '#4ADE80', fontFamily: 'var(--font-mono, monospace)' }}
              >
                {fmt(tablePrice * (1 - discPct / 100))}
              </p>
              <p className="text-[9px] font-semibold mt-0.5" style={{ color: 'rgba(74,222,128,0.6)' }}>
                {discPct}% desconto
              </p>
            </div>

            {/* Tabela */}
            <div
              className="rounded-xl p-3 text-left"
              style={{ background: SURFACE2, border: `1px solid ${BORDER}` }}
            >
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] mb-1" style={{ color: TEXT3 }}>
                TABELA
              </p>
              <p
                className="text-lg font-bold"
                style={{ color: TEXT2, fontFamily: 'var(--font-mono, monospace)' }}
              >
                {fmt(tablePrice)}
              </p>
              <p className="text-[9px] mt-0.5" style={{ color: TEXT3 }}>preço de tabela</p>
            </div>
          </div>

          {/* Payment conditions */}
          <div className="mb-5">
            <p className="text-[9px] uppercase tracking-[0.18em] font-bold mb-2.5" style={{ color: TEXT3 }}>
              Condições de Pagamento
            </p>
            <div
              className="rounded-xl overflow-hidden"
              style={{ border: `1px solid ${BORDER}` }}
            >
              {PAYMENT_OPTIONS.map((opt, idx) => {
                const price = calcPrice(tablePrice, opt.discount, opt.entry, opt.months);
                return (
                  <div
                    key={opt.months}
                    className="flex items-center justify-between py-2.5 px-3 transition-colors"
                    style={{
                      borderTop: idx > 0 ? `1px solid rgba(255,255,255,0.04)` : undefined,
                      background: 'transparent',
                    }}
                  >
                    <div>
                      <span
                        className="text-[11px] font-semibold"
                        style={{ color: TEXT1 }}
                      >
                        {opt.label}
                      </span>
                      <span className="text-[10px] ml-2" style={{ color: TEXT3 }}>
                        {opt.discount}% desc{opt.entry > 0 ? ` + ${opt.entry}% ent.` : ''}
                      </span>
                    </div>
                    <span
                      className="text-[12px] font-bold"
                      style={{ color: GOLD, fontFamily: 'var(--font-mono, monospace)' }}
                    >
                      {fmt(price)}{opt.months > 0 ? '/mês' : ''}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : lot.status === 'disponivel' ? (
        <div
          className="mb-5 py-5 text-center rounded-xl"
          style={{ background: 'rgba(200,164,74,0.06)', border: `1px solid rgba(200,164,74,0.18)` }}
        >
          <p className="text-sm font-semibold" style={{ color: GOLD }}>Preço sob consulta</p>
          <p className="text-xs mt-1" style={{ color: TEXT3 }}>Fale com nosso especialista para obter os valores</p>
        </div>
      ) : (
        <div
          className="mb-5 py-5 text-center rounded-xl"
          style={{ background: SURFACE2, border: `1px solid ${BORDER}` }}
        >
          <p className="text-sm font-semibold" style={{ color: TEXT2 }}>
            {lot.status === 'vendido'
              ? 'Este lote já foi vendido.'
              : lot.status === 'reservado'
                ? 'Este lote está reservado.'
                : 'Este lote está em processo de negociação.'}
          </p>
          <p className="text-xs mt-1" style={{ color: TEXT3 }}>Consulte outros lotes disponíveis.</p>
        </div>
      )}

      {/* ── Painel do corretor (reserva) ── */}
      {isManager && (lot.status === 'disponivel' || lot.status === 'reservado') && (
        <div
          className="mb-4 p-3 rounded-xl"
          style={{ background: 'rgba(96,165,250,0.05)', border: '1px solid rgba(96,165,250,0.18)' }}
        >
          <p
            className="text-[9px] uppercase tracking-[0.18em] font-bold mb-2.5 flex items-center gap-1.5"
            style={{ color: '#60A5FA' }}
          >
            <Lock className="w-3 h-3" /> Painel do Corretor
          </p>

          {lot.status === 'disponivel' ? (
            <>
              <input
                value={clientName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setClientName(e.target.value)}
                placeholder="Cliente (opcional)"
                className="w-full mb-2 px-2.5 py-2 text-[12px] rounded-lg outline-none transition-all"
                style={{
                  background: SURFACE2,
                  border: `1px solid ${BORDER}`,
                  color: TEXT1,
                  fontFamily: 'var(--font-sans, sans-serif)',
                }}
              />
              <input
                value={clientPhone}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setClientPhone(e.target.value)}
                placeholder="Telefone (opcional)"
                className="w-full mb-2.5 px-2.5 py-2 text-[12px] rounded-lg outline-none transition-all"
                style={{
                  background: SURFACE2,
                  border: `1px solid ${BORDER}`,
                  color: TEXT1,
                  fontFamily: 'var(--font-sans, sans-serif)',
                }}
              />
              <button
                disabled={actionLoading}
                onClick={() => onReserve?.({ clientName: clientName || undefined, clientPhone: clientPhone || undefined })}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider disabled:opacity-50 transition-all active:scale-[0.98]"
                style={{
                  background: NAVY,
                  color: '#60A5FA',
                  border: '1px solid rgba(96,165,250,0.3)',
                  letterSpacing: '0.1em',
                }}
              >
                <Lock className="w-3.5 h-3.5" />
                {actionLoading ? 'Reservando…' : 'Reservar por 48h'}
              </button>
            </>
          ) : (
            <button
              disabled={actionLoading}
              onClick={() => onRelease?.()}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider disabled:opacity-50 transition-all active:scale-[0.98]"
              style={{
                background: 'transparent',
                color: '#60A5FA',
                border: '1px solid rgba(96,165,250,0.3)',
                letterSpacing: '0.1em',
              }}
            >
              <Unlock className="w-3.5 h-3.5" />
              {actionLoading ? 'Liberando…' : 'Liberar reserva'}
            </button>
          )}

          {actionError && (
            <p className="mt-2 text-[11px] flex items-center gap-1" style={{ color: '#F87171' }}>
              <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {actionError}
            </p>
          )}
        </div>
      )}

      {/* ── Financing simulator ── */}
      {canSimulate && showSim && (
        <div className="mb-4">
          <LotFinancingSimulator lot={lot} />
        </div>
      )}

      {/* ── CTAs ── */}
      <div className="mt-auto space-y-2 pt-1">
        {canSimulate && (
          <button
            onClick={() => setShowSim((s: boolean) => !s)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all active:scale-[0.98]"
            style={{
              background: 'rgba(200,164,74,0.06)',
              color: GOLD,
              border: `1px solid rgba(200,164,74,0.25)`,
              letterSpacing: '0.1em',
            }}
          >
            <Calculator className="w-3.5 h-3.5" />
            {showSim ? 'Ocultar simulação' : 'Simular financiamento'}
          </button>
        )}

        {/* Primary CTA — "Agendar Visita": navy bg + white text + gold bottom accent line */}
        {lot.status === 'disponivel' && (
          <button
            className="w-full relative overflow-hidden flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-white transition-all active:scale-[0.98]"
            style={{
              background: NAVY,
              border: '1px solid rgba(255,255,255,0.08)',
              letterSpacing: '0.12em',
              boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
            }}
            onClick={() => {
              const msg = encodeURIComponent(
                `Olá! Gostaria de agendar uma visita ao Lote ${lot.lote}, Quadra ${lot.quadra} (${lot.area}m²). Podemos verificar a disponibilidade?`
              );
              window.open(`https://wa.me/${whatsappContact}?text=${msg}`, '_blank');
            }}
          >
            {/* Gold bottom accent line — brand system rule */}
            <span
              className="absolute bottom-0 rounded-full"
              style={{
                left: '10%', right: '10%', height: '2px',
                background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)`,
                opacity: 0.7,
              }}
            />
            <Calendar className="w-3.5 h-3.5 relative z-10" />
            <span className="relative z-10">Agendar Visita</span>
          </button>
        )}

        {/* Secondary CTA — ghost/outlined */}
        <button
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all active:scale-[0.98]"
          style={{
            background: 'transparent',
            color: TEXT2,
            border: `1px solid rgba(255,255,255,0.08)`,
            letterSpacing: '0.10em',
          }}
          onClick={() => {
            const msg = encodeURIComponent(
              `Olá! Tenho interesse neste empreendimento e gostaria de falar com um especialista.`
            );
            window.open(`https://wa.me/${whatsappContact}?text=${msg}`, '_blank');
          }}
        >
          <MessageCircle className="w-3.5 h-3.5" />
          Falar com Especialista
        </button>

        {/* Tertiary — phone call (small, quiet) */}
        <button
          className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[10px] uppercase tracking-wider transition-opacity hover:opacity-100 opacity-50"
          style={{ color: TEXT3, background: 'transparent', border: 'none' }}
          onClick={() => {
            const tel = whatsappContact?.replace(/\D/g, '');
            if (tel) window.open(`tel:+${tel}`, '_self');
          }}
        >
          <PhoneCall className="w-3 h-3" />
          Ligar agora
        </button>
      </div>
    </div>
  ) : null;

  // Lock body scroll when mobile sheet is open so WhatsAppFAB hides
  useEffect(() => {
    if (!isMobile) return;
    if (lot) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [lot, isMobile]);

  if (isMobile) {
    return (
      <AnimatePresence>
        {lot && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9998]"
              style={{ background: 'rgba(5,10,22,0.72)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
              onClick={onClose}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              drag="y"
              dragConstraints={{ top: 0 }}
              dragElastic={0.1}
              onDragEnd={(_: unknown, info: { offset: { y: number } }) => { if (info.offset.y > 120) onClose(); }}
              className="fixed bottom-0 left-0 right-0 z-[9999] rounded-t-[24px] p-5 max-h-[88vh] overflow-y-auto"
              style={{
                background: SURFACE,
                borderTop: `1px solid ${BORDER}`,
                boxShadow: '0 -8px 40px rgba(0,0,0,0.6)',
                paddingBottom: 'calc(2rem + env(safe-area-inset-bottom, 0px))',
              }}
            >
              {/* Drag handle */}
              <div
                className="w-10 h-1 rounded-full mx-auto mb-4"
                style={{ background: 'rgba(255,255,255,0.12)' }}
              />
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
          className="absolute top-0 right-0 bottom-0 w-[300px] overflow-y-auto z-20 p-5"
          style={{
            background: SURFACE,
            borderLeft: `1px solid ${BORDER}`,
            boxShadow: '-8px 0 32px rgba(0,0,0,0.4)',
          }}
        >
          {content}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
