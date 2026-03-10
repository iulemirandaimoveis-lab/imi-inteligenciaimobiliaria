'use client'

import { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search, Plus, TrendingUp, DollarSign, Users,
  MousePointer, Target, BarChart3,
  Instagram, Facebook, Globe, Mail, MessageSquare, Zap,
  RefreshCw, CheckCircle2, AlertCircle, Wifi,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import useSWR from 'swr'
import { createClient } from '@/lib/supabase/client'
import { PageIntelHeader } from '@/app/(backoffice)/components/ui/PageIntelHeader'
import { KPICard } from '@/app/(backoffice)/components/ui/KPICard'
import { FilterTabs, FilterTab } from '@/app/(backoffice)/components/ui/FilterTabs'
import { SectionHeader } from '@/app/(backoffice)/components/ui/SectionHeader'
import { MetricBar } from '@/app/(backoffice)/components/ui/MetricBar'
import { StatusBadge } from '@/app/(backoffice)/components/ui/StatusBadge'

const T = {
    surface: 'var(--bo-surface)', elevated: 'var(--bo-elevated)',
    border: 'var(--bo-border)', borderGold: 'var(--bo-border-gold)',
    text: 'var(--bo-text)', textSub: 'var(--bo-text-muted)',
    gold: 'var(--bo-accent)',
}

const supabase = createClient()

export interface Campaign {
  id: string
  name: string
  objective: string | null
  channel: string
  status: string
  start_date: string | null
  end_date: string | null
  budget: number | null
  daily_budget: number | null
  spent: number
  impressions: number
  clicks: number
  leads: number
  conversions: number
  cost_per_lead: number | null
  ctr: number
  roi: number | null
  utm_source: string | null
  utm_campaign: string | null
  created_at: string
}

function useMetaStatus() {
  return useSWR('meta-ads-status', async () => {
    const res = await fetch('/api/meta-ads')
    const data = await res.json()
    return data as { connected: boolean; count?: number; error?: string }
  }, { revalidateOnFocus: false })
}

function useCampanhas(filters: { search?: string; status?: string; type?: string }) {
  return useSWR(['campanhas', filters], async () => {
    let query = supabase
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false })

    if (filters.search) query = query.ilike('name', `%${filters.search}%`)
    if (filters.status && filters.status !== 'all') query = query.eq('status', filters.status)
    if (filters.type && filters.type !== 'all') query = query.eq('channel', filters.type)

    const { data, error } = await query
    if (error) throw error
    return (data || []) as Campaign[]
  })
}

const CHANNEL_MAP: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  google: { label: 'Google Ads', icon: Globe, color: '#3B82F6' },
  facebook: { label: 'Facebook', icon: Facebook, color: '#6366F1' },
  instagram: { label: 'Instagram', icon: Instagram, color: '#F472B6' },
  email: { label: 'Email', icon: Mail, color: '#22D3EE' },
  whatsapp: { label: 'WhatsApp', icon: MessageSquare, color: '#4ADE80' },
  site: { label: 'Site', icon: Globe, color: '#34D399' },
  // Legacy keys for backward compat
  google_ads: { label: 'Google Ads', icon: Globe, color: '#3B82F6' },
  organic: { label: 'Orgânico', icon: TrendingUp, color: '#34D399' },
  referral: { label: 'Indicação', icon: Users, color: '#A78BFA' },
  other: { label: 'Outro', icon: BarChart3, color: '#8B949E' },
}

const STATUS_MAP: Record<string, { label: string; statusKey: string }> = {
  active: { label: 'Ativa', statusKey: 'active' },
  paused: { label: 'Pausada', statusKey: 'pend' },
  completed: { label: 'Concluída', statusKey: 'done' },
  draft: { label: 'Rascunho', statusKey: 'draft' },
  archived: { label: 'Arquivada', statusKey: 'cancel' },
}

const formatBRL = (v: number | null | undefined): string => {
  if (v == null) return '—'
  if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `R$ ${(v / 1_000).toFixed(1)}k`
  return `R$ ${v.toFixed(0)}`
}

