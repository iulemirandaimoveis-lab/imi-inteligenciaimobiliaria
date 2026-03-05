'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Plus, Search, CheckCircle, Clock, AlertCircle,
  Scale, Mail, BookOpen, DollarSign, ChevronRight, TrendingUp
} from 'lucide-react'
import Link from 'next/link'
import { PageIntelHeader } from '@/app/(backoffice)/components/ui/PageIntelHeader'
import { KPICard } from '@/app/(backoffice)/components/ui/KPICard'
import { FilterTabs, FilterTab } from '@/app/(backoffice)/components/ui/FilterTabs'
import { StatusBadge } from '@/app/(backoffice)/components/ui/StatusBadge'
import { SectionHeader } from '@/app/(backoffice)/components/ui/SectionHeader'

const STATUS_CFG: Record<string, { label: string; statusKey: string }> = {
  concluida:      { label: 'Concluída',     statusKey: 'done'   },
  em_andamento:   { label: 'Em Andamento',  statusKey: 'active' },
  aguardando_docs:{ label: 'Aguard. Docs',  statusKey: 'pend'   },
  cancelada:      { label: 'Cancelada',     statusKey: 'cancel' },
}

const HONOR_CFG: Record<string, { label: string; color: string }> = {
  pago:     { label: 'Pago',     color: 'var(--s-done)' },
  parcial:  { label: 'Parcial',  color: 'var(--s-warm)' },
  pendente: { label: 'Pendente', color: 'var(--s-warm)'  },
}

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)

