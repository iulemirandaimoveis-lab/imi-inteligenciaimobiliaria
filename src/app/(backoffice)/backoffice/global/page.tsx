'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Globe2, MapPin, Search, Filter, Building2, Home, Wheat,
  DollarSign, TrendingUp, ChevronRight, Star, Eye, ArrowUpRight, Banknote
} from 'lucide-react'
import { T } from '../../lib/theme'
import { createClient } from '@/lib/supabase/client'

// ─── Static Demo Data ─────────────────────────────────────────────────────────

const FEATURED_COUNTRIES = [
  { code: 'US', name: 'Estados Unidos', flag: '🇺🇸', city: 'Miami, FL', listings: 0, currency: 'USD', hot: true },
  { code: 'AE', name: 'Emirados Árabes', flag: '🇦🇪', city: 'Dubai',     listings: 0, currency: 'AED', hot: true },
  { code: 'PT', name: 'Portugal',       flag: '🇵🇹', city: 'Lisboa',    listings: 0, currency: 'EUR', hot: false },
  { code: 'PY', name: 'Paraguai',       flag: '🇵🇾', city: 'Assunção',  listings: 0, currency: 'PYG', hot: false },
  { code: 'UY', name: 'Uruguai',        flag: '🇺🇾', city: 'Montevidéu',listings: 0, currency: 'UYU', hot: false },
  { code: 'ES', name: 'Espanha',        flag: '🇪🇸', city: 'Barcelona', listings: 0, currency: 'EUR', hot: false },
  { code: 'IT', name: 'Itália',         flag: '🇮🇹', city: 'Milano',    listings: 0, currency: 'EUR', hot: false },
  { code: 'SG', name: 'Singapura',      flag: '🇸🇬', city: 'Singapore', listings: 0, currency: 'SGD', hot: false },
]

const STATS = [
  { label: 'Países Ativos',    value: '17',   icon: Globe2,    color: '#6366F1' },
  { label: 'Moedas Suportadas',value: '11',   icon: Banknote,  color: '#10B981' },
  { label: 'Advisors na Rede', value: '—',    icon: Star,      color: '#C8A44A' },
  { label: 'Listagens',        value: '—',    icon: Building2, color: '#3B82F6' },
]

