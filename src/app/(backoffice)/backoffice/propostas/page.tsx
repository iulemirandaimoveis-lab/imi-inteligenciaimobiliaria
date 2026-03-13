'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Plus, Search, Filter, Flame, Thermometer, Snowflake,
  Eye, Clock, ChevronRight, TrendingUp, FileText, Send,
  CheckCircle, XCircle, AlertTriangle
} from 'lucide-react'
import { T, cardStyle } from '@/app/(backoffice)/lib/theme'
import { SectionHeader } from '../../components/ui'
import { createClient } from '@/lib/supabase/client'

const fmt = (v: number) =>
  v ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v) : '—'

const fmtDate = (s: string) =>
  s ? new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(new Date(s)) : '—'

const STATUS_LABELS: Record<string, { label: string; bg: string; color: string }> = {
  draft:     { label: 'Rascunho',    bg: 'rgba(107,119,133,0.12)', color: '#6b7785' },
  sent:      { label: 'Enviada',     bg: 'rgba(96,165,250,0.12)',  color: '#60a5fa' },
  viewed:    { label: 'Visualizada', bg: 'rgba(167,139,250,0.12)', color: '#a78bfa' },
  countered: { label: 'Contraposta', bg: 'rgba(251,191,36,0.12)', color: '#fbbf24' },
  accepted:  { label: 'Aceita',      bg: 'rgba(52,211,153,0.12)', color: '#34d399' },
  rejected:  { label: 'Recusada',    bg: 'rgba(248,113,113,0.10)', color: '#f87171' },
  expired:   { label: 'Expirada',    bg: 'rgba(107,119,133,0.10)', color: '#6b7785' },
}

const ALL_STATUSES = ['all', 'draft', 'sent', 'viewed', 'countered', 'accepted', 'rejected']

