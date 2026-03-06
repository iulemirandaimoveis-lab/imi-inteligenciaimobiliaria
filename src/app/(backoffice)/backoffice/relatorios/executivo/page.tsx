'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart3, TrendingUp, TrendingDown, Users, Building2,
  Globe, Target, ChevronRight, RefreshCw, Download, Loader2,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const T = {
  surface: 'var(--bo-surface)',
  elevated: 'var(--bo-elevated)',
  border: 'var(--bo-border)',
  text: 'var(--bo-text)',
  textMuted: 'var(--bo-text-muted)',
  accent: '#3B82F6',
}

type Period = 'monthly' | 'quarterly' | 'yearly'

const MONTHS_SHORT = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ']

// Mock sales velocity data (% of peak)
const VELOCITY_DATA: Record<Period, number[]> = {
  monthly:   [35, 48, 62, 55, 78, 95, 82, 71, 88, 92, 76, 85],
  quarterly: [48, 68, 95, 72],
  yearly:    [42, 67, 58, 85, 95, 72],
}

const CHANNEL_DATA = [
  { label: 'Meta Ads',      pct: 42, color: '#3B82F6' },
  { label: 'Google Search', pct: 31, color: '#8B5CF6' },
  { label: 'Direct Link',   pct: 18, color: '#4ADE80' },
  { label: 'Referral',      pct: 9,  color: '#FBBF24' },
]

const TOP_AGENTS = [
  { initials: 'RM', name: 'Ricardo M.', leads: 142, conv: 6.2, volume: 3.2, color: '#3B82F6' },
  { initials: 'AS', name: 'Ana Silva',  leads: 98,  conv: 5.8, volume: 2.8, color: '#A78BFA' },
  { initials: 'FL', name: 'Fabio L.',   leads: 115, conv: 4.1, volume: 1.9, color: '#4ADE80' },
]

