'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { T, cardStyle } from '@/app/(backoffice)/lib/theme'
import { toast } from 'sonner'
import Image from 'next/image'
import {
  Building2, Search, Upload, Globe, Filter, Plus,
  ChevronRight, Star, FileText, Loader2, X, ExternalLink,
  MapPin, Tag, Calendar, TrendingUp,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────
interface Developer {
  id: string
  name: string
  slug: string
  logo_url: string | null
  website: string | null
  country: string
  state: string | null
  city: string | null
  market: string[]
  segment: string[]
  zones: string[]
  partnership_status: string
  founded_year: number | null
  stock_ticker: string | null
  tags: string[]
  annual_sales_volume: number | null
  annual_vgv: number | null
}

interface PropertyImport {
  id: string
  source_filename: string
  status: string
  properties_created: number
  created_at: string
  developer_id: string | null
}

// ── Constants ─────────────────────────────────────
const COUNTRIES: Record<string, string> = { BR: 'Brasil', US: 'EUA', AE: 'Dubai/UAE' }
const FLAGS: Record<string, string> = { BR: '\u{1F1E7}\u{1F1F7}', US: '\u{1F1FA}\u{1F1F8}', AE: '\u{1F1E6}\u{1F1EA}' }
const SEGMENTS: Record<string, string> = {
  ultra_luxo: 'Ultra Luxo', luxo: 'Luxo', alto_padrao: 'Alto Padr\u00e3o',
  medio: 'M\u00e9dio', popular: 'Popular', mcmv: 'MCMV', economico: 'Econ\u00f4mico',
}
const STATUS_COLORS: Record<string, string> = {
  prospect: 'var(--text-secondary)', active: 'var(--success)', inactive: 'var(--error)',
  suspended: 'var(--warning)', vip: 'var(--accent-400)',
}
const STATUS_LABELS: Record<string, string> = {
  prospect: 'Prospect', active: 'Ativo', inactive: 'Inativo',
  suspended: 'Suspenso', vip: 'VIP',
}
const IMPORT_STATUS_COLORS: Record<string, string> = {
  processing: 'var(--warning)', completed: 'var(--success)',
  partial: 'var(--accent-400)', failed: 'var(--error)',
}

// ── Main Page ─────────────────────────────────────
export default function FornecedoresPage() {
  const supabase = createClient()
  const [developers, setDevelopers] = useState<Developer[]>([])
  const [imports, setImports] = useState<PropertyImport[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [countryFilter, setCountryFilter] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'catalog' | 'imports'>('catalog')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    const [{ data: devs }, { data: imps }] = await Promise.all([
      supabase.from('developers').select('*').order('name'),
      supabase.from('property_imports').select('*').order('created_at', { ascending: false }).limit(20),
    ])
    setDevelopers(devs ?? [])
    setImports(imps ?? [])
    setLoading(false)
  }, [supabase])

  useEffect(() => { loadData() }, [loadData])

  const filtered = developers.filter(d => {
    if (search && !d.name.toLowerCase().includes(search.toLowerCase()) && !d.city?.toLowerCase().includes(search.toLowerCase())) return false
    if (countryFilter && d.country !== countryFilter) return false
    if (statusFilter && d.partnership_status !== statusFilter) return false
    return true
  })

  const stats = {
    total: developers.length,
    active: developers.filter(d => d.partnership_status === 'active').length,
    vip: developers.filter(d => d.partnership_status === 'vip').length,
    countries: new Set(developers.map(d => d.country)).size,
  }

  // PDF Upload handler
  const handleUpload = async (file: File) => {
    if (!file || !file.name.endsWith('.pdf')) {
      toast.error('Apenas arquivos PDF')
      return
    }
    setUploading(true)
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve((reader.result as string).split(',')[1])
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      const res = await fetch('/api/parse-property-book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdf_base64: base64, filename: file.name }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`Extraidos ${data.properties_created} imoveis de "${file.name}"`)
        loadData()
      } else {
        toast.error(data.error || 'Erro ao processar PDF')
      }
    } catch (err) {
      toast.error('Erro ao enviar PDF')
      console.error(err)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: T.text, margin: 0, fontFamily: T.font.display }}>
            Fornecedores & Catalogo
          </h1>
          <p style={{ fontSize: 13, color: T.textDim, marginTop: 4 }}>
            CRM de construtoras, catalogo de imoveis e parser de books
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input ref={fileRef} type="file" accept=".pdf" hidden onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0])} />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
              background: 'var(--accent-400)', color: '#fff', border: 'none',
              borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {uploading ? 'Processando...' : 'Upload Book PDF'}
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Fornecedores', value: stats.total, icon: Building2 },
          { label: 'Ativos', value: stats.active, icon: Star, color: 'var(--success)' },
          { label: 'VIP', value: stats.vip, icon: TrendingUp, color: 'var(--accent-400)' },
          { label: 'Paises', value: stats.countries, icon: Globe },
        ].map((kpi, i) => (
          <div key={i} style={{ ...cardStyle, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: `${kpi.color || 'var(--accent-400)'}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <kpi.icon size={18} style={{ color: kpi.color || 'var(--accent-400)' }} />
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, color: T.text }}>{kpi.value}</div>
              <div style={{ fontSize: 11, color: T.textDim, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{kpi.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: `1px solid ${T.borderLight}`, paddingBottom: 0 }}>
        {(['catalog', 'imports'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 20px', fontSize: 13, fontWeight: activeTab === tab ? 600 : 400,
              color: activeTab === tab ? 'var(--accent-400)' : T.textDim,
              background: 'none', border: 'none', cursor: 'pointer',
              borderBottom: activeTab === tab ? '2px solid var(--accent-400)' : '2px solid transparent',
              marginBottom: -1,
            }}
          >
            {tab === 'catalog' ? `Catalogo (${developers.length})` : `Importacoes (${imports.length})`}
          </button>
        ))}
      </div>

      {/* Filters */}
      {activeTab === 'catalog' && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: T.textDim }} />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar construtora, cidade..."
              style={{
                width: '100%', padding: '8px 8px 8px 32px', background: 'var(--bg-muted)',
                border: `1px solid ${T.borderLight}`, borderRadius: 8, color: T.text,
                fontSize: 13, outline: 'none',
              }}
            />
          </div>
          {/* Country chips */}
          {[{ id: null, label: 'Todos', flag: '\u{1F30D}' }, { id: 'BR', label: 'Brasil', flag: '\u{1F1E7}\u{1F1F7}' }, { id: 'US', label: 'EUA', flag: '\u{1F1FA}\u{1F1F8}' }, { id: 'AE', label: 'UAE', flag: '\u{1F1E6}\u{1F1EA}' }].map(c => (
            <button
              key={c.id ?? 'all'}
              onClick={() => setCountryFilter(c.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px',
                borderRadius: 6, fontSize: 12, fontWeight: countryFilter === c.id ? 600 : 400,
                border: countryFilter === c.id ? '1.5px solid var(--accent-400)' : `1.5px solid ${T.borderLight}`,
                background: countryFilter === c.id ? 'rgba(61,111,255,0.10)' : 'transparent',
                color: countryFilter === c.id ? 'var(--accent-400)' : T.textDim,
                cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: 14 }}>{c.flag}</span> {c.label}
            </button>
          ))}
          {/* Status filter */}
          <select
            value={statusFilter ?? ''}
            onChange={e => setStatusFilter(e.target.value || null)}
            style={{
              padding: '6px 12px', background: 'var(--bg-muted)', border: `1px solid ${T.borderLight}`,
              borderRadius: 6, color: T.text, fontSize: 12, cursor: 'pointer',
            }}
          >
            <option value="">Status: Todos</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <Loader2 size={32} className="animate-spin" style={{ color: 'var(--accent-400)', margin: '0 auto' }} />
          <p style={{ color: T.textDim, marginTop: 12 }}>Carregando fornecedores...</p>
        </div>
      ) : activeTab === 'catalog' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 12 }}>
          {filtered.map(dev => (
            <div key={dev.id} style={{ ...cardStyle, padding: '16px 20px', cursor: 'pointer', transition: 'all 0.2s' }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 10, overflow: 'hidden',
                  background: 'var(--bg-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: `1px solid ${T.borderLight}`, flexShrink: 0, position: 'relative',
                }}>
                  {dev.logo_url ? (
                    <Image src={dev.logo_url} alt={dev.name} fill sizes="44px" style={{ objectFit: 'cover' }} />
                  ) : (
                    <Building2 size={20} style={{ color: T.textDim }} />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{dev.name}</span>
                    {dev.stock_ticker && (
                      <span style={{ fontSize: 10, color: 'var(--accent-400)', background: 'rgba(61,111,255,0.10)', padding: '1px 6px', borderRadius: 4, fontWeight: 600 }}>
                        {dev.stock_ticker}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: T.textDim, marginTop: 2 }}>
                    <span>{FLAGS[dev.country] || '\u{1F30D}'}</span>
                    <span>{dev.city}{dev.state ? `, ${dev.state}` : ''}</span>
                    {dev.founded_year && <span style={{ opacity: 0.6 }}>({dev.founded_year})</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: STATUS_COLORS[dev.partnership_status] || T.textDim,
                  }} />
                  <span style={{ fontSize: 11, color: STATUS_COLORS[dev.partnership_status] || T.textDim }}>
                    {STATUS_LABELS[dev.partnership_status] || dev.partnership_status}
                  </span>
                </div>
              </div>

              {/* Segments & Zones */}
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
                {(dev.segment ?? []).slice(0, 3).map(s => (
                  <span key={s} style={{
                    fontSize: 10, padding: '2px 6px', borderRadius: 4, fontWeight: 600,
                    color: 'var(--accent-400)', background: 'rgba(61,111,255,0.08)',
                  }}>
                    {SEGMENTS[s] || s}
                  </span>
                ))}
              </div>
              {(dev.zones ?? []).length > 0 && (
                <div style={{ fontSize: 11, color: T.textDim, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <MapPin size={10} />
                  {dev.zones.slice(0, 3).join(', ')}{dev.zones.length > 3 ? ` +${dev.zones.length - 3}` : ''}
                </div>
              )}

              {/* Tags */}
              {(dev.tags ?? []).length > 0 && (
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {dev.tags.slice(0, 4).map(tag => (
                    <span key={tag} style={{
                      fontSize: 9, padding: '1px 5px', borderRadius: 3,
                      color: T.textDim, background: 'var(--bg-muted)', border: `1px solid ${T.borderLight}`,
                    }}>
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Footer */}
              {dev.website && (
                <div style={{ marginTop: 10, paddingTop: 8, borderTop: `1px solid ${T.borderLight}`, display: 'flex', justifyContent: 'flex-end' }}>
                  <a
                    href={dev.website} target="_blank" rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    style={{ fontSize: 11, color: 'var(--accent-400)', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}
                  >
                    <ExternalLink size={10} /> Website
                  </a>
                </div>
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 40, color: T.textDim }}>
              Nenhum fornecedor encontrado com os filtros atuais.
            </div>
          )}
        </div>
      ) : (
        /* Imports Tab */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {imports.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: T.textDim }}>
              <FileText size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <p>Nenhuma importacao registrada.</p>
              <p style={{ fontSize: 12 }}>Use o botao "Upload Book PDF" para importar catalogos.</p>
            </div>
          ) : imports.map(imp => (
            <div key={imp.id} style={{ ...cardStyle, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <FileText size={18} style={{ color: 'var(--accent-400)', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{imp.source_filename}</div>
                <div style={{ fontSize: 11, color: T.textDim, marginTop: 2 }}>
                  {new Date(imp.created_at).toLocaleDateString('pt-BR')} - {imp.properties_created} imoveis criados
                </div>
              </div>
              <span style={{
                padding: '3px 10px', borderRadius: 4, fontSize: 11, fontWeight: 600,
                color: IMPORT_STATUS_COLORS[imp.status] || T.textDim,
                background: `${IMPORT_STATUS_COLORS[imp.status] || T.textDim}15`,
              }}>
                {imp.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