export default function PropostasPage() {
  const router = useRouter()
  const supabase = createClient()
  const [proposals, setProposals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    supabase
      .from('v_proposals_with_score')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)
      .then(({ data }) => {
        if (data) setProposals(data)
        setLoading(false)
      })
  }, [])

  const filtered = proposals.filter(p => {
    const matchSearch = !search ||
      p.buyer_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.seller_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.buyer_email?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || p.status === statusFilter
    return matchSearch && matchStatus
  })

  // KPI aggregates
  const total = proposals.length
  const active = proposals.filter(p => ['sent', 'viewed', 'countered'].includes(p.status)).length
  const accepted = proposals.filter(p => p.status === 'accepted').length
  const totalValue = proposals.filter(p => p.status === 'accepted').reduce((sum, p) => sum + (p.proposed_value || 0), 0)

  return (
    <div style={{ minHeight: '100vh', background: T.bg, padding: '32px 24px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <SectionHeader
          title="Propostas Imobiliárias"
          action={{ label: '+ Nova Proposta', href: '/backoffice/propostas/nova' }}
        />

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Total', value: String(total), icon: FileText },
            { label: 'Em negociação', value: String(active), icon: TrendingUp, accent: true },
            { label: 'Aceitas', value: String(accepted), icon: CheckCircle },
            { label: 'Volume aceito', value: totalValue > 0 ? fmt(totalValue) : '—', icon: Send },
          ].map(({ label, value, icon: Icon, accent }) => (
            <div key={label} style={{ ...cardStyle, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: T.radius.sm, background: accent ? T.accentBg : T.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${accent ? T.borderGold : T.border}` }}>
                <Icon size={14} color={accent ? T.accent : T.textMuted} />
              </div>
              <div>
                <div style={{ fontSize: 10, color: T.textMuted, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: accent ? T.accent : T.text }}>{value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
            <Search size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: T.textMuted }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por comprador, e-mail..."
              style={{
                width: '100%', paddingLeft: 34, paddingRight: 12, paddingTop: 9, paddingBottom: 9,
                background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.radius.md,
                color: T.text, fontSize: 13, outline: 'none',
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {ALL_STATUSES.map(s => {
              const cfg = s === 'all' ? { label: 'Todas', bg: '', color: T.textMuted } : STATUS_LABELS[s]
              const active = statusFilter === s
              return (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  style={{
                    padding: '6px 12px', borderRadius: T.radius.sm, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                    border: `1px solid ${active ? T.accent : T.border}`,
                    background: active ? T.accentBg : 'transparent',
                    color: active ? T.accent : T.textMuted,
                  }}
                >
                  {cfg?.label ?? s}
                </button>
              )
            })}
          </div>
        </div>

        {/* Table */}
        <div style={{ ...cardStyle, overflow: 'hidden' }}>
          {/* Header */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 140px 130px 100px 80px 32px',
            padding: '10px 20px', borderBottom: `1px solid ${T.border}`,
            fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.textMuted
          }}>
            <span>Comprador / Imóvel</span>
            <span>Valor</span>
            <span>Status</span>
            <span>Score</span>
            <span>Data</span>
            <span />
          </div>

          {loading && (
            <div style={{ padding: '32px 20px', color: T.textMuted, fontSize: 13 }}>Carregando...</div>
          )}

          {!loading && filtered.length === 0 && (
            <div style={{ padding: '48px 20px', textAlign: 'center', color: T.textMuted, fontSize: 13 }}>
              {proposals.length === 0 ? (
                <div>
                  <FileText size={32} style={{ margin: '0 auto 12px', opacity: 0.3, display: 'block' }} />
                  <p>Nenhuma proposta ainda.</p>
                  <button
                    onClick={() => router.push('/backoffice/propostas/nova')}
                    style={{ marginTop: 12, padding: '8px 20px', background: T.accent, border: 'none', borderRadius: T.radius.md, color: '#000', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
                  >
                    Criar Primeira Proposta
                  </button>
                </div>
              ) : 'Nenhum resultado para o filtro atual.'}
            </div>
          )}

          {filtered.map((p, idx) => {
            const statusCfg = STATUS_LABELS[p.status] ?? STATUS_LABELS.draft
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.03 }}
                onClick={() => router.push(`/backoffice/propostas/${p.id}`)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 140px 130px 100px 80px 32px',
                  padding: '14px 20px',
                  borderBottom: `1px solid ${T.borderSubtle}`,
                  cursor: 'pointer',
                  transition: T.transition.fast,
                  alignItems: 'center',
                }}
                whileHover={{ background: T.hover }}
              >
                {/* Buyer */}
                <div>
                  <div style={{ fontSize: 13, color: T.text, fontWeight: 500 }}>{p.buyer_name}</div>
                  <div style={{ fontSize: 11, color: T.textMuted, marginTop: 1 }}>
                    {p.property_snapshot?.titulo || p.buyer_email || '—'}
                  </div>
                </div>

                {/* Value */}
                <div style={{ fontSize: 13, color: T.accent, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                  {fmt(p.proposed_value)}
                </div>

                {/* Status badge */}
                <div>
                  <span style={{
                    padding: '3px 10px', borderRadius: 999, fontSize: 10, fontWeight: 700,
                    letterSpacing: '0.06em', textTransform: 'uppercase',
                    background: statusCfg.bg, color: statusCfg.color,
                  }}>
                    {statusCfg.label}
                  </span>
                </div>

                {/* Score */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  {p.tier === 'hot' && <Flame size={13} color="#f87171" />}
                  {p.tier === 'warm' && <Thermometer size={13} color="#fbbf24" />}
                  {(!p.tier || p.tier === 'cold') && <Snowflake size={13} color="#60a5fa" />}
                  <span style={{ fontSize: 12, color: T.textMuted }}>{p.score ?? 0}</span>
                </div>

                {/* Date */}
                <div style={{ fontSize: 11, color: T.textMuted }}>{fmtDate(p.created_at)}</div>

                <ChevronRight size={14} color={T.textDim} />
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
