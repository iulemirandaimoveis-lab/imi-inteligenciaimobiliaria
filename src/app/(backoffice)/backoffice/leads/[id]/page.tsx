'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Building2,
  DollarSign,
  Calendar,
  Star,
  Edit,
  Trash2,
  Send,
  MessageSquare,
  FileText,
  Video,
  Check,
  Clock,
  TrendingUp,
  User,
  Briefcase,
} from 'lucide-react'

// Dados do lead (mesmo do arquivo anterior)
const leadData = {
  id: 1,
  name: 'Maria Santos Silva',
  email: 'maria.santos@gmail.com',
  phone: '(81) 99845-3421',
  score: 92,
  status: 'hot',
  source: 'Instagram',
  interest: 'Apartamento 3Q',
  location: 'Boa Viagem',
  budget: '450k-600k',
  created: '2026-02-14T10:30:00',
  lastContact: '2026-02-14T15:20:00',
  notes: 'Interessada em empreendimentos próximos ao mar. Preferência por acabamento premium. Trabalha como médica no Hospital Português. Mora atualmente em Setúbal mas quer se mudar para Boa Viagem. Tem 2 filhos (8 e 11 anos) que estudarão no Colégio Damas.',

  // Dados adicionais
  occupation: 'Médica Cardiologista',
  company: 'Hospital Português',
  maritalStatus: 'Casada',
  children: 2,
  preferredContact: 'WhatsApp',
  bestTime: 'Tarde (14h-17h)',

  // Requisitos específicos
  requirements: [
    'Vista para o mar',
    'Varanda gourmet',
    'Suite master com closet',
    'Vaga dupla coberta',
    'Piscina no condomínio',
    'Academia completa',
    'Salão de festas',
  ],

  // Timeline de interações
  timeline: [
    {
      id: 1,
      type: 'note',
      title: 'Nota adicionada',
      description: 'Cliente confirmou interesse em visitar Villa Jardins no sábado às 10h',
      user: 'Iule Miranda',
      date: '2026-02-14T15:20:00',
      icon: FileText,
    },
    {
      id: 2,
      type: 'call',
      title: 'Ligação realizada',
      description: 'Conversa de 18 minutos. Cliente muito interessada, pediu plantas do Villa Jardins.',
      user: 'Iule Miranda',
      date: '2026-02-14T14:30:00',
      icon: Phone,
    },
    {
      id: 3,
      type: 'whatsapp',
      title: 'Mensagem WhatsApp',
      description: 'Enviado catálogo completo Reserva Atlantis + tabela de preços',
      user: 'Sistema',
      date: '2026-02-14T11:15:00',
      icon: MessageSquare,
    },
    {
      id: 4,
      type: 'email',
      title: 'E-mail enviado',
      description: 'E-mail de boas-vindas com apresentação da IMI e portfólio',
      user: 'Sistema',
      date: '2026-02-14T10:35:00',
      icon: Mail,
    },
    {
      id: 5,
      type: 'lead',
      title: 'Lead capturado',
      description: 'Origem: Instagram - Campanha Boa Viagem Premium',
      user: 'Sistema',
      date: '2026-02-14T10:30:00',
      icon: Star,
    },
  ],
}

