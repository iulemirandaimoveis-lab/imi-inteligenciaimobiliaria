'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Calendar, MessageCircle, Lock, Unlock, AlertCircle,
  Calculator, PhoneCall, TrendingUp, ChevronDown, Check, Share2,
} from 'lucide-react';
import type { LotMapEntry } from './useLotMap';
import LotFinancingSimulator from './LotFinancingSimulator';

const GOLD    = '#C8A44A';
const NAVY    = '#0B1928';
const SURFACE = '#0F2035';
const SURF2   = '#162840';
const TEXT1   = '#E8E4DC';
const TEXT2   = '#8E99AB';
const TEXT3   = '#4F5B6B';
const BORDER  = 'rgba(200,164,74,0.14)';

function fmt(n: number) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  disponivel:   { label: 'DISPONÍVEL',    color: '#4ADE80', bg: 'rgba(74,222,128,0.06)',  border: 'rgba(74,222,128,0.18)'  },
  reservado:    { label: 'RESERVADO',     color: '#FB923C', bg: 'rgba(251,146,60,0.06)',  border: 'rgba(251,146,60,0.18)'  },
  vendido:      { label: 'VENDIDO',       color: '#F87171', bg: 'rgba(248,113,113,0.06)', border: 'rgba(248,113,113,0.18)' },
  negociacao:   { label: 'EM NEGOCIAÇÃO', color: '#FBBF24', bg: 'rgba(251,191,36,0.06)',  border: 'rgba(251,191,36,0.18)'  },
  documentacao: { label: 'DOCUMENTAÇÃO',  color: '#60A5FA', bg: 'rgba(96,165,250,0.06)',  border: 'rgba(96,165,250,0.18)'  },
  bloqueado:    { label: 'BLOQUEADO',     color: '#94A3B8', bg: 'rgba(148,163,184,0.06)', border: 'rgba(148,163,184,0.18)' },
};

const MANAGER_STATUSES = [
  { value: 'DISPONIVEL',  label: 'Disponível',   color: '#4ADE80' },
  { value: 'NEGOCIACAO',  label: 'Negociação',   color: '#FBBF24' },
  { value: 'RESERVADO',   label: 'Reservado',    color: '#FB923C' },
  { value: 'DOCUMENTACAO',label: 'Documentação', color: '#60A5FA' },
  { value: 'VENDIDO',     label: 'Vendido',      color: '#F87171' },
  { value: 'BLOQUEADO',   label: 'Bloqueado',    color: '#94A3B8' },
];

interface LotDetailPanelProps {
  lot: LotMapEntry | null;
  onClose: () => void;
  isMobile: boolean;
  whatsappContact?: string;
  isManager?: boolean;
  actionLoading?: boolean;
  actionError?: string | null;
  onReserve?: (opts: { clientName?: string; clientPhone?: string; brokerName?: string }) => void;
  onRelease?: () => void;
  onNegotiate?: (opts: { brokerName?: string; clientName?: string; clientPhone?: string; note?: string }) => void;
  onChangeStatus?: (status: string, opts?: { reason?: string; brokerName?: string }) => void;
}

