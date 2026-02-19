/**
 * SALVAR EM: src/app/(backoffice)/backoffice/whatsapp/page.tsx
 *
 * Central WhatsApp: conversas + templates + status
 * MOCKADO — Integração real via Meta Cloud API (fase 2)
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  MessageSquare,
  Search,
  Send,
  Phone,
  MoreVertical,
  Check,
  CheckCheck,
  Clock,
  Tag,
  Plus,
  Filter,
  Star,
  Archive,
  RefreshCw,
  ChevronRight,
  User,
  Building,
  Sparkles,
  AlertCircle,
  Zap,
} from 'lucide-react'

// ⚠️ NÃO MODIFICAR - Conversas mockadas Recife
const CONVERSAS = [
  {
    id: 1,
    nome: 'Maria Santos Silva',
    telefone: '(81) 99845-3421',
    perfil: 'Lead — Boa Viagem',
    avatar: 'MS',
    ultima_mensagem: 'Teria disponibilidade para visita na próxima semana?',
    horario: '14:32',
    nao_lidas: 2,
    status: 'lead_quente',
    online: true,
    mensagens: [
      { id: 1, texto: 'Olá! Vi o anúncio do Reserva Atlantis no Instagram.', lado: 'recebida', horario: '14:10', lida: true },
      { id: 2, texto: 'Boa tarde, Maria! Que bom que entrou em contato. O Reserva Atlantis é realmente um empreendimento especial — estamos na fase 2 de lançamento com condições exclusivas.', lado: 'enviada', horario: '14:15', lida: true },
      { id: 3, texto: 'Interessante! Qual o valor médio dos apartamentos?', lado: 'recebida', horario: '14:18', lida: true },
      { id: 4, texto: 'As unidades variam de R$ 580k a R$ 1,2M dependendo da tipologia. Temos de 2 a 4 suítes, todos com vista mar. Posso enviar o book completo?', lado: 'enviada', horario: '14:20', lida: true },
      { id: 5, texto: 'Sim, por favor! Teria disponibilidade para visita na próxima semana?', lado: 'recebida', horario: '14:32', lida: false },
    ],
  },
  {
    id: 2,
    nome: 'João Pedro Almeida',
    telefone: '(81) 99234-8901',
    perfil: 'Lead — Investidor',
    avatar: 'JP',
    ultima_mensagem: 'Quais os dados de valorização do bairro nos últimos 3 anos?',
    horario: '11:45',
    nao_lidas: 1,
    status: 'lead_quente',
    online: false,
    mensagens: [
      { id: 1, texto: 'Recebi a indicação de um colega sobre vocês. Estou analisando investimento imobiliário em Recife.', lado: 'recebida', horario: '10:30', lida: true },
      { id: 2, texto: 'Olá João Pedro! Seja muito bem-vindo. Recife tem apresentado uma das melhores relações risco-retorno do mercado nacional. Posso compartilhar nosso relatório de mercado Q4 2025?', lado: 'enviada', horario: '10:45', lida: true },
      { id: 3, texto: 'Sim, me interessa muito. Qual é o ticket mínimo que vocês trabalham?', lado: 'recebida', horario: '11:02', lida: true },
      { id: 4, texto: 'Nosso foco é em imóveis a partir de R$ 400k, com curadoria completa: análise técnica, due diligence jurídica e acompanhamento pós-aquisição.', lado: 'enviada', horario: '11:10', lida: true },
      { id: 5, texto: 'Quais os dados de valorização do bairro nos últimos 3 anos?', lado: 'recebida', horario: '11:45', lida: false },
    ],
  },
  {
    id: 3,
    nome: 'Ana Carolina Ferreira',
    telefone: '(81) 98765-1234',
    perfil: 'Cliente — Pina',
    avatar: 'AC',
    ultima_mensagem: 'Perfeito, aguardo o contrato para revisão.',
    horario: 'Ontem',
    nao_lidas: 0,
    status: 'cliente',
    online: false,
    mensagens: [
      { id: 1, texto: 'Bom dia! Passando para confirmar a proposta do Smart Pina Apto 304.', lado: 'recebida', horario: 'Ontem 09:15', lida: true },
      { id: 2, texto: 'Bom dia, Ana Carolina! A proposta foi aceita pela construtora. Valor final: R$ 487.500 com financiamento Caixa em 360 meses.', lado: 'enviada', horario: 'Ontem 09:30', lida: true },
      { id: 3, texto: 'Excelente! Quando assino o contrato?', lado: 'recebida', horario: 'Ontem 09:45', lida: true },
      { id: 4, texto: 'Esta semana o jurídico finaliza. Já estamos com o documento pronto para revisão. Posso agendar para quinta-feira às 15h?', lado: 'enviada', horario: 'Ontem 10:00', lida: true },
      { id: 5, texto: 'Perfeito, aguardo o contrato para revisão.', lado: 'recebida', horario: 'Ontem 10:15', lida: true },
    ],
  },
  {
    id: 4,
    nome: 'Roberto Carlos Mendes',
    telefone: '(81) 99012-5678',
    perfil: 'Lead — Ocean Blue',
    avatar: 'RC',
    ultima_mensagem: 'Obrigado pelas informações. Vou conversar com minha família.',
    horario: 'Ter',
    nao_lidas: 0,
    status: 'lead_morno',
    online: false,
    mensagens: [
      { id: 1, texto: 'Oi, tenho interesse na cobertura do Ocean Blue. É possível visitar?', lado: 'recebida', horario: 'Ter 14:00', lida: true },
      { id: 2, texto: 'Claro, Roberto! A cobertura do Ocean Blue é realmente excepcional — 320m², terraço com piscina privativa e vista 360° para o mar. Temos visita disponível amanhã ou na semana que vem.', lado: 'enviada', horario: 'Ter 14:20', lida: true },
      { id: 3, texto: 'Qual o valor?', lado: 'recebida', horario: 'Ter 14:25', lida: true },
      { id: 4, texto: 'R$ 2,8M à vista. Em financiamento, trabalhamos com estruturação especial para esse perfil de ativo. Posso apresentar as opções?', lado: 'enviada', horario: 'Ter 14:35', lida: true },
      { id: 5, texto: 'Obrigado pelas informações. Vou conversar com minha família.', lado: 'recebida', horario: 'Ter 15:00', lida: true },
    ],
  },
]

// ⚠️ NÃO MODIFICAR - Templates de mensagem
const TEMPLATES = [
  { id: 1, nome: 'Boas-vindas Lead', texto: 'Olá {nome}! 👋\n\nAqui é da IMI — Inteligência Imobiliária. Vi que você demonstrou interesse em nossos imóveis premium em Recife.\n\nSou o(a) {corretor} e estou à disposição para te ajudar a encontrar o imóvel ideal.\n\nPosso te enviar nosso catálogo exclusivo?' },
  { id: 2, nome: 'Follow-up 24h', texto: 'Olá {nome}! Passando para verificar se recebeu as informações que enviei ontem sobre {imovel}.\n\nFicou alguma dúvida? Posso agendar uma visita esta semana.' },
  { id: 3, nome: 'Agendamento de Visita', texto: 'Olá {nome}! Confirmando nossa visita ao {imovel} em {data} às {horario}.\n\nEndereço: {endereco}\n\nAté logo! 🏡' },
  { id: 4, nome: 'Proposta Aceita', texto: 'Ótima notícia, {nome}! 🎉\n\nSua proposta para o {imovel} foi aceita.\n\nPróximos passos:\n1. Análise jurídica do contrato\n2. Assinatura digital\n3. Registro em cartório\n\nEstarei em contato em breve com os documentos.' },
]

const STATUS_LEAD: Record<string, { label: string; color: string }> = {
  lead_quente: { label: 'Lead Quente', color: 'bg-red-50 text-red-700' },
  lead_morno: { label: 'Lead Morno', color: 'bg-orange-50 text-orange-700' },
  cliente: { label: 'Cliente', color: 'bg-green-50 text-green-700' },
  arquivado: { label: 'Arquivado', color: 'bg-gray-100 text-gray-500' },
}

export default function WhatsAppPage() {
  const router = useRouter()
  const [conversaSelecionada, setConversaSelecionada] = useState(CONVERSAS[0])
  const [mensagem, setMensagem] = useState('')
  const [busca, setBusca] = useState('')
  const [mostrarTemplates, setMostrarTemplates] = useState(false)
  const [mensagens, setMensagens] = useState(CONVERSAS[0].mensagens)

  const stats = {
    conversas: CONVERSAS.length,
    nao_lidas: CONVERSAS.reduce((acc, c) => acc + c.nao_lidas, 0),
    leads_quentes: CONVERSAS.filter(c => c.status === 'lead_quente').length,
    clientes: CONVERSAS.filter(c => c.status === 'cliente').length,
  }

  const conversasFiltradas = CONVERSAS.filter(c =>
    c.nome.toLowerCase().includes(busca.toLowerCase()) ||
    c.telefone.includes(busca)
  )

  const selecionarConversa = (conversa: typeof CONVERSAS[0]) => {
    setConversaSelecionada(conversa)
    setMensagens(conversa.mensagens)
    setMostrarTemplates(false)
    setMensagem('')
  }

  const enviarMensagem = () => {
    if (!mensagem.trim()) return
    const nova = {
      id: mensagens.length + 1,
      texto: mensagem,
      lado: 'enviada' as const,
      horario: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      lida: false,
    }
    setMensagens(prev => [...prev, nova])
    setMensagem('')
  }

  const usarTemplate = (template: typeof TEMPLATES[0]) => {
    setMensagem(template.texto.replace('{nome}', conversaSelecionada.nome.split(' ')[0]))
    setMostrarTemplates(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">WhatsApp Business</h1>
          <p className="text-sm text-gray-600 mt-1">Central de mensagens e atendimento</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 rounded-xl border border-amber-100">
            <AlertCircle size={14} className="text-amber-600" />
            <span className="text-xs text-amber-700 font-medium">Modo demonstração</span>
          </div>
          <button className="flex items-center gap-2 h-10 px-4 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700">
            <Plus size={16} />
            Nova Conversa
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Conversas', value: stats.conversas, color: 'text-gray-900' },
          { label: 'Não Lidas', value: stats.nao_lidas, color: 'text-red-600' },
          { label: 'Leads Quentes', value: stats.leads_quentes, color: 'text-orange-600' },
          { label: 'Clientes', value: stats.clientes, color: 'text-green-700' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-4 border border-gray-100">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{s.label}</p>
            <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Interface de chat */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden" style={{ height: '600px' }}>
        <div className="flex h-full">
          {/* Lista de conversas */}
          <div className="w-80 flex-shrink-0 border-r border-gray-100 flex flex-col">
            {/* Busca */}
            <div className="p-3 border-b border-gray-50">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={busca}
                  onChange={e => setBusca(e.target.value)}
                  placeholder="Buscar conversa..."
                  className="w-full h-9 pl-9 pr-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Lista */}
            <div className="flex-1 overflow-y-auto">
              {conversasFiltradas.map(conversa => (
                <button
                  key={conversa.id}
                  onClick={() => selecionarConversa(conversa)}
                  className={`w-full px-3 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 ${conversaSelecionada.id === conversa.id ? 'bg-accent-50' : ''
                    }`}
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-accent-100 text-accent-700 text-sm font-bold flex items-center justify-center">
                      {conversa.avatar}
                    </div>
                    {conversa.online && (
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
                    )}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900 truncate">{conversa.nome}</span>
                      <span className="text-xs text-gray-400 flex-shrink-0 ml-1">{conversa.horario}</span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className="text-xs text-gray-500 truncate pr-2">{conversa.ultima_mensagem}</p>
                      {conversa.nao_lidas > 0 && (
                        <span className="flex-shrink-0 w-5 h-5 bg-green-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                          {conversa.nao_lidas}
                        </span>
                      )}
                    </div>
                    <span className={`inline-block mt-1 px-1.5 py-0.5 rounded text-xs font-medium ${STATUS_LEAD[conversa.status].color}`}>
                      {STATUS_LEAD[conversa.status].label}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Área de chat */}
          <div className="flex-1 flex flex-col">
            {/* Header da conversa */}
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-accent-100 text-accent-700 text-sm font-bold flex items-center justify-center">
                  {conversaSelecionada.avatar}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{conversaSelecionada.nome}</p>
                  <p className="text-xs text-gray-500">{conversaSelecionada.perfil} · {conversaSelecionada.telefone}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => router.push(`/backoffice/leads`)}
                  className="flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-medium bg-accent-50 text-accent-700 hover:bg-accent-100"
                >
                  <User size={12} />
                  Ver Lead
                </button>
                <button className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-500">
                  <Phone size={14} />
                </button>
                <button className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-500">
                  <MoreVertical size={14} />
                </button>
              </div>
            </div>

            {/* Mensagens */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {mensagens.map(msg => (
                <div
                  key={msg.id}
                  className={`flex ${msg.lado === 'enviada' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-sm px-3 py-2 rounded-2xl text-sm leading-relaxed ${msg.lado === 'enviada'
                        ? 'bg-accent-600 text-white rounded-br-sm'
                        : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                      }`}
                  >
                    <p className="whitespace-pre-line">{msg.texto}</p>
                    <div className={`flex items-center justify-end gap-1 mt-1 ${msg.lado === 'enviada' ? 'text-white/60' : 'text-gray-400'
                      }`}>
                      <span className="text-xs">{msg.horario}</span>
                      {msg.lado === 'enviada' && (
                        msg.lida ? <CheckCheck size={12} className="text-blue-300" /> : <Check size={12} />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Templates */}
            {mostrarTemplates && (
              <div className="border-t border-gray-100 p-3 bg-gray-50">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Templates Rápidos</p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {TEMPLATES.map(t => (
                    <button
                      key={t.id}
                      onClick={() => usarTemplate(t)}
                      className="flex-shrink-0 px-3 py-2 bg-white rounded-xl border border-gray-200 text-xs font-medium text-gray-700 hover:border-accent-300 hover:text-accent-700 transition-colors"
                    >
                      {t.nome}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input de mensagem */}
            <div className="px-4 py-3 border-t border-gray-100 flex items-center gap-2">
              <button
                onClick={() => setMostrarTemplates(!mostrarTemplates)}
                className={`w-9 h-9 flex items-center justify-center rounded-xl transition-colors ${mostrarTemplates ? 'bg-accent-100 text-accent-600' : 'hover:bg-gray-100 text-gray-400'
                  }`}
                title="Templates"
              >
                <Zap size={16} />
              </button>
              <input
                value={mensagem}
                onChange={e => setMensagem(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && enviarMensagem()}
                placeholder="Digite uma mensagem..."
                className="flex-1 h-10 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-accent-500 focus:border-transparent"
              />
              <button
                onClick={enviarMensagem}
                disabled={!mensagem.trim()}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-accent-600 text-white hover:bg-accent-700 disabled:opacity-40 transition-colors"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Aviso integração */}
      <div className="bg-blue-50 rounded-2xl border border-blue-100 p-4 flex items-start gap-3">
        <AlertCircle size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-blue-900">Integração WhatsApp Business API</p>
          <p className="text-xs text-blue-700 mt-0.5">
            Esta interface está em modo demonstração. Para ativar em produção, configure:
            <strong> Meta Cloud API</strong> (oficial) ou <strong>Evolution API</strong> (self-hosted).
            Adicione <code className="bg-blue-100 px-1 rounded">WHATSAPP_TOKEN</code> e <code className="bg-blue-100 px-1 rounded">WHATSAPP_PHONE_ID</code> no .env.local.
          </p>
        </div>
      </div>
    </div>
  )
}
