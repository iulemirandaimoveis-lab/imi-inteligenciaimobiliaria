'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft, ChevronDown, ChevronUp, Edit2, Check, X,
  Search, Download, Upload, MapPin, BarChart2, Loader2, AlertTriangle, FileSpreadsheet,
} from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { T } from '@/app/(backoffice)/lib/theme'
import { useIsMobile } from '@/hooks/use-is-mobile'
import { MobileGlobalStyles, MobileAppBar } from '../../mobile-ui'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Lot {
  id: string
  quadra: string
  lot_number: number
  area_m2: number
  price: number | null
  status: string
  special_type: string | null
  notes: string | null
}

interface Development {
  id: string
  name: string
  slug?: string
}

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  DISPONIVEL:   { label: 'Disponível',   color: '#16A34A', bg: 'rgba(22,163,74,0.12)',   dot: '#16A34A' },
  VENDIDO:      { label: 'Vendido',      color: '#DC2626', bg: 'rgba(220,38,38,0.12)',   dot: '#DC2626' },
  NEGOCIACAO:   { label: 'Negociação',   color: '#D97706', bg: 'rgba(217,119,6,0.12)',   dot: '#D97706' },
  PROPRIETARIO: { label: 'Proprietário', color: '#2563EB', bg: 'rgba(37,99,235,0.12)',   dot: '#2563EB' },
  IGREJA:       { label: 'Igreja',       color: '#7C3AED', bg: 'rgba(124,58,237,0.12)',  dot: '#7C3AED' },
}
const STATUS_KEYS = Object.keys(STATUS_CFG)

const fmtBRL = (v: number | null) =>
  v == null ? '—' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)

const fmtM2 = (v: number) =>
  `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(v)} m²`

const EYEBROW: React.CSSProperties = {
  fontSize: '9px', letterSpacing: '2.5px', textTransform: 'uppercase',
  fontFamily: 'var(--font-outfit, sans-serif)', color: T.textDim, fontWeight: 700,
}
const CARD: React.CSSProperties = {
  background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12,
}
const MONO: React.CSSProperties = {
  fontFamily: 'var(--font-mono, monospace)',
}

// ─── Inline Edit Cell ─────────────────────────────────────────────────────────

function StatusPill({ status, onClick }: { status: string; onClick?: () => void }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.DISPONIVEL
  return (
    <button
      onClick={onClick}
      title="Clique para editar"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '2px 8px', borderRadius: 6,
        background: cfg.bg, border: `1px solid ${cfg.color}22`,
        color: cfg.color, fontSize: 10, fontWeight: 700,
        letterSpacing: '1.2px', textTransform: 'uppercase',
        fontFamily: 'var(--font-outfit, sans-serif)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'opacity 0.15s',
      }}
    >
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
      {cfg.label}
    </button>
  )
}

// ─── Lot Edit Modal ───────────────────────────────────────────────────────────

