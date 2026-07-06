'use client';

import React from 'react';
import { MessageCircle, Scale, ShoppingCart, Check, X } from 'lucide-react';

// Card de detalhe do lote — conteúdo compartilhado entre "Mapa de Lotes"
// (AltoBellevuePlanView) e "Lotes + Satélite" (AltoBellevueGeoMap): mesmos
// campos e estilo em ambas as vistas, só muda o wrapper de posicionamento
// (bottom-sheet sobre a planta vetorial vs. painel lateral sobre o satélite).

const GOLD = '#C8A44A';

const fmtBRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);
const fmtM2 = (v: number) =>
  `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(v)} m²`;
const fmtM = (v: number) => `${v.toFixed(1).replace('.', ',')} m`;

export interface LotDetailContentProps {
  quadra: string;
  lotNumber: string | number;
  developmentName: string;
  statusLabel: string;
  statusBadgeBg: string;
  statusBadgeText: string;
  statusDotColor: string;
  isAvailable: boolean;
  isNegotiating: boolean;
  isCorner?: boolean;
  areaM2: number | null;
  price: number | null;
  pricePerM2?: number | null;
  dims?: { testada: number; profundidade: number } | null;
  sides?: { frente: number; fundos: number; lateralEsq: number; lateralDir: number } | null;
  acessoRua?: string | null;
  paymentPlans?: {
    preco_vista: number;
    p12_total: number; p12_parcela: number; p12_entrada?: number;
    p36_total: number; p36_parcela: number; p36_entrada?: number;
    p60_total: number; p60_parcela: number; p60_entrada?: number;
    p120_total: number; p120_parcela: number; p120_entrada?: number;
  } | null;
  notes?: string | null;
  whatsappPhone: string;
  waInterestText: string;
  waVisitText: string;
  waGeneralText: string;
  inCart?: boolean;
  onToggleCart?: () => void;
  onAddToCompare?: () => void;
  isInCompare?: boolean;
  onClose?: () => void;
  closeButtonRef?: React.RefObject<HTMLButtonElement>;
}

const PLAN_DISCOUNTS: Record<string, number> = { p12: 15, p36: 8, p60: 5, p120: 0 };

