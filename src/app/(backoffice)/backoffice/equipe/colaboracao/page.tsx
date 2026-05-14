'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Users, Building2, MessageSquare, Plus, ChevronRight,
  DollarSign, Handshake, X, Check, Clock, TrendingUp, Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { usePartnerships, acceptPartnership, rejectPartnership, type Partnership } from '@/hooks/use-partnerships'
import { useBrokers, type Broker } from '@/hooks/use-brokers'

/* ─── Status → Stage config ──────────────────────────────────────── */
const STAGE_CONFIG: Record<string, { label: string; color: string }> = {
  proposed:    { label: 'Proposta',   color: '#5B9BD5' },
  negotiating: { label: 'Negociação', color: 'var(--accent-400)' },
  accepted:    { label: 'Aceita',     color: '#5DB887' },
  active:      { label: 'Ativa',      color: 'var(--success)' },
  pending:     { label: 'Pendente',   color: '#D4913A' },
}

function formatCurrency(value: number | null) {
  if (!value) return '—'
  if (value >= 1_000_000) return `R$ ${(value / 1_000_000).toFixed(2).replace('.', ',')}M`
  if (value >= 1_000) return `R$ ${(value / 1_000).toFixed(0)}K`
  return `R$ ${value.toLocaleString('pt-BR')}`
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

function colorForName(name: string) {
  const colors = ['#5B9BD5', '#D4913A', '#5DB887', '#E06B6B', '#9B8FD5', '#C8A44A']
  let h = 0
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xff
  return colors[h % colors.length]
}

/* ─── Deal Card ──────────────────────────────────────────────────── */
function DealCard({ partnership, index }: { partnership: Partnership; index: number }) {
  const stage = STAGE_CONFIG[partnership.status] ?? STAGE_CONFIG.active

  return (
    <div style={{ background: 'var(--bg-elevated)', border: '1px solid rgba(61,111,255,0.15)', borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(61,111,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-outfit, sans-serif)', marginBottom: 2 }}>
              {partnership.property_name ?? 'Imóvel sem nome'}
            </p>
            <p style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-outfit, sans-serif)' }}>
              {formatCurrency(partnership.property_price)}
            </p>
          </div>
          <span style={{
            display: 'inline-flex', padding: '3px 9px', borderRadius: 20,
            background: `${stage.color}18`, border: `1px solid ${stage.color}40`,
            fontSize: 10, fontWeight: 700, color: stage.color,
            fontFamily: 'var(--font-outfit, sans-serif)', textTransform: 'uppercase',
            whiteSpace: 'nowrap', flexShrink: 0,
          }}>
            {stage.label}
          </span>
        </div>

        {/* Owner + Partner with split */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[
            { name: partnership.owner_name, pct: partnership.commission_owner_pct },
            { name: partnership.partner_name, pct: partnership.commission_partner_pct },
          ].filter(b => b.name).map((b, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: colorForName(b.name),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 700, color: '#fff', flexShrink: 0,
              }}>
                {initials(b.name)}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-primary)', fontFamily: 'var(--font-outfit, sans-serif)' }}>
                  {b.name}
                </p>
              </div>
              {b.pct != null && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <DollarSign size={11} style={{ color: 'var(--success)' }} />
                  <span style={{ fontSize: 11, fontFamily: 'var(--font-dm-mono)', color: 'var(--success)', fontWeight: 600 }}>
                    {b.pct}%
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Clock size={11} style={{ color: 'var(--text-tertiary)' }} />
          <span style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'var(--font-outfit, sans-serif)' }}>
            {partnership.last_message_at
              ? new Date(partnership.last_message_at).toLocaleDateString('pt-BR')
              : new Date(partnership.proposed_at).toLocaleDateString('pt-BR')
            }
          </span>
        </div>
        <Link href={`/backoffice/parcerias/${partnership.id}`}>
          <button style={{
            display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 6,
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            color: 'var(--text-secondary)', fontSize: 10, fontFamily: 'var(--font-outfit, sans-serif)', cursor: 'pointer',
          }}>
            <MessageSquare size={10} /> Ver Parceria
          </button>
        </Link>
      </div>
    </div>
  )
}

/* ─── Invite Card ────────────────────────────────────────────────── */
function InviteCard({ partnership, onAction }: { partnership: Partnership; onAction: () => void }) {
  const [loading, setLoading] = useState(false)

  async function handle(action: 'accept' | 'decline') {
    setLoading(true)
    try {
      if (action === 'accept') {
        await acceptPartnership(partnership.id)
        toast.success('Parceria aceita!')
      } else {
        await rejectPartnership(partnership.id, 'Recusado pelo parceiro')
        toast.success('Convite recusado')
      }
      onAction()
    } catch {
      toast.error('Erro ao processar ação')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ background: 'var(--bg-elevated)', border: '1px solid rgba(91,155,213,0.2)', borderRadius: 8, padding: '16px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <div style={{
          width: 42, height: 42, borderRadius: '50%',
          background: colorForName(partnership.owner_name),
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0,
        }}>
          {initials(partnership.owner_name)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-outfit, sans-serif)', marginBottom: 2 }}>
                {partnership.owner_name}
              </p>
              <p style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-outfit, sans-serif)' }}>
                {new Date(partnership.proposed_at).toLocaleDateString('pt-BR')}
              </p>
            </div>
            {partnership.commission_partner_pct != null && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 20,
                background: 'rgba(93,184,135,0.1)', border: '1px solid rgba(93,184,135,0.3)',
                fontSize: 11, fontWeight: 700, color: 'var(--success)', fontFamily: 'var(--font-outfit, sans-serif)',
              }}>
                <DollarSign size={10} /> Sua parte: {partnership.commission_partner_pct}%
              </span>
            )}
          </div>

          {/* Property */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, margin: '10px 0', padding: '8px 12px',
            borderRadius: 6, background: 'rgba(61,111,255,0.05)', border: '1px solid rgba(61,111,255,0.12)',
          }}>
            <Building2 size={13} style={{ color: 'var(--accent-400)', flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)', fontFamily: 'var(--font-outfit, sans-serif)' }}>
                {partnership.property_name ?? 'Imóvel sem nome'}
              </p>
              <p style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'var(--font-outfit, sans-serif)' }}>
                {formatCurrency(partnership.property_price)}
              </p>
            </div>
          </div>

          {/* Last message as context */}
          {partnership.last_message_preview && (
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'var(--font-outfit, sans-serif)', lineHeight: 1.6, marginBottom: 12 }}>
              "{partnership.last_message_preview}"
            </p>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => handle('accept')}
              disabled={loading}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '8px', borderRadius: 6, background: 'rgba(93,184,135,0.12)',
                border: '1px solid rgba(93,184,135,0.3)', color: 'var(--success)',
                fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-outfit, sans-serif)', cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={12} />}
              Aceitar
            </button>
            <button
              onClick={() => handle('decline')}
              disabled={loading}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '8px', borderRadius: 6, background: 'rgba(224,107,107,0.08)',
                border: '1px solid rgba(224,107,107,0.2)', color: 'var(--error)',
                fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-outfit, sans-serif)', cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              <X size={12} /> Recusar
            </button>
            <Link href={`/backoffice/parcerias/${partnership.id}`}>
              <button style={{
                display: 'flex', alignItems: 'center', gap: 4, padding: '8px 12px', borderRadius: 6,
                background: 'transparent', border: '1px solid rgba(255,255,255,0.08)',
                color: 'var(--text-secondary)', fontSize: 12, fontFamily: 'var(--font-outfit, sans-serif)', cursor: 'pointer',
              }}>
                <MessageSquare size={12} /> Ver
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Broker Row ─────────────────────────────────────────────────── */
function BrokerRow({ broker, isLast, presenceStatus }: { broker: Broker; isLast: boolean; presenceStatus?: string }) {
  const ROLE_LABELS: Record<string, string> = {
    broker: 'Corretor',
    broker_manager: 'Gerente',
    admin: 'Admin',
  }
  const color = colorForName(broker.name)
  const inits = initials(broker.name)
  const isActive = broker.status === 'active'
  const isOnline = presenceStatus === 'online'

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px',
      borderBottom: !isLast ? '1px solid rgba(61,111,255,0.06)' : 'none',
    }}>
      <div style={{ position: 'relative', flexShrink: 0 }}>
        {broker.avatar_url ? (
          <img src={broker.avatar_url} alt={broker.name} loading="lazy" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff' }}>
            {inits}
          </div>
        )}
        <div style={{
          position: 'absolute', bottom: 1, right: 1, width: 10, height: 10, borderRadius: '50%',
          background: isOnline ? '#4ADE80' : 'var(--text-tertiary)',
          border: '2px solid var(--bg-elevated)',
        }} />
      </div>

      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', fontFamily: 'var(--font-outfit, sans-serif)', marginBottom: 2 }}>
          {broker.name}
        </p>
        <p style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-outfit, sans-serif)' }}>
          {ROLE_LABELS[broker.role] ?? broker.role}
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
        <span style={{ fontSize: 11, color: isActive ? 'var(--success)' : 'var(--text-tertiary)', fontFamily: 'var(--font-outfit, sans-serif)' }}>
          {isActive ? 'Ativo' : 'Inativo'}
        </span>
      </div>

      <div style={{ display: 'flex', gap: 6 }}>
        <Link href="/backoffice/parcerias">
          <button style={{
            display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 6,
            background: 'rgba(61,111,255,0.06)', border: '1px solid rgba(61,111,255,0.18)',
            color: 'var(--accent-400)', fontSize: 10, fontWeight: 600,
            fontFamily: 'var(--font-outfit, sans-serif)', cursor: 'pointer',
          }}>
            <Handshake size={10} /> Parceria
          </button>
        </Link>
        <Link href="/backoffice/connect">
          <button style={{
            display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 6,
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            color: 'var(--text-secondary)', fontSize: 10, fontFamily: 'var(--font-outfit, sans-serif)', cursor: 'pointer',
          }}>
            <MessageSquare size={10} /> Chat
          </button>
        </Link>
      </div>
    </div>
  )
}