function LotEditModal({
  lot,
  onSave,
  onClose,
}: {
  lot: Lot
  onSave: (id: string, patch: Partial<Lot>) => Promise<void>
  onClose: () => void
}) {
  const [status, setStatus] = useState(lot.status)
  const [price, setPrice] = useState(lot.price?.toString() ?? '')
  const [notes, setNotes] = useState(lot.notes ?? '')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', handler); document.body.style.overflow = '' }
  }, [onClose])

  const handleSave = async () => {
    setSaving(true)
    const priceVal = price ? parseFloat(price.replace(',', '.')) : null
    await onSave(lot.id, { status, price: isNaN(priceVal as number) ? null : priceVal, notes: notes || null })
    setSaving(false)
    onClose()
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: 24, width: '100%', maxWidth: 400, boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <p style={{ ...EYEBROW, marginBottom: 2 }}>Editar Lote</p>
            <h3 style={{ ...MONO, fontSize: 18, fontWeight: 700, color: T.text, margin: 0 }}>
              Quadra {lot.quadra} — Lote {lot.lot_number}
            </h3>
            <p style={{ fontSize: 12, color: T.textDim, margin: '2px 0 0' }}>{fmtM2(lot.area_m2)}</p>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: `1px solid ${T.border}`, color: T.textDim, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={14} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Status */}
          <div>
            <label style={{ ...EYEBROW, display: 'block', marginBottom: 6 }}>Status</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {STATUS_KEYS.map(k => {
                const cfg = STATUS_CFG[k]
                const active = status === k
                return (
                  <button
                    key={k}
                    onClick={() => setStatus(k)}
                    style={{
                      padding: '8px 10px', borderRadius: 8, border: `1.5px solid ${active ? cfg.color : T.border}`,
                      background: active ? cfg.bg : 'transparent',
                      color: active ? cfg.color : T.textMuted,
                      fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-outfit, sans-serif)',
                      cursor: 'pointer', transition: 'all 0.12s',
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}
                  >
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
                    {cfg.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Price */}
          <div>
            <label style={{ ...EYEBROW, display: 'block', marginBottom: 6 }}>Valor (R$)</label>
            <input
              type="number"
              value={price}
              onChange={e => setPrice(e.target.value)}
              placeholder="Ex: 35000"
              style={{
                width: '100%', height: 40, borderRadius: 8, border: `1px solid ${T.border}`,
                background: 'rgba(255,255,255,0.04)', color: T.text,
                padding: '0 12px', fontSize: 14, fontFamily: 'var(--font-mono, monospace)',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Notes */}
          <div>
            <label style={{ ...EYEBROW, display: 'block', marginBottom: 6 }}>Observações</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              placeholder="Notas internas..."
              style={{
                width: '100%', borderRadius: 8, border: `1px solid ${T.border}`,
                background: 'rgba(255,255,255,0.04)', color: T.text,
                padding: '10px 12px', fontSize: 13, fontFamily: 'var(--font-outfit, sans-serif)',
                resize: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button
              onClick={onClose}
              style={{ flex: 1, height: 42, borderRadius: 8, border: `1px solid ${T.border}`, background: 'transparent', color: T.textMuted, fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-outfit, sans-serif)', cursor: 'pointer', letterSpacing: '1px', textTransform: 'uppercase' }}
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{ flex: 2, height: 42, borderRadius: 8, border: 'none', background: 'var(--gold, var(--accent-400))', color: '#0B1928', fontSize: 12, fontWeight: 800, fontFamily: 'var(--font-outfit, sans-serif)', cursor: saving ? 'not-allowed' : 'pointer', letterSpacing: '1px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: saving ? 0.7 : 1 }}
            >
              {saving ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={14} />}
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      </div>
      <style suppressHydrationWarning>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

// ─── Quadra Block ─────────────────────────────────────────────────────────────

function QuadraBlock({
  quadra,
  lots,
  onEdit,
  isOpen,
  onToggle,
  search,
}: {
  quadra: string
  lots: Lot[]
  onEdit: (lot: Lot) => void
  isOpen: boolean
  onToggle: () => void
  search: string
}) {
  const available = lots.filter(l => l.status === 'DISPONIVEL').length
  const total = lots.length
  const pct = total > 0 ? Math.round((available / total) * 100) : 0

  const filtered = search
    ? lots.filter(l =>
        l.lot_number.toString().includes(search) ||
        l.status.toLowerCase().includes(search.toLowerCase())
      )
    : lots

  if (search && filtered.length === 0) return null

  return (
    <div style={{ ...CARD, overflow: 'hidden' }}>
      {/* Header */}
      <button
        onClick={onToggle}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: 'transparent', border: 'none', cursor: 'pointer', gap: 12 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: available > 0 ? 'rgba(22,163,74,0.14)' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ ...MONO, fontSize: 14, fontWeight: 900, color: available > 0 ? '#16A34A' : T.textDim }}>{quadra}</span>
          </div>
          <div style={{ textAlign: 'left' }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: T.text, margin: 0, fontFamily: 'var(--font-outfit, sans-serif)' }}>Quadra {quadra}</p>
            <p style={{ fontSize: 11, color: T.textDim, margin: 0 }}>{total} lotes · {available} disponível{available !== 1 ? 'is' : ''}</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ textAlign: 'right' }}>
            <span style={{ ...MONO, fontSize: 13, fontWeight: 700, color: available > 0 ? '#16A34A' : T.textDim }}>{pct}%</span>
          </div>
          <div style={{ width: 60, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: '#16A34A', borderRadius: 2 }} />
          </div>
          {isOpen ? <ChevronUp size={15} style={{ color: T.textDim, flexShrink: 0 }} /> : <ChevronDown size={15} style={{ color: T.textDim, flexShrink: 0 }} />}
        </div>
      </button>

      {/* Lot rows */}
      {isOpen && (
        <div style={{ borderTop: `1px solid ${T.border}` }}>
          {/* Column headers */}
          <div style={{ display: 'grid', gridTemplateColumns: '52px 1fr 1fr 1fr 40px', gap: 8, padding: '8px 18px', borderBottom: `1px solid ${T.border}` }}>
            {['Lote', 'Área', 'Valor', 'Status', ''].map((h, i) => (
              <span key={i} style={{ ...EYEBROW, fontSize: '8px' }}>{h}</span>
            ))}
          </div>
          {filtered.sort((a, b) => a.lot_number - b.lot_number).map(lot => (
            <div
              key={lot.id}
              style={{ display: 'grid', gridTemplateColumns: '52px 1fr 1fr 1fr 40px', gap: 8, padding: '10px 18px', borderBottom: `1px solid ${T.border}22`, alignItems: 'center', transition: 'background 0.1s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.025)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            >
              <span style={{ ...MONO, fontSize: 13, fontWeight: 700, color: T.text }}>{lot.lot_number}</span>
              <span style={{ fontSize: 12, color: T.textMuted }}>{fmtM2(lot.area_m2)}</span>
              <span style={{ ...MONO, fontSize: 12, color: T.textMuted }}>{fmtBRL(lot.price)}</span>
              <StatusPill status={lot.status} />
              <button
                onClick={() => onEdit(lot)}
                title="Editar lote"
                style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(61,111,255,0.08)', border: `1px solid ${T.border}`, color: 'var(--accent-400)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Edit2 size={11} />
              </button>
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ padding: '20px', textAlign: 'center', color: T.textDim, fontSize: 12 }}>Nenhum lote encontrado</div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function LotesPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const isMobile = useIsMobile()

  const [dev, setDev] = useState<Development | null>(null)
  const [lots, setLots] = useState<Lot[]>([])
  const [loading, setLoading] = useState(true)
  const [editingLot, setEditingLot] = useState<Lot | null>(null)
  const [openQuadras, setOpenQuadras] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [showImport, setShowImport] = useState(false)
  const [importPreview, setImportPreview] = useState<Array<Partial<Lot>> | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    const run = async () => {
      const [{ data: devData }, { data: lotsData }] = await Promise.all([
        supabase.from('developments').select('id, name, slug').eq('id', id).single(),
        supabase.from('subdivision_lots').select('*').eq('development_id', id).order('quadra').order('lot_number'),
      ])
      if (devData) setDev(devData as Development)
      if (lotsData) {
        setLots(lotsData as Lot[])
        const firstTwo = [...new Set((lotsData as Lot[]).map(l => l.quadra))].slice(0, 2)
        setOpenQuadras(new Set(firstTwo))
      }
      setLoading(false)
    }
    run()
  }, [id])

  const handleSave = useCallback(async (lotId: string, patch: Partial<Lot>) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('subdivision_lots')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', lotId)
    if (error) {
      toast.error('Erro ao salvar: ' + error.message)
      return
    }
    setLots(prev => prev.map(l => l.id === lotId ? { ...l, ...patch } : l))
    toast.success('Lote atualizado!')
  }, [])

  const quadrasMap = useMemo(() => {
    const map = new Map<string, Lot[]>()
    const filtered = filterStatus === 'ALL' ? lots : lots.filter(l => l.status === filterStatus)
    for (const lot of filtered) {
      if (!map.has(lot.quadra)) map.set(lot.quadra, [])
      map.get(lot.quadra)!.push(lot)
    }
    return map
  }, [lots, filterStatus])

  const stats = useMemo(() => {
    const total = lots.length
    const disponivel = lots.filter(l => l.status === 'DISPONIVEL').length
    const vendido = lots.filter(l => l.status === 'VENDIDO').length
    const negociacao = lots.filter(l => l.status === 'NEGOCIACAO').length
    const proprietario = lots.filter(l => l.status === 'PROPRIETARIO').length
    const priceMin = Math.min(...lots.filter(l => l.price && l.status === 'DISPONIVEL').map(l => l.price!))
    const priceMax = Math.max(...lots.filter(l => l.price).map(l => l.price!))
    return { total, disponivel, vendido, negociacao, proprietario, priceMin: isFinite(priceMin) ? priceMin : 0, priceMax: isFinite(priceMax) ? priceMax : 0 }
  }, [lots])

  const toggleQuadra = (q: string) =>
    setOpenQuadras(prev => { const n = new Set(prev); n.has(q) ? n.delete(q) : n.add(q); return n })

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImportError(null)
    setImportPreview(null)

    try {
      let rows: string[][] = []

      if (file.name.endsWith('.csv')) {
        const text = await file.text()
        rows = text.split(/\r?\n/).filter(Boolean).map(line =>
          line.split(',').map(v => v.replace(/^"|"$/g, '').trim())
        )
      } else if (file.name.match(/\.xlsx?$/)) {
        const XLSX = await import('xlsx')
        const buffer = await file.arrayBuffer()
        const wb = XLSX.read(buffer, { type: 'array' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        rows = XLSX.utils.sheet_to_json(ws, { header: 1 }) as string[][]
      } else {
        setImportError('Formato não suportado. Use CSV (.csv) ou Excel (.xlsx, .xls).')
        return
      }

      if (rows.length < 2) { setImportError('Arquivo vazio ou sem dados.'); return }

      const header = rows[0].map(h => h.toLowerCase().trim())
      const colIdx = {
        quadra: header.findIndex(h => h.includes('quadra')),
        lote: header.findIndex(h => h.includes('lote') || h === 'lot'),
        area: header.findIndex(h => h.includes('área') || h.includes('area') || h.includes('m²') || h.includes('m2')),
        valor: header.findIndex(h => h.includes('valor') || h.includes('preço') || h.includes('price')),
        status: header.findIndex(h => h.includes('status')),
        tipo: header.findIndex(h => h.includes('tipo') || h.includes('type')),
        notas: header.findIndex(h => h.includes('nota') || h.includes('observ')),
      }

      if (colIdx.quadra < 0 || colIdx.lote < 0) {
        setImportError('Colunas obrigatórias não encontradas. O arquivo precisa ter colunas "Quadra" e "Lote".')
        return
      }

      const parsed: Array<Partial<Lot>> = []
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i]
        if (!row[colIdx.quadra] && !row[colIdx.lote]) continue
        const statusRaw = (row[colIdx.status] ?? '').toUpperCase().trim()
        const statusMap: Record<string, string> = {
          'DISPONÍVEL': 'DISPONIVEL', 'DISPONIVEL': 'DISPONIVEL', 'DISPONÍVEIS': 'DISPONIVEL',
          'VENDIDO': 'VENDIDO', 'VENDIDA': 'VENDIDO',
          'NEGOCIACAO': 'NEGOCIACAO', 'NEGOCIAÇÃO': 'NEGOCIACAO',
          'PROPRIETARIO': 'PROPRIETARIO', 'PROPRIETÁRIO': 'PROPRIETARIO',
          'IGREJA': 'IGREJA',
        }
        parsed.push({
          quadra: (row[colIdx.quadra] ?? '').toString().trim().toUpperCase(),
          lot_number: parseInt(row[colIdx.lote] ?? '0', 10) || 0,
          area_m2: colIdx.area >= 0 ? parseFloat((row[colIdx.area] ?? '').toString().replace(',', '.')) || 0 : 0,
          price: colIdx.valor >= 0 && row[colIdx.valor] ? parseFloat((row[colIdx.valor] ?? '').toString().replace(/[^\d,.]/g, '').replace(',', '.')) || null : null,
          status: statusMap[statusRaw] ?? 'DISPONIVEL',
          special_type: colIdx.tipo >= 0 ? (row[colIdx.tipo] ?? '').toString().trim().toUpperCase() || null : null,
          notes: colIdx.notas >= 0 ? (row[colIdx.notas] ?? '').toString().trim() || null : null,
        })
      }

      setImportPreview(parsed.slice(0, 200))
    } catch (err) {
      setImportError('Erro ao ler o arquivo: ' + (err instanceof Error ? err.message : 'desconhecido'))
    }
    e.target.value = ''
  }

  const handleImportConfirm = async () => {
    if (!importPreview || importPreview.length === 0) return
    setImporting(true)
    const supabase = createClient()

    try {
      let updated = 0
      for (const row of importPreview) {
        if (!row.quadra || !row.lot_number) continue
        const existing = lots.find(l => l.quadra === row.quadra && l.lot_number === row.lot_number)
        if (!existing) continue
        const patch: Partial<Lot> = {}
        if (row.status && row.status !== existing.status) patch.status = row.status
        if (row.price !== undefined && row.price !== existing.price) patch.price = row.price
        if (row.notes !== undefined && row.notes !== existing.notes) patch.notes = row.notes
        if (row.special_type !== undefined && row.special_type !== existing.special_type) patch.special_type = row.special_type
        if (Object.keys(patch).length > 0) {
          await supabase.from('subdivision_lots').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', existing.id)
          updated++
        }
      }
      setLots(prev => prev.map(l => {
        const match = importPreview.find(r => r.quadra === l.quadra && r.lot_number === l.lot_number)
        if (!match) return l
        return { ...l, ...match, id: l.id } as Lot
      }))
      toast.success(`${updated} lote${updated !== 1 ? 's' : ''} atualizado${updated !== 1 ? 's' : ''} com sucesso!`)
      setShowImport(false)
      setImportPreview(null)
    } catch (err) {
      toast.error('Erro na importação: ' + (err instanceof Error ? err.message : 'desconhecido'))
    }
    setImporting(false)
  }

  const handleExport = () => {
    const rows = [['Quadra', 'Lote', 'Área (m²)', 'Valor', 'Status', 'Tipo', 'Notas']]
    for (const l of lots) {
      rows.push([l.quadra, l.lot_number.toString(), l.area_m2.toString(), l.price?.toString() ?? '', l.status, l.special_type ?? '', l.notes ?? ''])
    }
    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `lotes-${dev?.slug ?? id}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {isMobile && <MobileGlobalStyles />}
        <Loader2 size={28} style={{ color: 'var(--accent-400)', animation: 'spin 1s linear infinite' }} />
        <style suppressHydrationWarning>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      </div>
    )
  }

  const content = (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: isMobile ? '0 0 80px' : '0 24px 48px' }}>
      {/* Back nav */}
      {!isMobile && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 0 20px' }}>
          <button
            onClick={() => router.push(`/backoffice/imoveis/${id}`)}
            style={{ width: 36, height: 36, borderRadius: 8, background: T.surface, border: `1px solid ${T.border}`, color: T.textDim, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <ArrowLeft size={16} />
          </button>
          <span style={{ ...EYEBROW }}>Imóveis</span>
          <span style={{ color: T.textDim, fontSize: 12 }}>/</span>
          <span style={{ ...EYEBROW, color: T.textMuted }}>{dev?.name}</span>
          <span style={{ color: T.textDim, fontSize: 12 }}>/</span>
          <span style={{ ...EYEBROW, color: 'var(--gold, var(--accent-400))' }}>Lotes</span>
        </div>
      )}

      {/* Page header */}
      <div style={{ padding: isMobile ? '20px 16px 0' : '0 0 24px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <div style={{ width: 3, height: 20, borderRadius: 2, background: 'var(--gold, var(--accent-400))' }} />
            <p style={{ ...EYEBROW, margin: 0 }}>Gestão de Lotes</p>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: T.text, margin: 0, fontFamily: 'var(--font-outfit, sans-serif)' }}>
            {dev?.name ?? 'Loteamento'}
          </h1>
          <p style={{ fontSize: 13, color: T.textDim, margin: '4px 0 0' }}>
            {stats.total} lotes · {quadrasMap.size} quadras · {stats.disponivel} disponíveis
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }} data-tour="lotes-actions">
          <button
            onClick={() => setShowImport(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, height: 38, padding: '0 14px', borderRadius: 8, border: `1px solid ${T.border}`, background: 'rgba(200,164,74,0.08)', color: 'var(--gold, var(--accent-400))', fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-outfit, sans-serif)', cursor: 'pointer', letterSpacing: '1px', textTransform: 'uppercase' }}
          >
            <Upload size={13} /> Importar
          </button>
          <button
            onClick={handleExport}
            style={{ display: 'flex', alignItems: 'center', gap: 6, height: 38, padding: '0 14px', borderRadius: 8, border: `1px solid ${T.border}`, background: 'transparent', color: T.textMuted, fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-outfit, sans-serif)', cursor: 'pointer', letterSpacing: '1px', textTransform: 'uppercase' }}
          >
            <Download size={13} /> Exportar
          </button>
        </div>
      </div>

      {/* Stats */}
      <div data-tour="lotes-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, padding: isMobile ? '16px' : '0 0 20px' }}>
        {([
          { key: 'DISPONIVEL',   label: 'Disponíveis',   value: stats.disponivel,   color: '#16A34A', bg: 'rgba(22,163,74,0.12)' },
          { key: 'VENDIDO',      label: 'Vendidos',      value: stats.vendido,      color: '#DC2626', bg: 'rgba(220,38,38,0.1)' },
          { key: 'NEGOCIACAO',   label: 'Negociação',    value: stats.negociacao,   color: '#D97706', bg: 'rgba(217,119,6,0.1)' },
          { key: 'PROPRIETARIO', label: 'Proprietários', value: stats.proprietario, color: '#2563EB', bg: 'rgba(37,99,235,0.1)' },
        ] as const).map(item => (
          <button
            key={item.key}
            onClick={() => setFilterStatus(p => p === item.key ? 'ALL' : item.key)}
            style={{
              ...CARD, padding: '14px 16px', textAlign: 'left', cursor: 'pointer',
              background: filterStatus === item.key ? item.bg : T.surface,
              border: `1.5px solid ${filterStatus === item.key ? item.color : T.border}`,
              borderRadius: 12, transition: 'all 0.15s',
            }}
          >
            <p style={{ ...MONO, fontSize: 26, fontWeight: 700, color: item.color, margin: '0 0 2px' }}>{item.value}</p>
            <p style={{ ...EYEBROW, margin: 0, color: item.color, opacity: 0.8 }}>{item.label}</p>
          </button>
        ))}
      </div>

      {/* Price range */}
      {stats.priceMin > 0 && (
        <div style={{ ...CARD, padding: '12px 16px', margin: isMobile ? '0 16px 16px' : '0 0 16px', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <BarChart2 size={13} style={{ color: 'var(--gold, var(--accent-400))', flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: T.textDim }}>Faixa de preço (disponíveis):</span>
          <span style={{ ...MONO, fontSize: 13, fontWeight: 700, color: T.text }}>{fmtBRL(stats.priceMin)} — {fmtBRL(stats.priceMax)}</span>
        </div>
      )}

      {/* Search + controls */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: isMobile ? '0 16px 16px' : '0 0 16px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 180, position: 'relative' }}>
          <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: T.textDim, pointerEvents: 'none' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar lote ou status..."
            style={{ width: '100%', height: 38, borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.text, paddingLeft: 30, paddingRight: 12, fontSize: 13, boxSizing: 'border-box' }}
          />
        </div>
        <button onClick={() => setOpenQuadras(new Set(quadrasMap.keys()))} style={{ fontSize: 11, color: 'var(--gold, var(--accent-400))', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}>
          Expandir todas
        </button>
        <button onClick={() => setOpenQuadras(new Set())} style={{ fontSize: 11, color: T.textDim, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}>
          Recolher
        </button>
      </div>

      {/* Quadras */}
      <div data-tour="lotes-quadras" style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: isMobile ? '0 16px' : undefined }}>
        {[...quadrasMap.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([quadra, qLots]) => (
          <QuadraBlock
            key={quadra}
            quadra={quadra}
            lots={qLots}
            onEdit={setEditingLot}
            isOpen={openQuadras.has(quadra)}
            onToggle={() => toggleQuadra(quadra)}
            search={search}
          />
        ))}
        {quadrasMap.size === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: T.textDim }}>
            <MapPin size={32} style={{ margin: '0 auto 12px', opacity: 0.2, display: 'block' }} />
            <p style={{ fontWeight: 600, margin: 0 }}>Nenhum lote encontrado com os filtros aplicados.</p>
          </div>
        )}
      </div>
    </div>
  )

  if (isMobile) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
        <MobileGlobalStyles />
        <MobileAppBar
          title={dev?.name ?? 'Lotes'}
          subtitle="Gestão de Lotes"
          onBack={() => router.push(`/backoffice/imoveis/${id}`)}
        />
        <div style={{ paddingTop: 64 }}>
          {content}
        </div>
        {editingLot && (
          <LotEditModal
            lot={editingLot}
            onSave={handleSave}
            onClose={() => setEditingLot(null)}
          />
        )}
        {showImport && (
          <ImportModal
            preview={importPreview}
            error={importError}
            importing={importing}
            onFileSelect={handleFileSelect}
            onConfirm={handleImportConfirm}
            onClose={() => { setShowImport(false); setImportPreview(null); setImportError(null) }}
          />
        )}
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', paddingTop: 16 }}>
      {content}
      {editingLot && (
        <LotEditModal
          lot={editingLot}
          onSave={handleSave}
          onClose={() => setEditingLot(null)}
        />
      )}
      {showImport && (
        <ImportModal
          preview={importPreview}
          error={importError}
          importing={importing}
          onFileSelect={handleFileSelect}
          onConfirm={handleImportConfirm}
          onClose={() => { setShowImport(false); setImportPreview(null); setImportError(null) }}
        />
      )}
    </div>
  )
}

// ─── Import Modal ─────────────────────────────────────────────────────────────

function ImportModal({
  preview, error, importing, onFileSelect, onConfirm, onClose,
}: {
  preview: Array<Partial<Lot>> | null
  error: string | null
  importing: boolean
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
  onConfirm: () => void
  onClose: () => void
}) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: 24, width: '100%', maxWidth: 560, boxShadow: '0 24px 64px rgba(0,0,0,0.5)', maxHeight: '85vh', overflow: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <p style={{ ...EYEBROW, marginBottom: 2 }}>Importar Lotes</p>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: T.text, margin: 0, fontFamily: 'var(--font-outfit, sans-serif)' }}>
              Atualizar via arquivo
            </h3>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: `1px solid ${T.border}`, color: T.textDim, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={14} />
          </button>
        </div>

        {/* File formats info */}
        <div style={{ background: 'rgba(200,164,74,0.06)', border: '1px solid rgba(200,164,74,0.2)', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <FileSpreadsheet size={14} style={{ color: 'var(--gold, var(--accent-400))', flexShrink: 0, marginTop: 1 }} />
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--gold, var(--accent-400))', margin: '0 0 4px', fontFamily: 'var(--font-outfit, sans-serif)' }}>Formatos suportados</p>
              <p style={{ fontSize: 11, color: T.textDim, margin: 0, lineHeight: 1.5 }}>
                <strong style={{ color: T.textMuted }}>CSV (.csv)</strong> e <strong style={{ color: T.textMuted }}>Excel (.xlsx, .xls)</strong><br />
                Colunas: <code style={{ fontSize: 10, background: 'rgba(255,255,255,0.06)', padding: '1px 4px', borderRadius: 3 }}>Quadra, Lote, Área (m²), Valor, Status, Tipo, Notas</code>
              </p>
              <p style={{ fontSize: 10, color: T.textDim, margin: '6px 0 0', opacity: 0.7 }}>
                Apenas lotes existentes serão atualizados. Use "Exportar" para obter o modelo correto.
              </p>
            </div>
          </div>
        </div>

        {/* File picker */}
        {!preview && (
          <label
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, height: 120, borderRadius: 12, border: `2px dashed ${T.border}`, cursor: 'pointer', transition: 'border-color 0.15s', background: 'rgba(255,255,255,0.02)' }}
            onDragOver={e => e.preventDefault()}
          >
            <Upload size={24} style={{ color: T.textDim }} />
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: T.text, margin: 0 }}>Arraste o arquivo ou clique para selecionar</p>
              <p style={{ fontSize: 11, color: T.textDim, margin: '3px 0 0' }}>CSV ou Excel — máximo 10 MB</p>
            </div>
            <input type="file" accept=".csv,.xlsx,.xls" onChange={onFileSelect} style={{ display: 'none' }} />
          </label>
        )}

        {/* Error */}
        {error && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 10, padding: '10px 12px', marginBottom: 12 }}>
            <AlertTriangle size={14} style={{ color: '#DC2626', flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 12, color: '#DC2626', margin: 0 }}>{error}</p>
          </div>
        )}

        {/* Preview */}
        {preview && preview.length > 0 && (
          <div>
            <p style={{ fontSize: 12, color: T.textDim, marginBottom: 8 }}>
              <strong style={{ color: T.text }}>{preview.length}</strong> lotes encontrados no arquivo. Confirme para atualizar os lotes existentes.
            </p>
            <div style={{ border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden', maxHeight: 240, overflowY: 'auto', marginBottom: 16 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.04)' }}>
                    {['Quadra', 'Lote', 'Área', 'Valor', 'Status'].map(h => (
                      <th key={h} style={{ padding: '6px 10px', textAlign: 'left', ...EYEBROW, fontSize: '8px', borderBottom: `1px solid ${T.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.slice(0, 30).map((row, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${T.border}22` }}>
                      <td style={{ padding: '5px 10px', color: T.text, fontWeight: 700 }}>{row.quadra}</td>
                      <td style={{ padding: '5px 10px', ...MONO, color: T.text }}>{row.lot_number}</td>
                      <td style={{ padding: '5px 10px', color: T.textMuted }}>{row.area_m2 ? `${row.area_m2} m²` : '—'}</td>
                      <td style={{ padding: '5px 10px', ...MONO, color: T.textMuted }}>{row.price ? fmtBRL(row.price) : '—'}</td>
                      <td style={{ padding: '5px 10px' }}>
                        <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: STATUS_CFG[row.status ?? 'DISPONIVEL']?.bg ?? '#fff', color: STATUS_CFG[row.status ?? 'DISPONIVEL']?.color ?? '#000' }}>
                          {STATUS_CFG[row.status ?? 'DISPONIVEL']?.label ?? row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {preview.length > 30 && (
                    <tr>
                      <td colSpan={5} style={{ padding: '6px 10px', textAlign: 'center', color: T.textDim, fontSize: 10, fontStyle: 'italic' }}>
                        +{preview.length - 30} mais…
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => { onClose(); }}
                style={{ flex: 1, height: 42, borderRadius: 8, border: `1px solid ${T.border}`, background: 'transparent', color: T.textMuted, fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-outfit, sans-serif)', cursor: 'pointer', letterSpacing: '1px', textTransform: 'uppercase' }}
              >
                Cancelar
              </button>
              <button
                onClick={onConfirm}
                disabled={importing}
                style={{ flex: 2, height: 42, borderRadius: 8, border: 'none', background: 'var(--gold, var(--accent-400))', color: '#0B1928', fontSize: 12, fontWeight: 800, fontFamily: 'var(--font-outfit, sans-serif)', cursor: importing ? 'not-allowed' : 'pointer', letterSpacing: '1px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: importing ? 0.7 : 1 }}
              >
                {importing ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={14} />}
                {importing ? 'Importando...' : 'Confirmar Importação'}
              </button>
            </div>
          </div>
        )}
        <style suppressHydrationWarning>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  )
}