export default function LotDetailContent({
  quadra, lotNumber, developmentName,
  statusLabel, statusBadgeBg, statusBadgeText, statusDotColor,
  isAvailable, isNegotiating, isCorner,
  areaM2, price, pricePerM2,
  dims, sides, acessoRua, paymentPlans, notes,
  whatsappPhone, waInterestText, waVisitText, waGeneralText,
  inCart = false, onToggleCart, onAddToCompare, isInCompare,
  onClose, closeButtonRef,
}: LotDetailContentProps) {
  return (
    <>
      {/* Status accent */}
      <div style={{ height: 3, background: statusDotColor }} />

      {/* Header */}
      <div className="flex items-start justify-between px-5 pt-5 pb-2">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span
              className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
              style={{ background: statusBadgeBg, color: statusBadgeText }}
            >
              {statusLabel}
            </span>
            {isAvailable && (
              <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-full" style={{ background: '#F0EDE5', color: GOLD }}>
                Premium
              </span>
            )}
            {isCorner && (
              <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-blue-50 text-blue-700">
                Esquina
              </span>
            )}
          </div>
          <h3 style={{ fontSize: 22, fontWeight: 800, color: '#081524', fontFamily: "'Outfit', sans-serif", margin: 0, lineHeight: 1.2 }}>
            Quadra {quadra} · Lote {lotNumber}
          </h3>
          <p style={{ fontSize: 11, color: '#948F84', margin: '3px 0 0', fontWeight: 500 }}>
            {developmentName} · Garanhuns, PE
          </p>
        </div>
        {onClose && (
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full flex-shrink-0 mt-1"
            style={{ background: '#F7F8FA' }}
            aria-label="Fechar detalhes do lote"
          >
            <X size={15} color="#948F84" />
          </button>
        )}
      </div>

      {/* Area + Price */}
      <div className="grid grid-cols-2 gap-2.5 px-5 pb-3">
        <div style={{ background: '#F8F6F2', borderRadius: 14, padding: '13px 14px' }}>
          <p style={{ fontSize: 9, fontWeight: 700, color: '#948F84', textTransform: 'uppercase', letterSpacing: '0.15em', margin: '0 0 4px', fontFamily: "'Outfit', sans-serif" }}>Área Total</p>
          <p style={{ fontSize: 18, fontWeight: 800, color: '#081524', fontFamily: "'JetBrains Mono', monospace", margin: 0 }}>
            {areaM2 ? fmtM2(areaM2) : '—'}
          </p>
        </div>
        <div style={{ background: isAvailable ? '#081524' : '#F8F6F2', borderRadius: 14, padding: '13px 14px' }}>
          <p style={{ fontSize: 9, fontWeight: 700, color: isAvailable ? GOLD : '#948F84', textTransform: 'uppercase', letterSpacing: '0.15em', margin: '0 0 4px', fontFamily: "'Outfit', sans-serif" }}>Valor</p>
          <p style={{ fontSize: price && price >= 100000 ? 15 : 18, fontWeight: 800, color: isAvailable ? '#fff' : '#081524', fontFamily: "'JetBrains Mono', monospace", margin: 0 }}>
            {price ? fmtBRL(price) : 'Consultar'}
          </p>
        </div>
      </div>

      {/* Dimensions (computed) */}
      {dims && (
        <div className="grid grid-cols-2 gap-2.5 px-5 pb-3">
          <div style={{ background: '#F8F6F2', borderRadius: 14, padding: '11px 14px' }}>
            <p style={{ fontSize: 9, fontWeight: 700, color: '#948F84', textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 3px', fontFamily: "'Outfit', sans-serif" }}>Testada aprox.</p>
            <p style={{ fontSize: 15, fontWeight: 800, color: '#081524', fontFamily: "'JetBrains Mono', monospace", margin: 0 }}>
              {fmtM(dims.testada)}
            </p>
          </div>
          <div style={{ background: '#F8F6F2', borderRadius: 14, padding: '11px 14px' }}>
            <p style={{ fontSize: 9, fontWeight: 700, color: '#948F84', textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 3px', fontFamily: "'Outfit', sans-serif" }}>Profundidade aprox.</p>
            <p style={{ fontSize: 15, fontWeight: 800, color: '#081524', fontFamily: "'JetBrains Mono', monospace", margin: 0 }}>
              {fmtM(dims.profundidade)}
            </p>
          </div>
        </div>
      )}

      {/* Confrontações (aprox. — derivadas das arestas) */}
      {sides && (
        <div className="px-5 pb-3">
          <p style={{ fontSize: 9, fontWeight: 700, color: '#948F84', textTransform: 'uppercase', letterSpacing: '0.15em', margin: '0 0 8px', fontFamily: "'Outfit', sans-serif" }}>
            Confrontações <span style={{ color: '#C0BAB2', fontWeight: 500 }}>(aprox.)</span>
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {([
              { label: 'Frente', v: sides.frente },
              { label: 'Fundos', v: sides.fundos },
              { label: 'Lateral esq.', v: sides.lateralEsq },
              { label: 'Lateral dir.', v: sides.lateralDir },
            ] as const).map((s) => (
              <div key={s.label} style={{ background: '#F8F6F2', borderRadius: 10, padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 10, color: '#948F84', fontWeight: 600 }}>{s.label}</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#081524', fontFamily: "'JetBrains Mono', monospace" }}>{fmtM(s.v)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rua de acesso */}
      {acessoRua && (
        <div className="px-5 pb-3">
          <div style={{ background: '#F0EDE5', borderRadius: 12, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 11, color: '#948F84', fontWeight: 600, flexShrink: 0 }}>Rua de acesso</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#081524', textAlign: 'right', fontFamily: "'Outfit', sans-serif" }}>{acessoRua}</span>
          </div>
        </div>
      )}

      {/* Price per m² */}
      {pricePerM2 && (
        <div className="px-5 pb-3">
          <div style={{ background: '#F0EDE5', borderRadius: 12, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: '#948F84', fontWeight: 600 }}>Preço por m²</span>
            <span style={{ fontSize: 15, fontWeight: 800, color: '#081524', fontFamily: "'JetBrains Mono', monospace" }}>
              {fmtBRL(pricePerM2)}/m²
            </span>
          </div>
        </div>
      )}

      {/* Payment plans */}
      {paymentPlans && (isAvailable || isNegotiating) && (
        <div className="px-5 pb-3">
          <p style={{ fontSize: 9, fontWeight: 700, color: '#948F84', textTransform: 'uppercase', letterSpacing: '0.15em', margin: '0 0 10px', fontFamily: "'Outfit', sans-serif" }}>
            Formas de Pagamento
          </p>
          {/* Cash */}
          <div style={{ background: '#081524', borderRadius: 12, padding: '11px 14px', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: 9, fontWeight: 700, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 3px', fontFamily: "'Outfit', sans-serif" }}>À Vista</p>
              <p style={{ fontSize: 16, fontWeight: 800, color: GOLD, fontFamily: "'JetBrains Mono', monospace", margin: 0 }}>
                {fmtBRL(paymentPlans.preco_vista)}
              </p>
            </div>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(200,164,74,0.75)', background: 'rgba(200,164,74,0.12)', padding: '3px 8px', borderRadius: 8 }}>
              −20%
            </span>
          </div>
          {/* Installments */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {([
              { key: 'p12', label: '12×', parcela: paymentPlans.p12_parcela, total: paymentPlans.p12_total, entrada: paymentPlans.p12_entrada },
              { key: 'p36', label: '36×', parcela: paymentPlans.p36_parcela, total: paymentPlans.p36_total, entrada: paymentPlans.p36_entrada },
              { key: 'p60', label: '60×', parcela: paymentPlans.p60_parcela, total: paymentPlans.p60_total, entrada: paymentPlans.p60_entrada },
              { key: 'p120', label: '120×', parcela: paymentPlans.p120_parcela, total: paymentPlans.p120_total, entrada: paymentPlans.p120_entrada },
            ] as const).map(plan => {
              const desconto = PLAN_DISCOUNTS[plan.key];
              const entrada = plan.entrada ?? Math.round(plan.total * 10) / 100;
              return (
                <div key={plan.label} style={{ background: '#F8F6F2', borderRadius: 12, padding: '10px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                    <p style={{ fontSize: 9, fontWeight: 700, color: '#948F84', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0, fontFamily: "'Outfit', sans-serif" }}>{plan.label}</p>
                    <span style={{
                      fontSize: 8, fontWeight: 700, padding: '2px 6px', borderRadius: 6,
                      background: desconto > 0 ? 'rgba(50,209,124,0.14)' : 'rgba(0,0,0,0.05)',
                      color: desconto > 0 ? '#15803D' : '#A8A296',
                    }}>
                      {desconto > 0 ? `−${desconto}%` : 'sem desc.'}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 800, color: '#081524', fontFamily: "'JetBrains Mono', monospace", margin: 0 }}>
                    {fmtBRL(plan.parcela)}/mês
                  </p>
                  <p style={{ fontSize: 8, color: '#B8B3A8', margin: '2px 0 0', fontWeight: 500 }}>
                    Entrada {fmtBRL(entrada)} · Total {fmtBRL(plan.total)}
                  </p>
                </div>
              );
            })}
          </div>
          <p style={{ fontSize: 8.5, color: '#B8B3A8', margin: '8px 2px 0', fontWeight: 500, lineHeight: 1.45 }}>
            Entrada de 10% sobre o valor do plano · correção mensal pelo INCC conforme tabela oficial.
          </p>
        </div>
      )}

      {isNegotiating && (
        <div className="px-5 pb-3">
          <p style={{ fontSize: 11, color: '#92400E', background: '#FEF3C7', borderRadius: 10, padding: '9px 13px', margin: 0, lineHeight: 1.5 }}>
            Este lote está em processo de negociação. Entre em contato para verificar disponibilidade.
          </p>
        </div>
      )}

      {notes && (
        <div className="px-5 pb-3">
          <p style={{ fontSize: 11, color: '#636363', background: '#F8F6F2', borderRadius: 10, padding: '9px 13px', margin: 0, lineHeight: 1.5 }}>
            {notes}
          </p>
        </div>
      )}

      {/* CTAs */}
      <div className="px-5 pt-1 pb-2 flex flex-col gap-2">
        {onAddToCompare && (
          <button
            onClick={onAddToCompare}
            className="flex items-center justify-center gap-2 w-full h-11 rounded-2xl text-[12px] font-semibold transition-all active:scale-95"
            style={{
              color: isInCompare ? '#0B1B2D' : GOLD,
              border: isInCompare ? '1.5px solid #C8A44A' : '1.5px solid rgba(200,164,74,0.4)',
              background: isInCompare ? 'rgba(200,164,74,0.15)' : 'transparent',
              fontFamily: "'Outfit', sans-serif",
            }}
          >
            <Scale size={14} />
            {isInCompare ? 'Remover da comparação' : 'Comparar este lote'}
          </button>
        )}
        {isAvailable && onToggleCart && (
          <button
            onClick={onToggleCart}
            className="flex items-center justify-center gap-2 w-full h-11 rounded-2xl text-[12px] font-bold transition-all active:scale-95"
            style={{
              color: inCart ? '#fff' : '#0B1B2D',
              border: '1.5px solid #C8A44A',
              background: inCart ? '#C8A44A' : 'transparent',
              fontFamily: "'Outfit', sans-serif",
            }}
          >
            {inCart ? <Check size={14} /> : <ShoppingCart size={14} />}
            {inCart ? 'Na proposta' : 'Adicionar à proposta'}
          </button>
        )}
        {isAvailable || isNegotiating ? (
          <>
            <a
              href={`https://wa.me/${whatsappPhone}?text=${waInterestText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="relative flex items-center justify-center gap-2 w-full h-12 rounded-2xl text-[13px] font-bold uppercase tracking-wider overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #0B1B2D, #10233B)', color: '#fff', textDecoration: 'none', fontFamily: "'Outfit', sans-serif" }}
            >
              <MessageCircle size={15} />
              Tenho Interesse
              <span style={{ position: 'absolute', bottom: 0, left: '15%', right: '15%', height: 2, background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)`, opacity: 0.8 }} />
            </a>
            <a
              href={`https://wa.me/${whatsappPhone}?text=${waVisitText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full h-11 rounded-2xl text-[12px] font-semibold"
              style={{ color: '#0B1B2D', border: '1.5px solid rgba(11,27,45,0.14)', background: '#F8F6F2', textDecoration: 'none', fontFamily: "'Outfit', sans-serif" }}
            >
              Agendar Visita
            </a>
          </>
        ) : (
          <a
            href={`https://wa.me/${whatsappPhone}?text=${waGeneralText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full h-12 rounded-2xl text-[13px] font-bold"
            style={{ color: '#0B1B2D', border: '1.5px solid rgba(11,27,45,0.12)', background: '#fff', textDecoration: 'none', fontFamily: "'Outfit', sans-serif" }}
          >
            <MessageCircle size={15} />
            Ver Lotes Disponíveis
          </a>
        )}
      </div>
    </>
  );
}
