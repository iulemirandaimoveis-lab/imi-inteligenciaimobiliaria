'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Video,
  Phone,
  Plus,
  ChevronLeft,
  ChevronRight,
  Home,
  FileText,
  Users,
} from 'lucide-react'

// ⚠️ NÃO MODIFICAR - Eventos mockados semana atual
const eventosData = {
  semanaAtual: {
    inicio: '2026-02-17',
    fim: '2026-02-23',
  },
  eventos: [
    {
      id: 1,
      titulo: 'Vistoria Técnica - Reserva Atlantis',
      tipo: 'vistoria',
      data: '2026-02-18',
      horaInicio: '09:00',
      horaFim: '11:00',
      local: 'Av. Boa Viagem, 5420 - Recife/PE',
      participantes: ['Iule Miranda', 'Maria Santos'],
      descricao: 'Vistoria para avaliação NBR 14653 do apartamento 802',
    },
    {
      id: 2,
      titulo: 'Reunião Cliente - Villa Jardins',
      tipo: 'reuniao',
      data: '2026-02-18',
      horaInicio: '14:00',
      horaFim: '15:30',
      local: 'Escritório IMI',
      participantes: ['Iule Miranda', 'João Pedro Almeida'],
      descricao: 'Apresentação de plantas e tabela de preços',
      videoCall: true,
    },
    {
      id: 3,
      titulo: 'Call Estratégia Q1',
      tipo: 'reuniao',
      data: '2026-02-19',
      horaInicio: '10:00',
      horaFim: '11:30',
      local: 'Google Meet',
      participantes: ['Equipe IMI'],
      descricao: 'Planejamento estratégico Q1 2026',
      videoCall: true,
    },
    {
      id: 4,
      titulo: 'Visita Stand - Smart Pina',
      tipo: 'visita',
      data: '2026-02-19',
      horaInicio: '15:00',
      horaFim: '16:00',
      local: 'Av. Herculano Bandeira, 234 - Recife/PE',
      participantes: ['Ana Carolina Ferreira'],
      descricao: 'Tour pelo empreendimento',
    },
    {
      id: 5,
      titulo: 'Entrega de Laudo - Ocean Blue',
      tipo: 'entrega',
      data: '2026-02-20',
      horaInicio: '11:00',
      horaFim: '12:00',
      local: 'Escritório IMI',
      participantes: ['Roberto Carlos Mendes'],
      descricao: 'Apresentação laudo avaliação cobertura',
    },
    {
      id: 6,
      titulo: 'Workshop - Marketing Digital Imobiliário',
      tipo: 'evento',
      data: '2026-02-20',
      horaInicio: '16:00',
      horaFim: '18:00',
      local: 'ADEMI Recife',
      participantes: ['Equipe Marketing'],
      descricao: 'Tendências e estratégias 2026',
    },
    {
      id: 7,
      titulo: 'Reunião Construtora Central',
      tipo: 'reuniao',
      data: '2026-02-21',
      horaInicio: '09:30',
      horaFim: '10:30',
      local: 'Sede Construtora Central',
      participantes: ['Iule Miranda', 'Diretor Comercial'],
      descricao: 'Alinhamento novos empreendimentos',
    },
    {
      id: 8,
      titulo: 'Vistoria Avaliação - Península Gardens',
      tipo: 'vistoria',
      data: '2026-02-21',
      horaInicio: '14:00',
      horaFim: '16:00',
      local: 'R. Setúbal Premium - Recife/PE',
      participantes: ['Iule Miranda'],
      descricao: 'Levantamento técnico casa 12',
    },
  ],
}

const diasSemana = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo']