const PARTNERSHIP_TYPES = [
  {
    code: 'referral', name: 'Referral',
    desc: 'Envie um cliente para um advisor em outro país e receba 20% da comissão.',
    split: '20/80', color: '#C8A44A',
  },
  {
    code: 'co-agent', name: 'Co-Agent',
    desc: 'Representação conjunta na mesma operação. Comissão dividida 50/50.',
    split: '50/50', color: '#3B82F6',
  },
  {
    code: 'exclusive', name: 'Exclusivo',
    desc: 'Parceria exclusiva por território ou nicho. 30/70 para o advisor local.',
    split: '30/70', color: '#8B5CF6',
  },
  {
    code: 'white-label', name: 'White-Label',
    desc: 'Operação sob a marca IMI em outro país. 40/60 para o advisor local.',
    split: '40/60', color: '#EC4899',
  },
]

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function GlobalPage() {
  const [tab, setTab] = useState<'markets' | 'partnerships' | 'listings'>('markets')
  const [search, setSearch] = useState('')
  const [liveListings, setLiveListings] = useState<number>(0)
  const [advisorsCount, setAdvisorsCount] = useState<number>(0)

  useEffect(() => {
    const load = async () => {
      try {
        const sb = createClient()
        const [propRes, advRes] = await Promise.all([
          sb.from('global_properties').select('id', { count: 'exact', head: true }).eq('is_active', true),
          sb.from('team_members').select('id', { count: 'exact', head: true }),
        ])
        if (propRes.count !== null) setLiveListings(propRes.count)
        if (advRes.count !== null) setAdvisorsCount(advRes.count)
      } catch {
        // graceful: table may not exist yet
      }
    }
    load()
  }, [])

  const tabs = [
    { id: 'markets',      label: 'Mercados',    icon: Globe2 },
    { id: 'listings',     label: 'Listagens',   icon: Building2 },
    { id: 'partnerships', label: 'Parcerias',   icon: TrendingUp },
  ] as const

  const filteredCountries = FEATURED_COUNTRIES.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.city.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ minHeight: '100vh', background: T.base, padding: '24px 20px 100px' }}>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 13,
            background: 'rgba(99,102,241,0.12)',
            border: '1px solid rgba(99,102,241,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Globe2 size={22} color="#6366F1" />
          </div>
          <div>
            <h1 style={{ fontFamily: 'Instrument Serif, serif', fontSize: 26, color: T.text, margin: 0 }}>
              Global Market
            </h1>
            <p style={{ fontSize: 13, color: T.textMuted, margin: 0 }}>
              Imóveis internacionais · Rede IMI Global
            </p>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 10 }}>
          {STATS.map(({ label, value: staticVal, icon: Icon, color }) => {
            const value = label === 'Advisors na Rede' && advisorsCount > 0
              ? String(advisorsCount)
              : label === 'Listagens' && liveListings > 0
              ? String(liveListings)
              : staticVal
            return (
              <div key={label} style={{
                flex: 1, background: T.surface, border: `1px solid ${T.border}`,
                borderRadius: 12, padding: '12px 10px', textAlign: 'center',
              }}>
                <Icon size={16} color={color} style={{ marginBottom: 4 }} />
                <div style={{ fontSize: 18, fontWeight: 700, color }}>{value}</div>
                <div style={{ fontSize: 10, color: T.textMuted }}>{label}</div>
              </div>
            )
          })}
        </div>
      </motion.div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: 4, marginBottom: 24,
        background: T.surface, borderRadius: 12, padding: 4,
        border: `1px solid ${T.border}`,
      }}>
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)} style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '9px 10px', borderRadius: 9, border: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: tab === id ? 600 : 400,
            background: tab === id ? T.elevated : 'transparent',
            color: tab === id ? T.text : T.textMuted,
            transition: 'all 0.2s',
          }}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === 'markets' && (
          <motion.div key="markets" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {/* Search */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: T.surface, border: `1px solid ${T.border}`,
              borderRadius: 12, padding: '10px 14px', marginBottom: 20,
            }}>
              <Search size={16} color={T.textMuted} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar país ou cidade..."
                style={{
                  flex: 1, background: 'transparent', border: 'none', outline: 'none',
                  fontSize: 14, color: T.text,
                }}
              />
            </div>

            {/* Hot markets */}
            {!search && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.textMuted, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Mercados em Destaque
                </div>
                <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
                  {FEATURED_COUNTRIES.filter(c => c.hot).map(c => (
                    <motion.div
                      key={c.code}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      style={{
                        flexShrink: 0, minWidth: 160,
                        background: T.surface, border: `1.5px solid rgba(99,102,241,0.3)`,
                        borderRadius: 16, padding: '16px 14px',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ fontSize: 32, marginBottom: 8 }}>{c.flag}</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 2 }}>{c.name}</div>
                      <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 8 }}>{c.city}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ fontSize: 11, color: '#FF6B35', fontWeight: 700, background: 'rgba(255,107,53,0.12)', padding: '2px 8px', borderRadius: 99 }}>
                          🔥 HOT
                        </span>
                        <span style={{ fontSize: 11, color: T.textMuted }}>{c.currency}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* All countries grid */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.textMuted, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {search ? `Resultados para "${search}"` : 'Todos os Mercados'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {filteredCountries.map((c, i) => (
                  <motion.div
                    key={c.code}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    style={{
                      background: T.surface, border: `1px solid ${T.border}`,
                      borderRadius: 12, padding: '14px 16px',
                      display: 'flex', alignItems: 'center', gap: 12,
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontSize: 28, flexShrink: 0 }}>{c.flag}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{c.name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                        <MapPin size={11} color={T.textMuted} />
                        <span style={{ fontSize: 12, color: T.textMuted }}>{c.city}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 11, color: T.textDim, marginBottom: 2 }}>{c.currency}</div>
                      <ArrowUpRight size={16} color={T.textMuted} />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {tab === 'listings' && (
          <motion.div key="listings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {liveListings === 0 ? (
              <div style={{
                background: T.surface, border: `1px solid ${T.border}`,
                borderRadius: 16, padding: '48px 24px', textAlign: 'center',
              }}>
                <Globe2 size={48} color={T.textDim} style={{ marginBottom: 16 }} />
                <h3 style={{ fontFamily: 'Instrument Serif, serif', fontSize: 20, color: T.text, marginBottom: 8 }}>
                  Listagens Internacionais
                </h3>
                <p style={{ fontSize: 14, color: T.textMuted, maxWidth: 300, margin: '0 auto 20px', lineHeight: 1.6 }}>
                  O marketplace global está sendo preparado. Em breve você poderá listar e buscar imóveis em 17 países.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 280, margin: '0 auto' }}>
                  {[
                    { label: 'Residencial Alto Padrão', icon: Home, color: '#C8A44A' },
                    { label: 'Comercial & Corporativo', icon: Building2, color: '#3B82F6' },
                    { label: 'Rural & Agro',             icon: Wheat, color: '#84CC16' },
                  ].map(({ label, icon: Icon, color }) => (
                    <div key={label} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      background: T.elevated, borderRadius: 10, padding: '10px 14px',
                    }}>
                      <Icon size={16} color={color} />
                      <span style={{ fontSize: 13, color: T.textMuted }}>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ color: T.textMuted, fontSize: 14 }}>
                {liveListings} listagens disponíveis
              </div>
            )}
          </motion.div>
        )}

        {tab === 'partnerships' && (
          <motion.div key="partnerships" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div style={{ marginBottom: 16 }}>
              <h2 style={{ fontFamily: 'Instrument Serif, serif', fontSize: 18, color: T.text, margin: '0 0 4px' }}>
                Modelos de Parceria
              </h2>
              <p style={{ fontSize: 13, color: T.textMuted, margin: 0 }}>
                Colabore com advisors IMI no mundo todo e compartilhe comissões
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {PARTNERSHIP_TYPES.map((p, i) => (
                <motion.div
                  key={p.code}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  style={{
                    background: T.surface, border: `1px solid ${T.border}`,
                    borderRadius: 14, padding: '18px 16px', overflow: 'hidden', position: 'relative',
                  }}
                >
                  <div style={{
                    position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
                    background: p.color, borderRadius: '3px 0 0 3px',
                  }} />
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: T.text, marginBottom: 6 }}>{p.name}</div>
                      <p style={{ fontSize: 13, color: T.textMuted, margin: 0, lineHeight: 1.55 }}>{p.desc}</p>
                    </div>
                    <div style={{
                      flexShrink: 0, background: `${p.color}18`,
                      border: `1px solid ${p.color}40`,
                      borderRadius: 10, padding: '6px 12px', textAlign: 'center',
                    }}>
                      <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 2 }}>Split</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: p.color }}>{p.split}</div>
                    </div>
                  </div>
                  <div style={{ marginTop: 14 }}>
                    <button style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      fontSize: 13, fontWeight: 600, color: p.color,
                      background: `${p.color}12`, border: 'none',
                      padding: '7px 14px', borderRadius: 8, cursor: 'pointer',
                    }}>
                      Iniciar parceria <ChevronRight size={13} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Advisor Network CTA */}
            <div style={{
              marginTop: 20, background: 'rgba(99,102,241,0.08)',
              border: '1px solid rgba(99,102,241,0.25)',
              borderRadius: 16, padding: '20px 18px', textAlign: 'center',
            }}>
              <Globe2 size={32} color="#6366F1" style={{ marginBottom: 12 }} />
              <h3 style={{ fontFamily: 'Instrument Serif, serif', fontSize: 18, color: T.text, marginBottom: 6 }}>
                Rede Global IMI
              </h3>
              <p style={{ fontSize: 13, color: T.textMuted, marginBottom: 14, lineHeight: 1.6 }}>
                Encontre advisors certificados em qualquer país da nossa rede para fechar operações internacionais.
              </p>
              <button style={{
                fontSize: 14, fontWeight: 600, color: '#6366F1',
                background: 'rgba(99,102,241,0.12)',
                border: '1px solid rgba(99,102,241,0.3)',
                padding: '10px 24px', borderRadius: 10, cursor: 'pointer',
              }}>
                Explorar Rede de Advisors
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
