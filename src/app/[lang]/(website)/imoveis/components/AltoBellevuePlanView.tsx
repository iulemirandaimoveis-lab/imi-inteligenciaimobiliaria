'use client';

import React, {
  useRef, useState, useCallback, useMemo, useEffect, memo,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  X, ZoomIn, ZoomOut, RotateCcw, MessageCircle,
  ShoppingCart, Trash2, Send, Layers, ChevronDown, ChevronUp,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Lot {
  id: string; quadra: string; lot_number: number;
  area_m2: number; price: number | null;
  status: string; special_type: string | null; notes: string | null;
}

interface PlanLot {
  id: string; quadra: string; lot_number: string;
  polygon: [number, number][]; centroid: [number, number];
  area_m2: number | null; price: number | null;
  status: string; has_polygon: boolean;
}

type StatusKey = 'DISPONIVEL' | 'VENDIDO' | 'NEGOCIACAO' | 'PROPRIETARIO' | 'IGREJA';

// ─── Constants ────────────────────────────────────────────────────────────────

const SVG_W = 1000, SVG_H = 707;
const MIN_SCALE = 0.4, MAX_SCALE = 18;
const WHATSAPP_NUMBER = '5587999999999';

const fmtBRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);
const fmtM2 = (v: number) =>
  `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(v)} m²`;

const STATUS: Record<StatusKey, { label: string; fill: string; stroke: string; text: string }> = {
  DISPONIVEL:   { label: 'Disponível',   fill: 'rgba(34,197,94,0.22)',  stroke: '#22C55E', text: '#16A34A' },
  VENDIDO:      { label: 'Vendido',      fill: 'rgba(30,41,59,0.65)',   stroke: '#334155', text: '#94A3B8' },
  NEGOCIACAO:   { label: 'Negociação',   fill: 'rgba(234,179,8,0.22)',  stroke: '#EAB308', text: '#CA8A04' },
  PROPRIETARIO: { label: 'Proprietário', fill: 'rgba(59,130,246,0.18)', stroke: '#3B82F6', text: '#2563EB' },
  IGREJA:       { label: 'Igreja',       fill: 'rgba(167,139,250,0.2)', stroke: '#A78BFA', text: '#7C3AED' },
};
const getStatus = (key: string) => STATUS[key as StatusKey] ?? STATUS.DISPONIVEL;

const PAYMENT_CONDITIONS = [
  { label: 'À vista',   desc: '20% desconto',        calc: (p: number) => p * 0.80 },
  { label: '12 meses',  desc: '15% desc + 10% ent.', calc: (p: number) => p * 0.85 },
  { label: '36 meses',  desc: '8% desc + 10% ent.',  calc: (p: number) => p * 0.92 },
  { label: '60 meses',  desc: '5% desc + 10% ent.',  calc: (p: number) => p * 0.95 },
  { label: '120 meses', desc: 'INCC/IPCA+0,5%/m',    calc: (p: number) => p },
];

// ─── Hook: Load plan lots from JSON ──────────────────────────────────────────

