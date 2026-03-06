'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Plus, Zap, TrendingUp, Users, Flame } from 'lucide-react'
import { PageIntelHeader } from '@/app/(backoffice)/components/ui/PageIntelHeader'
import { KPICard } from '@/app/(backoffice)/components/ui/KPICard'
import { FilterTabs, FilterTab } from '@/app/(backoffice)/components/ui/FilterTabs'
import { MobileLeadCard } from '@/app/(backoffice)/components/ui/MobileLeadCard'
import { SectionHeader } from '@/app/(backoffice)/components/ui/SectionHeader'

// ── Types ──────────────────────────────────────────────────────────
interface Lead {
  id: any
  name: string
  email: string
  phone: string
  score: number
  status: string
  source: string
  interest: string
  location: string
  budget?: string
  created: string
  lastContact: string
  ai_score?: number
}

// ── Helpers ────────────────────────────────────────────────────────
const timeAgo = (d: string) => {
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 60000)
  if (diff < 2)    return 'agora'
  if (diff < 60)   return `${diff} min`
  if (diff < 1440) return `${Math.floor(diff / 60)}h atrás`
  return `${Math.floor(diff / 1440)}d atrás`
}

// ── Skeleton ──────────────────────────────────────────────────────
function LeadsSkeleton() {
  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <div style={{ height: 40, background: 'var(--bo-card)', borderRadius: 12, opacity: 0.5, width: '60%' }} />
      <div className="grid grid-cols-4 gap-2">
        {[0,1,2,3].map(i => (
          <div key={i} style={{ height: 60, background: 'var(--bo-card)', borderRadius: 12, opacity: 0.4 }} />
        ))}
      </div>
      <div style={{ height: 44, background: 'var(--bo-card)', borderRadius: 12, opacity: 0.4 }} />
      {[0,1,2,3,4].map(i => (
        <div key={i} style={{ height: 88, background: 'var(--bo-card)', borderRadius: 16, opacity: 0.3 - i * 0.04 }} />
      ))}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────
export default function LeadsPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [searchFocused, setSearchFocused] = useState(false)

  useEffect(() => {
    fetch('/api/leads')
      .then(r => r.ok ? r.json() : [])
      .then((json: any) => {
        // API returns { data: [...], pagination: {} } or [] on error
        const data = json.data || (Array.isArray(json) ? json : [])
        setLeads(data.map((l: any) => ({
          id: l.id,
          name: l.name || 'Sem nome',
          email: l.email || '',
          phone: l.phone || '',
          score: l.score ?? 50,
          status: l.status || 'warm',
          source: l.source || 'Site',
          interest: l.interest || '',
          location: l.city || '',
          budget: l.budget ?? 'N/A',
          created: l.created_at || new Date().toISOString(),
          lastContact: l.updated_at || new Date().toISOString(),
          ai_score: l.ai_score ?? undefined,
        })))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // ── Stats ──────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total: leads.length,
    hot:   leads.filter(l => l.status === 'hot').length,
    warm:  leads.filter(l => l.status === 'warm').length,
    cold:  leads.filter(l => l.status === 'cold').length,
    avg:   leads.length > 0
      ? Math.round(leads.reduce((a, l) => a + l.score, 0) / leads.length)
      : 0,
  }), [leads])

  // ── Filter tabs ────────────────────────────────────────────────
  const FILTER_TABS: FilterTab[] = [
    { id: 'all',  label: 'Todos',  count: stats.total },
    { id: 'hot',  label: 'HOT',   count: stats.hot,  dotColor: 'var(--s-hot)' },
    { id: 'warm', label: 'Warm',  count: stats.warm, dotColor: 'var(--s-warm)' },
    { id: 'cold', label: 'Cold',  count: stats.cold, dotColor: 'var(--s-cold)' },
  ]

  // ── Filtered list ──────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return leads.filter(l => {
      const matchSearch = !q
        || l.name.toLowerCase().includes(q)
        || l.email.toLowerCase().includes(q)
        || l.phone.includes(q)
        || l.interest.toLowerCase().includes(q)
      const matchFilter = activeFilter === 'all' || l.status === activeFilter
      return matchSearch && matchFilter
    })
  }, [leads, search, activeFilter])

  if (loading) return <LeadsSkeleton />

  return (
    <div className="space-y-5 max-w-2xl mx-auto">

      {/* ── Header ────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        <PageIntelHeader
          moduleLabel="CRM INTELLIGENCE"
          title="Leads"
          subtitle="Behavioral Intelligence Pipeline"
          live
          actions={
            <motion.button
              whileTap={{ scale: 0.93 }}
              onClick={() => router.push('/backoffice/leads/novo')}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                height: '36px', padding: '0 14px', borderRadius: '10px',
                fontSize: '12px', fontWeight: 700, color: '#fff',
                background: 'linear-gradient(135deg, var(--imi-blue) 0%, var(--imi-blue-bright) 100%)',
                border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              <Plus size={14} /> Novo Lead
            </motion.button>
          }
        />
      </motion.div>

      {/* ── KPI Strip ─────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.06 }}
        className="grid grid-cols-4 gap-2"
      >
        <KPICard
          label="Total"
          value={stats.total}
          accent="blue"
          size="sm"
          icon={<Users size={10} />}
        />
        <KPICard
          label="HOT"
          value={stats.hot}
          accent="hot"
          size="sm"
          icon={<Flame size={10} />}
        />
        <KPICard
          label="Warm"
          value={stats.warm}
          accent="warm"
          size="sm"
        />
        <KPICard
          label="AI Score"
          value={stats.avg}
          accent="ai"
          size="sm"
          icon={<Zap size={10} />}
        />
      </motion.div>

      {/* ── Search ────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.10 }}
      >
        <div
          style={{
            position: 'relative',
            border: `1px solid ${searchFocused ? 'var(--imi-blue-border)' : 'var(--bo-border)'}`,
            borderRadius: '12px',
            background: 'var(--bo-card)',
            transition: 'border-color 0.18s',
            boxShadow: searchFocused ? '0 0 0 3px var(--imi-blue-dim)' : 'none',
          }}
        >
          <Search
            size={15}
            style={{
              position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
              color: searchFocused ? 'var(--imi-blue-bright)' : 'var(--bo-text-muted)',
              transition: 'color 0.18s',
            }}
          />
          <input
            type="text"
            placeholder="Buscar leads por nome, email, interesse..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            style={{
              width: '100%', height: '44px',
              paddingLeft: '38px', paddingRight: '16px',
              background: 'transparent', border: 'none', outline: 'none',
              fontSize: '13px', color: 'var(--bo-text)',
              borderRadius: '12px',
            }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{
                position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '6px',
                color: 'var(--bo-text-muted)', fontSize: '11px', padding: '3px 7px',
                cursor: 'pointer', fontWeight: 600,
              }}
            >
              ✕
            </button>
          )}
        </div>
      </motion.div>

      {/* ── Filter Tabs ────────────────────────────────── */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.13 }}>
        <FilterTabs tabs={FILTER_TABS} active={activeFilter} onChange={setActiveFilter} />
      </motion.div>

      {/* ── Lead List ──────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.16 }}
      >
        <SectionHeader
          title={activeFilter === 'all' ? 'Todos os Leads' : `Leads ${activeFilter.toUpperCase()}`}
          badge={filtered.length}
        />

        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-2xl text-center"
              style={{ background: 'var(--bo-card)', border: '1px solid var(--bo-border)', padding: '40px 16px' }}
            >
              <Users size={28} style={{ color: 'var(--bo-text-muted)', opacity: 0.2, margin: '0 auto 12px' }} />
              <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--bo-text)', marginBottom: '6px' }}>
                {search ? 'Nenhum resultado encontrado' : 'Nenhum lead ainda'}
              </p>
              <p style={{ fontSize: '12px', color: 'var(--bo-text-muted)', marginBottom: '16px' }}>
                {search
                  ? `Sem leads para "${search}"`
                  : 'Capture seu primeiro lead para começar'}
              </p>
              {!search && (
                <button
                  onClick={() => router.push('/backoffice/leads/novo')}
                  style={{
                    fontSize: '12px', fontWeight: 700, color: '#fff',
                    background: 'linear-gradient(135deg, var(--imi-blue) 0%, var(--imi-blue-bright) 100%)',
                    border: 'none', padding: '8px 18px', borderRadius: '10px', cursor: 'pointer',
                  }}
                >
                  + Novo Lead
                </button>
              )}
            </motion.div>
          ) : (
            <motion.div className="space-y-2">
              {filtered.map((lead, i) => {
                // Assign AI state based on score/status
                const aiState: 'qualifying' | 'scheduled' | 'waiting' | null =
                  lead.status === 'hot' ? 'qualifying'
                  : lead.status === 'warm' ? 'scheduled'
                  : null

                // Compute AI score
                const aiScore = lead.ai_score
                  ?? (lead.status === 'hot' ? 75 + Math.floor((lead.score || 50) * 0.25)
                    : lead.status === 'warm' ? 45 + Math.floor((lead.score || 50) * 0.4)
                    : 20 + Math.floor((lead.score || 50) * 0.3))

                // AI summary
                const aiSummary = lead.status === 'hot' && lead.interest
                  ? `Alta intenção detectada. Interesse: ${lead.interest}. Prioridade: contato imediato.`
                  : lead.status === 'warm' && lead.interest
                    ? `Engajamento moderado. Lead explorando ${lead.interest}.`
                    : undefined

                return (
                  <motion.div
                    key={lead.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ delay: Math.min(i * 0.04, 0.3) }}
                  >
                    <MobileLeadCard
                      id={lead.id}
                      name={lead.name}
                      status={lead.status}
                      score={aiScore}
                      aiState={aiState}
                      aiSummary={aiSummary}
                      meta={{
                        origin: lead.source || undefined,
                        location: lead.location || undefined,
                        lastActivity: timeAgo(lead.lastContact),
                        product: lead.interest || undefined,
                      }}
                      isNew={i === 0 && lead.status === 'hot'}
                      animDelay={i * 50}
                      onClick={() => router.push(`/backoffice/leads/${lead.id}`)}
                    />
                  </motion.div>
                )
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

    </div>
  )
}
