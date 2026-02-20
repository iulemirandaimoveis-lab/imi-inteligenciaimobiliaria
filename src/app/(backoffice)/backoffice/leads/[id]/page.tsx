'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Phone, Mail, MapPin, Building2, DollarSign,
  Calendar, Star, Edit, Trash2, MessageSquare, FileText,
  Check, Clock, TrendingUp, Eye, MousePointerClick, Download,
  Megaphone, ChevronRight, Sparkles, MoreVertical, Send,
} from 'lucide-react'

const LEADS_DB: Record<number, any> = {
  1: {
    id: 1, name: 'Maria Santos Silva', initials: 'MS',
    email: 'maria.santos@gmail.com', phone: '(81) 99845-3421',
    score: 92, status: 'hot', source: 'Instagram',
    interest: 'Apartamento 3Q', location: 'Boa Viagem',
    budget: 'R$ 450k – 600k', created: '2026-02-14T10:30:00',
    lastContact: '2026-02-14T15:20:00',
    notes: 'Interessada em empreendimentos próximos ao mar. Preferência por acabamento premium.',
    aiInsight: 'Lead demonstrou alto interesse em apartamentos com vista mar em Boa Viagem. Passou mais de 8 minutos visualizando a página do Reserva Atlantis. Sugerimos abordagem focada em exclusividade e entrega em 2027.',
    nextStep: 'Enviar Relatório de Avaliação NBR 14653 do Reserva Atlantis',
    timeline: [
      { icon: Eye, label: 'Visualizou "Reserva Atlantis"', detail: 'Duração: 08:14 min · Alto engajamento', time: '2 min atrás', accent: true },
      { icon: MousePointerClick, label: 'Clicou em "Solicitar Avaliação"', detail: 'CTA na página de Avaliações', time: '1h atrás', accent: false },
      { icon: Download, label: 'Baixou relatório de mercado', detail: 'Arquivo: Mercado_BoaViagem_2026.pdf', time: 'Hoje 10:24', accent: false },
      { icon: Megaphone, label: 'Inbound via Instagram Ads', detail: 'Campanha: Alto Padrão Recife', time: 'Ontem', accent: false },
    ],
    history: [
      { type: 'call', label: 'Ligação realizada', note: 'Interessada, pediu para ligar na próxima semana', date: '14/02', icon: Phone },
      { type: 'whatsapp', label: 'WhatsApp enviado', note: 'Material do Reserva Atlantis encaminhado', date: '13/02', icon: MessageSquare },
      { type: 'note', label: 'Nota adicionada', note: 'Preferência por pavimento alto, andar > 12', date: '12/02', icon: FileText },
    ],
  },
  2: {
    id: 2, name: 'João Pedro Almeida', initials: 'JP',
    email: 'joao.almeida@hotmail.com', phone: '(81) 98732-1098',
    score: 85, status: 'hot', source: 'Google Ads',
    interest: 'Casa 4Q', location: 'Piedade',
    budget: 'R$ 800k – 1M', created: '2026-02-14T08:15:00',
    lastContact: '2026-02-14T14:45:00',
    notes: 'Procura casa com quintal. Família com 2 filhos.',
    aiInsight: 'Lead com perfil familiar. Alta intenção de compra. Prioriza quintal e segurança. Abordagem: destaque diferenciais estruturais e planta familiar.',
    nextStep: 'Agendar visita a empreendimento em Piedade',
    timeline: [
      { icon: Eye, label: 'Visualizou plantas Casa 4Q', detail: 'Duração: 05:30 min', time: '3h atrás', accent: true },
      { icon: Megaphone, label: 'Inbound via Google Ads', detail: 'Campanha: Casas Recife', time: 'Hoje 08:00', accent: false },
    ],
    history: [],
  },
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  hot: { label: 'Quente', color: 'text-red-600', bg: 'bg-red-50 border-red-200', dot: 'bg-red-500' },
  warm: { label: 'Morno', color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200', dot: 'bg-orange-500' },
  cold: { label: 'Frio', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200', dot: 'bg-blue-500' },
  qualified: { label: 'Qualificado', color: 'text-green-600', bg: 'bg-green-50 border-green-200', dot: 'bg-green-500' },
  new: { label: 'Novo', color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200', dot: 'bg-purple-500' },
  lost: { label: 'Perdido', color: 'text-gray-500', bg: 'bg-gray-100 border-gray-200', dot: 'bg-gray-400' },
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

export default function LeadDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = Number(params?.id) || 1
  const lead = LEADS_DB[id] || LEADS_DB[1]
  const [activeTab, setActiveTab] = useState<'timeline' | 'history' | 'notes'>('timeline')
  const [note, setNote] = useState('')
  const status = STATUS_CONFIG[lead.status] || STATUS_CONFIG.cold

  const getTimeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime()
    const d = Math.floor(diff / 86400000)
    const h = Math.floor(diff / 3600000)
    const m = Math.floor(diff / 60000)
    if (d > 0) return `${d}d atrás`
    if (h > 0) return `${h}h atrás`
    return `${m}min atrás`
  }

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
            {lead.initials}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-[#1A1A1A] mb-0.5 truncate">{lead.name}</h1>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${status.bg} ${status.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                {status.label}
              </span>
              <span className="text-[11px] text-[#ADB5BD]">via {lead.source}</span>
            </div>
          </div>

          {/* Score Ring */}
          <ScoreRing score={lead.score} />
        </div>

        {/* Contact info grid */}
        <div className="grid grid-cols-2 gap-2 mb-5">
          <div className="flex items-center gap-2 text-sm text-[#495057]">
            <Mail size={13} className="text-[#ADB5BD] flex-shrink-0" />
            <span className="truncate text-[12px]">{lead.email}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-[#495057]">
            <Phone size={13} className="text-[#ADB5BD] flex-shrink-0" />
            <span className="text-[12px]">{lead.phone}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin size={13} className="text-[#ADB5BD] flex-shrink-0" />
            <span className="text-[12px] text-[#495057]">{lead.location}</span>
          </div>
          <div className="flex items-center gap-2">
            <Building2 size={13} className="text-[#ADB5BD] flex-shrink-0" />
            <span className="text-[12px] text-[#495057]">{lead.interest}</span>
          </div>
          <div className="flex items-center gap-2 col-span-2">
            <DollarSign size={13} className="text-[#ADB5BD] flex-shrink-0" />
            <span className="text-[12px] font-semibold text-[#1A1A1A]">{lead.budget}</span>
          </div>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-4 text-[11px] text-[#ADB5BD] mb-5">
          <span>Criado {getTimeAgo(lead.created)}</span>
          <span>·</span>
          <span>Último contato {getTimeAgo(lead.lastContact)}</span>
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
            href={`https://wa.me/55${lead.phone.replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 h-11 bg-[#1A1A1A] hover:bg-[#C49D5B] rounded-2xl text-[13px] font-semibold text-white transition-all duration-200"
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
        {/* Glow */}
        <div className="absolute -right-6 -top-6 w-24 h-24 bg-[#C49D5B]/20 rounded-full blur-2xl" />

        <div className="flex items-center gap-2 mb-3 relative z-10">
          <Sparkles size={16} className="text-[#C49D5B]" />
          <h3 className="font-bold text-white text-[15px]">AI Insight Strategy</h3>
        </div>
        <p className="text-[#9CA3AF] text-[13px] leading-relaxed mb-4 relative z-10">
          {lead.aiInsight}
        </p>
        <div className="bg-white/[0.07] rounded-2xl border border-white/10 p-4 relative z-10">
          <p className="text-[10px] uppercase font-bold text-[#6C757D] mb-1.5 tracking-widest">
            Próxima Ação Sugerida
          </p>
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-white">{lead.nextStep}</span>
            <ChevronRight size={14} className="text-[#C49D5B] flex-shrink-0" />
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
        {/* Tab bar */}
        <div className="flex border-b border-[#E9ECEF]">
          {[
            { key: 'timeline', label: 'Behavioural' },
            { key: 'history', label: 'Histórico' },
            { key: 'notes', label: 'Nota' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex-1 py-3.5 text-[12px] font-bold uppercase tracking-wider transition-colors ${activeTab === tab.key
                  ? 'text-[#1A1A1A] border-b-2 border-[#C49D5B]'
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
                <h3 className="font-bold text-[#1A1A1A] text-[14px]">Behavioral Timeline</h3>
                <span className="text-[10px] font-bold text-[#C49D5B] bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                  Live
                </span>
              </div>
              <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-5 top-0 bottom-0 w-px bg-[#E9ECEF]" />

                <div className="space-y-4">
                  {lead.timeline.map((event: any, i: number) => (
                    <div key={i} className="flex gap-4 relative">
                      {/* Icon dot */}
                      <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${event.accent
                          ? 'bg-[#1A1A1A] ring-4 ring-white shadow-md'
                          : 'bg-[#F8F9FA] border border-[#E9ECEF]'
                        }`}>
                        <event.icon size={14} className={event.accent ? 'text-[#C49D5B]' : 'text-[#ADB5BD]'} />
                      </div>

                      {/* Content */}
                      <div className={`flex-1 bg-[#F8F9FA] border border-[#E9ECEF] rounded-2xl p-3.5 ${i > 0 ? 'opacity-80' : ''}`}>
                        <div className="flex items-start justify-between gap-2 mb-0.5">
                          <h4 className="font-semibold text-[13px] text-[#1A1A1A]">{event.label}</h4>
                          <span className="text-[10px] text-[#ADB5BD] flex-shrink-0">{event.time}</span>
                        </div>
                        <p className="text-[11px] text-[#6C757D]">{event.detail}</p>
                        {event.accent && (
                          <div className="flex items-center gap-1.5 mt-2 text-[10px] font-bold text-emerald-600">
                            <TrendingUp size={10} />
                            Alto engajamento detectado
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── HISTORY TAB ── */}
          {activeTab === 'history' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-[#1A1A1A] text-[14px]">Histórico de Contatos</h3>
                <button className="text-[11px] font-bold text-[#C49D5B]">+ Registrar</button>
              </div>
              {lead.history.length > 0 ? (
                <div className="space-y-3">
                  {lead.history.map((h: any, i: number) => (
                    <div key={i} className="flex gap-3 p-3.5 bg-[#F8F9FA] rounded-2xl border border-[#E9ECEF]">
                      <div className="w-9 h-9 rounded-xl bg-white border border-[#E9ECEF] flex items-center justify-center flex-shrink-0">
                        <h.icon size={14} className="text-[#6C757D]" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-[12px] font-semibold text-[#1A1A1A]">{h.label}</p>
                          <span className="text-[10px] text-[#ADB5BD]">{h.date}/02</span>
                        </div>
                        <p className="text-[11px] text-[#6C757D]">{h.note}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-[#ADB5BD]">
                  <Clock size={28} className="mx-auto mb-2 opacity-40" />
                  <p className="text-[13px]">Nenhum contato registrado ainda</p>
                </div>
              )}
            </div>
          )}

          {/* ── NOTES TAB ── */}
          {activeTab === 'notes' && (
            <div>
              <div className="bg-[#F8F9FA] rounded-2xl border border-[#E9ECEF] p-4 mb-4">
                <p className="text-[13px] text-[#495057] leading-relaxed">{lead.notes}</p>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Adicionar nota..."
                  className="flex-1 h-11 px-4 text-[13px] bg-[#F8F9FA] border border-[#E9ECEF] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C49D5B]/30 focus:border-[#C49D5B]"
                />
                <button
                  disabled={!note.trim()}
                  className="w-11 h-11 bg-[#1A1A1A] disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-colors hover:bg-[#C49D5B]"
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
