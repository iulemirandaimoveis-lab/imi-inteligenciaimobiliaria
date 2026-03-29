'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Sun, Moon, Users, CalendarDays,
  MessageCircle, Building2,
  TrendingUp, Scale, Clock, Zap, Bot, Sparkles, CheckCircle2, LayoutDashboard,
  Camera, Loader2, Video, X, Plug, Megaphone, FileSignature, Banknote,
} from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { PageIntelHeader } from '@/app/(backoffice)/components/ui/PageIntelHeader'
import { MarketTicker } from '@/app/(backoffice)/components/ui/MarketTicker'
import { KPICard } from '@/app/(backoffice)/components/ui/KPICard'
import { SectionHeader } from '@/app/(backoffice)/components/ui/SectionHeader'
import { MobileLeadCard } from '@/app/(backoffice)/components/ui/MobileLeadCard'
import { AIInsightCard } from '@/app/(backoffice)/components/ui/AIInsightCard'
import { StatusBadge } from '@/app/(backoffice)/components/ui/StatusBadge'
import { T } from '@/app/(backoffice)/lib/theme'

// ── Helpers ────────────────────────────────────────────────────────────
function getGreeting(): { text: string; Icon: React.ElementType; period: string } {
  const h = new Date().getHours()
  if (h < 12) return { text: 'Bom dia', Icon: Sun, period: 'morning' }
  if (h < 18) return { text: 'Boa tarde', Icon: Sun, period: 'afternoon' }
  return { text: 'Boa noite', Icon: Moon, period: 'evening' }
}

function todayLabel() {
  const d = new Date()
  const weekday = d.toLocaleDateString('pt-BR', { weekday: 'long' })
  const rest = d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })
  return { weekday: weekday.charAt(0).toUpperCase() + weekday.slice(1), rest }
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

// ── Quick action config ──────────────────────────────────────────────
const QUICK_ACTIONS = [
  { label: 'Dashboard',   href: '/backoffice/dashboard',         color: 'var(--accent-400)', icon: LayoutDashboard },
  { label: 'Novo Lead',   href: '/backoffice/leads/novo',        color: 'var(--error)',        icon: Users },
  { label: 'Agendamento', href: '/backoffice/agenda',            color: 'var(--warning)',      icon: CalendarDays },
  { label: 'WhatsApp',    href: '/backoffice/whatsapp',          color: '#25D366',             icon: MessageCircle },
  { label: 'Agentes IA',  href: '/backoffice/ia/agentes',        color: '#A78BFA',             icon: Bot,           isNew: true },
  { label: 'Vídeo IA',    href: '/backoffice/conteudo/video',    color: '#F472B6',             icon: Video,         isNew: true },
  { label: 'Avaliação',   href: '/backoffice/avaliacoes/nova',   color: 'var(--accent-400)', icon: Scale },
  { label: 'Imóveis',     href: '/backoffice/imoveis',           color: 'var(--info)',         icon: Building2 },
  { label: 'Pipeline',    href: '/backoffice/leads',             color: 'var(--accent-400)', icon: TrendingUp },
]

// ── Agent activity default (zeroed — real data fetched from API) ──
const AGENT_ACTIVITY_DEFAULT = [
  { name: 'Qualificador', tasksToday: 0, color: 'var(--info, #60A5FA)', raw: '96,165,250', status: 'active' },
  { name: 'Conteúdo',     tasksToday: 0, color: '#8B5CF6', raw: '139,92,246', status: 'active' },
  { name: 'Matchmaker',   tasksToday: 0, color: '#F59E0B', raw: '245,158,11', status: 'active' },
  { name: 'Follow-up',    tasksToday: 0, color: 'var(--error)', raw: '239,68,68',  status: 'idle'   },
]

