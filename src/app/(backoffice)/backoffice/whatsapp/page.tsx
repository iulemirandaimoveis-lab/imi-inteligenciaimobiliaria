// ============================================
// BLOCO 4 — SCRIPT 6: WHATSAPP BUSINESS
// ⚠️ COPIAR EXATAMENTE — NÃO MODIFICAR
// ============================================

/**
 * SALVAR EM: src/app/(backoffice)/backoffice/whatsapp/page.tsx
 */

'use client'

import { useState, useRef, useEffect } from 'react'
import {
  Search,
  MoreVertical,
  Phone,
  Video,
  Info,
  Send,
  Paperclip,
  Smile,
  Check,
  CheckCheck,
  User,
  Clock,
  Filter,
  ArrowLeft,
  Settings,
  ShieldCheck,
  AlertCircle,
  MessageSquare,
  Zap,
  Sparkles,
  Loader2,
} from 'lucide-react'

// ⚠️ NÃO MODIFICAR - Conversas mockadas contextualizadas Recife
const CONVERSAS = [
  {
    id: 1,
    nome: 'Maria Santos Silva',
    telefone: '+55 81 99876-5432',
    ultimaMensagem: 'Gostaria de agendar uma visita ao Reserva Atlantis',
    horario: '14:32',
    naoLidas: 2,
    online: true,
    empresa: 'Hospital Português',
    avatar: null,
    status: 'Interessada',
  },
  {
    id: 2,
    nome: 'João Oliveira (Investidor)',
    telefone: '+55 81 98765-4321',
    ultimaMensagem: 'Como está o yield de locação em Boa Viagem?',
    horario: '11:05',
    naoLidas: 0,
    online: false,
    empresa: 'Family Office',
    avatar: null,
    status: 'Qualificado',
  },
  {
    id: 3,
    nome: 'Ana Paula Ferreira',
    telefone: '+55 81 99123-4567',
    ultimaMensagem: 'Enviando o laudo da avaliação... 📎',
    horario: 'Ontem',
    naoLidas: 0,
    online: true,
    empresa: 'IMI Atlantis',
    avatar: null,
    status: 'Time',
  },
  {
    id: 4,
    nome: 'Carlos Eduardo',
    telefone: '+55 11 98888-7777',
    ultimaMensagem: 'Obrigado pelas fotos do Ocean Blue',
    horario: 'Ontem',
    naoLidas: 0,
    online: false,
    empresa: 'Prospecção SP',
    avatar: null,
    status: 'Frio',
  },
  {
    id: 5,
    nome: 'Ricardo Mendes',
    telefone: '+55 81 97777-6666',
    ultimaMensagem: 'Qual o valor do m² no Pina hoje?',
    horario: '18/02',
    naoLidas: 0,
    online: false,
    empresa: 'Construtora Moura Dubeux',
    avatar: null,
    status: 'Morno',
  },
]

// ⚠️ NÃO MODIFICAR - Mensagens da conversa ativa
const MENSAGENS_INICIAIS = [
  { id: 1, texto: 'Olá Maria, bom dia! Como posso ajudar hoje?', eu: true, horario: '14:00', status: 'read' },
  { id: 2, texto: 'Olá! Vi o anúncio do Reserva Atlantis no Instagram e fiquei interessada.', eu: false, horario: '14:15' },
  { id: 3, texto: 'Excelente escolha. É o produto com melhor performance em Boa Viagem hoje.', eu: true, horario: '14:20', status: 'read' },
  { id: 4, texto: 'Vocês têm unidades acima do 15º andar?', eu: false, horario: '14:30' },
  { id: 5, texto: 'Gostaria de agendar uma visita ao Reserva Atlantis', eu: false, horario: '14:32' },
]

// ⚠️ NÃO MODIFICAR - Templates de resposta rápida
const TEMPLATES_WHATSAPP = [
  { id: 'visita', label: 'Agendar Visita', text: 'Olá [Nome], podemos agendar uma visita técnica para amanhã às 10h ou 15h? Estarei com o material completo do Reserva Atlantis.' },
  { id: 'laudo', label: 'Enviar Laudo', text: 'Segue em anexo o laudo de avaliação técnica conforme NBR 14653. Fico à disposição para dúvidas.' },
  { id: 'invest', label: 'Dados Investimento', text: 'O yield médio nesta região de Boa Viagem está em 0,72% a.m., com valorização histórica de 18% ao ano.' },
]

