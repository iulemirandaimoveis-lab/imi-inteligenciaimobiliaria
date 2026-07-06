'use client';

/**
 * Carrinho de proposta multi-lote (FAB + sheet) — visual único compartilhado
 * entre as vistas "Plano" (SubdivisionLotMap) e "Satélite + Lotes"
 * (AltoBellevueGeoMap). Extraído de AltoBellevueGeoMap.tsx (nenhuma mudança
 * visual) para as duas vistas usarem exatamente o mesmo componente — evita
 * o carrinho divergir entre elas no futuro.
 *
 * z-index alto (mesmo padrão de SubdivisionLotMap/DevelopmentUnits/LeadCaptureModal)
 * para nunca ficar escondido atrás de barras fixas da página (ex.: MobileStickyBar,
 * z-[140]) — sem isso o cliente não conseguia abrir/concluir a proposta.
 */

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, ShoppingCart, Trash2, Check, Link2, FileText } from 'lucide-react';
import { cartTotals, type CartLot } from '@/lib/lotmap/cart';

const GOLD = '#C8A44A';
const NAVY = '#0B1928';

export const fmtBRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);
export const fmtM2 = (v: number) => `${Math.round(v).toLocaleString('pt-BR')} m²`;

// ── Botão flutuante "Proposta" (contador do carrinho) ──────────────────────────

export function CartFab({
  count, onClick, fixed = false,
}: {
  count: number;
  onClick: () => void;
  /** true = ancorado à viewport (páginas com scroll longo, ex. "Plano");
   *  false (default) = ancorado ao container relative mais próximo (ex. o
   *  canvas do mapa em "Satélite + Lotes", que já é `position: relative`). */
  fixed?: boolean;
}) {
  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      onClick={onClick}
      className={`${fixed ? 'fixed' : 'absolute'} z-[9990] flex items-center gap-2 right-3 bottom-16 sm:bottom-6`}
      style={{
        height: 48, padding: '0 16px 0 14px', borderRadius: 24, border: 'none',
        background: GOLD, color: NAVY, boxShadow: '0 8px 28px rgba(200,164,74,0.45)',
        cursor: 'pointer', fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: 13.5,
      }}
      aria-label="Abrir proposta"
    >
      <ShoppingCart size={18} />
      <span>Proposta</span>
      <span style={{ minWidth: 22, height: 22, borderRadius: 11, background: NAVY, color: GOLD, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, padding: '0 6px' }}>
        {count}
      </span>
    </motion.button>
  );
}

// ── Cart sheet (proposta multi-lote) ───────────────────────────────────────────

export function CartSheet({
  items, totals, linkCopied, onRemove, onClear, onCopyLink, onProposal, onClose, fixed = false,
}: {
  items: CartLot[];
  totals: ReturnType<typeof cartTotals>;
  linkCopied: boolean;
  onRemove: (id: string) => void;
  onClear: () => void;
  onCopyLink: () => void;
  onProposal: () => void;
  onClose: () => void;
  /** true = ancorado à viewport (páginas com scroll longo, ex. "Plano");
   *  false (default) = ancorado ao container relative mais próximo (ex. o
   *  canvas do mapa em "Satélite + Lotes"). */
  fixed?: boolean;
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  const posClass = fixed ? 'fixed' : 'absolute';

  return (
    <>
      {/* Scrim */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className={`${posClass} inset-0 z-[9998]`}
        style={{ background: 'rgba(0,0,0,0.45)' }}
        onClick={onClose}
      />
      <motion.div
        initial={{ y: '100%', opacity: 0.6 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', stiffness: 380, damping: 40 }}
        className={`${posClass} z-[9999] left-0 right-0 bottom-0 sm:left-auto sm:right-4 sm:bottom-4 sm:w-[380px] rounded-t-[24px] sm:rounded-[20px] flex flex-col overflow-hidden`}
        style={{
          background: 'rgba(9,20,38,0.98)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(200,164,74,0.25)', boxShadow: '0 -8px 40px rgba(0,0,0,0.6)', maxHeight: '80svh',
        }}
      >
        <div style={{ height: 3, background: GOLD, flexShrink: 0 }} />
        <div className="flex items-center justify-between px-5 pt-4 pb-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <ShoppingCart size={16} color={GOLD} />
            <span style={{ fontSize: 15, fontWeight: 800, color: '#fff', fontFamily: "'Outfit', sans-serif" }}>
              Sua proposta
            </span>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>
              {items.length} {items.length === 1 ? 'lote' : 'lotes'}
            </span>
          </div>
          <button onClick={onClose} aria-label="Fechar"
            className="flex items-center justify-center"
            style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)', border: 'none', cursor: 'pointer' }}>
            <X size={15} />
          </button>
        </div>

        <div className="overflow-y-auto px-5 flex-1" style={{ scrollbarWidth: 'thin' }}>
          {items.map((l) => (
            <div key={l.id} className="flex items-center justify-between py-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', margin: 0 }}>Quadra {l.block} · Lote {l.lot}</p>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', margin: '2px 0 0', fontFamily: "'JetBrains Mono', monospace" }}>
                  {fmtM2(l.areaM2)} · {fmtBRL(l.price)}
                </p>
                {l.selectedPlan && (
                  <p style={{ fontSize: 10.5, color: GOLD, margin: '2px 0 0', fontWeight: 700 }}>
                    {l.selectedPlan.label}{l.selectedPlan.parcela ? ` · ${fmtBRL(l.selectedPlan.parcela)}/mês` : ''}
                  </p>
                )}
              </div>
              <button onClick={() => onRemove(l.id)} aria-label="Remover lote"
                className="flex items-center justify-center flex-shrink-0"
                style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(239,68,68,0.10)', color: '#F87171', border: 'none', cursor: 'pointer' }}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        {/* Totais + ações */}
        <div className="px-5 pt-4 flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))' }}>
          <div className="flex items-center justify-between mb-1">
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Área total</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.8)', fontFamily: "'JetBrains Mono', monospace" }}>{fmtM2(totals.totalArea)}</span>
          </div>
          <div className="flex items-center justify-between mb-3">
            <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Valor total</span>
            <span style={{ fontSize: 18, fontWeight: 800, color: GOLD, fontFamily: "'JetBrains Mono', monospace" }}>{fmtBRL(totals.totalPrice)}</span>
          </div>
          <button
            onClick={onProposal}
            className="flex items-center justify-center gap-2 w-full mb-2"
            style={{ height: 48, borderRadius: 13, border: 'none', background: GOLD, color: NAVY, fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: "'Outfit', sans-serif" }}
          >
            <FileText size={16} /> Preencher proposta
          </button>
          <div className="flex gap-2">
            <button onClick={onCopyLink}
              className="flex items-center justify-center gap-2 flex-1"
              style={{ height: 40, borderRadius: 11, background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
              {linkCopied ? <><Check size={14} color="#34D399" /> Copiado</> : <><Link2 size={14} /> Copiar link</>}
            </button>
            <button onClick={onClear}
              className="flex items-center justify-center"
              style={{ width: 40, height: 40, borderRadius: 11, background: 'rgba(239,68,68,0.10)', color: '#F87171', border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer' }}
              aria-label="Limpar proposta">
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}
