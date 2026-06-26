'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { FileText, Plus, Search, TrendingUp, Clock, CheckCircle2, XCircle } from 'lucide-react'
import { tokens as T } from '../ui/tokens'
import { GlassCard, Eyebrow } from '../ui/primitives'
import { StatusBadge } from './StatusBadge'
import { PROPOSAL_STATUS_LABELS, formatBRL, type ProposalStatus } from '@/lib/imi-proposals/status'
import type { ProposalRow, ProposalsKpis } from './data'

const FILTERS: Array<{ key: 'all' | ProposalStatus; label: string }> = [
  { key: 'all', label: 'Todas' },
  { key: 'submitted', label: PROPOSAL_STATUS_LABELS.submitted },
  { key: 'under_review', label: PROPOSAL_STATUS_LABELS.under_review },
  { key: 'approved', label: PROPOSAL_STATUS_LABELS.approved },
  { key: 'rejected', label: PROPOSAL_STATUS_LABELS.rejected },
  { key: 'draft', label: PROPOSAL_STATUS_LABELS.draft },
]

function relativeDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function ProposalsListView({
  rows,
  kpis,
  canCreate,
}: {
  rows: ProposalRow[]
  kpis: ProposalsKpis
  canCreate: boolean
}) {
  const [filter, setFilter] = useState<'all' | ProposalStatus>('all')
  const [q, setQ] = useState('')

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    return rows.filter((r) => {
      if (filter !== 'all' && r.status !== filter) return false
      if (!term) return true
      return (
        r.clientName.toLowerCase().includes(term) ||
        (r.unitLabel ?? '').toLowerCase().includes(term) ||
        (r.loteamento ?? '').toLowerCase().includes(term) ||
        (r.projectName ?? '').toLowerCase().includes(term) ||
        (r.brokerName ?? '').toLowerCase().includes(term)
      )
    })
  }, [rows, filter, q])

  return (
    <div style={{ maxWidth: 1080, margin: '0 auto', padding: '28px 24px 64px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 22 }}>
        <div>
          <Eyebrow style={{ color: T.gold }}>Propostas</Eyebrow>
          <h1 style={{ fontFamily: T.fSerif, fontWeight: 500, fontSize: 30, color: T.t1, margin: '8px 0 4px' }}>
            Propostas de Compra
          </h1>
          <p style={{ fontFamily: T.fSans, fontSize: 13, color: T.t3, margin: 0 }}>
            Do papel ao digital — registre, acompanhe e aprove propostas em tempo real.
          </p>
        </div>
        {canCreate && (
          <Link
            href="/users/proposals/new"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              height: 44,
              padding: '0 18px',
              borderRadius: T.rMd,
              background: T.gold,
              color: '#1A1206',
              fontFamily: T.fSans,
              fontSize: 13,
              fontWeight: 600,
              textDecoration: 'none',
              boxShadow: `0 6px 20px ${T.goldGlow}`,
            }}
          >
            <Plus size={16} /> Nova proposta
          </Link>
        )}
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 22 }}>
        <Kpi icon={<FileText size={15} />} label="Total" value={String(kpis.total)} tone={T.t1} />
        <Kpi icon={<Clock size={15} />} label="Em aberto" value={String(kpis.open)} tone={T.amber} />
        <Kpi icon={<CheckCircle2 size={15} />} label="Aprovadas" value={String(kpis.approved)} tone={T.green} />
        <Kpi icon={<XCircle size={15} />} label="Rejeitadas" value={String(kpis.rejected)} tone={T.red} />
        <Kpi icon={<TrendingUp size={15} />} label="VGV aprovado" value={formatBRL(kpis.totalVgv)} tone={T.gold} />
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 4, padding: 3, borderRadius: T.rSm, background: 'rgba(255,255,255,0.03)', border: `1px solid ${T.glassBorder}`, flexWrap: 'wrap' }}>
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              style={{
                padding: '6px 11px',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                fontFamily: T.fSans,
                fontSize: 12,
                fontWeight: 600,
                color: filter === f.key ? '#1A1206' : T.t2,
                background: filter === f.key ? T.gold : 'transparent',
                transition: 'background 180ms, color 180ms',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={15} color={T.t3} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por cliente, unidade, empreendimento…"
            style={{
              width: '100%',
              height: 40,
              padding: '0 12px 0 36px',
              borderRadius: T.rSm,
              background: 'rgba(255,255,255,0.03)',
              border: `1px solid ${T.glassBorder}`,
              color: T.t1,
              fontFamily: T.fSans,
              fontSize: 13,
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* List */}
      <GlassCard padding={8}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {filtered.map((r, i) => (
            <ProposalRowItem key={r.id} row={r} last={i === filtered.length - 1} />
          ))}
          {filtered.length === 0 && (
            <div style={{ padding: '40px 20px', textAlign: 'center' }}>
              <FileText size={28} color={T.t4} style={{ margin: '0 auto 10px' }} />
              <p style={{ fontFamily: T.fSans, fontSize: 13, color: T.t3, margin: 0 }}>
                Nenhuma proposta encontrada.
              </p>
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  )
}

function Kpi({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone: string }) {
  return (
    <GlassCard padding={14}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: T.t3, marginBottom: 8 }}>
        <span style={{ color: tone, display: 'flex' }}>{icon}</span>
        <span style={{ fontFamily: T.fSans, fontSize: 11, fontWeight: 600, letterSpacing: '0.04em' }}>{label}</span>
      </div>
      <p style={{ fontFamily: T.fSans, fontWeight: 700, fontSize: 22, color: T.t1, margin: 0 }}>{value}</p>
    </GlassCard>
  )
}

function ProposalRowItem({ row, last }: { row: ProposalRow; last: boolean }) {
  return (
    <Link
      href={`/users/proposals/${row.id}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '14px 16px',
        borderBottom: last ? 'none' : `1px solid ${T.glassBorder}`,
        textDecoration: 'none',
        flexWrap: 'wrap',
        transition: `background ${T.dur} ${T.ease}`,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <p style={{ fontFamily: T.fSans, fontSize: 14, fontWeight: 600, color: T.t1, margin: 0 }}>{row.clientName}</p>
          {row.mock && (
            <span style={{ fontFamily: T.fMono, fontSize: 9.5, color: T.t4, border: `1px solid ${T.glassBorder}`, borderRadius: 4, padding: '1px 5px' }}>
              MOCK
            </span>
          )}
        </div>
        <p style={{ fontFamily: T.fSans, fontSize: 11.5, color: T.t3, margin: '3px 0 0' }}>
          {[row.unitLabel, row.loteamento || row.projectName, row.brokerName].filter(Boolean).join(' · ')}
        </p>
      </div>

      <div style={{ textAlign: 'right', minWidth: 100 }}>
        <p style={{ fontFamily: T.fSans, fontSize: 13.5, fontWeight: 600, color: T.t1, margin: 0 }}>{formatBRL(row.totalAmount)}</p>
        <p style={{ fontFamily: T.fSans, fontSize: 10.5, color: T.t4, margin: '2px 0 0' }}>{relativeDate(row.createdAt)}</p>
      </div>

      <StatusBadge status={row.status} />
    </Link>
  )
}
