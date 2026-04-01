'use client'

import { useEffect, useState } from 'react'
import {
  CheckCircle2, XCircle, Clock, GitBranch, GitCommit,
  Rocket, Shield, TestTube, FileCode, Bell, Package,
  RefreshCw, Server,
} from 'lucide-react'
import { PageIntelHeader } from '../../../components/ui'

// ── DS3 inline style helpers ─────────────────────────────────────────────────
const card: React.CSSProperties = {
  background: 'var(--bg-surface)',
  border: '1px solid var(--border-subtle)',
  borderRadius: 'var(--r-xl, 4px)',
  boxShadow: 'var(--shadow-xs)',
  padding: 24,
}

const statusBadge = (ok: boolean): React.CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '4px 10px',
  borderRadius: 'var(--r-md, 4px)',
  fontSize: 12,
  fontWeight: 600,
  fontFamily: 'var(--font-mono)',
  color: ok ? 'var(--success)' : 'var(--warning)',
  background: ok
    ? 'color-mix(in srgb, var(--success) 10%, transparent)'
    : 'color-mix(in srgb, var(--warning) 10%, transparent)',
  border: `1px solid ${ok
    ? 'color-mix(in srgb, var(--success) 25%, transparent)'
    : 'color-mix(in srgb, var(--warning) 25%, transparent)'}`,
})

const metaLabel: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 11,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: 'var(--text-tertiary)',
  marginBottom: 4,
}

const metaValue: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 500,
  color: 'var(--text-primary)',
  fontFamily: 'var(--font-mono)',
  wordBreak: 'break-all',
}

// ── Checklist items ──────────────────────────────────────────────────────────
interface CheckItem {
  label: string
  description: string
  status: 'pass' | 'warn' | 'info'
  icon: React.ReactNode
}

const CHECKLIST: CheckItem[] = [
  {
    label: 'TypeScript',
    description: 'Strict type-checking com tsc --noEmit',
    status: 'pass',
    icon: <FileCode size={16} />,
  },
  {
    label: 'Testes automatizados',
    description: 'Jest + React Testing Library (src/__tests__)',
    status: 'pass',
    icon: <TestTube size={16} />,
  },
  {
    label: 'Build Next.js',
    description: 'next build com eslint.ignoreDuringBuilds (temporario)',
    status: 'warn',
    icon: <Package size={16} />,
  },
  {
    label: 'ESLint',
    description: 'next/core-web-vitals + @typescript-eslint',
    status: 'warn',
    icon: <Shield size={16} />,
  },
  {
    label: 'Push Notifications',
    description: 'Service worker com next-pwa + workbox',
    status: 'pass',
    icon: <Bell size={16} />,
  },
  {
    label: 'Security Headers',
    description: 'CSP, HSTS, X-Frame-Options, X-Content-Type-Options',
    status: 'pass',
    icon: <Shield size={16} />,
  },
  {
    label: 'RLS Policies',
    description: 'Row Level Security auditada (2026-03-27)',
    status: 'pass',
    icon: <Shield size={16} />,
  },
  {
    label: 'Sentry Monitoring',
    description: 'Error tracking e performance monitoring',
    status: 'pass',
    icon: <Server size={16} />,
  },
  {
    label: 'CI Pipeline',
    description: 'GitHub Actions: typecheck, test, build, security',
    status: 'pass',
    icon: <RefreshCw size={16} />,
  },
]

