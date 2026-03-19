'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Plus, Search, CheckCircle, Clock, AlertCircle,
  Scale, Mail, BookOpen, DollarSign, ChevronRight, TrendingUp, Brain
} from 'lucide-react'
import Link from 'next/link'
import { PageIntelHeader } from '@/app/(backoffice)/components/ui/PageIntelHeader'
import { KPICard } from '@/app/(backoffice)/components/ui/KPICard'
import { FilterTabs, FilterTab } from '@/app/(backoffice)/components/ui/FilterTabs'
import { StatusBadge } from '@/app/(backoffice)/components/ui/StatusBadge'
import { SectionHeader } from '@/app/(backoffice)/components/ui/SectionHeader'
import { Stepper } from '@/app/(backoffice)/components/ui/Stepper'
import type { Step } from '@/app/(backoffice)/components/ui/Stepper'
import { T } from '@/app/(backoffice)/lib/theme'
const STATUS_CFG: Record<string, { label: string; statusKey: string }> = {
  concluida:      { label: 'Concluída',     statusKey: 'done'   },
  em_andamento:   { label: 'Em Andamento',  statusKey: 'active' },
  aguardando_docs:{ label: 'Aguard. Docs',  statusKey: 'pend'   },
  cancelada:      { label: 'Cancelada',     statusKey: 'cancel' },
}
const HONOR_CFG: Record<string, { label: string; color: string }> = {
  pago:     { label: 'Pago',     color: 'var(--success)' },
  parcial:  { label: 'Parcial',  color: 'var(--warning)' },
  pendente: { label: 'Pendente', color: 'var(--warning)'  },
}
const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)
const QUICK_ACTIONS = [
  { label: 'Nova Avaliação',    href: '/backoffice/avaliacoes/nova',             icon: Plus      },
  { label: 'Email + Honorários',href: '/backoffice/avaliacoes/email-honorarios', icon: Mail      },
  { label: 'Exercícios NBR',    href: '/backoffice/avaliacoes/exercicios',       icon: BookOpen  },
  { label: 'Motor NBR 14653',   href: '/backoffice/avaliacoes/motor',            icon: Brain     },
]
export default function AvaliacoesPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState('todos')
  const [avaliacoes, setAvaliacoes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    async function fetchAvaliacoes() {
      try {
        const res = await fetch('/api/avaliacoes')
        if (!res.ok) throw new Error('Falha ao carregar')
        const result = await res.json()
        setAvaliacoes(result.data || [])
      } catch (err) {
        setAvaliacoes([])
      } finally {
        setLoading(false)
      }
    }
    fetchAvaliacoes()
  }, [])
  const honorariosPago = avaliacoes.filter(a => a.honorarios_status === 'pago').reduce((s, a) => s + (Number(a.honorarios) || 0), 0)
  const honorariosPendente = avaliacoes.filter(a => a.honorarios_status !== 'pago').reduce((s, a) => s + (Number(a.honorarios) || 0), 0)
  const emAndamento = avaliacoes.filter(a => a.status === 'em_andamento' || a.status === 'aguardando_docs').length
  const concluidas = avaliacoes.filter(a => a.status === 'concluida').length
  const filtered = avaliacoes.filter(a => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      (a.cliente_nome || '').toLowerCase().includes(q) ||
      (a.protocolo || '').toLowerCase().includes(q) ||
      (a.bairro || '').toLowerCase().includes(q)
    const matchTab = tab === 'todos' || a.status === tab
    return matchSearch && matchTab
  })
  const filterTabs: FilterTab[] = [
    { id: 'todos',          label: 'Todos',       count: avaliacoes.length },
    { id: 'em_andamento',   label: 'Andamento',   count: avaliacoes.filter(a => a.status === 'em_andamento').length,    dotColor: 'var(--warning)' },
    { id: 'aguardando_docs',label: 'Docs',         count: avaliacoes.filter(a => a.status === 'aguardando_docs').length, dotColor: 'var(--info)' },
    { id: 'concluida',      label: 'Concluídas',  count: avaliacoes.filter(a => a.status === 'concluida').length,        dotColor: 'var(--success)' },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <PageIntelHeader
          moduleLabel="AVALIAÇÕES NBR 14653"
          title="Avaliações"
          subtitle="Gestão de laudos e honorários"
          live
          actions={
            <button
              onClick={() => router.push('/backoffice/avaliacoes/nova')}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                height: '44px', padding: '0 20px', borderRadius: '6px',
                fontSize: '13px', fontWeight: 700, color: 'var(--text-inverse)',
                background: 'var(--imi-gold-500)',
                boxShadow: '0 4px 14px rgba(37,99,235,0.28)',
                border: 'none', cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              <Plus size={15} />
              Nova Avaliação
            </button>
          }
        />
      </motion.div>
      {/* KPI row */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.35 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
      >
        <KPICard label="Honorários Recebidos" value={loading ? '—' : fmt(honorariosPago)} sublabel="receita confirmada" icon={<DollarSign size={16} />} accent="green" />
        <KPICard label="A Receber" value={loading ? '—' : fmt(honorariosPendente)} sublabel="honorários pendentes" icon={<TrendingUp size={16} />} accent="warm" />
        <KPICard label="Em Andamento" value={loading ? '—' : String(emAndamento)} sublabel="laudos ativos" icon={<Clock size={16} />} accent="blue" />
        <KPICard label="Concluídas" value={loading ? '—' : String(concluidas)} sublabel="laudos entregues" icon={<CheckCircle size={16} />} accent="ai" />
      </motion.div>
      {/* Workflow Pipeline */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--r-xl, 4px)',
          padding: '16px 20px',
        }}
      >
        <div style={{ marginBottom: 12, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Pipeline de Avaliações
        </div>
        <Stepper
          currentStep={1}
          steps={[
            { id: 'solicitacao', label: 'Solicitação', description: 'Dados recebidos', status: 'done' },
            { id: 'vistoria', label: 'Vistoria', description: 'Visita ao imóvel', status: 'active' },
            { id: 'calculo', label: 'Cálculo', description: 'Metodologia NBR', status: 'pending' },
            { id: 'laudo', label: 'Laudo', description: 'Documento final', status: 'pending' },
            { id: 'entrega', label: 'Entrega', description: 'Honorários pagos', status: 'pending' },
          ]}
        />
      </motion.div>
      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12, duration: 0.3 }}
        style={{ display: 'flex', gap: '8px', overflowX: 'auto', scrollbarWidth: 'none', marginInline: '-4px', paddingInline: '4px', paddingBottom: '4px' }}
      >
        {QUICK_ACTIONS.map((a) => (
          <Link key={a.href} href={a.href} style={{ textDecoration: 'none', flexShrink: 0 }}>
            <div
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px 14px', borderRadius: '6px',
                background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
                cursor: 'pointer', transition: 'border-color 0.18s ease',
              }}
            >
              <div style={{
                width: '28px', height: '28px', borderRadius: '6px',
                background: 'rgba(184,148,58,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <a.icon size={13} color="var(--imi-gold-500)" />
              </div>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>{a.label}</span>
              <ChevronRight size={12} color="var(--text-tertiary)" />
            </div>
          </Link>
        ))}
      </motion.div>
      {/* Filter + Search */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.16, duration: 0.3 }}
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '6px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}
      >
        <div style={{ position: 'relative' }}>
          <Search size={13} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', pointerEvents: 'none' }} />
          <input
            type="text" placeholder="Buscar por cliente, protocolo, bairro..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', height: '38px', paddingLeft: '34px', paddingRight: '14px',
              borderRadius: '6px', fontSize: '13px', color: 'var(--text-primary)',
              background: 'var(--bg-muted)', border: '1px solid var(--border-default)',
              outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>
        <FilterTabs tabs={filterTabs} active={tab} onChange={setTab} />
      </motion.div>
      {/* Loading skeletons */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="animate-pulse" style={{
              background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
              borderRadius: '6px', padding: '14px',
              display: 'flex', alignItems: 'center', gap: '12px',
            }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '6px', background: 'var(--bg-elevated)', flexShrink: 0 }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ height: '11px', width: '40%', borderRadius: '6px', background: 'var(--bg-elevated)' }} />
                <div style={{ height: '13px', width: '65%', borderRadius: '6px', background: 'var(--bg-elevated)' }} />
                <div style={{ height: '11px', width: '50%', borderRadius: '6px', background: 'var(--bg-elevated)' }} />
              </div>
              <div style={{ width: '70px', display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
                <div style={{ height: '13px', width: '60px', borderRadius: '6px', background: 'var(--bg-elevated)' }} />
                <div style={{ height: '10px', width: '44px', borderRadius: '6px', background: 'var(--bg-elevated)' }} />
              </div>
            </div>
          ))}
        </div>
      )}
      {/* List */}
      {!loading && filtered.length > 0 && (
        <>
          <SectionHeader title="Avaliações" badge={filtered.length} />
          <div data-tour="avaliacoes-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filtered.map((av, i) => {
              const sc = STATUS_CFG[av.status] || STATUS_CFG.em_andamento
              const hc = HONOR_CFG[av.honorarios_status] || HONOR_CFG.pendente
              return (
                <motion.div
                  key={av.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => router.push(`/backoffice/avaliacoes/${av.id}`)}
                  style={{
                    background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
                    borderRadius: '6px', padding: '12px 14px',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px',
                    transition: 'border-color 0.18s ease',
                  }}
                >
                  {/* Status icon */}
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '6px', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: av.status === 'concluida' ? 'color-mix(in srgb, var(--success) 12%, transparent)' :
                      av.status === 'aguardando_docs' ? 'color-mix(in srgb, var(--info) 12%, transparent)' : 'color-mix(in srgb, var(--warning) 12%, transparent)',
                  }}>
                    {av.status === 'concluida'
                      ? <CheckCircle size={18} color="var(--success)" />
                      : av.status === 'aguardando_docs'
                      ? <AlertCircle size={18} color="var(--info)" />
                      : <Clock size={18} color="var(--warning)" />
                    }
                  </div>
                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                      <span style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-tertiary)' }}>
                        {av.protocolo || '—'}
                      </span>
                      <StatusBadge status={sc.statusKey} label={sc.label} size="xs" />
                    </div>
                    <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {av.cliente_nome || '—'}
                    </p>
                    <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {[av.tipo_imovel, av.bairro, av.area_privativa ? `${av.area_privativa}m²` : null, av.metodologia].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  {/* Value */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    {av.honorarios && (
                      <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--imi-gold-500)', marginBottom: '3px', fontVariantNumeric: 'tabular-nums' }}>
                        {fmt(Number(av.honorarios))}
                      </p>
                    )}
                    <span style={{
                      fontSize: '11px', fontWeight: 700, padding: '2px 7px', borderRadius: '6px',
                      background: `${hc.color}18`, color: hc.color,
                    }}>{hc.label}</span>
                    {av.valor_estimado && (
                      <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px', fontVariantNumeric: 'tabular-nums' }}>
                        Vlr: {fmt(Number(av.valor_estimado))}
                      </p>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </>
      )}
      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
            borderRadius: '6px', padding: '48px 24px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', textAlign: 'center',
          }}
        >
          <Scale size={32} color="var(--text-tertiary)" />
          <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>Nenhuma avaliação encontrada</p>
          <p style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>
            {search ? 'Tente buscar com outros termos' : 'Comece criando uma nova avaliação NBR 14653.'}
          </p>
          {!search && (
            <button
              onClick={() => router.push('/backoffice/avaliacoes/nova')}
              style={{
                marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px',
                height: '44px', padding: '0 20px', borderRadius: '6px',
                fontSize: '13px', fontWeight: 700, color: 'var(--text-inverse)',
                background: 'var(--imi-gold-500)',
                boxShadow: '0 4px 14px rgba(37,99,235,0.22)',
                border: 'none', cursor: 'pointer',
              }}
            >
              <Plus size={15} />Nova Avaliação
            </button>
          )}
        </motion.div>
      )}
    </div>
  )
}
