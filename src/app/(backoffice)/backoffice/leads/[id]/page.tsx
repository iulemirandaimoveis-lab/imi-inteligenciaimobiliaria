'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Phone, Mail, MapPin, Building2, DollarSign,
  Calendar, Star, Edit, MessageSquare, FileText,
  Clock, TrendingUp, Eye, MousePointerClick,
  ChevronRight, Sparkles, MoreVertical, Send, AlertCircle,
} from 'lucide-react'
import { useLead } from '@/hooks/use-leads-complete'

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  hot:       { label: 'Quente',     color: 'text-red-600',    bg: 'bg-red-50 border-red-200',       dot: 'bg-red-500' },
  warm:      { label: 'Morno',      color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200', dot: 'bg-orange-500' },
  cold:      { label: 'Frio',       color: 'text-blue-600',   bg: 'bg-blue-50 border-blue-200',     dot: 'bg-blue-500' },
  qualified: { label: 'Qualificado',color: 'text-green-600',  bg: 'bg-green-50 border-green-200',   dot: 'bg-green-500' },
  new:       { label: 'Novo',       color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200', dot: 'bg-purple-500' },
  contacted: { label: 'Contactado', color: 'text-sky-600',    bg: 'bg-sky-50 border-sky-200',       dot: 'bg-sky-500' },
  proposal:  { label: 'Proposta',   color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-200', dot: 'bg-indigo-500' },
  won:       { label: 'Ganho',      color: 'text-emerald-600',bg: 'bg-emerald-50 border-emerald-200',dot: 'bg-emerald-500' },
  lost:      { label: 'Perdido',    color: 'text-gray-500',   bg: 'bg-gray-100 border-gray-200',    dot: 'bg-gray-400' },
}

function ScoreRing({ score }: { score: number }) {
  const r = 20, c = 2 * Math.PI * r
  const fill = (score / 100) * c
  const color = score >= 85 ? '#22c55e' : score >= 70 ? '#f97316' : '#94a3b8'

  return (
    <div className="relative w-16 h-16 flex-shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 48 48">
        <circle cx="24" cy="24" r={r} strokeWidth="4" stroke="#F1F3F5" fill="none" />
        <circle cx="24" cy="24" r={r} strokeWidth="4" stroke={color} fill="none"
          strokeDasharray={`${fill} ${c}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[13px] font-black text-[#1A1A1A] leading-none">{score}</span>
        <span className="text-[8px] text-[#ADB5BD] font-bold uppercase">score</span>
      </div>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="max-w-2xl mx-auto pb-20 animate-pulse">
      <div className="h-8 w-24 bg-gray-200 rounded-lg mb-6" />
      <div className="bg-white rounded-3xl border border-[#E9ECEF] p-6 mb-4">
        <div className="flex items-start gap-4 mb-5">
          <div className="w-14 h-14 rounded-2xl bg-gray-200 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-5 w-40 bg-gray-200 rounded" />
            <div className="h-4 w-24 bg-gray-100 rounded" />
          </div>
          <div className="w-16 h-16 rounded-full bg-gray-200" />
        </div>
        <div className="grid grid-cols-2 gap-2 mb-5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className={`h-4 bg-gray-100 rounded ${i === 4 ? 'col-span-2' : ''}`} />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="h-11 bg-gray-100 rounded-2xl" />
          <div className="h-11 bg-gray-200 rounded-2xl" />
        </div>
      </div>
      <div className="bg-gray-800 rounded-3xl h-36 mb-4" />
      <div className="bg-white rounded-3xl border border-[#E9ECEF] h-48" />
    </div>
  )
}

function formatCapital(capital: number | null): string {
  if (!capital) return '—'
  if (capital >= 1_000_000) return `R$ ${(capital / 1_000_000).toFixed(1).replace('.', ',')}M`
  if (capital >= 1_000) return `R$ ${(capital / 1_000).toFixed(0)}k`
  return `R$ ${capital.toLocaleString('pt-BR')}`
}

function getInitials(name: string): string {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

function getTimeAgo(iso: string | null): string {
  if (!iso) return '—'
  const diff = Date.now() - new Date(iso).getTime()
  const d = Math.floor(diff / 86400000)
  const h = Math.floor(diff / 3600000)
  const m = Math.floor(diff / 60000)
  if (d > 0) return `${d}d atrás`
  if (h > 0) return `${h}h atrás`
  return `${m}min atrás`
}

export default function LeadDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string | undefined

  const { lead, isLoading, isError } = useLead(id ?? null)
  const [activeTab, setActiveTab] = useState<'timeline' | 'history' | 'notes'>('timeline')
  const [note, setNote] = useState('')

  if (isLoading) return <LoadingSkeleton />

  if (isError || !lead) {
    return (
      <div className="max-w-2xl mx-auto pb-20">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-[#6C757D] hover:text-[#1A1A1A] transition-colors font-medium text-sm mb-6"
        >
          <ArrowLeft size={16} />
          Leads
        </button>
        <div className="bg-white rounded-3xl border border-[#E9ECEF] p-12 text-center">
          <AlertCircle size={32} className="mx-auto mb-3 text-gray-300" />
          <p className="text-[15px] font-semibold text-[#1A1A1A] mb-1">Lead não encontrado</p>
          <p className="text-[13px] text-[#ADB5BD]">O lead solicitado não existe ou foi removido.</p>
        </div>
      </div>
    )
  }

  const status = STATUS_CONFIG[lead.status] ?? STATUS_CONFIG.new
  const initials = getInitials(lead.name)
  const devName = (lead as any).development?.name ?? null

  // Build a generic timeline from what we know
  const timeline = [
    lead.last_interaction_at && {
      icon: MessageSquare,
      label: 'Último contato registrado',
      detail: devName ? `Empreendimento: ${devName}` : '',
      time: getTimeAgo(lead.last_interaction_at),
      accent: true,
    },
    {
      icon: Eye,
      label: `Lead capturado via ${lead.source || 'Orgânico'}`,
      detail: devName ? `Interesse: ${lead.interest || devName}` : (lead.interest || ''),
      time: getTimeAgo(lead.created_at),
      accent: !lead.last_interaction_at,
    },
  ].filter(Boolean) as Array<{ icon: any; label: string; detail: string; time: string; accent: boolean }>

  return (
    <div className="max-w-2xl mx-auto pb-20">

      {/* ── TOP NAV ── */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-[#6C757D] hover:text-[#1A1A1A] transition-colors font-medium text-sm"
        >
          <ArrowLeft size={16} />
          Leads
        </button>
        <div className="flex items-center gap-2">
          <button className="w-9 h-9 rounded-xl border border-[#E9ECEF] hover:bg-[#F8F9FA] flex items-center justify-center transition-colors">
            <Edit size={15} className="text-[#6C757D]" />
          </button>
          <button className="w-9 h-9 rounded-xl border border-[#E9ECEF] hover:bg-[#F8F9FA] flex items-center justify-center transition-colors">
            <MoreVertical size={15} className="text-[#6C757D]" />
          </button>
        </div>
      </div>

      {/* ── HERO CARD ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="bg-white rounded-3xl border border-[#E9ECEF] p-6 mb-4 shadow-sm"
      >
        <div className="flex items-start gap-4 mb-5">
          {/* Avatar */}
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1A1A1A] to-[#495057] flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
            {initials}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-[#1A1A1A] mb-0.5 truncate">{lead.name}</h1>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${status.bg} ${status.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                {status.label}
              </span>
              {lead.source && (
                <span className="text-[11px] text-[#ADB5BD]">via {lead.source}</span>
              )}
            </div>
          </div>

          {/* Score Ring */}
          <ScoreRing score={lead.score ?? 0} />
        </div>

        {/* Contact info grid */}
        <div className="grid grid-cols-2 gap-2 mb-5">
          {lead.email && (
            <div className="flex items-center gap-2 text-sm text-[#495057]">
              <Mail size={13} className="text-[#ADB5BD] flex-shrink-0" />
              <span className="truncate text-[12px]">{lead.email}</span>
            </div>
          )}
          {lead.phone && (
            <div className="flex items-center gap-2 text-sm text-[#495057]">
              <Phone size={13} className="text-[#ADB5BD] flex-shrink-0" />
              <span className="text-[12px]">{lead.phone}</span>
            </div>
          )}
          {devName && (
            <div className="flex items-center gap-2">
              <Building2 size={13} className="text-[#ADB5BD] flex-shrink-0" />
              <span className="text-[12px] text-[#495057]">{devName}</span>
            </div>
          )}
          {lead.interest && (
            <div className="flex items-center gap-2">
              <MapPin size={13} className="text-[#ADB5BD] flex-shrink-0" />
              <span className="text-[12px] text-[#495057]">{lead.interest}</span>
            </div>
          )}
          {lead.capital && (
            <div className="flex items-center gap-2 col-span-2">
              <DollarSign size={13} className="text-[#ADB5BD] flex-shrink-0" />
              <span className="text-[12px] font-semibold text-[#1A1A1A]">{formatCapital(lead.capital)}</span>
            </div>
          )}
        </div>

        {/* Tags */}
        {lead.tags && lead.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-5">
            {lead.tags.map((tag, i) => (
              <span key={i} className="px-2 py-0.5 bg-[#F8F9FA] border border-[#E9ECEF] rounded-full text-[10px] font-medium text-[#495057]">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Meta */}
        <div className="flex items-center gap-4 text-[11px] text-[#ADB5BD] mb-5">
          <span>Criado {getTimeAgo(lead.created_at)}</span>
          {lead.last_interaction_at && (
            <>
              <span>·</span>
              <span>Último contato {getTimeAgo(lead.last_interaction_at)}</span>
            </>
          )}
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-3">
          <a
            href={`tel:${lead.phone}`}
            className="flex items-center justify-center gap-2 h-11 bg-[#F8F9FA] border border-[#E9ECEF] rounded-2xl text-[13px] font-semibold text-[#1A1A1A] hover:bg-[#E9ECEF] transition-colors"
          >
            <Phone size={15} />
            Ligar
          </a>
          <a
            href={`https://wa.me/55${(lead.phone ?? '').replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 h-11 bg-[#1A1A1A] hover:bg-[#102A43] rounded-2xl text-[13px] font-semibold text-white transition-all duration-200"
          >
            <MessageSquare size={15} />
            WhatsApp
          </a>
        </div>
      </motion.div>

      {/* ── AI INSIGHT CARD ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.35 }}
        className="bg-[#1A1A1A] rounded-3xl p-6 mb-4 relative overflow-hidden"
      >
        <div className="absolute -right-6 -top-6 w-24 h-24 bg-[#102A43]/20 rounded-full blur-2xl" />
        <div className="flex items-center gap-2 mb-3 relative z-10">
          <Sparkles size={16} className="text-[#486581]" />
          <h3 className="font-bold text-white text-[15px]">AI Insight Strategy</h3>
        </div>
        <p className="text-[#9CA3AF] text-[13px] leading-relaxed mb-4 relative z-10">
          {lead.score >= 85
            ? `${lead.name} tem score alto (${lead.score}). Abordagem proativa recomendada — alta probabilidade de conversão.`
            : lead.score >= 70
            ? `Score moderado (${lead.score}). Qualificar melhor interesse antes de apresentar propostas.`
            : `Lead em aquecimento (score ${lead.score}). Nutrição com conteúdo relevante recomendada antes de contato direto.`
          }
          {devName ? ` Interesse principal: ${devName}.` : ''}
          {lead.capital ? ` Capital declarado: ${formatCapital(lead.capital)}.` : ''}
        </p>
        <div className="bg-white/[0.07] rounded-2xl border border-white/10 p-4 relative z-10">
          <p className="text-[10px] uppercase font-bold text-[#6C757D] mb-1.5 tracking-widest">
            Próxima Ação Sugerida
          </p>
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-white">
              {lead.status === 'new' || lead.status === 'cold'
                ? 'Entrar em contato e qualificar necessidade'
                : lead.status === 'contacted' || lead.status === 'warm'
                ? 'Agendar visita ou apresentação de proposta'
                : lead.status === 'proposal'
                ? 'Follow-up na proposta enviada'
                : lead.status === 'hot' || lead.status === 'qualified'
                ? 'Apresentar proposta personalizada'
                : 'Atualizar status do lead'
              }
            </span>
            <ChevronRight size={14} className="text-[#486581] flex-shrink-0" />
          </div>
        </div>
      </motion.div>

      {/* ── TABS ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.18 }}
        className="bg-white rounded-3xl border border-[#E9ECEF] overflow-hidden shadow-sm"
      >
        <div className="flex border-b border-[#E9ECEF]">
          {[
            { key: 'timeline', label: 'Timeline' },
            { key: 'history', label: 'Histórico' },
            { key: 'notes', label: 'Observações' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex-1 py-3.5 text-[12px] font-bold uppercase tracking-wider transition-colors ${activeTab === tab.key
                  ? 'text-[#1A1A1A] border-b-2 border-[#334E68]'
                  : 'text-[#ADB5BD] hover:text-[#6C757D]'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {/* ── TIMELINE TAB ── */}
          {activeTab === 'timeline' && (
            <div className="space-y-1">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-[#1A1A1A] text-[14px]">Eventos do Lead</h3>
                <span className="text-[10px] font-bold text-[#486581] bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                  {timeline.length} evento{timeline.length !== 1 ? 's' : ''}
                </span>
              </div>

              {timeline.length > 0 ? (
                <div className="relative">
                  <div className="absolute left-5 top-0 bottom-0 w-px bg-[#E9ECEF]" />
                  <div className="space-y-4">
                    {timeline.map((event, i) => (
                      <div key={i} className="flex gap-4 relative">
                        <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${event.accent
                            ? 'bg-[#1A1A1A] ring-4 ring-white shadow-md'
                            : 'bg-[#F8F9FA] border border-[#E9ECEF]'
                          }`}>
                          <event.icon size={14} className={event.accent ? 'text-[#486581]' : 'text-[#ADB5BD]'} />
                        </div>
                        <div className={`flex-1 bg-[#F8F9FA] border border-[#E9ECEF] rounded-2xl p-3.5 ${i > 0 ? 'opacity-80' : ''}`}>
                          <div className="flex items-start justify-between gap-2 mb-0.5">
                            <h4 className="font-semibold text-[13px] text-[#1A1A1A]">{event.label}</h4>
                            <span className="text-[10px] text-[#ADB5BD] flex-shrink-0">{event.time}</span>
                          </div>
                          {event.detail && (
                            <p className="text-[11px] text-[#6C757D]">{event.detail}</p>
                          )}
                          {event.accent && (
                            <div className="flex items-center gap-1.5 mt-2 text-[10px] font-bold text-emerald-600">
                              <TrendingUp size={10} />
                              Evento mais recente
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-[#ADB5BD]">
                  <Eye size={28} className="mx-auto mb-2 opacity-40" />
                  <p className="text-[13px]">Nenhum evento registrado</p>
                </div>
              )}
            </div>
          )}

          {/* ── HISTORY TAB ── */}
          {activeTab === 'history' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-[#1A1A1A] text-[14px]">Histórico de Contatos</h3>
                <button className="text-[11px] font-bold text-[#486581]">+ Registrar</button>
              </div>
              <div className="text-center py-8 text-[#ADB5BD]">
                <Clock size={28} className="mx-auto mb-2 opacity-40" />
                <p className="text-[13px]">Nenhum contato registrado ainda</p>
                <p className="text-[11px] mt-1">Use o botão acima para registrar um contato</p>
              </div>
            </div>
          )}

          {/* ── NOTES TAB ── */}
          {activeTab === 'notes' && (
            <div>
              {lead.message ? (
                <div className="bg-[#F8F9FA] rounded-2xl border border-[#E9ECEF] p-4 mb-4">
                  <p className="text-[13px] text-[#495057] leading-relaxed">{lead.message}</p>
                </div>
              ) : (
                <div className="bg-[#F8F9FA] rounded-2xl border border-[#E9ECEF] p-4 mb-4 text-center text-[#ADB5BD]">
                  <FileText size={20} className="mx-auto mb-1 opacity-40" />
                  <p className="text-[12px]">Nenhuma mensagem do lead</p>
                </div>
              )}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Adicionar observação..."
                  className="flex-1 h-11 px-4 text-[13px] bg-[#F8F9FA] border border-[#E9ECEF] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#334E68]/30 focus:border-[#334E68]"
                />
                <button
                  disabled={!note.trim()}
                  className="w-11 h-11 bg-[#1A1A1A] disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-colors hover:bg-[#102A43]"
                >
                  <Send size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