export default function AgendaPage() {
  const router = useRouter()
  const [visualizacao, setVisualizacao] = useState<'semana' | 'dia'>('semana')

  const getTipoConfig = (tipo: string) => {
    const configs: Record<string, { label: string; color: string; bg: string; icon: any }> = {
      vistoria: { label: 'Vistoria', color: 'text-blue-700', bg: 'bg-blue-50', icon: Home },
      reuniao: { label: 'Reunião', color: 'text-purple-700', bg: 'bg-purple-50', icon: Users },
      visita: { label: 'Visita', color: 'text-green-700', bg: 'bg-green-50', icon: MapPin },
      entrega: { label: 'Entrega', color: 'text-orange-700', bg: 'bg-orange-50', icon: FileText },
      evento: { label: 'Evento', color: 'text-accent-700', bg: 'bg-accent-50', icon: Calendar },
    }
    return configs[tipo] || configs.reuniao
  }

  const agruparPorDia = () => {
    const grupos: Record<string, typeof eventosData.eventos> = {}

    eventosData.eventos.forEach(evento => {
      if (!grupos[evento.data]) {
        grupos[evento.data] = []
      }
      grupos[evento.data].push(evento)
    })

    return grupos
  }

  const eventosPorDia = agruparPorDia()

  const getDiaSemana = (dateStr: string) => {
    const date = new Date(dateStr)
    return diasSemana[date.getDay() === 0 ? 6 : date.getDay() - 1]
  }

  const formatarData = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agenda</h1>
          <p className="text-sm text-gray-600 mt-1">
            Gerencie reuniões, vistorias e compromissos
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1">
            <button
              onClick={() => setVisualizacao('semana')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${visualizacao === 'semana'
                  ? 'bg-accent-50 text-accent-700'
                  : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              Semana
            </button>
            <button
              onClick={() => setVisualizacao('dia')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${visualizacao === 'dia'
                  ? 'bg-accent-50 text-accent-700'
                  : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              Dia
            </button>
          </div>
          <button
            onClick={() => router.push('/backoffice/agenda/novo')}
            className="flex items-center gap-2 h-11 px-6 bg-accent-600 text-white rounded-xl font-medium hover:bg-accent-700 transition-colors"
          >
            <Plus size={20} />
            Novo Evento
          </button>
        </div>
      </div>

      {/* Navegação Semana */}
      <div className="bg-white rounded-xl p-4 border border-gray-100">
        <div className="flex items-center justify-between">
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ChevronLeft size={20} className="text-gray-600" />
          </button>
          <div className="text-center">
            <p className="text-lg font-bold text-gray-900">
              17 - 23 de Fevereiro, 2026
            </p>
            <p className="text-sm text-gray-600">Semana Atual</p>
          </div>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ChevronRight size={20} className="text-gray-600" />
          </button>
        </div>
      </div>

      {/* Grid de Eventos por Dia */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
        {Object.entries(eventosPorDia).map(([data, eventos]) => (
          <div key={data} className="bg-white rounded-xl p-4 border border-gray-100">
            {/* Header do Dia */}
            <div className="mb-4 pb-3 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-600 uppercase">
                {getDiaSemana(data)}
              </p>
              <p className="text-lg font-bold text-gray-900">{formatarData(data)}</p>
            </div>

            {/* Eventos do Dia */}
            <div className="space-y-3">
              {eventos.length === 0 ? (
                <p className="text-xs text-gray-400 italic">Sem eventos</p>
              ) : (
                eventos.map((evento) => {
                  const tipoConfig = getTipoConfig(evento.tipo)
                  const TipoIcon = tipoConfig.icon

                  return (
                    <div
                      key={evento.id}
                      className={`p-3 rounded-lg border cursor-pointer hover:shadow-sm transition-all ${tipoConfig.bg} border-current`}
                      onClick={() => router.push(`/backoffice/agenda/${evento.id}`)}
                    >
                      <div className="flex items-start gap-2 mb-2">
                        <TipoIcon size={14} className={tipoConfig.color} />
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-bold ${tipoConfig.color} line-clamp-2`}>
                            {evento.titulo}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
                        <Clock size={10} />
                        <span>{evento.horaInicio} - {evento.horaFim}</span>
                      </div>

                      {evento.videoCall && (
                        <div className="flex items-center gap-1 text-xs text-blue-600">
                          <Video size={10} />
                          <span>Videochamada</span>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Lista Detalhada de Eventos */}
      <div className="bg-white rounded-xl border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Todos os Eventos da Semana</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {eventosData.eventos.map((evento) => {
            const tipoConfig = getTipoConfig(evento.tipo)
            const TipoIcon = tipoConfig.icon

            return (
              <div
                key={evento.id}
                className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => router.push(`/backoffice/agenda/${evento.id}`)}
              >
                <div className="flex items-start gap-4">
                  {/* Icon & Time */}
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${tipoConfig.bg}`}>
                      <TipoIcon size={20} className={tipoConfig.color} />
                    </div>
                    <p className="text-xs text-gray-600 mt-2">{evento.horaInicio}</p>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">{evento.titulo}</h3>
                        <p className="text-sm text-gray-600">{evento.descricao}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-lg text-xs font-medium ${tipoConfig.bg} ${tipoConfig.color}`}>
                        {tipoConfig.label}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        {new Date(evento.data).toLocaleDateString('pt-BR')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {evento.horaInicio} - {evento.horaFim}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin size={14} />
                        {evento.local}
                      </span>
                      {evento.videoCall && (
                        <span className="flex items-center gap-1 text-blue-600">
                          <Video size={14} />
                          Videochamada
                        </span>
                      )}
                    </div>

                    {evento.participantes.length > 0 && (
                      <div className="flex items-center gap-2 mt-3">
                        <User size={14} className="text-gray-400" />
                        <div className="flex flex-wrap gap-2">
                          {evento.participantes.map((participante, idx) => (
                            <span key={idx} className="px-2 py-1 bg-gray-100 text-xs font-medium text-gray-700 rounded">
                              {participante}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
