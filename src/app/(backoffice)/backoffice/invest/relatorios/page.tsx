'use client'

import { useState, useEffect } from 'react'
import { FileText, Search, Plus, Clock, Download, Eye, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { T } from '../../../lib/theme'
import { PageIntelHeader, EmptyState } from '../../../components/ui'

interface Report {
  id: string
  title: string
  type: string
  createdAt: string
  status: 'draft' | 'published' | 'archived'
  author: string
  views: number
  downloads: number
}

export default function RelatoriosPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/invest/reports')
      .then(r => r.json())
      .then(data => { setReports(data.reports || []); setLoading(false) })
      .catch(() => {
        toast.error('Erro ao carregar relatorios')
        setLoading(false)
      })
  }, [])

  const filtered = reports.filter(r =>
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    r.type.toLowerCase().includes(search.toLowerCase())
  )

  const statusMap: Record<string, { label: string; color: string; bg: string }> = {
    draft: { label: 'Rascunho', color: T.textMuted, bg: T.hover },
    published: { label: 'Publicado', color: 'var(--success)', bg: 'var(--success-bg)' },
    archived: { label: 'Arquivado', color: T.textDim, bg: T.hover },
  }

  return (
    <div className="space-y-6">
      <PageIntelHeader
        moduleLabel="INVEST · RELATÓRIOS"
        title="Relatórios"
        subtitle="Relatorios de investimento e analises de mercado"
        actions={
          <button
            className="relative overflow-hidden flex items-center gap-2 px-4 py-2 rounded-[6px] text-xs font-semibold uppercase tracking-[1px]"
            style={{ background: '#0A1624', color: '#fff', border: '1px solid rgba(255,255,255,0.08)', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}
          >
            <Plus className="w-4 h-4" />
            Novo Relatorio
            <span style={{ position: 'absolute', bottom: 0, left: '12%', right: '12%', height: 2, background: 'linear-gradient(90deg, transparent, #C8A44A, transparent)', opacity: 0.6, pointerEvents: 'none' }} />
          </button>
        }
      />

      {/* Search */}
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
          style={{ color: T.textDim }}
        />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar relatorios..."
          className="w-full pl-10 pr-4 py-2.5 rounded-[6px] text-sm focus:outline-none"
          style={{
            background: T.surface,
            border: `1px solid ${T.border}`,
            color: T.text,
            fontFamily: T.font.sans,
          }}
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: T.accent }} />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<FileText className="w-6 h-6" />}
          title="Nenhum relatorio encontrado"
          description={search ? 'Tente outros termos.' : 'Crie seu primeiro relatorio de investimento.'}
        />
      ) : (
        <div className="space-y-2">
          {filtered.map(report => (
            <Link
              key={report.id}
              href={`/backoffice/invest/relatorios/${report.id}`}
              className="block rounded-lg p-4 transition-all"
              style={{ background: T.surface, border: `1px solid ${T.border}` }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ background: T.accentBg }}
                  >
                    <FileText className="w-5 h-5" style={{ color: T.accent }} />
                  </div>
                  <div>
                    <div className="text-sm font-medium" style={{ color: T.text }}>
                      {report.title}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs" style={{ color: T.textDim }}>{report.type}</span>
                      <span
                        className="text-xs flex items-center gap-1"
                        style={{ color: T.textDim }}
                      >
                        <Clock className="w-3 h-3" />
                        {new Date(report.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                      <span className="text-xs" style={{ color: T.textDim }}>
                        {report.author}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3 text-xs" style={{ color: T.textDim }}>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />{report.views}
                    </span>
                    <span className="flex items-center gap-1">
                      <Download className="w-3 h-3" />{report.downloads}
                    </span>
                  </div>
                  <span
                    className="text-xs px-2 py-0.5 rounded-[6px]"
                    style={{
                      color: statusMap[report.status]?.color || T.textMuted,
                      background: statusMap[report.status]?.bg || T.hover,
                    }}
                  >
                    {statusMap[report.status]?.label || report.status}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