function usePlanLots() {
  const [planLots, setPlanLots] = useState<PlanLot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/data/alto-bellevue-lots.json')
      .then(r => r.json())
      .then((data: PlanLot[]) => { setPlanLots(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return { planLots, loading };
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isMobile;
}

// ─── Merge DB lots with plan polygons ─────────────────────────────────────────

function mergeLots(dbLots: Lot[], planLots: PlanLot[]): PlanLot[] {
  const dbMap = new Map(dbLots.map(l => [`${l.quadra}-${String(l.lot_number).padStart(2, '0')}`, l]));
  return planLots.map(pl => {
    const db = dbMap.get(pl.id);
    return {
      ...pl,
      price: db?.price ?? pl.price,
      area_m2: db?.area_m2 ?? pl.area_m2,
      status: db?.status ?? pl.status,
    };
  });
}

// ─── CartPanel ────────────────────────────────────────────────────────────────

interface CartPanelProps {
  cart: PlanLot[]; whatsapp: string;
  onRemove: (id: string) => void; onClear: () => void;
}

const CartPanel = memo(function CartPanel({ cart, whatsapp, onRemove, onClear }: CartPanelProps) {
  const [payIdx, setPayIdx] = useState(0);
  const totalArea = cart.reduce((s, l) => s + (l.area_m2 ?? 0), 0);
  const totalPrice = cart.reduce((s, l) => s + (l.price ?? 0), 0);

  function sendWhatsApp() {
    const lines = cart.map(l =>
      `• Quadra ${l.quadra}, Lote ${l.lot_number}${l.area_m2 ? ` — ${fmtM2(l.area_m2)}` : ''}${l.price ? ` — ${fmtBRL(l.price)}` : ''}`
    );
    const msg = `Olá! Tenho interesse nos seguintes lotes do *Alto Bellevue*:\n\n${lines.join('\n')}\n\n${totalPrice ? `*Valor total: ${fmtBRL(totalPrice)}*\n` : ''}Gostaria de receber uma proposta. Obrigado!`;
    window.open(`https://wa.me/${whatsapp}?text=${encodeURIComponent(msg)}`, '_blank');
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <ShoppingCart size={16} className="text-emerald-400"/>
          <span className="font-semibold text-white text-sm">{cart.length} {cart.length === 1 ? 'lote' : 'lotes'}</span>
        </div>
        {cart.length > 0 && (
          <button onClick={onClear} className="text-slate-500 hover:text-red-400 text-xs flex items-center gap-1">
            <Trash2 size={12}/> Limpar
          </button>
        )}
      </div>

      {cart.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-500 p-6 text-center">
          <ShoppingCart size={32} className="opacity-30"/>
          <p className="text-sm">Selecione lotes no mapa para adicionar à proposta</p>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {cart.map(lot => (
              <div key={lot.id} className="bg-white/5 rounded-lg p-3 flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white text-sm">Quadra {lot.quadra} · Lote {lot.lot_number}</div>
                  {lot.area_m2 && <div className="text-slate-400 text-xs">{fmtM2(lot.area_m2)}</div>}
                  {lot.price && <div className="text-emerald-400 text-xs font-medium mt-0.5">{fmtBRL(lot.price)}</div>}
                </div>
                <button onClick={() => onRemove(lot.id)} className="text-slate-600 hover:text-red-400 flex-shrink-0 mt-0.5">
                  <X size={14}/>
                </button>
              </div>
            ))}
          </div>

          {totalPrice > 0 && (
            <div className="p-3 border-t border-white/10 space-y-3">
              <div className="bg-white/5 rounded-lg p-3 space-y-1.5">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Área total</span><span>{fmtM2(totalArea)}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold text-white">
                  <span>Valor total</span><span>{fmtBRL(totalPrice)}</span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-xs text-slate-500 mb-1">Condição de pagamento:</div>
                {PAYMENT_CONDITIONS.map((c, i) => (
                  <button
                    key={i}
                    onClick={() => setPayIdx(i)}
                    className={`w-full flex justify-between px-3 py-1.5 rounded text-xs transition-colors ${
                      i === payIdx ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'hover:bg-white/5 text-slate-400'
                    }`}
                  >
                    <span>{c.label}</span>
                    <span className="font-medium">{fmtBRL(c.calc(totalPrice))}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="p-3 pt-0">
            <button
              onClick={sendWhatsApp}
              className="w-full bg-[#25D366] hover:bg-[#1ebe5b] text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 text-sm transition-colors"
            >
              <MessageCircle size={16}/>
              Enviar Proposta
              <Send size={14}/>
            </button>
          </div>
        </>
      )}
    </div>
  );
});

// ─── LotInfoPanel ─────────────────────────────────────────────────────────────

interface LotInfoProps {
  lot: PlanLot; inCart: boolean;
  onAddToCart: () => void; onRemoveFromCart: () => void;
  onClose: () => void;
}

function LotInfoPanel({ lot, inCart, onAddToCart, onRemoveFromCart, onClose }: LotInfoProps) {
  const st = getStatus(lot.status);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}
      className="fixed bottom-0 left-0 right-0 md:absolute md:bottom-4 md:left-auto md:right-4 md:w-72 md:rounded-2xl bg-[#0F1923]/98 backdrop-blur-xl border-t md:border border-white/10 rounded-t-2xl shadow-2xl overflow-hidden z-[160] md:z-30"
      style={{ maxHeight: '72vh', overflowY: 'auto', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div>
          <div className="font-bold text-white text-base">Quadra {lot.quadra} · Lote {lot.lot_number}</div>
          <span
            className="text-xs px-2 py-0.5 rounded-full mt-1 inline-block"
            style={{ background: st.fill, color: st.text, border: `1px solid ${st.stroke}` }}
          >
            {st.label}
          </span>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-white">
          <X size={18}/>
        </button>
      </div>

      <div className="p-4 space-y-3">
        {lot.area_m2 && (
          <div className="flex justify-between">
            <span className="text-slate-400 text-sm">Área</span>
            <span className="text-white font-semibold text-sm">{fmtM2(lot.area_m2)}</span>
          </div>
        )}

        {lot.price ? (
          <>
            <div className="flex justify-between">
              <span className="text-slate-400 text-sm">Preço à vista</span>
              <span className="text-emerald-400 font-bold">{fmtBRL(lot.price * 0.80)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 text-sm">Tabela</span>
              <span className="text-white font-semibold text-sm">{fmtBRL(lot.price)}</span>
            </div>
            {lot.area_m2 && (
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">R$/m²</span>
                <span className="text-slate-300 text-sm">{fmtBRL(lot.price / lot.area_m2)}/m²</span>
              </div>
            )}

            <div className="bg-white/5 rounded-xl p-3 space-y-1.5">
              <div className="text-xs text-slate-500 mb-2">Condições de pagamento</div>
              {PAYMENT_CONDITIONS.map((c, i) => (
                <div key={i} className="flex justify-between text-xs">
                  <span className="text-slate-400">{c.label}</span>
                  <span className={i === 0 ? 'text-emerald-400 font-semibold' : 'text-slate-300'}>{fmtBRL(c.calc(lot.price!))}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-slate-500 text-sm italic">Preço sob consulta</div>
        )}
      </div>

      {lot.status === 'DISPONIVEL' && (
        <div className="p-4 pt-0">
          {inCart ? (
            <button
              onClick={onRemoveFromCart}
              className="w-full border border-red-500/40 text-red-400 hover:bg-red-500/10 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <X size={14}/> Remover da proposta
            </button>
          ) : (
            <button
              onClick={onAddToCart}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-white py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <ShoppingCart size={14}/> Adicionar à proposta
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
  lots: Lot[];
  developmentId: string;
  developmentName: string;
  whatsappPhone: string;
  onLotClick?: (lot: Lot) => void;
}

export default function AltoBellevuePlanView({ lots, whatsappPhone, onLotClick }: Props) {
  const { planLots, loading } = usePlanLots();
  const isMobile = useIsMobile();
  const mergedLots = useMemo(() => mergeLots(lots, planLots), [lots, planLots]);

  // Pan/zoom state
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const isPanning = useRef(false);
  const lastPan = useRef({ x: 0, y: 0 });
  const pinchRef = useRef<{ dist: number } | null>(null);

  // UI state
  const [selectedLot, setSelectedLot] = useState<PlanLot | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [cart, setCart] = useState<PlanLot[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'ALL' | StatusKey>('ALL');
  const [showFilters, setShowFilters] = useState(false);
  const [showImage, setShowImage] = useState(true);

  // Compute visible lots
  const visibleLots = useMemo(() => {
    const withPoly = mergedLots.filter(l => l.has_polygon);
    if (filterStatus === 'ALL') return withPoly;
    return withPoly.filter(l => l.status === filterStatus);
  }, [mergedLots, filterStatus]);

  const lotsWithPoly = useMemo(() => mergedLots.filter(l => l.has_polygon), [mergedLots]);
  const lotsNoPrice = useMemo(() => lotsWithPoly.filter(l => !l.price && l.status === 'DISPONIVEL'), [lotsWithPoly]);
  const lotsDisponiveis = useMemo(() => mergedLots.filter(l => l.status === 'DISPONIVEL'), [mergedLots]);

  // Zoom
  const doZoom = useCallback((factor: number, cx = SVG_W / 2, cy = SVG_H / 2) => {
    setTransform(t => {
      const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, t.scale * factor));
      const ratio = newScale / t.scale;
      return { scale: newScale, x: cx - (cx - t.x) * ratio, y: cy - (cy - t.y) * ratio };
    });
  }, []);

  const resetView = useCallback(() => setTransform({ x: 0, y: 0, scale: 1 }), []);

  // Wheel zoom
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    function onWheel(e: WheelEvent) {
      e.preventDefault();
      const rect = el!.getBoundingClientRect();
      const cx = (e.clientX - rect.left) / rect.width * SVG_W;
      const cy = (e.clientY - rect.top) / rect.height * SVG_H;
      const delta = e.deltaMode === 1 ? e.deltaY * 28 : e.deltaMode === 2 ? e.deltaY * 500 : e.deltaY;
      doZoom(delta > 0 ? 0.88 : 1.14, cx, cy);
    }
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [doZoom]);

  // Mouse pan
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as Element).closest('[data-lot]')) return;
    isPanning.current = true;
    lastPan.current = { x: e.clientX, y: e.clientY };
  }, []);
  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning.current) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const dx = (e.clientX - lastPan.current.x) / rect.width * SVG_W;
    const dy = (e.clientY - lastPan.current.y) / rect.height * SVG_H;
    lastPan.current = { x: e.clientX, y: e.clientY };
    setTransform(t => ({ ...t, x: t.x + dx / t.scale, y: t.y + dy / t.scale }));
  }, []);
  const onMouseUp = useCallback(() => { isPanning.current = false; }, []);

  // Touch pan/pinch
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchRef.current = { dist: Math.sqrt(dx * dx + dy * dy) };
    } else {
      lastPan.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  }, []);
  const onTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 2 && pinchRef.current) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const newDist = Math.sqrt(dx * dx + dy * dy);
      doZoom(newDist / pinchRef.current.dist);
      pinchRef.current = { dist: newDist };
    } else if (e.touches.length === 1) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const ddx = (e.touches[0].clientX - lastPan.current.x) / rect.width * SVG_W;
      const ddy = (e.touches[0].clientY - lastPan.current.y) / rect.height * SVG_H;
      lastPan.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      setTransform(t => ({ ...t, x: t.x + ddx / t.scale, y: t.y + ddy / t.scale }));
    }
  }, [doZoom]);

  // Cart helpers
  const cartIds = useMemo(() => new Set(cart.map(l => l.id)), [cart]);
  const addToCart = useCallback((lot: PlanLot) => {
    setCart(c => cartIds.has(lot.id) ? c : [...c, lot]);
    setShowCart(true);
  }, [cartIds]);
  const removeFromCart = useCallback((id: string) => setCart(c => c.filter(l => l.id !== id)), []);

  // Lot click
  const handleLotClick = useCallback((lot: PlanLot) => {
    setSelectedLot(prev => prev?.id === lot.id ? null : lot);
    onLotClick?.({ id: lot.id, quadra: lot.quadra, lot_number: Number(lot.lot_number), area_m2: lot.area_m2 ?? 0, price: lot.price, status: lot.status, special_type: null, notes: null });
  }, [onLotClick]);

  const showScale = transform.scale >= 2.5;

  return (
    <div className="relative w-full h-full flex bg-[#070E16] overflow-hidden select-none" style={{ minHeight: 480 }}>

      {/* Map SVG */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden"
        style={{ cursor: isPanning.current ? 'grabbing' : 'grab' }}
        onMouseDown={onMouseDown} onMouseMove={onMouseMove}
        onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
        onTouchStart={onTouchStart} onTouchMove={onTouchMove}
        onTouchEnd={() => { pinchRef.current = null; }}
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          className="w-full h-full"
          style={{ overflow: 'visible' }}
        >
          <defs>
            <filter id="ab-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
            <filter id="ab-hover-glow" x="-25%" y="-25%" width="150%" height="150%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur"/>
              <feFlood floodColor="#ffffff" floodOpacity="0.3" result="color"/>
              <feComposite in="color" in2="blur" operator="in" result="colorBlur"/>
              <feMerge><feMergeNode in="colorBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>

          <g transform={`scale(${transform.scale}) translate(${transform.x},${transform.y})`}>

            {/* Background image (plant scan — pre-cropped to match SVG coordinate space) */}
            {showImage && (
              <image
                href="/images/maps/alto-bellevue-bg.jpg"
                x={0} y={0} width={1000} height={707}
                preserveAspectRatio="none"
                opacity={0.35}
                style={{ imageRendering: 'crisp-edges' }}
              />
            )}

            {/* Lot polygons */}
            {visibleLots.map(lot => {
              if (!lot.polygon || lot.polygon.length < 3) return null;
              const st = getStatus(lot.status);
              const isHovered = hoveredId === lot.id;
              const isSelected = selectedLot?.id === lot.id;
              const inCart = cartIds.has(lot.id);
              const pts = lot.polygon.map(([x, y]) => `${x},${y}`).join(' ');

              return (
                <polygon
                  key={lot.id}
                  data-lot={lot.id}
                  points={pts}
                  fill={isSelected ? 'rgba(245,210,40,0.35)' : inCart ? 'rgba(52,211,153,0.32)' : st.fill}
                  stroke={isSelected ? '#F5D228' : inCart ? '#34D399' : isHovered ? '#FFFFFF' : st.stroke}
                  strokeWidth={isSelected || isHovered ? 1.2 / transform.scale : 0.7 / transform.scale}
                  filter={isSelected ? 'url(#ab-glow)' : isHovered ? 'url(#ab-hover-glow)' : undefined}
                  style={{ cursor: 'pointer', transition: 'fill 0.12s, stroke 0.12s' }}
                  onMouseEnter={() => setHoveredId(lot.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={(e) => { e.stopPropagation(); handleLotClick(lot); }}
                />
              );
            })}

            {/* Lot labels (only when zoomed in) */}
            {showScale && visibleLots.map(lot => {
              if (!lot.centroid || !lot.polygon || lot.polygon.length < 3) return null;
              const [cx, cy] = lot.centroid;
              const fontSize = Math.max(2, Math.min(4, 6 / transform.scale));
              return (
                <text
                  key={`lbl-${lot.id}`}
                  x={cx} y={cy}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize={fontSize}
                  fill={selectedLot?.id === lot.id ? '#F5D228' : '#FFFFFFCC'}
                  style={{ pointerEvents: 'none', fontFamily: 'monospace', fontWeight: 600 }}
                >
                  {lot.lot_number}
                </text>
              );
            })}

            {/* Quadra labels */}
            {!showScale && (
              <g style={{ pointerEvents: 'none' }}>
                {Object.entries(
                  visibleLots.reduce((acc, l) => {
                    if (!l.centroid || !l.has_polygon) return acc;
                    if (!acc[l.quadra]) acc[l.quadra] = { xs: [], ys: [] };
                    acc[l.quadra].xs.push(l.centroid[0]);
                    acc[l.quadra].ys.push(l.centroid[1]);
                    return acc;
                  }, {} as Record<string, { xs: number[]; ys: number[] }>)
                ).map(([q, { xs, ys }]) => {
                  const cx = xs.reduce((a, b) => a + b, 0) / xs.length;
                  const cy = ys.reduce((a, b) => a + b, 0) / ys.length;
                  return (
                    <g key={q} transform={`translate(${cx},${cy})`}>
                      <circle r={8 / transform.scale} fill="#0A1828CC" stroke="#FFFFFF33" strokeWidth={0.5 / transform.scale}/>
                      <text textAnchor="middle" dominantBaseline="middle" fontSize={7 / transform.scale} fill="#FFFFFF" fontWeight="bold" fontFamily="system-ui">
                        {q}
                      </text>
                    </g>
                  );
                })}
              </g>
            )}
          </g>
        </svg>

        {/* Controls */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-20">
          <button onClick={() => doZoom(1.3)} className="w-8 h-8 bg-[#0A1828]/90 border border-white/10 rounded-lg text-white flex items-center justify-center hover:bg-white/10">
            <ZoomIn size={14}/>
          </button>
          <button onClick={() => doZoom(0.77)} className="w-8 h-8 bg-[#0A1828]/90 border border-white/10 rounded-lg text-white flex items-center justify-center hover:bg-white/10">
            <ZoomOut size={14}/>
          </button>
          <button onClick={resetView} className="w-8 h-8 bg-[#0A1828]/90 border border-white/10 rounded-lg text-white flex items-center justify-center hover:bg-white/10">
            <RotateCcw size={14}/>
          </button>
        </div>

        {/* Filter bar */}
        <div className="absolute top-3 right-3 flex items-center gap-2 z-20">
          <div className="relative">
            <button
              onClick={() => setShowFilters(f => !f)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0A1828]/90 border border-white/10 rounded-lg text-slate-300 text-xs hover:bg-white/10"
            >
              <Layers size={12}/> {filterStatus === 'ALL' ? 'Todos' : STATUS[filterStatus as StatusKey]?.label}
              <ChevronDown size={10}/>
            </button>
            {showFilters && (
              <div className="absolute right-0 top-full mt-1 bg-[#0A1828] border border-white/10 rounded-xl shadow-xl overflow-hidden min-w-32 z-30">
                {(['ALL', ...Object.keys(STATUS)] as const).map(k => (
                  <button
                    key={k}
                    onClick={() => { setFilterStatus(k as 'ALL' | StatusKey); setShowFilters(false); }}
                    className={`w-full px-3 py-2 text-left text-xs hover:bg-white/5 ${filterStatus === k ? 'text-emerald-400' : 'text-slate-300'}`}
                  >
                    {k === 'ALL' ? 'Todos os lotes' : STATUS[k as StatusKey].label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => setShowImage(s => !s)}
            className={`px-3 py-1.5 border rounded-lg text-xs transition-colors ${showImage ? 'bg-slate-600/40 border-slate-500/40 text-slate-300' : 'bg-white/5 border-white/10 text-slate-500'}`}
          >
            Planta
          </button>

          <button
            onClick={() => { setShowCart(s => !s); setSelectedLot(null); }}
            className="relative flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/30 rounded-lg text-emerald-400 text-xs hover:bg-emerald-500/30"
          >
            <ShoppingCart size={12}/> Proposta
            {cart.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-emerald-500 text-white rounded-full text-[9px] flex items-center justify-center font-bold">
                {cart.length}
              </span>
            )}
          </button>
        </div>

        {/* Stats bar — hidden on mobile when lot panel is open */}
        {!(isMobile && selectedLot && !showCart) && (
          <div className="absolute bottom-3 left-3 flex items-center gap-2 text-xs text-slate-500 z-20">
            <span className="bg-[#0A1828]/80 border border-white/5 rounded-lg px-2.5 py-1">
              <span className="text-emerald-400 font-semibold">{lotsDisponiveis.length}</span> disponíveis
            </span>
            {lotsWithPoly.length > 0 && (
              <span className="hidden sm:inline bg-[#0A1828]/80 border border-white/5 rounded-lg px-2.5 py-1">
                <span className="text-white">{lotsWithPoly.length}</span> mapeados
              </span>
            )}
            {lotsNoPrice.length > 0 && (
              <span className="bg-[#0A1828]/80 border border-white/5 rounded-lg px-2.5 py-1">
                <span className="text-amber-400">{lotsNoPrice.length}</span> sem preço
              </span>
            )}
          </div>
        )}

        {/* Legend — hidden on mobile when lot panel is open */}
        {!(isMobile && selectedLot && !showCart) && (
          <div className="absolute bottom-3 right-3 flex items-center gap-2 z-20">
            {(['DISPONIVEL', 'VENDIDO', 'NEGOCIACAO'] as const).map(k => (
              <div key={k} className="flex items-center gap-1 text-xs text-slate-400">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ background: STATUS[k].fill, border: `1px solid ${STATUS[k].stroke}` }}/>
                <span className="hidden sm:inline">{STATUS[k].label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#070E16]/60 z-50">
            <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"/>
          </div>
        )}

        {/* Lot info panel */}
        <AnimatePresence>
          {selectedLot && !showCart && (
            <LotInfoPanel
              lot={selectedLot}
              inCart={cartIds.has(selectedLot.id)}
              onAddToCart={() => addToCart(selectedLot)}
              onRemoveFromCart={() => removeFromCart(selectedLot.id)}
              onClose={() => setSelectedLot(null)}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Cart — sidebar on desktop, bottom sheet on mobile */}
      <AnimatePresence>
        {showCart && !isMobile && (
          <motion.div
            initial={{ width: 0, opacity: 0 }} animate={{ width: 300, opacity: 1 }} exit={{ width: 0, opacity: 0 }}
            className="border-l border-white/10 bg-[#0A1828] overflow-hidden flex-shrink-0"
          >
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <span className="text-sm font-semibold text-white">Proposta de Compra</span>
              <button onClick={() => setShowCart(false)} className="text-slate-500 hover:text-white">
                <X size={16}/>
              </button>
            </div>
            <div className="h-[calc(100%-49px)] overflow-hidden">
              <CartPanel
                cart={cart}
                whatsapp={whatsappPhone || WHATSAPP_NUMBER}
                onRemove={removeFromCart}
                onClear={() => setCart([])}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart — mobile bottom sheet */}
      <AnimatePresence>
        {showCart && isMobile && (
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-[#0A1828] border-t border-white/10 rounded-t-2xl z-[160] flex flex-col"
            style={{ maxHeight: '80vh', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-white/20"/>
            </div>
            <div className="flex items-center justify-between px-4 pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <ShoppingCart size={15} className="text-emerald-400"/>
                <span className="text-sm font-semibold text-white">Proposta de Compra</span>
              </div>
              <button onClick={() => setShowCart(false)} className="text-slate-500 hover:text-white p-1">
                <ChevronDown size={18}/>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <CartPanel
                cart={cart}
                whatsapp={whatsappPhone || WHATSAPP_NUMBER}
                onRemove={removeFromCart}
                onClear={() => setCart([])}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