// ── Page component ───────────────────────────────────────────────────────────
export default function DeployChecklistPage() {
  const [buildTime, setBuildTime] = useState<string>('')

  useEffect(() => {
    setBuildTime(new Date().toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      dateStyle: 'long',
      timeStyle: 'short',
    }))
  }, [])

  const branch = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF || 'local'
  const commitSha = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || 'dev'
  const commitMsg = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_MESSAGE || '-'
  const env = process.env.NEXT_PUBLIC_VERCEL_ENV || 'development'

  const passCount = CHECKLIST.filter(i => i.status === 'pass').length
  const totalCount = CHECKLIST.length

  return (
    <div style={{ padding: '0 0 48px' }}>
      <PageIntelHeader
        moduleLabel="SETTINGS"
        title="Deploy Checklist"
        subtitle="Status dos checks de qualidade e informacoes do build"
        breadcrumbs={[
          { label: 'Settings', href: '/backoffice/settings' },
          { label: 'Deploy Checklist' },
        ]}
        badge={{ label: `${passCount}/${totalCount}`, color: passCount === totalCount ? 'success' : 'warning' }}
      />

      {/* ── Build metadata ──────────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 16,
        marginBottom: 32,
      }}>
        <div style={card}>
          <div style={metaLabel}>
            <GitBranch size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
            Branch
          </div>
          <div style={metaValue}>{branch}</div>
        </div>

        <div style={card}>
          <div style={metaLabel}>
            <GitCommit size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
            Commit
          </div>
          <div style={metaValue}>
            {commitSha.length > 7 ? commitSha.slice(0, 7) : commitSha}
          </div>
        </div>

        <div style={card}>
          <div style={metaLabel}>
            <Rocket size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
            Ambiente
          </div>
          <div style={metaValue}>{env}</div>
        </div>

        <div style={card}>
          <div style={metaLabel}>
            <Clock size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
            Acessado em
          </div>
          <div style={metaValue}>{buildTime || '...'}</div>
        </div>
      </div>

      {/* ── Commit message ──────────────────────────────────────────────── */}
      {commitMsg !== '-' && (
        <div style={{ ...card, marginBottom: 32 }}>
          <div style={metaLabel}>Ultimo commit</div>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)', fontStyle: 'italic' }}>
            {commitMsg}
          </div>
        </div>
      )}

      {/* ── Checklist ───────────────────────────────────────────────────── */}
      <div style={card}>
        <h3 style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 18,
          fontWeight: 700,
          color: 'var(--text-primary)',
          margin: '0 0 20px',
        }}>
          Checklist de Qualidade
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {CHECKLIST.map((item) => (
            <div
              key={item.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '14px 16px',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--r-lg, 4px)',
              }}
            >
              <div style={{
                width: 32,
                height: 32,
                borderRadius: 'var(--r-md, 4px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: item.status === 'pass'
                  ? 'color-mix(in srgb, var(--success) 12%, transparent)'
                  : 'color-mix(in srgb, var(--warning) 12%, transparent)',
                color: item.status === 'pass' ? 'var(--success)' : 'var(--warning)',
                flexShrink: 0,
              }}>
                {item.icon}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontWeight: 600,
                  fontSize: 14,
                  color: 'var(--text-primary)',
                  marginBottom: 2,
                }}>
                  {item.label}
                </div>
                <div style={{
                  fontSize: 12,
                  color: 'var(--text-tertiary)',
                }}>
                  {item.description}
                </div>
              </div>

              <div style={statusBadge(item.status === 'pass')}>
                {item.status === 'pass'
                  ? <><CheckCircle2 size={13} /> OK</>
                  : <><XCircle size={13} /> PENDENTE</>
                }
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Notes ───────────────────────────────────────────────────────── */}
      <div style={{
        ...card,
        marginTop: 24,
        borderLeft: '3px solid var(--accent-400)',
      }}>
        <h4 style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--accent-400)',
          margin: '0 0 8px',
        }}>
          Proximos passos
        </h4>
        <ul style={{
          margin: 0,
          paddingLeft: 20,
          fontSize: 13,
          color: 'var(--text-secondary)',
          lineHeight: 1.8,
        }}>
          <li>Corrigir warnings de ESLint e desativar <code>eslint.ignoreDuringBuilds</code></li>
          <li>Adicionar lint check obrigatorio no CI (remover continue-on-error)</li>
          <li>Configurar Vercel env secrets no GitHub Actions para build completo</li>
        </ul>
      </div>
    </div>
  )
}