export default function LeadDetalhesPage() {
  const router = useRouter()
  const params = useParams()
  const [lead] = useState(leadData)
  const [newNote, setNewNote] = useState('')
  const [isAddingNote, setIsAddingNote] = useState(false)

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; color: string; bg: string }> = {
      hot: { label: 'Quente 🔥', color: 'text-red-700', bg: 'bg-red-50' },
      warm: { label: 'Morno', color: 'text-orange-700', bg: 'bg-orange-50' },
      cold: { label: 'Frio', color: 'text-blue-700', bg: 'bg-blue-50' },
    }
    return configs[status] || configs.cold
  }

  const statusConfig = getStatusConfig(lead.status)

  const handleAddNote = () => {
    if (!newNote.trim()) return

    // Aqui salvaria no Supabase
    console.log('Nova nota:', newNote)
    setNewNote('')
    setIsAddingNote(false)
  }

  const getTimeAgo = (date: string) => {
    const now = new Date()
    const past = new Date(date)
    const diffMs = now.getTime() - past.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)

    if (diffMins < 60) return `${diffMins} minutos atrás`
    if (diffHours < 24) return `${diffHours} horas atrás`
    return new Date(date).toLocaleString('pt-BR')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center justify-center transition-colors flex-shrink-0"
          >
            <ArrowLeft size={20} />
          </button>

          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
              {lead.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>

            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                {lead.name}
              </h1>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Briefcase size={14} />
                  {lead.occupation}
                </span>
                <span>•</span>
                <span>{lead.company}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="h-10 px-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
            <Edit size={16} />
            <span className="hidden sm:inline">Editar</span>
          </button>
          <button className="h-10 px-4 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-2">
            <Trash2 size={16} />
            <span className="hidden sm:inline">Excluir</span>
          </button>
        </div>
      </div>

      {/* Score + Status */}
      <div className="flex items-center gap-3">
        <div className="px-4 py-2 rounded-xl bg-green-50 border border-green-200">
          <span className="text-sm font-medium text-green-700">Score: </span>
          <span className="text-lg font-bold text-green-700">{lead.score}</span>
        </div>
        <div className={`px-4 py-2 rounded-xl border ${statusConfig.bg} border-current`}>
          <span className={`text-sm font-medium ${statusConfig.color}`}>
            {statusConfig.label}
          </span>
        </div>
        <div className="px-4 py-2 rounded-xl bg-blue-50 border border-blue-200">
          <span className="text-sm font-medium text-blue-700">{lead.source}</span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button
          onClick={() => window.location.href = `mailto:${lead.email}`}
          className="h-12 px-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 font-medium"
        >
          <Mail size={18} />
          E-mail
        </button>
        <button
          onClick={() => window.location.href = `https://wa.me/55${lead.phone.replace(/\D/g, '')}`}
          className="h-12 px-4 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center gap-2 font-medium"
        >
          <MessageSquare size={18} />
          WhatsApp
        </button>
        <button
          onClick={() => window.location.href = `tel:${lead.phone}`}
          className="h-12 px-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 font-medium"
        >
          <Phone size={18} />
          Ligar
        </button>
        <button className="h-12 px-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 font-medium">
          <Calendar size={18} />
          Agendar
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Contato */}
          <div className="bg-white rounded-xl p-6 border border-gray-100">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
              Informações de Contato
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Mail size={18} className="text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-600 mb-1">E-mail</p>
                  <a href={`mailto:${lead.email}`} className="text-sm font-medium text-accent-600 hover:underline">
                    {lead.email}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone size={18} className="text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-600 mb-1">Telefone</p>
                  <a href={`tel:${lead.phone}`} className="text-sm font-medium text-accent-600 hover:underline">
                    {lead.phone}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MessageSquare size={18} className="text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-600 mb-1">Preferência</p>
                  <p className="text-sm font-medium text-gray-900">{lead.preferredContact}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock size={18} className="text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-600 mb-1">Melhor horário</p>
                  <p className="text-sm font-medium text-gray-900">{lead.bestTime}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Interesse */}
          <div className="bg-white rounded-xl p-6 border border-gray-100">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
              Interesse
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Building2 size={16} className="text-gray-400" />
                <span className="font-medium">{lead.interest}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin size={16} className="text-gray-400" />
                <span className="font-medium">{lead.location}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <DollarSign size={16} className="text-gray-400" />
                <span className="font-medium">R$ {lead.budget}</span>
              </div>
            </div>
          </div>

          {/* Dados Pessoais */}
          <div className="bg-white rounded-xl p-6 border border-gray-100">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
              Dados Pessoais
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Estado civil</span>
                <span className="font-medium">{lead.maritalStatus}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Filhos</span>
                <span className="font-medium">{lead.children}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Profissão</span>
                <span className="font-medium">{lead.occupation}</span>
              </div>
            </div>
          </div>

          {/* Requisitos */}
          <div className="bg-white rounded-xl p-6 border border-gray-100">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
              Requisitos
            </h3>
            <div className="space-y-2">
              {lead.requirements.map((req, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <Check size={14} className="text-green-600" />
                  <span className="text-gray-700">{req}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Timeline */}
        <div className="lg:col-span-2">
          {/* Notes Section */}
          <div className="bg-white rounded-xl p-6 border border-gray-100 mb-6">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
              Observações
            </h3>
            <p className="text-sm text-gray-700 leading-relaxed mb-4">
              {lead.notes}
            </p>

            {!isAddingNote ? (
              <button
                onClick={() => setIsAddingNote(true)}
                className="text-sm font-medium text-accent-600 hover:text-accent-700"
              >
                + Adicionar nota
              </button>
            ) : (
              <div className="space-y-3">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Digite sua nota..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 resize-none text-sm"
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleAddNote}
                    className="h-9 px-4 bg-accent-600 text-white rounded-lg hover:bg-accent-700 transition-colors text-sm font-medium"
                  >
                    Salvar
                  </button>
                  <button
                    onClick={() => {
                      setIsAddingNote(false)
                      setNewNote('')
                    }}
                    className="h-9 px-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-xl p-6 border border-gray-100">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-6">
              Timeline de Interações
            </h3>

            <div className="space-y-6">
              {lead.timeline.map((item, index) => {
                const Icon = item.icon
                const isLast = index === lead.timeline.length - 1

                return (
                  <div key={item.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-accent-50 flex items-center justify-center flex-shrink-0">
                        <Icon size={18} className="text-accent-600" />
                      </div>
                      {!isLast && (
                        <div className="w-0.5 flex-1 bg-gray-200 mt-2" />
                      )}
                    </div>

                    <div className="flex-1 pb-6">
                      <div className="flex items-start justify-between gap-4 mb-1">
                        <h4 className="text-sm font-semibold text-gray-900">
                          {item.title}
                        </h4>
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {getTimeAgo(item.date)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {item.description}
                      </p>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <User size={12} />
                        {item.user}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
