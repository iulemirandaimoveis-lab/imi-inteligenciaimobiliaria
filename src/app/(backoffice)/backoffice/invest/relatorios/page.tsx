'use client'

import { useState, useEffect } from 'react'
import { FileText, Search, Plus, Clock, Download, Eye } from 'lucide-react'

const dmMono = { fontFamily: "'DM Mono', monospace" }

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
      .catch(() => setLoading(false))
  }, [])

  const filtered = reports.filter(r =>
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    r.type.toLowerCase().includes(search.toLowerCase())
  )

  const statusMap: Record<string, { label: string; cls: string }> = {
    draft: { label: 'Rascunho', cls: 'bg-white/10 text-white/50' },
    published: { label: 'Publicado', cls: 'bg-emerald-400/10 text-emerald-400' },
    archived: { label: 'Arquivado', cls: 'bg-white/5 text-white/30' },
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-editorial, serif)' }}>
            Relatorios
          </h1>
          <p className="text-sm text-white/50 mt-1">Relatorios de investimento e analises de mercado</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-[#0B1928]" style={{ background: '#C8A44A' }}>
          <Plus className="w-4 h-4" />
          Novo Relatorio
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar relatorios..."
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-gold/50"
          style={{ background: 'rgba(255,255,255,0.03)' }}
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 rounded-lg bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-white/10 p-12 text-center" style={{ background: 'rgba(255,255,255,0.02)' }}>
          <FileText className="w-10 h-10 text-white/20 mx-auto mb-3" />
          <h3 className="text-white/70 font-medium mb-1">Nenhum relatorio encontrado</h3>
          <p className="text-white/40 text-sm">
            {search ? 'Tente outros termos.' : 'Crie seu primeiro relatorio de investimento.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(report => (
            <a
              key={report.id}
              href={`/backoffice/invest/relatorios/${report.id}`}
              className="block rounded-xl border border-white/10 hover:border-gold/30 p-4 transition-all"
              style={{ background: 'rgba(255,255,255,0.02)' }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-gold" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">{report.title}</div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-white/40">{report.type}</span>
                      <span className="text-xs text-white/30 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(report.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                      <span className="text-xs text-white/30">{report.author}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3 text-xs text-white/30">
                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{report.views}</span>
                    <span className="flex items-center gap-1"><Download className="w-3 h-3" />{report.downloads}</span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-[6px] ${statusMap[report.status]?.cls || 'bg-white/10 text-white/50'}`}>
                    {statusMap[report.status]?.label || report.status}
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
