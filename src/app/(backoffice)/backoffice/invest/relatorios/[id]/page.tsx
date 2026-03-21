'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { ArrowLeft, FileText, Clock, Download, Eye, User, Share2, Printer } from 'lucide-react'

const dmMono = { fontFamily: "'DM Mono', monospace" }

interface ReportDetail {
  id: string
  title: string
  type: string
  createdAt: string
  updatedAt: string
  status: string
  author: string
  views: number
  downloads: number
  summary: string
  sections: { title: string; content: string }[]
  tags: string[]
}

export default function ReportDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [report, setReport] = useState<ReportDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/invest/reports/${id}`)
      .then(r => r.json())
      .then(data => { setReport(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-lg bg-white/5 animate-pulse" />
        ))}
      </div>
    )
  }

  if (!report) {
    return (
      <div className="rounded-lg border border-white/10 p-12 text-center" style={{ background: 'rgba(255,255,255,0.02)' }}>
        <FileText className="w-10 h-10 text-white/20 mx-auto mb-3" />
        <h3 className="text-white/70 font-medium mb-1">Relatorio nao encontrado</h3>
        <p className="text-white/40 text-sm mb-4">ID: {id}</p>
        <a href="/backoffice/invest/relatorios" className="text-[#3D6FFF] text-sm hover:underline">Voltar para lista</a>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <a href="/backoffice/invest/relatorios" className="p-2 rounded-lg border border-white/10 hover:border-[#3D6FFF]/30 transition-colors">
          <ArrowLeft className="w-4 h-4 text-white/50" />
        </a>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-white">{report.title}</h1>
          <div className="flex items-center gap-4 text-xs text-white/40 mt-0.5">
            <span className="flex items-center gap-1"><User className="w-3 h-3" />{report.author}</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(report.createdAt).toLocaleDateString('pt-BR')}</span>
            <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{report.views} views</span>
            <span className="flex items-center gap-1"><Download className="w-3 h-3" />{report.downloads} downloads</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="p-2 rounded-[6px] border border-white/10 hover:border-white/20 transition-colors">
            <Share2 className="w-4 h-4 text-white/50" />
          </button>
          <button className="p-2 rounded-[6px] border border-white/10 hover:border-white/20 transition-colors">
            <Printer className="w-4 h-4 text-white/50" />
          </button>
          <button className="flex items-center gap-2 px-3 py-2 rounded-[6px] text-sm font-medium text-[#0B1928]" style={{ background: '#3D6FFF' }}>
            <Download className="w-4 h-4" />
            PDF
          </button>
        </div>
      </div>

      {/* Tags */}
      {report.tags && report.tags.length > 0 && (
        <div className="flex gap-2">
          {report.tags.map(tag => (
            <span key={tag} className="text-xs px-2 py-1 rounded-[6px] border border-white/10 text-white/50">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Summary */}
      <div className="rounded-lg border border-[#3D6FFF]/20 p-5" style={{ background: 'rgba(200,164,74,0.05)' }}>
        <h3 className="text-xs text-[#3D6FFF] font-semibold mb-2">RESUMO EXECUTIVO</h3>
        <p className="text-sm text-white/70 leading-relaxed">{report.summary}</p>
      </div>

      {/* Sections */}
      {report.sections && report.sections.length > 0 ? (
        <div className="space-y-4">
          {report.sections.map((section, i) => (
            <div key={i} className="rounded-lg border border-white/10 p-5" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <h3 className="text-sm font-semibold text-white mb-3">{section.title}</h3>
              <p className="text-sm text-white/60 leading-relaxed whitespace-pre-line">{section.content}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-white/10 p-8 text-center" style={{ background: 'rgba(255,255,255,0.02)' }}>
          <p className="text-white/40 text-sm">Conteudo do relatorio sera exibido aqui.</p>
        </div>
      )}

      {/* Metadata */}
      <div className="rounded-lg border border-white/5 p-4" style={{ background: 'rgba(255,255,255,0.01)' }}>
        <div className="flex items-center justify-between text-xs text-white/20">
          <span>Tipo: {report.type}</span>
          <span>Status: {report.status}</span>
          <span>Atualizado: {new Date(report.updatedAt).toLocaleDateString('pt-BR')}</span>
          <span>ID: {report.id}</span>
        </div>
      </div>
    </div>
  )
}
