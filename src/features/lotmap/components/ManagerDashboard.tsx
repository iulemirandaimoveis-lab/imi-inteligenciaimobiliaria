'use client';

import React, { useEffect, useState } from 'react';
import { TrendingUp, Users, Clock, AlertTriangle, MapPin, BarChart3 } from 'lucide-react';

const GOLD  = '#C8A44A';
const NAVY  = '#0B1928';
const T1    = '#E8E4DC';
const T2    = '#8E99AB';
const T3    = '#4F5B6B';
const SURF  = 'rgba(13,27,46,0.85)';
const BORD  = 'rgba(200,164,74,0.14)';

function fmt(n: number) {
  if (n >= 1_000_000) return `R$ ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `R$ ${(n / 1_000).toFixed(0)}K`;
  return `R$ ${n.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`;
}

function fmtDate(s: string) {
  const d = new Date(s);
  const now = new Date();
  const diff = Math.round((d.getTime() - now.getTime()) / 3600000);
  if (diff < 0)  return 'VENCIDA';
  if (diff < 24) return `${diff}h`;
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

interface DashboardStats {
  total: number;
  byStatus: Record<string, number>;
  vgv: { total: number; sold: number; available: number; negotiation: number; reserved: number };
  topQuadras: Array<{ quadra: string; negotiation: number; available: number; sold: number }>;
  expiring: Array<{ id: string; client_name: string; broker_name: string; expires_at: string }>;
  lotsByBroker: Array<{ name: string; negotiation: number; reservation: number; sale: number }>;
}

interface ManagerDashboardProps {
  developmentId: string;
  developmentName: string;
}

function StatCard({ label, value, color, sub }: { label: string; value: string | number; color?: string; sub?: string }) {
  return (
    <div className="rounded-2xl p-4 flex flex-col gap-1" style={{ background: SURF, border: `1px solid ${BORD}` }}>
      <p className="text-[9px] uppercase tracking-[0.18em] font-bold" style={{ color: T3 }}>{label}</p>
      <p className="text-2xl font-black leading-none" style={{ color: color ?? T1, fontFamily: 'var(--font-mono, monospace)' }}>
        {value}
      </p>
      {sub && <p className="text-[10px]" style={{ color: T3 }}>{sub}</p>}
    </div>
  );
}

export default function ManagerDashboard({ developmentId, developmentName }: ManagerDashboardProps) {
  const [data,    setData]    = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/lotmap/dashboard/${developmentId}`)
      .then(r => { if (!r.ok) throw new Error('Acesso negado.'); return r.json(); })
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [developmentId]);

  if (loading) return (
    <div className="flex items-center justify-center py-20" style={{ color: T3 }}>
      <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin mr-3" style={{ borderColor: `${GOLD} transparent transparent transparent` }} />
      Carregando dashboard…
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center py-20 gap-2 text-sm" style={{ color: '#F87171' }}>
      <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
    </div>
  );

  if (!data) return null;

  const s = data.byStatus;
  const available   = s['DISPONIVEL']  ?? 0;
  const negotiation = s['NEGOCIACAO']  ?? 0;
  const reserved    = s['RESERVADO']   ?? 0;
  const sold        = s['VENDIDO']     ?? 0;
  const docs        = s['DOCUMENTACAO']?? 0;
  const blocked     = s['BLOQUEADO']   ?? 0;

  const soldPct = data.total > 0 ? Math.round((sold / data.total) * 100) : 0;

  return (
    <div style={{ color: T1, fontFamily: 'var(--font-ui, system-ui, sans-serif)' }}>

      {/* ── Header ── */}
      <div className="mb-6">
        <p className="text-[10px] uppercase tracking-[0.2em] font-bold mb-1" style={{ color: T3 }}>Dashboard · Gestor</p>
        <h1 className="text-2xl font-semibold" style={{ letterSpacing: '-0.02em', color: T1 }}>{developmentName}</h1>
      </div>

      {/* ── VGV Cards ── */}
      <div className="mb-5">
        <p className="text-[9px] uppercase tracking-[0.2em] font-bold mb-2.5 flex items-center gap-1.5" style={{ color: GOLD }}>
          <BarChart3 className="w-3 h-3" /> VGV do Empreendimento
        </p>
        <div className="grid grid-cols-2 gap-2">
          <StatCard label="VGV Total"         value={fmt(data.vgv.total)}       sub={`${data.total} lotes`} />
          <StatCard label="VGV Vendido"       value={fmt(data.vgv.sold)}        color="#4ADE80" sub={`${soldPct}% do total`} />
          <StatCard label="VGV Disponível"    value={fmt(data.vgv.available)}   color={GOLD} />
          <StatCard label="VGV em Negociação" value={fmt(data.vgv.negotiation)} color="#FBBF24" />
        </div>
      </div>

      {/* ── Status distribution ── */}
      <div className="mb-5 rounded-2xl p-4" style={{ background: SURF, border: `1px solid ${BORD}` }}>
        <p className="text-[9px] uppercase tracking-[0.2em] font-bold mb-3" style={{ color: T3 }}>Distribuição por Status</p>
        <div className="space-y-2">
          {[
            { label: 'Disponíveis',   count: available,   color: '#4ADE80', total: data.total },
            { label: 'Negociação',    count: negotiation, color: '#FBBF24', total: data.total },
            { label: 'Reservados',    count: reserved,    color: '#FB923C', total: data.total },
            { label: 'Documentação',  count: docs,        color: '#60A5FA', total: data.total },
            { label: 'Vendidos',      count: sold,        color: '#F87171', total: data.total },
            { label: 'Bloqueados',    count: blocked,     color: '#94A3B8', total: data.total },
          ].map(({ label, count, color, total }) => (
            <div key={label} className="flex items-center gap-2">
              <span className="text-[10px] font-medium shrink-0" style={{ width: 96, color: T2 }}>{label}</span>
              <div className="flex-1 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${total > 0 ? (count / total) * 100 : 0}%`, background: color }}
                />
              </div>
              <span className="text-[10px] font-black shrink-0 tabular-nums" style={{ width: 28, textAlign: 'right', color, fontFamily: 'var(--font-mono, monospace)' }}>
                {count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Expiring reservations ── */}
      {data.expiring.length > 0 && (
        <div className="mb-5 rounded-2xl p-4" style={{ background: 'rgba(251,146,60,0.06)', border: '1px solid rgba(251,146,60,0.18)' }}>
          <p className="text-[9px] uppercase tracking-[0.2em] font-bold mb-3 flex items-center gap-1.5" style={{ color: '#FB923C' }}>
            <Clock className="w-3 h-3" /> Reservas Vencendo (48h)
          </p>
          <div className="space-y-2">
            {data.expiring.map(r => (
              <div key={r.id} className="flex items-center justify-between py-1.5 border-b" style={{ borderColor: 'rgba(251,146,60,0.12)' }}>
                <div>
                  <p className="text-[11px] font-semibold" style={{ color: T1 }}>{r.client_name || 'Cliente —'}</p>
                  <p className="text-[10px]" style={{ color: T3 }}>{r.broker_name || 'Corretor —'}</p>
                </div>
                <span
                  className="text-[10px] font-black px-2 py-1 rounded-lg"
                  style={{
                    background: fmtDate(r.expires_at) === 'VENCIDA' ? 'rgba(248,113,113,0.15)' : 'rgba(251,146,60,0.15)',
                    color:      fmtDate(r.expires_at) === 'VENCIDA' ? '#F87171' : '#FB923C',
                    fontFamily: 'var(--font-mono, monospace)',
                  }}
                >
                  {fmtDate(r.expires_at)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Broker ranking ── */}
      {data.lotsByBroker.length > 0 && (
        <div className="mb-5 rounded-2xl p-4" style={{ background: SURF, border: `1px solid ${BORD}` }}>
          <p className="text-[9px] uppercase tracking-[0.2em] font-bold mb-3 flex items-center gap-1.5" style={{ color: GOLD }}>
            <Users className="w-3 h-3" /> Ranking de Corretores (30 dias)
          </p>
          <div className="space-y-2">
            {data.lotsByBroker.map((b, i) => (
              <div key={b.name} className="flex items-center gap-3 py-1">
                <span className="text-[10px] font-black shrink-0" style={{ width: 18, color: i === 0 ? GOLD : T3, fontFamily: 'var(--font-mono, monospace)' }}>
                  {i + 1}
                </span>
                <span className="flex-1 text-[11px] font-medium truncate" style={{ color: T1 }}>{b.name}</span>
                <div className="flex items-center gap-1.5 shrink-0">
                  {b.negotiation > 0 && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: 'rgba(251,191,36,0.12)', color: '#FBBF24' }}>
                      {b.negotiation} neg
                    </span>
                  )}
                  {b.reservation > 0 && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: 'rgba(251,146,60,0.12)', color: '#FB923C' }}>
                      {b.reservation} res
                    </span>
                  )}
                  {b.sale > 0 && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: 'rgba(74,222,128,0.12)', color: '#4ADE80' }}>
                      {b.sale} vnd
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Top quadras ── */}
      {data.topQuadras.length > 0 && (
        <div className="rounded-2xl p-4" style={{ background: SURF, border: `1px solid ${BORD}` }}>
          <p className="text-[9px] uppercase tracking-[0.2em] font-bold mb-3 flex items-center gap-1.5" style={{ color: GOLD }}>
            <MapPin className="w-3 h-3" /> Quadras por Atividade
          </p>
          <div className="grid grid-cols-2 gap-2">
            {data.topQuadras.map(q => (
              <div key={q.quadra} className="rounded-xl p-2.5" style={{ background: NAVY, border: `1px solid rgba(255,255,255,0.05)` }}>
                <p className="text-base font-black mb-1" style={{ color: GOLD, fontFamily: 'var(--font-mono, monospace)' }}>Q{q.quadra}</p>
                <div className="space-y-0.5">
                  {q.negotiation > 0 && <p className="text-[10px]" style={{ color: '#FBBF24' }}>{q.negotiation} neg</p>}
                  {q.available   > 0 && <p className="text-[10px]" style={{ color: '#4ADE80' }}>{q.available} disp</p>}
                  {q.sold        > 0 && <p className="text-[10px]" style={{ color: '#F87171' }}>{q.sold} vnd</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