const QUICK_ACTIONS = [
  { label: 'Nova Avaliação',    href: '/backoffice/avaliacoes/nova',             icon: Plus      },
  { label: 'Email + Honorários',href: '/backoffice/avaliacoes/email-honorarios', icon: Mail      },
  { label: 'Exercícios NBR',    href: '/backoffice/avaliacoes/exercicios',       icon: BookOpen  },
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
        console.error('Erro ao buscar avaliações:', err)
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
    { id: 'em_andamento',   label: 'Andamento',   count: avaliacoes.filter(a => a.status === 'em_andamento').length,    dotColor: 'var(--s-warm)' },
    { id: 'aguardando_docs',label: 'Docs',         count: avaliacoes.filter(a => a.status === 'aguardando_docs').length, dotColor: 'var(--s-cold)' },
    { id: 'concluida',      label: 'Concluídas',  count: avaliacoes.filter(a => a.status === 'concluida').length,        dotColor: 'var(--s-done)' },
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
                height: '38px', padding: '0 18px', borderRadius: '12px',
                fontSize: '13px', fontWeight: 700, color: '#fff',
                background: 'linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)',
                border: 'none', cursor: 'pointer',
                boxShadow: '0 0 18px rgba(59,130,246,0.35)', flexShrink: 0,
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
        style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}
      >
        <div style={{ flexShrink: 0, minWidth: '140px', flex: '1 1 0' }}>
          <KPICard label="Honorários Recebidos" value={loading ? '—' : fmt(honorariosPago)} sublabel="receita confirmada" icon={<DollarSign size={16} />} accent="green" />
        </div>
        <div style={{ flexShrink: 0, minWidth: '140px', flex: '1 1 0' }}>
          <KPICard label="A Receber" value={loading ? '—' : fmt(honorariosPendente)} sublabel="honorários pendentes" icon={<TrendingUp size={16} />} accent="warm" />
        </div>
        <div style={{ flexShrink: 0, minWidth: '120px', flex: '1 1 0' }}>
          <KPICard label="Em Andamento" value={loading ? '—' : String(emAndamento)} sublabel="laudos ativos" icon={<Clock size={16} />} accent="blue" />
        </div>
        <div style={{ flexShrink: 0, minWidth: '120px', flex: '1 1 0' }}>
          <KPICard label="Concluídas" value={loading ? '—' : String(concluidas)} sublabel="laudos entregues" icon={<CheckCircle size={16} />} accent="ai" />
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12, duration: 0.3 }}
        style={{ display: 'flex', gap: '10px', overflowX: 'auto', scrollbarWidth: 'none' }}
      >
        {QUICK_ACTIONS.map((a) => (
          <Link key={a.href} href={a.href} style={{ textDecoration: 'none', flexShrink: 0 }}>
            <div
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px 14px', borderRadius: '12px',
                background: 'var(--bo-card)', border: '1px solid var(--bo-border)',
                cursor: 'pointer', transition: 'border-color 0.18s ease',
              }}
            >
              <div style={{
                width: '28px', height: '28px', borderRadius: '8px',
                background: 'var(--imi-blue-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <a.icon size={13} color="var(--imi-blue-bright)" />
              </div>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--bo-text)', whiteSpace: 'nowrap' }}>{a.label}</span>
              <ChevronRight size={12} color="var(--bo-text-muted)" />
            </div>
          </Link>
        ))}
      </motion.div>

      {/* Filter + Search */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.16, duration: 0.3 }}
        style={{ background: 'var(--bo-card)', border: '1px solid var(--bo-border)', borderRadius: '16px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}
      >
        <div style={{ position: 'relative' }}>
          <Search size={13} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--bo-text-muted)', pointerEvents: 'none' }} />
          <input
            type="text" placeholder="Buscar por cliente, protocolo, bairro..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', height: '38px', paddingLeft: '34px', paddingRight: '14px',
              borderRadius: '10px', fontSize: '13px', color: 'var(--bo-text)',
              background: 'var(--bo-surface)', border: '1px solid var(--bo-border)',
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
            <div key={i} style={{
              background: 'var(--bo-card)', border: '1px solid var(--bo-border)',
              borderRadius: '14px', height: '80px', animation: 'pulse 1.5s ease-in-out infinite',
            }} />
          ))}
        </div>
      )}

      {/* List */}
      {!loading && filtered.length > 0 && (
        <>
          <SectionHeader title="Avaliações" badge={filtered.length} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
                    background: 'var(--bo-card)', border: '1px solid var(--bo-border)',
                    borderRadius: '14px', padding: '12px 14px',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px',
                    transition: 'border-color 0.18s ease',
                  }}
                >
                  {/* Status icon */}
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '12px', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: av.status === 'concluida' ? 'var(--s-done-bg)' :
                      av.status === 'aguardando_docs' ? 'var(--s-cold-bg)' : 'var(--s-warm-bg)',
                  }}>
                    {av.status === 'concluida'
                      ? <CheckCircle size={18} color="var(--s-done)" />
                      : av.status === 'aguardando_docs'
                      ? <AlertCircle size={18} color="var(--s-cold)" />
                      : <Clock size={18} color="var(--s-warm)" />
                    }
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                      <span style={{ fontSize: '10px', fontFamily: 'monospace', color: 'var(--bo-text-muted)' }}>
                        {av.protocolo || '—'}
                      </span>
                      <StatusBadge status={sc.statusKey} label={sc.label} size="xs" />
                    </div>
                    <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--bo-text)', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {av.cliente_nome || '—'}
                    </p>
                    <p style={{ fontSize: '11px', color: 'var(--bo-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {[av.tipo_imovel, av.bairro, av.area_privativa ? `${av.area_privativa}m²` : null, av.metodologia].filter(Boolean).join(' · ')}
                    </p>
                  </div>

                  {/* Value */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    {av.honorarios && (
                      <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--imi-blue-bright)', marginBottom: '3px' }}>
                        {fmt(Number(av.honorarios))}
                      </p>
                    )}
                    <span style={{ fontSize: '10px', fontWeight: 600, color: hc.color }}>{hc.label}</span>
                    {av.valor_estimado && (
                      <p style={{ fontSize: '10px', color: 'var(--bo-text-muted)', marginTop: '2px' }}>
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
            background: 'var(--bo-card)', border: '1px solid var(--bo-border)',
            borderRadius: '16px', padding: '48px 24px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', textAlign: 'center',
          }}
        >
          <Scale size={32} color="var(--bo-text-muted)" />
          <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--bo-text)' }}>Nenhuma avaliação encontrada</p>
          <p style={{ fontSize: '13px', color: 'var(--bo-text-muted)' }}>
            {search ? 'Tente buscar com outros termos' : 'Comece criando uma nova avaliação NBR 14653.'}
          </p>
          {!search && (
            <button
              onClick={() => router.push('/backoffice/avaliacoes/nova')}
              style={{
                marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px',
                height: '38px', padding: '0 18px', borderRadius: '12px',
                fontSize: '13px', fontWeight: 700, color: '#fff',
                background: 'linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)',
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