export default function RelatoriosExecutivoPage() {
  const [period, setPeriod] = useState<Period>('monthly')
  const [loading, setLoading] = useState(true)
  const [pipeline, setPipeline] = useState('12.4')
  const [conversion, setConversion] = useState('4.82')
  const [totalLeads, setTotalLeads] = useState(355)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const supabase = createClient()
        const { count } = await supabase.from('leads').select('*', { count: 'exact', head: true })
        if (count) setTotalLeads(count)
      } catch { /* use defaults */ }
      setLoading(false)
    }
    load()
  }, [])

  const velocityData = VELOCITY_DATA[period]
  const maxVelocity = Math.max(...velocityData)
  const periodLabels = period === 'monthly'
    ? MONTHS_SHORT.slice(0, velocityData.length)
    : period === 'quarterly'
      ? ['T1', 'T2', 'T3', 'T4']
      : ['2021', '2022', '2023', '2024', '2025', '2026'].slice(0, velocityData.length)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          <div>
            <p style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.12em', color: '#3B82F6', textTransform: 'uppercase', marginBottom: '4px' }}>
              INTELLIGENCE OS
            </p>
            <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--bo-text)', lineHeight: 1.15 }}>
              Global Reports
            </h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '36px', padding: '0 14px', borderRadius: '10px', fontSize: '12px', fontWeight: 700, color: 'var(--bo-text-muted)', background: 'var(--bo-elevated)', border: '1px solid var(--bo-border)', cursor: 'pointer' }}>
              <Download size={14} />
              Exportar
            </button>
            <button style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px', background: 'var(--bo-elevated)', border: '1px solid var(--bo-border)', cursor: 'pointer' }}>
              <RefreshCw size={14} color="var(--bo-text-muted)" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* ── Period Tabs ──────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}>
        <div style={{ display: 'inline-flex', background: 'var(--bo-elevated)', border: '1px solid var(--bo-border)', borderRadius: '14px', padding: '4px', gap: '2px' }}>
          {(['monthly', 'quarterly', 'yearly'] as Period[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{
                height: '34px', padding: '0 18px', borderRadius: '10px',
                fontSize: '13px', fontWeight: 700, cursor: 'pointer', border: 'none',
                transition: 'all 0.2s',
                background: period === p ? '#3B82F6' : 'transparent',
                color: period === p ? '#fff' : 'var(--bo-text-muted)',
              }}
            >
              {p === 'monthly' ? 'Mensal' : p === 'quarterly' ? 'Trimestral' : 'Anual'}
            </button>
          ))}
        </div>
      </motion.div>

      {/* ── KPI Cards ────────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {/* Pipeline */}
          <div style={{ background: 'var(--bo-surface)', border: '1px solid var(--bo-border)', borderRadius: '18px', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Target size={14} color="#3B82F6" />
              </div>
              <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--bo-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Est. Pipeline
              </span>
            </div>
            <p style={{ fontSize: '28px', fontWeight: 800, color: 'var(--bo-text)', lineHeight: 1.1, marginBottom: '6px' }}>
              {loading ? '—' : `R$ ${pipeline}M`}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <TrendingUp size={12} color="#4ADE80" />
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#4ADE80' }}>+12.4% vs mês ant.</span>
            </div>
          </div>

          {/* Conversion */}
          <div style={{ background: 'var(--bo-surface)', border: '1px solid var(--bo-border)', borderRadius: '18px', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(167,139,250,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BarChart3 size={14} color="#A78BFA" />
              </div>
              <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--bo-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Conversão
              </span>
            </div>
            <p style={{ fontSize: '28px', fontWeight: 800, color: 'var(--bo-text)', lineHeight: 1.1, marginBottom: '6px' }}>
              {loading ? '—' : `${conversion}%`}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <TrendingDown size={12} color="#F87171" />
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#F87171' }}>-0.5% vs mês ant.</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Sales Velocity Trend ─────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
        <div style={{ background: 'var(--bo-surface)', border: '1px solid var(--bo-border)', borderRadius: '18px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--bo-text)' }}>Sales Velocity Trend</p>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#3B82F6' }}>
              {period === 'monthly' ? 'Units / Mês' : period === 'quarterly' ? 'Units / Trimestre' : 'Units / Ano'}
            </span>
          </div>

          {/* Chart area */}
          <div style={{ position: 'relative', height: '120px', marginBottom: '12px' }}>
            {/* Gradient background */}
            <svg width="100%" height="100%" viewBox={`0 0 ${velocityData.length * 60} 120`} preserveAspectRatio="none" style={{ position: 'absolute', inset: 0 }}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.02" />
                </linearGradient>
              </defs>
              {/* Area fill */}
              <path
                d={[
                  `M 0 ${120 - (velocityData[0] / maxVelocity) * 100}`,
                  ...velocityData.slice(1).map((v, i) => `L ${(i + 1) * 60} ${120 - (v / maxVelocity) * 100}`),
                  `L ${(velocityData.length - 1) * 60} 120 L 0 120 Z`,
                ].join(' ')}
                fill="url(#areaGrad)"
              />
              {/* Line */}
              <polyline
                points={velocityData.map((v, i) => `${i * 60},${120 - (v / maxVelocity) * 100}`).join(' ')}
                fill="none"
                stroke="#3B82F6"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Dots on peaks */}
              {velocityData.map((v, i) => v === maxVelocity && (
                <circle key={i} cx={i * 60} cy={120 - (v / maxVelocity) * 100} r="4" fill="#3B82F6" />
              ))}
            </svg>
          </div>

          {/* X-axis labels */}
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid var(--bo-border)' }}>
            {periodLabels.map((label, i) => (
              <span key={i} style={{ fontSize: '9px', fontWeight: 600, color: 'var(--bo-text-muted)', letterSpacing: '0.04em' }}>{label}</span>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── Property Category + Leads by Channel ─────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {/* Property Category */}
          <div style={{ background: 'var(--bo-surface)', border: '1px solid var(--bo-border)', borderRadius: '18px', padding: '20px' }}>
            <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--bo-text)', marginBottom: '16px' }}>Property Category</p>

            {/* Donut chart */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
              <div style={{ position: 'relative', width: '80px', height: '80px' }}>
                <svg viewBox="0 0 80 80" width="80" height="80">
                  {/* Background circle */}
                  <circle cx="40" cy="40" r="32" fill="none" stroke="var(--bo-elevated)" strokeWidth="10" />
                  {/* Residential 75% */}
                  <circle
                    cx="40" cy="40" r="32" fill="none"
                    stroke="#3B82F6" strokeWidth="10"
                    strokeDasharray={`${2 * Math.PI * 32 * 0.75} ${2 * Math.PI * 32}`}
                    strokeLinecap="round"
                    transform="rotate(-90 40 40)"
                  />
                  {/* Commercial 25% */}
                  <circle
                    cx="40" cy="40" r="32" fill="none"
                    stroke="#8B5CF6" strokeWidth="10"
                    strokeDasharray={`${2 * Math.PI * 32 * 0.25} ${2 * Math.PI * 32}`}
                    strokeDashoffset={`-${2 * Math.PI * 32 * 0.75}`}
                    strokeLinecap="round"
                    transform="rotate(-90 40 40)"
                  />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--bo-text)' }}>75%</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3B82F6', flexShrink: 0 }} />
                <span style={{ fontSize: '11px', color: 'var(--bo-text-muted)', flex: 1 }}>Residencial</span>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--bo-text)' }}>75%</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#8B5CF6', flexShrink: 0 }} />
                <span style={{ fontSize: '11px', color: 'var(--bo-text-muted)', flex: 1 }}>Comercial</span>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--bo-text)' }}>25%</span>
              </div>
            </div>
          </div>

          {/* Leads by Channel */}
          <div style={{ background: 'var(--bo-surface)', border: '1px solid var(--bo-border)', borderRadius: '18px', padding: '20px' }}>
            <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--bo-text)', marginBottom: '16px' }}>Leads por Canal</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {CHANNEL_DATA.map(ch => (
                <div key={ch.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--bo-text-muted)' }}>{ch.label}</span>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--bo-text)' }}>{ch.pct}%</span>
                  </div>
                  <div style={{ height: '6px', borderRadius: '3px', background: 'var(--bo-elevated)', overflow: 'hidden' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${ch.pct}%` }}
                      transition={{ delay: 0.3, duration: 0.7, ease: 'easeOut' }}
                      style={{ height: '100%', borderRadius: '3px', background: ch.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Top Performance ──────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.20 }}>
        <div style={{ background: 'var(--bo-surface)', border: '1px solid var(--bo-border)', borderRadius: '18px', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--bo-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--bo-text)' }}>Top Performance (Agente)</span>
            <button style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700, color: '#3B82F6', background: 'none', border: 'none', cursor: 'pointer' }}>
              Full List <ChevronRight size={13} />
            </button>
          </div>

          {/* Column headers */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 60px 70px', gap: '12px', padding: '10px 20px', borderBottom: '1px solid var(--bo-border)' }}>
            <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--bo-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Consultor</span>
            <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--bo-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'center' }}>Leads</span>
            <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--bo-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'center' }}>Conv.%</span>
            <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--bo-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'right' }}>Volume</span>
          </div>

          {/* Rows */}
          {TOP_AGENTS.map((agent, idx) => (
            <motion.div
              key={agent.name}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 + idx * 0.06 }}
              style={{ display: 'grid', gridTemplateColumns: '1fr 60px 60px 70px', gap: '12px', padding: '14px 20px', borderBottom: idx < TOP_AGENTS.length - 1 ? '1px solid var(--bo-border)' : 'none', alignItems: 'center' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: `${agent.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: agent.color }}>{agent.initials}</span>
                </div>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--bo-text)' }}>{agent.name}</span>
              </div>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--bo-text)', textAlign: 'center' }}>{agent.leads}</span>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#4ADE80', textAlign: 'center' }}>{agent.conv}%</span>
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#3B82F6', textAlign: 'right' }}>R${agent.volume}M</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ── Total Leads Indicator ────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}>
        <div style={{ background: 'linear-gradient(135deg, #1E3A5F 0%, #0F172A 100%)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '18px', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>Total Leads Capturados</p>
            <p style={{ fontSize: '32px', fontWeight: 800, color: '#fff' }}>
              {loading ? <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} /> : totalLeads.toLocaleString('pt-BR')}
            </p>
          </div>
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={26} color="#3B82F6" />
          </div>
        </div>
      </motion.div>

    </div>
  )
}