// ── Loading Skeleton ─────────────────────────────────────────────────
function HojeSkeleton() {
  return (
    <div className="space-y-5 lg:max-w-2xl lg:mx-auto">
      <div style={{ height: 60, background: 'var(--bg-surface)', borderRadius: 16, opacity: 0.5 }} />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {[0,1,2].map(i => (
          <div key={i} style={{ height: 72, background: 'var(--bg-surface)', borderRadius: 14, opacity: 0.4 }} />
        ))}
      </div>
      <div style={{ height: 100, background: 'var(--bg-surface)', borderRadius: 16, opacity: 0.4 }} />
      <div style={{ height: 200, background: 'var(--bg-surface)', borderRadius: 16, opacity: 0.35 }} />
    </div>
  )
}

// ── Main ────────────────────────────────────────────────────────────
export default function HojePage() {
  const router = useRouter()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [leads, setLeads] = useState<Record<string, any>[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [events, setEvents] = useState<Record<string, any>[]>([])
  const [agentActivity, setAgentActivity] = useState(AGENT_ACTIVITY_DEFAULT)
  const [loading, setLoading] = useState(true)

  // ── Avatar / profile ──────────────────────────────────────────────
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [userName, setUserName] = useState<string>('Iule')
  const [userRole, setUserRole] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const [integBannerDismissed, setIntegBannerDismissed] = useState(() => {
    try { return localStorage.getItem('imi-integ-banner-dismissed') === '1' } catch { return false }
  })

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Corretor'
      setUserName(name.split(' ')[0])

      // Try brokers first, then profiles, then auth metadata
      let avatar: string | null = null
      try {
        const { data: broker } = await supabase.from('brokers').select('avatar_url').eq('user_id', user.id).maybeSingle()
        if (broker?.avatar_url) avatar = broker.avatar_url
      } catch {}
      if (!avatar) {
        try {
          const { data: profile } = await supabase.from('profiles').select('avatar_url').eq('id', user.id).maybeSingle()
          if (profile?.avatar_url) avatar = profile.avatar_url
        } catch {}
      }
      if (!avatar) avatar = user.user_metadata?.avatar_url || null
      if (avatar) setAvatarUrl(avatar)

      // Load role
      supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
        .then(({ data }) => { if (data?.role) setUserRole(data.role as string) })
    })
  }, [])

  const handleAvatarUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUploading(true)
    try {
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `avatars/${user.id}.${ext}`
      const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
      if (upErr) throw upErr
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
      // Cache-bust to force browser reload after upload
      const finalUrl = `${publicUrl}?t=${Date.now()}`
      await supabase.auth.updateUser({ data: { avatar_url: finalUrl } })
      // Save to profiles AND brokers for consistency across all modules
      await supabase.from('profiles').upsert({ id: user.id, avatar_url: finalUrl }, { onConflict: 'id' })
      await supabase.from('brokers').update({ avatar_url: finalUrl }).eq('user_id', user.id)
      setAvatarUrl(finalUrl)
      toast.success('Foto atualizada!')
    } catch {
      toast.error('Erro ao atualizar foto')
    } finally {
      setUploading(false)
      if (avatarInputRef.current) avatarInputRef.current.value = ''
    }
  }, [])

  const { text: greetText, Icon: GreetIcon, period } = getGreeting()
  const { weekday, rest } = todayLabel()
  const todayISO = new Date().toISOString().split('T')[0]
  const currentMonth = todayISO.slice(0, 7)

  useEffect(() => {
    Promise.all([
      fetch('/api/leads').then(r => r.json()).catch(() => { toast.error('Erro ao carregar leads'); return [] }),
      fetch(`/api/agenda?month=${currentMonth}`).then(r => r.json()).catch(() => { toast.error('Erro ao carregar agenda'); return [] }),
      fetch('/api/ai/agents/stats').then(r => r.json()).catch(() => null),
    ]).then(([leadsData, eventsData, agentData]) => {
      // /api/leads returns { data: [...], pagination: {} } — extract .data
      setLeads(leadsData?.data || (Array.isArray(leadsData) ? leadsData : []))
      setEvents(Array.isArray(eventsData) ? eventsData : [])
      // Merge agent stats from API if available
      if (agentData?.agents && typeof agentData.agents === 'object') {
        setAgentActivity(prev => prev.map(agent => {
          const apiData = agentData.agents[agent.name] || agentData.agents[agent.name.toLowerCase()]
          return apiData ? { ...agent, tasksToday: apiData.tasksToday } : agent
        }))
      }
      setLoading(false)
    })
  }, [currentMonth])

  if (loading) return <HojeSkeleton />

  // Derived data
  const todayEvents  = events.filter(e => String(e.start_time ?? '').startsWith(todayISO))
  const hotLeads     = leads.filter(l => l.status === 'hot').slice(0, 4)
  const hotCount     = leads.filter(l => l.status === 'hot').length
  const warmCount    = leads.filter(l => l.status === 'warm').length
  const coldCount    = leads.filter(l => l.status === 'cold').length
  const totalLeads   = leads.length

  // AI briefing — dynamic text based on real data
  const aiBriefing = hotCount > 0
    ? `${hotCount} lead${hotCount > 1 ? 's quentes precisam' : ' quente precisa'} de ação hoje. Foco: abordagem de urgência + exclusividade.`
    : warmCount > 0
      ? `Nenhum lead quente agora. ${warmCount} leads mornos podem ser aquecidos hoje com follow-up ativo.`
      : 'Pipeline aguardando novos leads. Ative suas campanhas para maximizar captação.'

  const greetIconColor = period === 'morning'
    ? 'var(--accent-400)'
    : period === 'afternoon'
      ? 'var(--warning)'
      : 'var(--info)'

  return (
    <div className="space-y-5 lg:max-w-2xl lg:mx-auto">

      {/* ── Hero: Greeting ──────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: [0, 0, 0.2, 1] }}
        className="rounded-lg"
        style={{
          background: 'linear-gradient(135deg, var(--bg-surface) 0%, var(--bg-surface) 100%)',
          border: '1px solid var(--border-default)',
          padding: '16px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background glow */}
        <div style={{
          position: 'absolute', top: '-30px', right: '-20px',
          width: '100px', height: '100px', borderRadius: '50%',
          background: `${greetIconColor}15`, filter: 'blur(30px)', pointerEvents: 'none',
        }} />

        {/* IMI Intelligence tag */}
        <div className="flex items-center gap-2 mb-3">
          <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--accent-400)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            INTELLIGENCE OS
          </span>
          <span className="flex items-center gap-1">
            <span className="live-dot" />
            <span style={{ fontSize: '8px', fontWeight: 700, color: 'var(--imi-ai-green)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              IA EM TEMPO REAL
            </span>
          </span>
        </div>

        <div className="flex items-start justify-between" style={{ position: 'relative', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500, marginBottom: '2px' }}>
              {greetText}, {userName} ✦
            </p>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
              {weekday}
            </h1>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '1px' }}>
              {rest}
            </p>
            {userRole && (
              <span style={{
                display: 'inline-block', marginTop: 6,
                fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
                padding: '2px 8px', borderRadius: 6,
                background: 'var(--bg-active)', color: 'var(--accent-400)',
                border: '1px solid var(--border-default)',
              }}>
                {userRole}
              </span>
            )}
          </div>

          {/* Avatar with upload */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleAvatarUpload}
            />
            <button
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploading}
              style={{
                width: 56, height: 56, borderRadius: '50%',
                overflow: 'hidden', position: 'relative',
                border: `2px solid rgba(61,111,255,0.4)`,
                background: 'var(--bg-elevated)',
                cursor: 'pointer', padding: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}
              title="Alterar foto"
            >
              {uploading ? (
                <Loader2 size={20} style={{ color: 'var(--accent-400)', animation: 'spin 1s linear infinite' }} />
              ) : avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent-400)', fontFamily: "var(--font-playfair, 'Playfair Display', Georgia, serif)" }}>
                  {userName.charAt(0).toUpperCase()}
                </span>
              )}
              {/* Camera hover overlay */}
              {!uploading && (
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'rgba(0,0,0,0.45)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  opacity: 0, transition: 'opacity 0.15s',
                  borderRadius: '50%',
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.opacity = '1' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.opacity = '0' }}
                >
                  <Camera size={14} style={{ color: 'white' }} />
                </div>
              )}
            </button>
            {/* "Foto" label */}
            <span style={{
              position: 'absolute', bottom: -14, left: '50%', transform: 'translateX(-50%)',
              fontSize: 8, fontWeight: 700, color: 'var(--text-secondary)',
              letterSpacing: '0.05em', whiteSpace: 'nowrap',
            }}>
              Alterar foto
            </span>
          </div>
        </div>

        {/* Today's mini stat strip */}
        <div className="flex items-center gap-3 mt-4 pt-3" style={{ borderTop: '1px solid var(--border-default)' }}>
          <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
            Hoje: <span style={{ color: 'var(--error)', fontWeight: 700 }}>{hotCount} quentes</span>
          </span>
          <span style={{ color: 'var(--border-default)', fontSize: '12px' }}>·</span>
          <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
            <span style={{ color: 'var(--warning)', fontWeight: 700 }}>{todayEvents.length} eventos</span>
          </span>
          <span style={{ color: 'var(--border-default)', fontSize: '12px' }}>·</span>
          <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
            <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{totalLeads}</span> leads total
          </span>
        </div>
      </motion.div>

      {/* ── Quick Actions (horizontal scroll) ────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.06 }}
      >
        <SectionHeader title="Ações Rápidas" />
        <div className="grid grid-cols-3 gap-3">
          {QUICK_ACTIONS.slice(0, 6).map((a, i) => (
            <motion.button
              key={a.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.08 + i * 0.04 }}
              whileTap={{ scale: 0.90 }}
              onClick={() => router.push(a.href)}
              className="flex flex-col items-center justify-center gap-1.5 relative"
              style={{
                minHeight: '80px', padding: '10px 4px',
                background: 'var(--bg-surface)',
                border: `1px solid ${('isNew' in a && a.isNew) ? 'rgba(167,139,250,0.30)' : 'var(--border-default)'}`,
                borderRadius: '12px',
              }}
            >
              {/* Icon */}
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: 'rgba(255,255,255,0.04)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, position: 'relative',
              }}>
                <a.icon size={16} style={{ color: a.color }} />
                {'isNew' in a && a.isNew && (
                  <span style={{
                    position: 'absolute', top: -5, right: -5,
                    fontSize: '7px', fontWeight: 800, padding: '1px 4px',
                    borderRadius: 6, background: 'rgba(74,222,128,0.20)',
                    color: 'var(--success)', border: '1px solid rgba(74,222,128,0.35)',
                    letterSpacing: '0.03em',
                  }}>NEW</span>
                )}
              </div>
              <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'center', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                {a.label}
              </span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Market Ticker */}
      <MarketTicker
        paused
        items={[
          // Brasil — Mercado Imobiliário
          { label: '🇧🇷 Ipanema • RJ', value: 'R$ 24.800/m²', change: 2.3, type: 'price' },
          { label: '🇧🇷 Leblon • RJ', value: 'R$ 28.400/m²', change: -0.8, type: 'price' },
          { label: '🇧🇷 Jardins • SP', value: 'R$ 22.100/m²', change: 1.4, type: 'price' },
          { label: '🇧🇷 Itaim Bibi • SP', value: 'R$ 19.600/m²', change: 0.9, type: 'price' },
          { label: '🇧🇷 Boa Viagem • PE', value: 'R$ 11.200/m²', change: 3.2, type: 'price' },
          { label: '🇧🇷 Barra da Tijuca • RJ', value: 'R$ 12.600/m²', change: 1.5, type: 'price' },
          { label: '🇧🇷 Yield Médio BR', value: '5.8% a.a.', change: 0.2, type: 'yield' },
          { label: '🇧🇷 CDI', value: '10.5% a.a.', change: 0.0, type: 'index' },
          { label: '🇧🇷 IGPM 12m', value: '4.83%', change: 0.3, type: 'index' },
          { label: '🇧🇷 FII HGLG11', value: 'R$ 156,20', change: -1.2, type: 'index' },
          // EUA — Real Estate
          { label: '🇺🇸 Miami Beach', value: '$ 1.850/sqft', change: 3.8, type: 'price' },
          { label: '🇺🇸 Manhattan • NY', value: '$ 2.450/sqft', change: -0.5, type: 'price' },
          { label: '🇺🇸 Beverly Hills • LA', value: '$ 2.100/sqft', change: 1.2, type: 'price' },
          { label: '🇺🇸 Brickell • Miami', value: '$ 980/sqft', change: 4.6, type: 'price' },
          { label: '🇺🇸 US Prime Rate', value: '5.50% a.a.', change: 0.0, type: 'index' },
          { label: '🇺🇸 DJIA', value: '39.142', change: 0.4, type: 'index' },
          // Emirados Árabes
          { label: '🇦🇪 Dubai Marina', value: 'AED 3.200/sqft', change: 8.4, type: 'price' },
          { label: '🇦🇪 Palm Jumeirah', value: 'AED 5.800/sqft', change: 12.1, type: 'price' },
          { label: '🇦🇪 Downtown Dubai', value: 'AED 4.100/sqft', change: 6.7, type: 'price' },
          { label: '🇦🇪 Abu Dhabi • Al Reem', value: 'AED 1.850/sqft', change: 5.3, type: 'price' },
          { label: '🇦🇪 Yield Dubai', value: '6.8% a.a.', change: 0.4, type: 'yield' },
          { label: '🇦🇪 DFM Index', value: '4.238', change: 1.1, type: 'index' },
        ]}
      />

      {/* ── KPI Strip ─────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-2"
      >
        <KPICard
          label="Quentes"
          value={hotCount}
          accent="hot"
          icon={<Zap size={11} />}
          delta={hotCount > 0 ? 8 : undefined}
          deltaLabel=""
        />
        <KPICard
          label="Eventos Hoje"
          value={todayEvents.length}
          accent="blue"
          icon={<CalendarDays size={11} />}
        />
        <KPICard
          label="Pipeline"
          value={totalLeads}
          accent="green"
          icon={<TrendingUp size={11} />}
          sublabel={`${warmCount} mornos`}
        />
      </motion.div>

      {/* ── Integration Setup Banner ────────────────── */}
      {!integBannerDismissed && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="rounded-lg"
          style={{
            background: 'linear-gradient(135deg, rgba(61,111,255,0.08) 0%, rgba(61,111,255,0.04) 100%)',
            border: '1px solid rgba(61,111,255,0.25)',
            padding: '14px 16px',
            position: 'relative',
          }}
        >
          <button
            type="button"
            onClick={() => {
              setIntegBannerDismissed(true)
              try { localStorage.setItem('imi-integ-banner-dismissed', '1') } catch {}
            }}
            style={{
              position: 'absolute', top: 10, right: 10,
              width: 24, height: 24, borderRadius: 6,
              background: 'transparent', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-tertiary)',
            }}
          >
            <X size={14} />
          </button>
          <div className="flex items-start gap-3">
            <div style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: 'rgba(61,111,255,0.12)',
              border: '1px solid rgba(61,111,255,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Plug size={16} style={{ color: 'var(--accent-400)' }} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
                Configure suas integrações
              </p>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 8 }}>
                Conecte WhatsApp, e-mail, assinatura digital e redes sociais para ativar todos os recursos do backoffice.
              </p>
              <button
                onClick={() => router.push('/backoffice/integracoes')}
                style={{
                  height: 30, padding: '0 14px', borderRadius: 8,
                  background: 'var(--btn-primary-bg)', border: 'none', cursor: 'pointer',
                  fontSize: '11px', fontWeight: 700, color: '#0B1120',
                  letterSpacing: '0.03em',
                }}
              >
                Configurar agora →
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── AI Daily Briefing ─────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.14 }}
      >
        <AIInsightCard
          title="Briefing Diário · IA"
          variant="gold"
          nextStep="Ver leads prioritários"
          action={{
            label: 'Abrir Pipeline Completo',
            onClick: () => router.push('/backoffice/leads'),
          }}
        >
          <span style={{ color: 'var(--text-primary)', fontSize: '12px', lineHeight: 1.65 }}>
            {aiBriefing}
            {hotCount > 0 && (
              <>
                {' '}Recomendação: ligar nas <span style={{ color: 'var(--accent-400)', fontWeight: 600 }}>próximas 2 horas</span> para maximizar conversão.
              </>
            )}
          </span>
        </AIInsightCard>
      </motion.div>

      {/* ── Agentes IA — status strip ─────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.16 }}
      >
        <SectionHeader
          title="Agentes IA Hoje"
          action={{ label: 'Ver todos', href: '/backoffice/ia/agentes' }}
        />
        <div
          className="rounded-lg overflow-hidden"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
        >
          {/* Header */}
          <div
            className="px-4 py-2.5 flex items-center gap-2"
            style={{
              background: 'linear-gradient(135deg, rgba(139,92,246,0.08) 0%, rgba(96,165,250,0.05) 100%)',
              borderBottom: '1px solid var(--border-default)',
            }}
          >
            <Bot size={12} style={{ color: '#A78BFA' }} />
            <span style={{ fontSize: '10px', fontWeight: 700, color: '#A78BFA', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {agentActivity.filter(a => a.status === 'active').length} ativos agora
            </span>
            <span style={{ marginLeft: 'auto', fontSize: '9px', color: 'var(--text-secondary)' }}>
              {agentActivity.reduce((s, a) => s + a.tasksToday, 0)} tarefas hoje
            </span>
          </div>

          {/* Agent rows */}
          {agentActivity.map((agent, i) => (
            <div
              key={agent.name}
              className="flex items-center gap-3 px-4 py-3"
              style={{ borderBottom: i < agentActivity.length - 1 ? '1px solid var(--border-default)' : 'none' }}
            >
              {/* Icon */}
              <div style={{
                width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                background: `rgba(${agent.raw},0.12)`,
                border: `1px solid rgba(${agent.raw},0.20)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Bot size={13} style={{ color: agent.color }} />
              </div>

              {/* Name + status */}
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {agent.name}
                </span>
              </div>

              {/* Status pill */}
              <span style={{
                fontSize: '9px', fontWeight: 700, padding: '2px 7px', borderRadius: 5,
                background: agent.status === 'active' ? 'rgba(74,222,128,0.12)' : 'rgba(251,191,36,0.10)',
                color: agent.status === 'active' ? 'var(--success)' : 'var(--warning)',
                border: `1px solid ${agent.status === 'active' ? 'rgba(74,222,128,0.25)' : 'rgba(251,191,36,0.20)'}`,
              }}>
                {agent.status === 'active' ? '● Ativo' : '○ Espera'}
              </span>

              {/* Tasks count */}
              <span style={{ fontSize: '11px', fontWeight: 700, color: agent.color, minWidth: 24, textAlign: 'right' }}>
                {agent.tasksToday}
              </span>
            </div>
          ))}

          {/* CTA footer */}
          <button
            onClick={() => router.push('/backoffice/ia/agentes')}
            className="w-full flex items-center justify-center gap-2 py-3"
            style={{
              fontSize: '11px', fontWeight: 600, color: '#A78BFA',
              background: 'transparent', border: 'none', cursor: 'pointer',
              borderTop: '1px solid var(--border-default)',
            }}
          >
            <Sparkles size={11} />
            Gerenciar agentes
          </button>
        </div>
      </motion.div>

      {/* ── Agenda de Hoje ────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.17 }}
      >
        <SectionHeader
          title="Agenda de Hoje"
          badge={todayEvents.length || undefined}
          action={{ label: 'Ver agenda', href: '/backoffice/agenda' }}
        />

        <div
          className="rounded-lg overflow-hidden"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
        >
          {todayEvents.length === 0 ? (
            <div style={{ padding: '28px 16px', textAlign: 'center' }}>
              <CalendarDays size={24} style={{ color: 'var(--text-secondary)', opacity: 0.25, margin: '0 auto 10px' }} />
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                Sem eventos hoje
              </p>
              <button
                onClick={() => router.push('/backoffice/agenda')}
                style={{
                  fontSize: '11px', fontWeight: 600,
                  color: 'var(--accent-400)',
                  background: 'rgba(61,111,255,0.10)',
                  border: '1px solid rgba(61,111,255,0.25)',
                  padding: '6px 14px', borderRadius: '8px', cursor: 'pointer',
                }}
              >
                + Agendar compromisso
              </button>
            </div>
          ) : (
            todayEvents.map((ev, i) => (
              <div
                key={String(ev.id)}
                className="flex items-center gap-3 px-4 py-3"
                style={{ borderBottom: i < todayEvents.length - 1 ? '1px solid var(--border-default)' : 'none' }}
              >
                {/* Accent line */}
                <div style={{
                  width: '3px', height: '36px', borderRadius: '2px', flexShrink: 0,
                  background: String(ev.color || 'var(--accent-400)'),
                }} />
                <div className="flex-1 min-w-0">
                  <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {String(ev.title ?? '')}
                  </p>
                  <p className="flex items-center gap-1" style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    <Clock size={10} />
                    {formatTime(String(ev.start_time ?? ''))}
                    {ev.location && ` · ${String(ev.location)}`}
                  </p>
                </div>
                <StatusBadge status="pend" label="Hoje" size="xs" />
              </div>
            ))
          )}
        </div>
      </motion.div>

      {/* ── Hot Leads ─────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.20 }}
      >
        <SectionHeader
          title="Leads Quentes"
          badge={hotCount > 0 ? hotCount : undefined}
          action={{ label: 'Ver todos', href: '/backoffice/leads' }}
        />

        {hotLeads.length === 0 ? (
          <div
            className="rounded-lg text-center"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', padding: '28px 16px' }}
          >
            <Users size={24} style={{ color: 'var(--text-secondary)', opacity: 0.2, margin: '0 auto 10px' }} />
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
              Nenhum lead quente no momento
            </p>
            <button
              onClick={() => router.push('/backoffice/leads/novo')}
              style={{
                fontSize: '11px', fontWeight: 600,
                color: 'var(--error)',
                background: 'var(--error-bg)',
                border: '1px solid rgba(248,113,113,0.25)',
                padding: '6px 14px', borderRadius: '8px', cursor: 'pointer',
              }}
            >
              + Novo Lead
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {hotLeads.map((l, i) => (
              <div key={String(l.id)} style={{ cursor: 'pointer' }} onClick={() => router.push(`/backoffice/leads/${l.id}`)}>
                <MobileLeadCard
                  id={l.id as string}
                  name={String(l.name || 'Sem nome')}
                  status="hot"
                  score={(l.ai_score as number) ?? 75}
                  aiState="qualifying"
                  aiSummary={
                    l.interest
                      ? `Lead interessado em ${l.interest}. IA identificou alta intenção de compra.`
                      : undefined
                  }
                  meta={{
                    origin: String(l.source || 'Meta Ads'),
                    location: l.city ? String(l.city) : undefined,
                    lastActivity: 'hoje',
                    product: l.interest ? String(l.interest) : undefined,
                  }}
                  isNew={i === 0}
                  animDelay={i * 60}
                />
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* ── Pipeline & Portfolio Shortcuts ─────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.24 }}
        className="grid grid-cols-2 gap-2"
      >
        {/* Pipeline */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => router.push('/backoffice/leads')}
          className="rounded-lg text-left"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', padding: '14px' }}
        >
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'rgba(61,111,255,0.10)', border: '1px solid rgba(61,111,255,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px',
          }}>
            <TrendingUp size={16} style={{ color: 'var(--accent-400)' }} />
          </div>
          <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>
            Pipeline
          </p>
          <p style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
            {totalLeads} leads · {hotCount} quentes
          </p>
        </motion.button>

        {/* Portfolio */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => router.push('/backoffice/imoveis')}
          className="rounded-lg text-left"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', padding: '14px' }}
        >
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'rgba(167,139,250,0.10)', border: '1px solid rgba(167,139,250,0.20)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px',
          }}>
            <Building2 size={16} style={{ color: 'var(--warning)' }} />
          </div>
          <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>
            Portfólio
          </p>
          <p style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
            Ver empreendimentos
          </p>
        </motion.button>
      </motion.div>

      {/* ── Performance Rápida ───────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.28 }}
      >
        <SectionHeader title="Performance da Semana" action={{ label: 'Ver relatório', href: '/backoffice/relatorios' }} />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <div
            className="rounded-lg p-3 text-center"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
          >
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--error)', lineHeight: 1 }}>{hotCount}</div>
            <div style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4 }}>Quentes</div>
          </div>
          <div
            className="rounded-lg p-3 text-center"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
          >
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--warning)', lineHeight: 1 }}>{warmCount}</div>
            <div style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4 }}>Mornos</div>
          </div>
          <div
            className="rounded-lg p-3 text-center"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
          >
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--info)', lineHeight: 1 }}>{coldCount}</div>
            <div style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4 }}>Frios</div>
          </div>
        </div>

        {/* Conversion funnel bar */}
        <div
          className="mt-2 rounded-lg p-4"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
        >
          <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
            Funil de Conversão
          </div>
          {totalLeads > 0 ? (
            <div className="space-y-2">
              {[
                { label: 'Total Leads', value: totalLeads, max: totalLeads, color: 'var(--accent-400)' },
                { label: 'Quentes', value: hotCount, max: totalLeads, color: 'var(--error)' },
                { label: 'Mornos', value: warmCount, max: totalLeads, color: 'var(--warning)' },
              ].map(item => (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{item.label}</span>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-primary)' }}>{item.value}</span>
                  </div>
                  <div style={{ height: 4, borderRadius: 2, background: 'var(--bg-hover)' }}>
                    <div style={{
                      height: '100%', borderRadius: 2,
                      background: item.color,
                      width: `${Math.round((item.value / item.max) * 100)}%`,
                      transition: 'width 0.6s ease',
                    }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center' }}>Sem dados de leads</p>
          )}
        </div>
      </motion.div>

      {/* ── Atalhos Módulos ─────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.32 }}
      >
        <SectionHeader title="Módulos Ativos" action={{ label: 'Ver tudo', href: '/backoffice/dashboard' }} />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { label: 'Avaliações', href: '/backoffice/avaliacoes', icon: Scale, color: 'var(--accent-400)', badge: 'IA' },
            { label: 'Campanhas', href: '/backoffice/campanhas', icon: Megaphone, color: '#F472B6', badge: null },
            { label: 'Contratos', href: '/backoffice/contratos', icon: FileSignature, color: '#60A5FA', badge: null },
            { label: 'Financeiro', href: '/backoffice/financeiro', icon: Banknote, color: 'var(--success)', badge: null },
          ].map((mod) => (
            <motion.button
              key={mod.label}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push(mod.href)}
              className="rounded-lg text-left"
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                padding: '12px',
                position: 'relative',
              }}
            >
              {mod.badge && (
                <span style={{
                  position: 'absolute', top: 8, right: 8,
                  fontSize: '7px', fontWeight: 800, padding: '1px 4px',
                  borderRadius: 6,
                  background: 'rgba(61,111,255,0.12)',
                  color: 'var(--accent-400)',
                  border: '1px solid rgba(61,111,255,0.25)',
                }}>{mod.badge}</span>
              )}
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: `${mod.color}15`,
                border: `1px solid ${mod.color}25`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 8,
              }}>
                <mod.icon size={14} style={{ color: mod.color }} />
              </div>
              <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)' }}>{mod.label}</p>
            </motion.button>
          ))}
        </div>
      </motion.div>

    </div>
  )
}