const fmtNum = (v: number | null | undefined): string => {
  if (v == null) return '—'
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}k`
  return String(v)
}

function ChannelBadge({ channel }: { channel: string }) {
  const cfg = CHANNEL_MAP[channel] ?? CHANNEL_MAP.other
  const Icon = cfg.icon
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      fontSize: '10px', fontWeight: 700,
      color: cfg.color, background: `${cfg.color}15`,
      border: `1px solid ${cfg.color}30`,
      borderRadius: '8px', padding: '2px 8px',
    }}>
      <Icon size={10} />
      {cfg.label}
    </span>
  )
}

function CampaignCard({ c, index, onClick }: { c: Campaign; index: number; onClick: () => void }) {
  const budgetPct = c.budget ? Math.min(100, Math.round((c.spent / c.budget) * 100)) : 0
  const convPct = c.leads ? Math.min(100, Math.round((c.conversions / c.leads) * 100)) : 0
  const statusCfg = STATUS_MAP[c.status] ?? STATUS_MAP.draft
  const budgetColor = budgetPct >= 90 ? 'var(--s-hot)' : budgetPct >= 70 ? 'var(--s-warm)' : 'var(--imi-blue-bright)'

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.35, ease: 'easeOut' }}
      onClick={onClick}
      style={{
        background: 'var(--bo-card)', border: '1px solid var(--bo-border)',
        borderRadius: '16px', padding: '14px', cursor: 'pointer',
        transition: 'border-color 0.18s ease',
      }}
      whileHover={{ borderColor: 'rgba(59,130,246,0.35)', y: -2 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontSize: '13px', fontWeight: 700, color: 'var(--bo-text)',
            marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{c.name}</p>
          <ChannelBadge channel={c.channel} />
        </div>
        <StatusBadge status={statusCfg.statusKey} label={statusCfg.label} size="xs" dot />
      </div>

      <div style={{ marginBottom: '10px' }}>
        <MetricBar label="Orçamento utilizado" value={budgetPct} valueLabel={`${formatBRL(c.spent)} / ${formatBRL(c.budget)}`} color={budgetColor} />
      </div>
      <div style={{ marginBottom: '12px' }}>
        <MetricBar label="Taxa de conversão" value={convPct} valueLabel={`${convPct}%`} color="var(--s-done)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px', paddingTop: '10px', borderTop: '1px solid var(--bo-border)' }}>
        {[
          { label: 'Leads', value: fmtNum(c.leads), Icon: Users },
          { label: 'Cliques', value: fmtNum(c.clicks), Icon: MousePointer },
          { label: 'CAC', value: formatBRL(c.cost_per_lead), Icon: DollarSign },
        ].map(({ label, value, Icon }) => (
          <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'center' }}>
            <Icon size={12} color="var(--bo-text-muted)" />
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--bo-text)' }}>{value}</span>
            <span style={{ fontSize: '9px', color: 'var(--bo-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

export default function CampanhasPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<{ success?: boolean; synced?: number; error?: string } | null>(null)

  const { data: metaStatus } = useMetaStatus()
  const { data: campanhas, isLoading, mutate: refetch } = useCampanhas({ search, status: statusFilter, type: typeFilter })

  const syncMeta = useCallback(async () => {
    setSyncing(true)
    setSyncResult(null)
    try {
      const res = await fetch('/api/meta-ads', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro na sincronização')
      setSyncResult({ success: true, synced: data.synced })
      refetch()
    } catch (err) {
      setSyncResult({ success: false, error: err instanceof Error ? err.message : 'Erro' })
    } finally {
      setSyncing(false)
      setTimeout(() => setSyncResult(null), 5000)
    }
  }, [refetch])

  const totalBudget = campanhas?.reduce((s, c) => s + (c.budget || 0), 0) ?? 0
  const totalSpent = campanhas?.reduce((s, c) => s + (c.spent || 0), 0) ?? 0
  const totalLeads = campanhas?.reduce((s, c) => s + (c.leads || 0), 0) ?? 0
  const totalConversions = campanhas?.reduce((s, c) => s + (c.conversions || 0), 0) ?? 0
  const convPct = totalLeads ? Math.round((totalConversions / totalLeads) * 100) : 0
  const avgCAC = totalConversions ? Math.round(totalSpent / totalConversions) : null

  const channelPerf = useMemo(() => {
    if (!campanhas?.length) return []
    const map: Record<string, { leads: number; spent: number; label: string }> = {}
    for (const c of campanhas) {
      const cfg = CHANNEL_MAP[c.channel] ?? CHANNEL_MAP.other
      if (!map[c.channel]) map[c.channel] = { leads: 0, spent: 0, label: cfg.label }
      map[c.channel].leads += c.leads || 0
      map[c.channel].spent += c.spent || 0
    }
    const entries = Object.entries(map).sort((a, b) => b[1].leads - a[1].leads)
    const maxLeads = entries[0]?.[1]?.leads || 1
    return entries.map(([ch, d]) => ({
      channel: ch, label: d.label,
      color: CHANNEL_MAP[ch]?.color ?? '#8B949E',
      leadsValue: d.leads,
      leadsPct: Math.round((d.leads / maxLeads) * 100),
      spent: d.spent,
    }))
  }, [campanhas])

  const statusTabs: FilterTab[] = [
    { id: 'all', label: 'Todas', count: campanhas?.length },
    { id: 'active', label: 'Ativas', count: campanhas?.filter(c => c.status === 'active').length, dotColor: 'var(--s-done)' },
    { id: 'paused', label: 'Pausadas', count: campanhas?.filter(c => c.status === 'paused').length, dotColor: 'var(--s-warm)' },
    { id: 'completed', label: 'Concluídas', count: campanhas?.filter(c => c.status === 'completed').length, dotColor: 'var(--s-cold)' },
    { id: 'draft', label: 'Rascunho', count: campanhas?.filter(c => c.status === 'draft').length },
  ]

  const typeTabs: FilterTab[] = [
    { id: 'all', label: 'Todos os canais' },
    { id: 'instagram', label: 'Instagram' },
    { id: 'facebook', label: 'Facebook' },
    { id: 'google', label: 'Google Ads' },
    { id: 'email', label: 'Email' },
    { id: 'whatsapp', label: 'WhatsApp' },
    { id: 'site', label: 'Site' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <PageIntelHeader
          moduleLabel="ADS INTELLIGENCE"
          title="Campanhas"
          subtitle="Performance e gestão de campanhas de marketing"
          live
          actions={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              {/* Meta connection badge */}
              {metaStatus && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '5px',
                  fontSize: '10px', fontWeight: 700, padding: '4px 10px',
                  borderRadius: '8px',
                  background: metaStatus.connected ? 'rgba(0,178,127,0.1)' : 'rgba(148,163,184,0.08)',
                  color: metaStatus.connected ? 'var(--s-done)' : 'var(--bo-text-muted)',
                  border: `1px solid ${metaStatus.connected ? 'rgba(0,178,127,0.25)' : 'var(--bo-border)'}`,
                }}>
                  <Wifi size={10} />
                  {metaStatus.connected ? `Meta · ${metaStatus.count ?? 0} camps.` : 'Meta desconectado'}
                </span>
              )}
              {/* Sync Meta button — only if connected */}
              {metaStatus?.connected && (
                <button
                  onClick={syncMeta}
                  disabled={syncing}
                  title="Sincronizar campanhas do Meta Ads"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '5px',
                    height: '38px', padding: '0 14px', borderRadius: '12px',
                    fontSize: '12px', fontWeight: 700,
                    color: syncing ? 'var(--bo-text-muted)' : 'var(--bo-text)',
                    background: 'var(--bo-elevated)',
                    border: '1px solid var(--bo-border)',
                    cursor: syncing ? 'not-allowed' : 'pointer',
                    opacity: syncing ? 0.75 : 1,
                    flexShrink: 0,
                  }}
                >
                  <RefreshCw size={13} style={{ animation: syncing ? 'spin 1s linear infinite' : 'none' }} />
                  <span className="hidden sm:inline">{syncing ? 'Sincronizando…' : 'Sincronizar Meta'}</span>
                </button>
              )}
              <button
                onClick={() => router.push('/backoffice/campanhas/nova')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  height: '38px', padding: '0 18px', borderRadius: '12px',
                  fontSize: '13px', fontWeight: 700, color: '#fff',
                  background: 'var(--bo-accent)',
                  border: 'none', cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                <Plus size={15} />
                <span className="hidden sm:inline">Nova Campanha</span>
              </button>
            </div>
          }
        />
      </motion.div>

      {/* Sync result toast */}
      <AnimatePresence>
        {syncResult && (
          <motion.div
            key="sync-toast"
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 16px', borderRadius: '12px',
              background: syncResult.success ? 'rgba(0,178,127,0.1)' : 'rgba(248,113,113,0.1)',
              border: `1px solid ${syncResult.success ? 'rgba(0,178,127,0.25)' : 'rgba(248,113,113,0.25)'}`,
            }}
          >
            {syncResult.success
              ? <CheckCircle2 size={15} style={{ color: 'var(--s-done)', flexShrink: 0 }} />
              : <AlertCircle size={15} style={{ color: 'var(--s-hot)', flexShrink: 0 }} />
            }
            <p style={{ fontSize: '12px', fontWeight: 600, color: syncResult.success ? 'var(--s-done)' : 'var(--s-hot)' }}>
              {syncResult.success
                ? `✓ ${syncResult.synced} campanha(s) sincronizada(s) do Meta Ads`
                : `Erro: ${syncResult.error}`
              }
            </p>
          </motion.div>
        )}
      </AnimatePresence>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.35 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-3"
      >
        <KPICard label="Pipeline Total" value={isLoading ? '—' : formatBRL(totalBudget)} sublabel="orçamento aprovado" icon={<DollarSign size={16} />} accent="blue" />
        <KPICard label="Conversão" value={isLoading ? '—' : `${convPct}%`} sublabel={`${totalConversions} de ${totalLeads} leads`} icon={<Target size={16} />} accent="green" />
        <KPICard label="CAC Médio" value={isLoading ? '—' : formatBRL(avgCAC)} sublabel="custo por aquisição" icon={<Zap size={16} />} accent="warm" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.14, duration: 0.3 }}
        style={{ background: 'var(--bo-card)', border: '1px solid var(--bo-border)', borderRadius: '16px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}
      >
        <div style={{ position: 'relative' }}>
          <Search size={13} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--bo-text-muted)', pointerEvents: 'none' }} />
          <input
            type="text" placeholder="Buscar campanhas..." value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', height: '38px', paddingLeft: '34px', paddingRight: '14px',
              borderRadius: '10px', fontSize: '13px', color: 'var(--bo-text)',
              background: 'var(--bo-surface)', border: '1px solid var(--bo-border)',
              outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>
        <FilterTabs tabs={statusTabs} active={statusFilter} onChange={setStatusFilter} />
        <FilterTabs tabs={typeTabs} active={typeFilter} onChange={setTypeFilter} />
      </motion.div>

      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(100%,280px),1fr))', gap: '12px' }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{ background: 'var(--bo-card)', border: '1px solid var(--bo-border)', borderRadius: '16px', padding: '14px', height: '180px', animation: 'pulse 1.5s ease-in-out infinite' }} />
          ))}
        </div>
      ) : campanhas && campanhas.length > 0 ? (
        <>
          <SectionHeader title="Campanhas" badge={campanhas.length} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(100%,280px),1fr))', gap: '12px' }}>
            {campanhas.map((c, i) => (
              <CampaignCard key={c.id} c={c} index={i} onClick={() => router.push(`/backoffice/campanhas/${c.id}`)} />
            ))}
          </div>
        </>
      ) : (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{
            background: 'var(--bo-card)', border: '1px solid var(--bo-border)',
            borderRadius: '16px', padding: '48px 24px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', textAlign: 'center',
          }}
        >
          <BarChart3 size={32} color="var(--bo-text-muted)" />
          <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--bo-text)' }}>Nenhuma campanha encontrada</p>
          <p style={{ fontSize: '13px', color: 'var(--bo-text-muted)', maxWidth: '320px' }}>
            Crie sua primeira campanha para começar a rastrear performance de marketing.
          </p>
          <button
            onClick={() => router.push('/backoffice/campanhas/nova')}
            style={{
              marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px',
              height: '38px', padding: '0 18px', borderRadius: '12px',
              fontSize: '13px', fontWeight: 700, color: '#fff',
              background: 'var(--bo-accent)',
              border: 'none', cursor: 'pointer', 
            }}
          >
            <Plus size={15} />Nova Campanha
          </button>
        </motion.div>
      )}

      {!isLoading && channelPerf.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.35 }}
          style={{ background: 'var(--bo-card)', border: '1px solid var(--bo-border)', borderRadius: '16px', padding: '14px' }}
        >
          <SectionHeader title="Performance por Canal" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {channelPerf.map(ch => (
              <MetricBar
                key={ch.channel} label={ch.label}
                value={ch.leadsPct}
                valueLabel={`${fmtNum(ch.leadsValue)} leads · ${formatBRL(ch.spent)}`}
                color={ch.color}
              />
            ))}
          </div>
        </motion.div>
      )}

    </div>
  )
}