export default function LotDetailPanel({
  lot, onClose, isMobile,
  whatsappContact = '5581986141487',
  isManager = false, actionLoading = false, actionError = null,
  onReserve, onRelease, onNegotiate, onChangeStatus,
}: LotDetailPanelProps) {
  const [brokerName,  setBrokerName]  = useState('');
  const [clientName,  setClientName]  = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [note,        setNote]        = useState('');
  const [showSim,     setShowSim]     = useState(false);
  const [activeTab,   setActiveTab]   = useState<'info' | 'crm'>('info');
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [confirmStatus, setConfirmStatus]   = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Sync brokerName from lot if already in negotiation
  useEffect(() => {
    if (lot?.brokerName) setBrokerName(lot.brokerName);
  }, [lot?.id, lot?.brokerName]);

  const tablePrice = lot?.price;
  const statusCfg  = STATUS_CONFIG[lot?.status ?? 'disponivel'] ?? STATUS_CONFIG.disponivel;
  const canSimulate = !!(lot && lot.status === 'disponivel' && (lot.valor || lot.price));
  const isAvail     = lot?.status === 'disponivel';
  const isNeg       = lot?.status === 'negociacao';
  const isReserved  = lot?.status === 'reservado';

  function buildShareMsg() {
    if (!lot) return '';
    const lines = [
      `*Lote ${lot.lote} · Quadra ${lot.quadra}*`,
      lot.area > 0 ? `Área: ${lot.area}m²` : '',
      tablePrice   ? `Valor: ${fmt(tablePrice)}` : 'Valor: Consulte',
      `Status: ${statusCfg.label}`,
    ].filter(Boolean);
    return lines.join('\n');
  }

  function shareViaWhatsApp() {
    const msg = encodeURIComponent(buildShareMsg());
    window.open(`https://wa.me/${whatsappContact}?text=${msg}`, '_blank');
  }

  function copyLink() {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    navigator.clipboard.writeText(url + `#lote-${lot?.quadra}-${lot?.lote}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const content = lot ? (
    <div className="flex flex-col h-full" style={{ color: TEXT1 }}>

      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0 pr-3">
          <span
            className="inline-flex items-center gap-1.5 text-[9px] font-bold tracking-[0.18em] px-2.5 py-1 rounded-full mb-2"
            style={{ background: statusCfg.bg, color: statusCfg.color, border: `1px solid ${statusCfg.border}` }}
          >
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: statusCfg.color }} />
            {statusCfg.label}
            {(isNeg || isReserved) && lot.brokerName && (
              <span style={{ color: statusCfg.color, opacity: 0.7 }}>
                {' '}· {lot.brokerName}
              </span>
            )}
          </span>
          <h2
            className="text-2xl font-semibold leading-tight mb-0.5"
            style={{ fontFamily: 'var(--font-serif, Georgia, serif)', color: TEXT1, letterSpacing: '-0.01em' }}
          >
            Lote {lot.lote}
          </h2>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em]" style={{ color: TEXT3 }}>
            Quadra {lot.quadra}
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={shareViaWhatsApp}
            className="w-8 h-8 flex items-center justify-center rounded-full"
            style={{ color: TEXT3, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
            aria-label="Compartilhar"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full"
            style={{ color: TEXT2, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Tab bar (manager only) ── */}
      {isManager && (
        <div className="flex gap-0.5 mb-4 rounded-xl overflow-hidden" style={{ background: SURF2, padding: 3 }}>
          {(['info', 'crm'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all"
              style={{
                background: activeTab === tab ? SURFACE : 'transparent',
                color: activeTab === tab ? TEXT1 : TEXT3,
                border: activeTab === tab ? `1px solid ${BORDER}` : '1px solid transparent',
              }}
            >
              {tab === 'info' ? 'Informações' : 'CRM / Operação'}
            </button>
          ))}
        </div>
      )}

      {/* ── Info tab ── */}
      {(activeTab === 'info' || !isManager) && (
        <>
          {/* Area */}
          <div className="mb-4 px-3 py-2.5 rounded-xl" style={{ background: SURF2, border: `1px solid ${BORDER}` }}>
            <p className="text-[9px] uppercase tracking-[0.2em] font-bold mb-1" style={{ color: TEXT3 }}>Área do Lote</p>
            <p className="text-xl font-semibold" style={{ fontFamily: 'var(--font-mono, monospace)', color: TEXT1 }}>
              {lot.area > 0 ? `${lot.area} m²` : '—'}
            </p>
            {tablePrice && lot.area > 0 && (
              <p className="text-[10px] mt-0.5" style={{ color: TEXT3, fontFamily: 'var(--font-mono, monospace)' }}>
                {fmt(tablePrice / lot.area)}/m² (tabela)
              </p>
            )}
          </div>

          {/* Price (available only) */}
          {isAvail && tablePrice ? (
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="rounded-xl p-3" style={{ background: 'rgba(74,222,128,0.05)', border: '1px solid rgba(74,222,128,0.18)' }}>
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] mb-1" style={{ color: 'rgba(74,222,128,0.6)' }}>À VISTA</p>
                <p className="text-lg font-bold" style={{ color: '#4ADE80', fontFamily: 'var(--font-mono, monospace)' }}>
                  {fmt(tablePrice * 0.8)}
                </p>
                <p className="text-[9px] mt-0.5" style={{ color: 'rgba(74,222,128,0.6)' }}>20% desconto</p>
              </div>
              <div className="rounded-xl p-3" style={{ background: SURF2, border: `1px solid ${BORDER}` }}>
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] mb-1" style={{ color: TEXT3 }}>TABELA</p>
                <p className="text-lg font-bold" style={{ color: TEXT2, fontFamily: 'var(--font-mono, monospace)' }}>
                  {fmt(tablePrice)}
                </p>
                <p className="text-[9px] mt-0.5" style={{ color: TEXT3 }}>preço de tabela</p>
              </div>
            </div>
          ) : !isAvail ? (
            <div className="mb-4 py-4 text-center rounded-xl" style={{ background: statusCfg.bg, border: `1px solid ${statusCfg.border}` }}>
              <p className="text-sm font-semibold" style={{ color: statusCfg.color }}>
                {isNeg ? 'Em negociação' : isReserved ? 'Reservado' : statusCfg.label}
              </p>
              {(isNeg || isReserved) && lot.brokerName && (
                <p className="text-xs mt-1" style={{ color: TEXT3 }}>Corretor: {lot.brokerName}</p>
              )}
              {!isManager && <p className="text-xs mt-1" style={{ color: TEXT3 }}>Consulte outros lotes disponíveis.</p>}
            </div>
          ) : null}

          {/* Simulator */}
          {canSimulate && showSim && (
            <div className="mb-4">
              <LotFinancingSimulator lot={lot} />
            </div>
          )}

          {/* CTAs */}
          <div className="mt-auto space-y-2 pt-1">
            {canSimulate && (
              <button
                onClick={() => setShowSim(s => !s)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all active:scale-[0.98]"
                style={{ background: 'rgba(200,164,74,0.06)', color: GOLD, border: `1px solid rgba(200,164,74,0.25)` }}
              >
                <Calculator className="w-3.5 h-3.5" />
                {showSim ? 'Ocultar simulação' : 'Simular financiamento'}
              </button>
            )}

            {isAvail && (
              <button
                className="w-full relative overflow-hidden flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-white transition-all active:scale-[0.98]"
                style={{ background: NAVY, border: '1px solid rgba(255,255,255,0.08)', letterSpacing: '0.12em', boxShadow: '0 1px 3px rgba(0,0,0,0.4)' }}
                onClick={() => {
                  const msg = encodeURIComponent(`Olá! Gostaria de agendar uma visita ao Lote ${lot.lote}, Quadra ${lot.quadra} (${lot.area}m²).`);
                  window.open(`https://wa.me/${whatsappContact}?text=${msg}`, '_blank');
                }}
              >
                <span className="absolute bottom-0 rounded-full" style={{ left: '10%', right: '10%', height: '2px', background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)`, opacity: 0.7 }} />
                <Calendar className="w-3.5 h-3.5 relative z-10" />
                <span className="relative z-10">Agendar Visita</span>
              </button>
            )}

            <button
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider"
              style={{ background: 'transparent', color: TEXT2, border: `1px solid rgba(255,255,255,0.08)` }}
              onClick={() => {
                const msg = encodeURIComponent(`Olá! Tenho interesse neste empreendimento.`);
                window.open(`https://wa.me/${whatsappContact}?text=${msg}`, '_blank');
              }}
            >
              <MessageCircle className="w-3.5 h-3.5" />
              Falar com Especialista
            </button>

            <button
              className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[10px] uppercase tracking-wider opacity-50"
              style={{ color: TEXT3, background: 'transparent', border: 'none' }}
              onClick={() => { const tel = whatsappContact?.replace(/\D/g,''); if (tel) window.open(`tel:+${tel}`, '_self'); }}
            >
              <PhoneCall className="w-3 h-3" />
              Ligar agora
            </button>
          </div>
        </>
      )}

      {/* ── CRM tab (managers only) ── */}
      {isManager && activeTab === 'crm' && (
        <div className="space-y-3 flex-1 overflow-y-auto pb-4">

          {/* Quick status change */}
          <div className="rounded-xl p-3" style={{ background: SURF2, border: `1px solid ${BORDER}` }}>
            <p className="text-[9px] uppercase tracking-[0.18em] font-bold mb-2.5" style={{ color: TEXT3 }}>
              Alterar Status
            </p>
            <div className="relative">
              <button
                onClick={() => setShowStatusMenu(m => !m)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all"
                style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${BORDER}`, color: TEXT2 }}
              >
                <span style={{ color: statusCfg.color }}>{statusCfg.label}</span>
                <ChevronDown className="w-3.5 h-3.5" style={{ color: TEXT3, transform: showStatusMenu ? 'rotate(180deg)' : undefined, transition: 'transform .2s' }} />
              </button>
              {showStatusMenu && (
                <div
                  className="absolute left-0 right-0 top-[calc(100%+4px)] rounded-xl overflow-hidden z-10"
                  style={{ background: NAVY, border: `1px solid ${BORDER}`, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
                >
                  {MANAGER_STATUSES.map(s => (
                    <button
                      key={s.value}
                      onClick={() => { setConfirmStatus(s.value); setShowStatusMenu(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-medium transition-all hover:opacity-80"
                      style={{ color: s.color, borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: s.color }} />
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Confirm status change */}
            {confirmStatus && (
              <div className="mt-2 p-2.5 rounded-lg" style={{ background: 'rgba(200,164,74,0.08)', border: `1px solid rgba(200,164,74,0.22)` }}>
                <p className="text-[10px] mb-2" style={{ color: TEXT2 }}>
                  Confirmar mudança para <strong style={{ color: MANAGER_STATUSES.find(s => s.value === confirmStatus)?.color }}>{MANAGER_STATUSES.find(s => s.value === confirmStatus)?.label}</strong>?
                </p>
                <div className="flex gap-2">
                  <button
                    disabled={actionLoading}
                    onClick={() => { onChangeStatus?.(confirmStatus, { brokerName: brokerName || undefined }); setConfirmStatus(null); }}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider disabled:opacity-50"
                    style={{ background: 'rgba(200,164,74,0.15)', color: GOLD, border: `1px solid rgba(200,164,74,0.3)` }}
                  >
                    <Check className="w-3 h-3" /> Confirmar
                  </button>
                  <button
                    onClick={() => setConfirmStatus(null)}
                    className="flex-1 py-1.5 rounded-lg text-[10px] font-semibold"
                    style={{ color: TEXT3, border: `1px solid rgba(255,255,255,0.08)` }}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Broker name input */}
          <div className="rounded-xl p-3" style={{ background: SURF2, border: `1px solid ${BORDER}` }}>
            <p className="text-[9px] uppercase tracking-[0.18em] font-bold mb-2.5" style={{ color: TEXT3 }}>
              Corretor Responsável
            </p>
            <input
              value={brokerName}
              onChange={e => setBrokerName(e.target.value)}
              placeholder="Nome do corretor"
              className="w-full px-2.5 py-2 text-[12px] rounded-lg outline-none mb-2"
              style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${BORDER}`, color: TEXT1 }}
            />
            <input
              value={clientName}
              onChange={e => setClientName(e.target.value)}
              placeholder="Nome do cliente (opcional)"
              className="w-full px-2.5 py-2 text-[12px] rounded-lg outline-none mb-2"
              style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${BORDER}`, color: TEXT1 }}
            />
            <input
              value={clientPhone}
              onChange={e => setClientPhone(e.target.value)}
              placeholder="Telefone do cliente (opcional)"
              className="w-full px-2.5 py-2 text-[12px] rounded-lg outline-none"
              style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${BORDER}`, color: TEXT1 }}
            />
          </div>

          {/* CRM action buttons */}
          <div className="space-y-2">
            {/* Negotiate */}
            {(isAvail || isNeg) && (
              <button
                disabled={actionLoading}
                onClick={() => onNegotiate?.({
                  brokerName: brokerName || undefined,
                  clientName: clientName || undefined,
                  clientPhone: clientPhone || undefined,
                  note: note || undefined,
                })}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider disabled:opacity-50 transition-all active:scale-[0.98]"
                style={{ background: 'rgba(251,191,36,0.08)', color: '#FBBF24', border: '1px solid rgba(251,191,36,0.25)' }}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                {actionLoading ? 'Registrando…' : isNeg ? 'Atualizar negociação' : 'Iniciar negociação'}
              </button>
            )}

            {/* Reserve */}
            {(isAvail || isNeg) && (
              <button
                disabled={actionLoading}
                onClick={() => onReserve?.({
                  clientName: clientName || undefined,
                  clientPhone: clientPhone || undefined,
                  brokerName: brokerName || undefined,
                })}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider disabled:opacity-50 transition-all active:scale-[0.98]"
                style={{ background: NAVY, color: '#FB923C', border: '1px solid rgba(251,146,60,0.3)' }}
              >
                <Lock className="w-3.5 h-3.5" />
                {actionLoading ? 'Reservando…' : 'Reservar por 72h'}
              </button>
            )}

            {/* Release reservation */}
            {isReserved && (
              <button
                disabled={actionLoading}
                onClick={() => onRelease?.()}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider disabled:opacity-50 transition-all active:scale-[0.98]"
                style={{ background: 'transparent', color: '#FB923C', border: '1px solid rgba(251,146,60,0.3)' }}
              >
                <Unlock className="w-3.5 h-3.5" />
                {actionLoading ? 'Liberando…' : 'Cancelar reserva'}
              </button>
            )}
          </div>

          {/* Note field */}
          <div>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Observação (opcional)…"
              rows={2}
              className="w-full px-2.5 py-2 text-[12px] rounded-lg outline-none resize-none"
              style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${BORDER}`, color: TEXT1 }}
            />
          </div>

          {/* WhatsApp template */}
          <button
            onClick={shareViaWhatsApp}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider"
            style={{ background: 'rgba(74,222,128,0.06)', color: '#4ADE80', border: '1px solid rgba(74,222,128,0.18)' }}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            Compartilhar via WhatsApp
          </button>

          {/* Copy link */}
          <button
            onClick={copyLink}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-semibold uppercase tracking-wider transition-all"
            style={{ color: copied ? '#4ADE80' : TEXT3, border: `1px solid rgba(255,255,255,0.06)` }}
          >
            {copied ? <><Check className="w-3 h-3" /> Link copiado!</> : <><Share2 className="w-3 h-3" /> Copiar link do lote</>}
          </button>

          {actionError && (
            <p className="text-[11px] flex items-center gap-1" style={{ color: '#F87171' }}>
              <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {actionError}
            </p>
          )}
        </div>
      )}
    </div>
  ) : null;

  useEffect(() => {
    if (!isMobile) return;
    document.body.style.overflow = lot ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [lot, isMobile]);

  if (isMobile) {
    return (
      <AnimatePresence>
        {lot && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9998]"
              style={{ background: 'rgba(5,10,22,0.72)', backdropFilter: 'blur(4px)' }}
              onClick={onClose}
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              drag="y" dragConstraints={{ top: 0 }} dragElastic={0.1}
              onDragEnd={(_: unknown, info: { offset: { y: number } }) => { if (info.offset.y > 120) onClose(); }}
              className="fixed bottom-0 left-0 right-0 z-[9999] rounded-t-[24px] p-5 max-h-[92vh] overflow-y-auto"
              style={{ background: SURFACE, borderTop: `1px solid ${BORDER}`, boxShadow: '0 -8px 40px rgba(0,0,0,0.6)', paddingBottom: 'calc(2rem + env(safe-area-inset-bottom, 0px))' }}
            >
              <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: 'rgba(255,255,255,0.12)' }} />
              {content}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      {lot && (
        <motion.div
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 250 }}
          className="absolute top-0 right-0 bottom-0 w-[300px] overflow-y-auto z-20 p-5"
          style={{ background: SURFACE, borderLeft: `1px solid ${BORDER}`, boxShadow: '-8px 0 32px rgba(0,0,0,0.4)' }}
        >
          {content}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
