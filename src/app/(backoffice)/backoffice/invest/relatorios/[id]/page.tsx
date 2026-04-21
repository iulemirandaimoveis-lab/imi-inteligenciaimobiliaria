'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { ArrowLeft, FileText, Clock, Download, Eye, User, Share2, Printer } from 'lucide-react'
import { T } from '../../../../lib/theme'

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
      .catch(() => { toast.error('Erro ao carregar relatorio'); setLoading(false) })
  }, [id])

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-lg animate-pulse" style={{ background: T.hover }} />
        ))}
      </div>
    )
  }

  if (!report) {
    return (
      <div className="rounded-lg p-12 text-center" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
        <FileText className="w-10 h-10 mx-auto mb-3" style={{ color: T.textDim }} />
        <h3 className="font-medium mb-1" style={{ color: T.textMuted }}>Relatorio nao encontrado</h3>
        <p className="text-sm mb-4" style={{ color: T.textMuted }}>ID: {id}</p>
        <Link href="/backoffice/invest/relatorios" className="text-sm hover:underline" style={{ color: T.accent }}>Voltar para lista</Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/backoffice/invest/relatorios" className="p-2 rounded-lg transition-colors" style={{ border: `1px solid ${T.border}` }}>
          <ArrowLeft className="w-4 h-4" style={{ color: T.textMuted }} />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold" style={{ color: T.text }}>{report.title}</h1>
          <div className="flex items-center gap-4 text-xs mt-0.5" style={{ color: T.textMuted }}>
            <span className="flex items-center gap-1"><User className="w-3 h-3" />{report.author}</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(report.createdAt).toLocaleDateString('pt-BR')}</span>
            <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{report.views} views</span>
            <span className="flex items-center gap-1"><Download className="w-3 h-3" />{report.downloads} downloads</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="p-2 rounded-[6px] transition-colors" style={{ border: `1px solid ${T.border}` }}>
            <Share2 className="w-4 h-4" style={{ color: T.textMuted }} />
          </button>
          <button className="p-2 rounded-[6px] transition-colors" style={{ border: `1px solid ${T.border}` }}>
            <Printer className="w-4 h-4" style={{ color: T.textMuted }} />
          </button>
          <button className="flex items-center gap-2 px-3 py-2 rounded-[6px] text-sm font-medium" style={{ background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)' }}>
            <Download className="w-4 h-4" />
            PDF
          </button>
        </div>
      </div>

      {/* Tags */}
      {report.tags && report.tags.length > 0 && (
        <div className="flex gap-2">
          {report.tags.map(tag => (
            <span key={tag} className="text-xs px-2 py-1 rounded-[6px]" style={{ border: `1px solid ${T.border}`, color: T.textMuted }}>
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Summary */}
      <div className="rounded-lg p-5" style={{ border: `1px solid ${T.borderActive}`, background: T.activeBg }}>
        <h3 className="text-xs font-semibold mb-2" style={{ color: T.accent }}>RESUMO EXECUTIVO</h3>
        <p className="text-sm leading-relaxed" style={{ color: T.textMuted }}>{report.summary}</p>
      </div>

      {/* Sections */}
      {report.sections && report.sections.length > 0 ? (
        <div className="space-y-4">
          {report.sections.map((section, i) => (
            <div key={i} className="rounded-lg p-5" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
              <h3 className="text-sm font-semibold mb-3" style={{ color: T.text }}>{section.title}</h3>
              <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: T.textMuted }}>{section.content}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg p-8 text-center" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
          <p className="text-sm" style={{ color: T.textMuted }}>Conteudo do relatorio sera exibido aqui.</p>
        </div>
      )}

      {/* Metadata */}
      <div className="rounded-lg p-4" style={{ background: T.surface, border: `1px solid ${T.borderSubtle}` }}>
        <div className="flex items-center justify-between text-xs" style={{ color: T.textDim }}>
          <span>Tipo: {report.type}</span>
          <span>Status: {report.status}</span>
          <span>Atualizado: {new Date(report.updatedAt).toLocaleDateString('pt-BR')}</span>
          <span>ID: {report.id}</span>
        </div>
      </div>
    </div>
  )
}
