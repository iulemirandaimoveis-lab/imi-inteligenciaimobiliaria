'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  TrendingUp, Clock, Search, X, ChevronRight,
  AlertTriangle, LogIn,
} from 'lucide-react';

const BG    = '#05080F';
const NAVY  = '#0B1928';
const SURF  = '#0F2035';
const SURF2 = '#162840';
const T1    = '#E8E4DC';
const T2    = '#8E99AB';
const T3    = '#4F5B6B';
const GOLD  = '#C8A44A';
const BORD  = 'rgba(200,164,74,0.14)';

type LotsRow = {
  id: string; quadra: string; lot_number: number;
  status: string; price: number | null; area_m2: number | null;
}

type HistRow = {
  lot_id: string; new_status: string; changed_at: string;
  metadata: { broker_name?: string } | null;
}

function statusColor(s: string): string {
  switch (s.toUpperCase()) {
    case 'DISPONIVEL':   return '#4ADE80';
    case 'NEGOCIACAO':   return '#FBBF24';
    case 'RESERVADO':    return '#FB923C';
    case 'DOCUMENTACAO': return '#60A5FA';
    case 'VENDIDO':      return '#F87171';
    default:             return '#4F5B6B';
  }
}

function statusLabel(s: string): string {
  switch (s.toUpperCase()) {
    case 'DISPONIVEL':   return 'Disponível';
    case 'NEGOCIACAO':   return 'Negociação';
    case 'RESERVADO':    return 'Reservado';
    case 'DOCUMENTACAO': return 'Documentação';
    case 'VENDIDO':      return 'Vendido';
    case 'BLOQUEADO':    return 'Bloqueado';
    default:             return s;
  }
}

function fmt(n: number) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
}