export default function WhatsappPage() {
  const [conversations, setConversations] = useState(CONVERSAS)
  const [activeConversation, setActiveConversation] = useState(CONVERSAS[0])
  const [messages, setMessages] = useState(MENSAGENS_INICIAIS)
  const [newMessage, setNewMessage] = useState('')
  const [search, setSearch] = useState('')
  const [showTemplates, setShowTemplates] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = () => {
    if (!newMessage.trim()) return
    const msg = {
      id: Date.now(),
      texto: newMessage,
      eu: true,
      horario: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      status: 'sent',
    }
    setMessages([...messages, msg])
    setNewMessage('')
    setShowTemplates(false)
  }

  const applyTemplate = (text: string) => {
    setNewMessage(text.replace('[Nome]', activeConversation.nome.split(' ')[0]))
    setShowTemplates(false)
  }

  const generateAIReply = async () => {
    setAiLoading(true)
    setShowTemplates(false)

    const lastMsg = messages[messages.length - 1]?.texto || ''

    try {
      const res = await fetch('/api/ai/router', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_type: 'legenda',
          prompt: `Gere uma resposta curta (máx 2 parágrafos) para o cliente ${activeConversation.nome}.\nContexto da última mensagem dele: "${lastMsg}"`,
          platform: 'email',
          context: `Empresa: IMI Atlantis. Mercado Imobiliário de Luxo em Recife.`
        })
      })

      const data = await res.json()
      if (data.success) {
        setNewMessage(data.result)
      }
    } catch (err) {
      console.error('AI Reply error:', err)
    } finally {
      setAiLoading(false)
    }
  }

  const filteredConversations = conversations.filter(c =>
    c.nome.toLowerCase().includes(search.toLowerCase()) ||
    c.telefone.includes(search)
  )

  return (
    <div className="h-[calc(100vh-140px)] flex bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
      {/* ── Sidebar: Lista de Conversas ──────────────────────────────── */}
      <div className="w-80 md:w-96 border-r border-gray-100 flex flex-col bg-gray-50/50">
        <div className="p-4 bg-white border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-900">Mensagens</h1>
            <div className="flex gap-1">
              <button className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 transition-colors">
                <MessageSquare size={18} />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 transition-colors">
                <Settings size={18} />
              </button>
            </div>
          </div>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar ou começar nova conversa"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-gray-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-accent-500 transition-all font-medium"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredConversations.map(conversa => (
            <button
              key={conversa.id}
              onClick={() => setActiveConversation(conversa)}
              className={`w-full flex items-center gap-3 p-4 hover:bg-white transition-all border-l-4 ${activeConversation.id === conversa.id ? 'bg-white border-accent-500' : 'border-transparent'
                }`}
            >
              <div className="relative flex-shrink-0">
                <div className="w-12 h-12 bg-accent-100 rounded-2xl flex items-center justify-center text-accent-700 font-bold">
                  {conversa.nome[0]}
                </div>
                {conversa.online && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full" />
                )}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="flex justify-between items-baseline mb-0.5">
                  <span className="text-sm font-bold text-gray-900 truncate">{conversa.nome}</span>
                  <span className="text-[10px] font-medium text-gray-400">{conversa.horario}</span>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-xs text-gray-500 truncate">{conversa.ultimaMensagem}</p>
                  {conversa.naoLidas > 0 && (
                    <span className="bg-accent-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                      {conversa.naoLidas}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Chat: Área Principal ────────────────────────────────────── */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Header do Chat */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button className="md:hidden p-2 -ml-2 hover:bg-gray-100 rounded-xl">
              <ArrowLeft size={20} />
            </button>
            <div className="w-10 h-10 bg-accent-100 rounded-xl flex items-center justify-center text-accent-700 font-bold">
              {activeConversation.nome[0]}
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900 leading-tight">{activeConversation.nome}</h2>
              <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-medium">
                <span className={activeConversation.online ? 'text-green-500' : ''}>
                  {activeConversation.online ? 'Online agora' : 'Visto por último hoje'}
                </span>
                <span>•</span>
                <span className="text-accent-600 px-1.5 py-0.5 bg-accent-50 rounded-md">
                  {activeConversation.status}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 transition-colors">
              <Video size={18} />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 transition-colors">
              <Phone size={18} />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 transition-colors">
              <Search size={18} />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 transition-colors">
              <MoreVertical size={18} />
            </button>
          </div>
        </div>

        {/* Disclaimer / Info */}
        <div className="px-6 py-2 bg-amber-50/50 border-b border-amber-100 flex items-center gap-2">
          <ShieldCheck size={14} className="text-amber-600" />
          <p className="text-[10px] text-amber-700 font-medium">
            Integração oficial via <span className="font-bold">WhatsApp Business API</span>. Mensagens criptografadas.
          </p>
        </div>

        {/* Mensagens */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/30"
          style={{ backgroundImage: 'radial-gradient(#e5e7eb 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }}
        >
          <div className="flex justify-center mb-6">
            <span className="bg-white/80 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-gray-400 uppercase tracking-widest border border-gray-100 shadow-sm">
              Hoje
            </span>
          </div>

          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.eu ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm relative group ${msg.eu
                  ? 'bg-accent-600 text-white rounded-tr-none'
                  : 'bg-white border border-gray-100 text-gray-900 rounded-tl-none'
                  }`}
              >
                <p className="text-sm leading-relaxed">{msg.texto}</p>
                <div className={`flex items-center justify-end gap-1 mt-1 ${msg.eu ? 'text-white/70' : 'text-gray-400'}`}>
                  <span className="text-[10px] font-medium">{msg.horario}</span>
                  {msg.eu && (
                    <span>
                      {msg.status === 'read' ? <CheckCheck size={12} /> : <Check size={12} />}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Input e Ferramentas */}
        <div className="p-4 bg-white border-t border-gray-100">
          {(showTemplates || aiLoading) && (
            <div className="mb-4 flex flex-wrap gap-2 animate-in slide-in-from-bottom-2">
              {aiLoading ? (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-accent-50 text-accent-700 rounded-xl text-xs font-semibold border border-accent-100">
                  <Loader2 size={14} className="animate-spin" />
                  IA formulando resposta estratégica...
                </div>
              ) : (
                <>
                  {TEMPLATES_WHATSAPP.map(tpl => (
                    <button
                      key={tpl.id}
                      onClick={() => applyTemplate(tpl.text)}
                      className="px-3 py-1.5 bg-accent-50 text-accent-700 rounded-xl text-xs font-semibold hover:bg-accent-100 transition-colors border border-accent-100"
                    >
                      {tpl.label}
                    </button>
                  ))}
                  <button
                    onClick={generateAIReply}
                    className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-colors border border-indigo-100 flex items-center gap-1.5"
                  >
                    <Sparkles size={14} />
                    Auto-Reply IA
                  </button>
                  <button
                    onClick={() => setShowTemplates(false)}
                    className="px-3 py-1.5 bg-gray-100 text-gray-500 rounded-xl text-xs font-semibold hover:bg-gray-200"
                  >
                    Cancelar
                  </button>
                </>
              )}
            </div>
          )}

          <div className="flex items-end gap-2">
            <div className="flex gap-1 mb-1">
              <button
                onClick={() => setShowTemplates(!showTemplates)}
                className={`p-2.5 rounded-xl transition-all ${showTemplates ? 'bg-accent-600 text-white' : 'hover:bg-gray-100 text-gray-500'
                  }`}
                title="Templates & IA"
              >
                <Zap size={20} />
              </button>
              <button className="p-2.5 hover:bg-gray-100 rounded-xl text-gray-500 transition-colors">
                <Paperclip size={20} />
              </button>
              <button className="p-2.5 hover:bg-gray-100 rounded-xl text-gray-500 transition-colors">
                <Smile size={20} />
              </button>
            </div>

            <div className="flex-1 relative">
              <textarea
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                placeholder="Digite uma mensagem..."
                className="w-full h-11 py-3 px-4 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-accent-500 transition-all font-medium resize-none shadow-inner"
              />
            </div>

            <button
              onClick={handleSend}
              disabled={!newMessage.trim()}
              className="h-11 w-11 flex items-center justify-center bg-accent-600 text-white rounded-2xl hover:bg-accent-700 transition-all disabled:opacity-50 disabled:hover:bg-accent-600 shadow-md shadow-accent-200"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Painel Direito: Info do Lead ────────────────────────────── */}
      <div className="hidden xl:flex w-72 border-l border-gray-100 flex-col bg-gray-50/30">
        <div className="p-6 text-center border-b border-gray-100 bg-white shadow-sm">
          <div className="w-20 h-20 bg-accent-100 rounded-3xl mx-auto flex items-center justify-center text-accent-700 text-2xl font-bold mb-3 shadow-lg shadow-accent-100">
            {activeConversation.nome[0]}
          </div>
          <h3 className="font-bold text-gray-900">{activeConversation.nome}</h3>
          <p className="text-xs text-gray-500 mt-1 font-medium">{activeConversation.telefone}</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <section>
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">CRM Insight</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs">
                <Clock size={14} className="text-gray-400" />
                <span className="text-gray-500 font-medium">Última visita: 14:32</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] bg-blue-50 text-blue-700 px-2 py-1 rounded-lg font-bold w-fit">
                <ShieldCheck size={12} />
                <span>Lead Qualificado</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-900 font-bold">
                <AlertCircle size={14} className="text-gray-400" />
                <span>Value: R$ 2.4M</span>
              </div>
            </div>
          </section>

          <section>
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Segmentação</h4>
            <div className="flex flex-wrap gap-1.5">
              <span className="px-2 py-1 bg-accent-50 text-accent-700 rounded-lg text-[10px] font-bold border border-accent-100">Reserva Atlantis</span>
              <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-[10px] font-bold border border-indigo-100">Investidor</span>
              <span className="px-2 py-1 bg-green-50 text-green-700 rounded-lg text-[10px] font-bold border border-green-100">Alta Renda</span>
            </div>
          </section>

          <section>
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Notas de Contexto</h4>
            <div className="p-3 bg-white rounded-xl border border-gray-100 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-accent-500" />
              <p className="text-[10px] text-gray-600 italic leading-relaxed font-medium">
                "Busca rentabilidade anual superior a 15%. Interessada em unidades com vista mar definitiva em Boa Viagem."
              </p>
            </div>
          </section>
        </div>

        <div className="p-4 border-t border-gray-100 bg-white">
          <button className="w-full h-10 bg-gray-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-all flex items-center justify-center gap-2">
            Ver Ficha Completa
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}

function ArrowRight({ size, className }: { size: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  )
}