/* ─── Main Page ──────────────────────────────────────────────────── */
export default function ColaboracaoPage() {
  const ACTIVE_STATUSES = ['active', 'accepted', 'negotiating']
  const INVITE_STATUSES = ['proposed', 'pending']

  const { partnerships: activeDeals, isLoading: loadingDeals, mutate: mutateDeals } =
    usePartnerships({ status: 'active' })
  const { partnerships: negotiating, mutate: mutateNeg } =
    usePartnerships({ status: 'negotiating' })
  const { partnerships: accepted, mutate: mutateAcc } =
    usePartnerships({ status: 'accepted' })
  const { partnerships: invites, isLoading: loadingInvites, mutate: mutateInvites } =
    usePartnerships({ status: 'proposed' })
  const { brokers, isLoading: loadingBrokers } = useBrokers({ status: 'active' })

  const [presenceMap, setPresenceMap] = useState<Map<string, string>>(new Map())

  useEffect(() => {
    const supabase = createClient()
    supabase.from('user_presence').select('user_id,status').then(({ data }) => {
      if (data) {
        const map = new Map<string, string>()
        data.forEach((p: { user_id: string; status: string }) => map.set(p.user_id, p.status))
        setPresenceMap(map)
      }
    })
  }, [])

  const allActiveDeals = [...activeDeals, ...negotiating, ...accepted]
  const activeBrokers = brokers.filter(b => b.status === 'active')

  function refreshAll() {
    mutateDeals()
    mutateNeg()
    mutateAcc()
    mutateInvites()
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', fontFamily: 'var(--font-outfit, sans-serif)' }}>
      {/* Header */}
      <header style={{ padding: '24px 32px 20px', borderBottom: '1px solid rgba(61,111,255,0.12)', background: 'var(--bg-elevated)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'linear-gradient(rgba(61,111,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(61,111,255,0.015) 1px, transparent 1px)', backgroundSize: '52px 52px' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
            <span style={{ fontSize: 8.5, letterSpacing: 3, textTransform: 'uppercase' as const, color: 'var(--accent-400)', fontFamily: 'var(--font-outfit, sans-serif)', fontWeight: 700 }}>IMI</span>
            <span style={{ color: 'rgba(61,111,255,0.3)', fontSize: 11 }}>›</span>
            <Link href="/backoffice/equipe"><span style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase' as const, color: 'var(--text-tertiary)', fontFamily: 'var(--font-outfit, sans-serif)', cursor: 'pointer' }}>Equipe</span></Link>
            <span style={{ color: 'rgba(61,111,255,0.3)', fontSize: 11 }}>›</span>
            <span style={{ fontSize: 8.5, letterSpacing: 3, textTransform: 'uppercase' as const, color: 'var(--accent-400)', fontFamily: 'var(--font-outfit, sans-serif)', fontWeight: 700 }}>Colaboração</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{ fontFamily: 'var(--font-playfair, serif)', fontSize: 28, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4, lineHeight: 1.1 }}>
                IMI <em style={{ fontStyle: 'italic', color: 'var(--accent-400)' }}>Connect</em>
              </h1>
              <p style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 300 }}>
                Co-brokagem · parcerias · splits de comissão
              </p>
            </div>
            <Link href="/backoffice/parcerias">
              <button style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 6,
                background: 'var(--accent-400)', border: 'none',
                color: '#0B1120', fontSize: 12, fontWeight: 700, letterSpacing: 1,
                textTransform: 'uppercase', fontFamily: 'var(--font-outfit, sans-serif)', cursor: 'pointer',
              }}>
                <Plus size={14} /> Nova Parceria
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <div style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 32 }}>

        {/* ── Section 1: Em Andamento ── */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <TrendingUp size={15} style={{ color: 'var(--accent-400)' }} />
            <span style={{ fontSize: 8.5, letterSpacing: 3, textTransform: 'uppercase' as const, color: 'var(--accent-400)', fontWeight: 700 }}>Em Andamento</span>
            {!loadingDeals && (
              <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>— {allActiveDeals.length} parcerias ativas</span>
            )}
          </div>

          {loadingDeals ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '24px', color: 'var(--text-tertiary)' }}>
              <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
              <span style={{ fontSize: 13 }}>Carregando parcerias...</span>
            </div>
          ) : allActiveDeals.length === 0 ? (
            <div style={{ padding: '32px 24px', textAlign: 'center', background: 'var(--bg-elevated)', border: '1px solid rgba(61,111,255,0.1)', borderRadius: 8 }}>
              <TrendingUp size={32} style={{ color: 'rgba(61,111,255,0.2)', margin: '0 auto 10px' }} />
              <p style={{ fontSize: 13, color: 'var(--text-tertiary)', fontFamily: 'var(--font-outfit, sans-serif)' }}>Nenhuma parceria ativa</p>
              <Link href="/backoffice/parcerias">
                <button style={{ marginTop: 12, padding: '8px 16px', borderRadius: 6, border: '1px solid rgba(61,111,255,0.2)', background: 'transparent', color: 'var(--accent-400)', fontSize: 12, cursor: 'pointer' }}>
                  Criar primeira parceria
                </button>
              </Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
              {allActiveDeals.map(p => (
                <DealCard key={p.id} partnership={p} index={0} />
              ))}
            </div>
          )}
        </section>

        {/* ── Section 2: Convites de Parceria ── */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <Handshake size={15} style={{ color: '#5B9BD5' }} />
            <span style={{ fontSize: 8.5, letterSpacing: 3, textTransform: 'uppercase' as const, color: '#5B9BD5', fontWeight: 700 }}>Convites de Parceria</span>
            {invites.length > 0 && (
              <span style={{ display: 'inline-flex', padding: '2px 7px', borderRadius: 10, background: '#5B9BD520', border: '1px solid #5B9BD540', fontSize: 10, fontWeight: 700, color: '#5B9BD5' }}>
                {invites.length}
              </span>
            )}
          </div>

          {loadingInvites ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '24px', color: 'var(--text-tertiary)' }}>
              <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
              <span style={{ fontSize: 13 }}>Carregando convites...</span>
            </div>
          ) : invites.length === 0 ? (
            <div style={{ padding: '32px 24px', textAlign: 'center', background: 'var(--bg-elevated)', border: '1px solid rgba(61,111,255,0.1)', borderRadius: 8 }}>
              <Handshake size={32} style={{ color: 'rgba(61,111,255,0.2)', margin: '0 auto 10px' }} />
              <p style={{ fontSize: 13, color: 'var(--text-tertiary)', fontFamily: 'var(--font-outfit, sans-serif)' }}>Nenhum convite pendente</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {invites.map(invite => (
                <InviteCard key={invite.id} partnership={invite} onAction={refreshAll} />
              ))}
            </div>
          )}
        </section>

        {/* ── Section 3: Minha Equipe ── */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <Users size={15} style={{ color: 'var(--success)' }} />
            <span style={{ fontSize: 8.5, letterSpacing: 3, textTransform: 'uppercase' as const, color: 'var(--success)', fontWeight: 700 }}>Minha Equipe</span>
            {!loadingBrokers && (
              <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>— {activeBrokers.length} corretores ativos</span>
            )}
          </div>

          {loadingBrokers ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '24px', color: 'var(--text-tertiary)' }}>
              <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
              <span style={{ fontSize: 13 }}>Carregando equipe...</span>
            </div>
          ) : brokers.length === 0 ? (
            <div style={{ padding: '32px 24px', textAlign: 'center', background: 'var(--bg-elevated)', border: '1px solid rgba(61,111,255,0.1)', borderRadius: 8 }}>
              <Users size={32} style={{ color: 'rgba(61,111,255,0.2)', margin: '0 auto 10px' }} />
              <p style={{ fontSize: 13, color: 'var(--text-tertiary)', fontFamily: 'var(--font-outfit, sans-serif)' }}>Nenhum corretor cadastrado</p>
              <Link href="/backoffice/equipe">
                <button style={{ marginTop: 12, padding: '8px 16px', borderRadius: 6, border: '1px solid rgba(61,111,255,0.2)', background: 'transparent', color: 'var(--accent-400)', fontSize: 12, cursor: 'pointer' }}>
                  Gerenciar equipe
                </button>
              </Link>
            </div>
          ) : (
            <div style={{ background: 'var(--bg-elevated)', border: '1px solid rgba(61,111,255,0.12)', borderRadius: 8, overflow: 'hidden' }}>
              {brokers.map((broker, i) => (
                <BrokerRow key={broker.id} broker={broker} isLast={i === brokers.length - 1} presenceStatus={presenceMap.get(broker.user_id)} />
              ))}
            </div>
          )}
        </section>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