export default function BrokerCRMPage() {
  const params = useParams();
  const router = useRouter();
  const lang = params.lang as string;
  const slug = params.slug as string;

  const [user,     setUser]     = useState<{ id: string } | null>(null);
  const [brokerName, setBrokerName] = useState('');
  const [lots,     setLots]     = useState<LotsRow[]>([]);
  const [history,  setHistory]  = useState<HistRow[]>([]);
  const [devId,    setDevId]    = useState('');
  const [devName,  setDevName]  = useState('');
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [filter,   setFilter]   = useState<'all' | 'negociacao' | 'reservado'>('all');

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (!u) { setLoading(false); return; }
      setUser(u);

      // Load development
      supabase.from('developments').select('id, title').eq('slug', slug).single()
        .then(({ data: dev }) => {
          if (!dev) { setLoading(false); return; }
          setDevId(dev.id);
          setDevName(dev.title);

          // Load lots in negotiation/reserved
          Promise.all([
            supabase.from('subdivision_lots')
              .select('id, quadra, lot_number, status, price, area_m2')
              .eq('development_id', dev.id)
              .in('status', ['NEGOCIACAO', 'RESERVADO', 'DOCUMENTACAO'])
              .order('quadra').order('lot_number'),
            supabase.from('lot_status_history')
              .select('lot_id, new_status, changed_at, metadata')
              .eq('development_id', dev.id)
              .order('changed_at', { ascending: false })
              .limit(200),
          ]).then(([{ data: l }, { data: h }]) => {
            setLots(l ?? []);
            setHistory(h ?? []);
            setLoading(false);
          });
        });
    });
  }, [slug]);

  // Derive broker name from most recent history for each lot
  const brokerByLot = React.useMemo(() => {
    const map: Record<string, string> = {};
    for (const h of history) {
      if (!map[h.lot_id] && h.metadata?.broker_name) {
        map[h.lot_id] = h.metadata.broker_name;
      }
    }
    return map;
  }, [history]);

  const filtered = lots.filter(l => {
    if (filter === 'negociacao' && l.status !== 'NEGOCIACAO') return false;
    if (filter === 'reservado'  && l.status !== 'RESERVADO')  return false;
    if (search) {
      const q = search.toLowerCase();
      return l.quadra.toLowerCase().includes(q) || String(l.lot_number).includes(q);
    }
    return true;
  });

  if (loading) return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: T2, fontSize: 13 }}>
        <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: `${GOLD} transparent transparent transparent` }} />
        Carregando…
      </div>
    </div>
  );

  if (!user) return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 }}>
      <LogIn size={40} style={{ color: T3 }} />
      <p style={{ color: T1, fontSize: 18, fontWeight: 600, textAlign: 'center' }}>
        Área exclusiva para corretores
      </p>
      <p style={{ color: T3, fontSize: 13, textAlign: 'center' }}>
        Faça login para acessar o painel de negociações.
      </p>
      <a
        href={`/${lang}/login?redirect=/${lang}/empreendimentos/${slug}/crm`}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '12px 24px', borderRadius: 12,
          background: 'rgba(200,164,74,0.12)',
          border: '1.5px solid rgba(200,164,74,0.35)',
          color: GOLD, fontSize: 13, fontWeight: 700, textDecoration: 'none',
          letterSpacing: '1px', textTransform: 'uppercase',
        }}
      >
        <LogIn size={14} /> Entrar
      </a>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: BG, color: T1 }}>

      {/* ── Header ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 20,
        background: 'rgba(5,8,15,0.96)', backdropFilter: 'blur(28px)',
        borderBottom: `1px solid ${BORD}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, height: 56, padding: '0 16px' }}>
          <a
            href={`/${lang}/empreendimentos/${slug}/mapa`}
            style={{ color: T3, textDecoration: 'none', fontSize: 20, lineHeight: 1 }}
            aria-label="Voltar ao mapa"
          >‹</a>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: T1, letterSpacing: '-0.2px' }}>Painel CRM</div>
            <div style={{ fontSize: 11, color: T3 }}>{devName}</div>
          </div>
          <a
            href={`/${lang}/empreendimentos/${slug}/dashboard`}
            style={{
              fontSize: 11, fontWeight: 700, color: GOLD,
              background: 'rgba(200,164,74,0.10)',
              border: `1px solid rgba(200,164,74,0.25)`,
              padding: '4px 12px', borderRadius: 8,
              letterSpacing: '1px', textTransform: 'uppercase',
              textDecoration: 'none',
            }}
          >
            Dashboard
          </a>
        </div>

        {/* Search */}
        <div style={{ padding: '0 16px 12px', display: 'flex', gap: 8 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: T3, pointerEvents: 'none' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar quadra ou lote…"
              style={{
                width: '100%', boxSizing: 'border-box', height: 36,
                background: SURF2, border: `1px solid ${BORD}`,
                borderRadius: 10, paddingLeft: 32, paddingRight: search ? 32 : 12,
                fontSize: 13, color: T1, outline: 'none',
              }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: T3, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Filter pills */}
        <div style={{ display: 'flex', gap: 6, padding: '0 16px 12px', overflowX: 'auto' }}>
          {[
            { key: 'all',        label: 'Todos',       color: GOLD      },
            { key: 'negociacao', label: 'Negociação',  color: '#FBBF24' },
            { key: 'reservado',  label: 'Reservados',  color: '#FB923C' },
          ].map(({ key, label, color }) => (
            <button
              key={key}
              onClick={() => setFilter(key as typeof filter)}
              style={{
                whiteSpace: 'nowrap', height: 30, padding: '0 12px',
                borderRadius: 20, fontSize: 10, fontWeight: 700,
                letterSpacing: '1px', textTransform: 'uppercase',
                cursor: 'pointer',
                background: filter === key ? 'rgba(200,164,74,0.08)' : 'transparent',
                color: filter === key ? color : T3,
                border: filter === key ? `1px solid ${color}44` : '1px solid rgba(255,255,255,0.08)',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Lot list ── */}
      <div style={{ padding: '12px 16px 120px' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: T3, fontSize: 13 }}>
            {search ? 'Nenhum lote encontrado.' : 'Nenhuma negociação ou reserva ativa.'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map(l => {
              const broker = brokerByLot[l.id];
              const color  = statusColor(l.status);
              return (
                <a
                  key={l.id}
                  href={`/${lang}/empreendimentos/${slug}/mapa#lote-${l.quadra}-${l.lot_number}`}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '14px 14px',
                    background: SURF,
                    border: `1px solid ${BORD}`,
                    borderLeft: `3px solid ${color}`,
                    borderRadius: 14,
                    textDecoration: 'none',
                    transition: 'border-color .15s',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: T1 }}>
                        Q{l.quadra} — Lote {l.lot_number}
                      </span>
                      <span style={{
                        fontSize: 9, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase',
                        padding: '2px 7px', borderRadius: 20, color,
                        background: `${color}18`,
                      }}>
                        {statusLabel(l.status)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 12, fontSize: 11, color: T3 }}>
                      {l.area_m2 && <span>{l.area_m2}m²</span>}
                      {l.price   && <span style={{ color: T2 }}>{fmt(l.price)}</span>}
                      {broker    && <span style={{ color: GOLD }}>· {broker}</span>}
                    </div>
                  </div>
                  <ChevronRight size={16} style={{ color: T3, shrink: 0 }} />
                </a>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Fixed bottom bar ── */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'rgba(5,8,15,0.97)', backdropFilter: 'blur(28px)',
        borderTop: `1px solid ${BORD}`,
        padding: '12px 16px',
        paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
        display: 'flex', gap: 10,
      }}>
        <a
          href={`/${lang}/empreendimentos/${slug}/mapa`}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 8, height: 46, borderRadius: 12,
            background: NAVY, border: `1.5px solid ${BORD}`,
            color: T1, fontSize: 12, fontWeight: 700,
            letterSpacing: '0.8px', textTransform: 'uppercase', textDecoration: 'none',
          }}
        >
          <TrendingUp size={15} /> Ver Mapa
        </a>
        <a
          href={`/${lang}/empreendimentos/${slug}/dashboard`}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 8, height: 46, borderRadius: 12,
            background: 'rgba(200,164,74,0.12)', border: `1.5px solid rgba(200,164,74,0.3)`,
            color: GOLD, fontSize: 12, fontWeight: 700,
            letterSpacing: '0.8px', textTransform: 'uppercase', textDecoration: 'none',
          }}
        >
          <Clock size={15} /> Dashboard
        </a>
      </div>
    </div>
  );
}
