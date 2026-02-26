'use client'

import { useState, useRef, useEffect } from 'react'
import {
  Search, MoreVertical, Phone, Video, Send, Paperclip, Smile,
  Check, CheckCheck, Clock, ArrowLeft, Settings, ShieldCheck,
  AlertCircle, MessageSquare, Zap, Sparkles, Loader2, X
} from 'lucide-react'

/* ── Design Tokens ──────────────────────────────────────────── */
const T = {
  surface: 'var(--bo-surface)',
  elevated: 'var(--bo-elevated)',
  hover: 'var(--bo-hover)',
  border: 'var(--bo-border)',
  borderGold: 'var(--bo-border-gold)',
  text: 'var(--bo-text)',
  textMuted: 'var(--bo-text-muted)',
  textTertiary: 'var(--bo-text-tertiary, var(--bo-text-muted))',
  gold: '#C49D5B',
  shadow: 'var(--bo-shadow)',
}

/* ── Mock Data (unchanged) ──────────────────────────────────── */
const CONVERSAS = [
  { id: 1, nome: 'Maria Santos Silva', telefone: '+55 81 99876-5432', ultimaMensagem: 'Gostaria de agendar uma visita ao Reserva Atlantis', horario: '14:32', naoLidas: 2, online: true, empresa: 'Hospital Português', status: 'Interessada' },
  { id: 2, nome: 'João Oliveira (Investidor)', telefone: '+55 81 98765-4321', ultimaMensagem: 'Como está o yield de locação em Boa Viagem?', horario: '11:05', naoLidas: 0, online: false, empresa: 'Family Office', status: 'Qualificado' },
  { id: 3, nome: 'Ana Paula Ferreira', telefone: '+55 81 99123-4567', ultimaMensagem: 'Enviando o laudo da avaliação... 📎', horario: 'Ontem', naoLidas: 0, online: true, empresa: 'IMI Atlantis', status: 'Time' },
  { id: 4, nome: 'Carlos Eduardo', telefone: '+55 11 98888-7777', ultimaMensagem: 'Obrigado pelas fotos do Ocean Blue', horario: 'Ontem', naoLidas: 0, online: false, empresa: 'Prospecção SP', status: 'Frio' },
  { id: 5, nome: 'Ricardo Mendes', telefone: '+55 81 97777-6666', ultimaMensagem: 'Qual o valor do m² no Pina hoje?', horario: '18/02', naoLidas: 0, online: false, empresa: 'Construtora Moura Dubeux', status: 'Morno' },
]

const MENSAGENS_INICIAIS = [
  { id: 1, texto: 'Olá Maria, bom dia! Como posso ajudar hoje?', eu: true, horario: '14:00', status: 'read' },
  { id: 2, texto: 'Olá! Vi o anúncio do Reserva Atlantis no Instagram e fiquei interessada.', eu: false, horario: '14:15' },
  { id: 3, texto: 'Excelente escolha. É o produto com melhor performance em Boa Viagem hoje.', eu: true, horario: '14:20', status: 'read' },
  { id: 4, texto: 'Vocês têm unidades acima do 15º andar?', eu: false, horario: '14:30' },
  { id: 5, texto: 'Gostaria de agendar uma visita ao Reserva Atlantis', eu: false, horario: '14:32' },
]

const TEMPLATES_WHATSAPP = [
  { id: 'visita', label: 'Agendar Visita', text: 'Olá [Nome], podemos agendar uma visita técnica para amanhã às 10h ou 15h? Estarei com o material completo do Reserva Atlantis.' },
  { id: 'laudo', label: 'Enviar Laudo', text: 'Segue em anexo o laudo de avaliação técnica conforme NBR 14653. Fico à disposição para dúvidas.' },
  { id: 'invest', label: 'Dados Investimento', text: 'O yield médio nesta região de Boa Viagem está em 0,72% a.m., com valorização histórica de 18% ao ano.' },
]

type Conversa = typeof CONVERSAS[number]
type Msg = typeof MENSAGENS_INICIAIS[number]

export default function WhatsappPage() {
  const [activeConversation, setActiveConversation] = useState<Conversa>(CONVERSAS[0])
  const [messages, setMessages] = useState<Msg[]>(MENSAGENS_INICIAIS)
  const [newMessage, setNewMessage] = useState('')
  const [search, setSearch] = useState('')
  const [showTemplates, setShowTemplates] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [showInfo, setShowInfo] = useState(false)
  // Mobile: show chat (true) or list (false)
  const [mobileShowChat, setMobileShowChat] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages])

  const handleSend = () => {
    if (!newMessage.trim()) return
    setMessages(prev => [...prev, {
      id: Date.now(), texto: newMessage, eu: true,
      horario: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      status: 'sent',
    }])
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
      if (data.success) setNewMessage(data.result)
    } catch (err) { console.error('AI Reply error:', err) }
    finally { setAiLoading(false) }
  }

  const selectConversation = (c: Conversa) => {
    setActiveConversation(c)
    setMobileShowChat(true)
    setShowInfo(false)
  }

  const filteredConversations = CONVERSAS.filter(c =>
    c.nome.toLowerCase().includes(search.toLowerCase()) || c.telefone.includes(search)
  )

  return (
    <div
      className="flex overflow-hidden rounded-2xl lg:rounded-3xl"
      style={{
        height: 'calc(100vh - 140px)',
        background: T.elevated,
        border: `1px solid ${T.border}`,
        boxShadow: T.shadow,
      }}
    >
      {/* ═══════════════ SIDEBAR: CONVERSATION LIST ═══════════════ */}
      <div
        className={`${mobileShowChat ? 'hidden' : 'flex'} lg:flex flex-col w-full lg:w-80 xl:w-96 flex-shrink-0`}
        style={{ borderRight: `1px solid ${T.border}`, background: T.surface }}
      >
        {/* Header */}
        <div className="p-4 flex-shrink-0" style={{ borderBottom: `1px solid ${T.border}`, background: T.elevated }}>
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-bold" style={{ color: T.text }}>Mensagens</h1>
            <div className="flex gap-1">
              <button className="p-2 rounded-xl transition-colors" style={{ color: T.textMuted }}
                onMouseEnter={e => (e.currentTarget.style.background = T.hover)}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <MessageSquare size={18} />
              </button>
              <button className="p-2 rounded-xl transition-colors" style={{ color: T.textMuted }}
                onMouseEnter={e => (e.currentTarget.style.background = T.hover)}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <Settings size={18} />
              </button>
            </div>
          </div>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: T.textTertiary }} />
            <input
              type="text"
              placeholder="Buscar ou começar nova conversa"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-xl text-sm font-medium outline-none transition-all"
              style={{ background: T.hover, color: T.text, border: `1px solid transparent` }}
              onFocus={e => (e.currentTarget.style.borderColor = T.gold)}
              onBlur={e => (e.currentTarget.style.borderColor = 'transparent')}
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.map(conversa => {
            const active = activeConversation.id === conversa.id
            return (
              <button
                key={conversa.id}
                onClick={() => selectConversation(conversa)}
                className="w-full flex items-center gap-3 p-4 transition-all"
                style={{
                  background: active ? T.elevated : 'transparent',
                  borderLeft: active ? `3px solid ${T.gold}` : '3px solid transparent',
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = T.hover }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
              >
                <div className="relative flex-shrink-0">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm"
                    style={{ background: 'rgba(196,157,91,0.12)', color: T.gold }}>
                    {conversa.nome[0]}
                  </div>
                  {conversa.online && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full"
                      style={{ background: 'var(--s-done)', border: `2px solid ${T.elevated}` }} />
                  )}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <span className="text-sm font-semibold truncate" style={{ color: T.text }}>{conversa.nome}</span>
                    <span className="text-[10px] font-medium flex-shrink-0 ml-2" style={{ color: T.textTertiary }}>{conversa.horario}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-xs truncate" style={{ color: T.textMuted }}>{conversa.ultimaMensagem}</p>
                    {conversa.naoLidas > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center text-white flex-shrink-0 ml-2"
                        style={{ background: T.gold }}>{conversa.naoLidas}</span>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* ═══════════════ CHAT AREA ═══════════════ */}
      <div className={`${mobileShowChat ? 'flex' : 'hidden'} lg:flex flex-1 flex-col min-w-0`}
        style={{ background: T.elevated }}>

        {/* Chat Header */}
        <div className="h-14 flex items-center justify-between px-3 sm:px-5 flex-shrink-0"
          style={{ borderBottom: `1px solid ${T.border}`, background: T.elevated }}>
          <div className="flex items-center gap-2.5 min-w-0">
            <button className="lg:hidden p-1.5 rounded-xl flex-shrink-0"
              onClick={() => setMobileShowChat(false)}
              style={{ color: T.textMuted }}>
              <ArrowLeft size={20} />
            </button>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0"
              style={{ background: 'rgba(196,157,91,0.12)', color: T.gold }}>
              {activeConversation.nome[0]}
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold leading-tight truncate" style={{ color: T.text }}>{activeConversation.nome}</h2>
              <div className="flex items-center gap-1.5 text-[10px] font-medium" style={{ color: T.textTertiary }}>
                <span style={{ color: activeConversation.online ? 'var(--s-done)' : T.textTertiary }}>
                  {activeConversation.online ? 'Online agora' : 'Visto por último hoje'}
                </span>
                <span>•</span>
                <span className="px-1.5 py-0.5 rounded-md"
                  style={{ background: 'rgba(196,157,91,0.10)', color: T.gold }}>{activeConversation.status}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-0.5 flex-shrink-0">
            {[Video, Phone, Search].map((Icon, i) => (
              <button key={i} className="hidden sm:flex p-2 rounded-xl transition-colors"
                style={{ color: T.textMuted }}
                onMouseEnter={e => (e.currentTarget.style.background = T.hover)}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <Icon size={18} />
              </button>
            ))}
            <button className="p-2 rounded-xl transition-colors"
              onClick={() => setShowInfo(!showInfo)}
              style={{ color: showInfo ? T.gold : T.textMuted }}
              onMouseEnter={e => (e.currentTarget.style.background = T.hover)}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <MoreVertical size={18} />
            </button>
          </div>
        </div>

        {/* WhatsApp API Disclaimer */}
        <div className="px-3 sm:px-5 py-1.5 flex items-center gap-2 flex-shrink-0"
          style={{ background: 'var(--s-warm-bg)', borderBottom: `1px solid rgba(196,157,91,0.15)` }}>
          <ShieldCheck size={13} style={{ color: 'var(--s-warm)' }} />
          <p className="text-[10px] font-medium" style={{ color: 'var(--s-warm)' }}>
            Integração oficial via <span className="font-bold">WhatsApp Business API</span>. Mensagens criptografadas.
          </p>
        </div>

        {/* Messages Area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3"
          style={{ background: T.surface }}>
          <div className="flex justify-center mb-4">
            <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest"
              style={{ background: T.elevated, color: T.textTertiary, border: `1px solid ${T.border}` }}>
              Hoje
            </span>
          </div>

          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.eu ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 ${msg.eu ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}
                style={msg.eu
                  ? { background: '#C49D5B', color: '#fff' }
                  : { background: T.elevated, border: `1px solid ${T.border}`, color: T.text }
                }
              >
                <p className="text-sm leading-relaxed" style={msg.eu ? {} : { color: T.text }}>{msg.texto}</p>
                <div className="flex items-center justify-end gap-1 mt-1"
                  style={{ color: msg.eu ? 'rgba(255,255,255,0.65)' : T.textTertiary }}>
                  <span className="text-[10px] font-medium">{msg.horario}</span>
                  {msg.eu && (msg.status === 'read' ? <CheckCheck size={12} /> : <Check size={12} />)}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Input Area — always at bottom */}
        <div className="flex-shrink-0 p-3 sm:p-4" style={{ borderTop: `1px solid ${T.border}`, background: T.elevated }}>
          {(showTemplates || aiLoading) && (
            <div className="mb-3 flex flex-wrap gap-2">
              {aiLoading ? (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold"
                  style={{ background: 'rgba(196,157,91,0.10)', color: T.gold, border: `1px solid rgba(196,157,91,0.20)` }}>
                  <Loader2 size={14} className="animate-spin" /> IA formulando resposta...
                </div>
              ) : (
                <>
                  {TEMPLATES_WHATSAPP.map(tpl => (
                    <button key={tpl.id} onClick={() => applyTemplate(tpl.text)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors"
                      style={{ background: 'rgba(196,157,91,0.10)', color: T.gold, border: `1px solid rgba(196,157,91,0.20)` }}>
                      {tpl.label}
                    </button>
                  ))}
                  <button onClick={generateAIReply}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                    style={{ background: 'var(--s-cold-bg)', color: 'var(--s-cold)', border: `1px solid rgba(123,158,196,0.20)` }}>
                    <Sparkles size={14} /> Auto-Reply IA
                  </button>
                  <button onClick={() => setShowTemplates(false)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold"
                    style={{ background: T.hover, color: T.textMuted }}>
                    Cancelar
                  </button>
                </>
              )}
            </div>
          )}

          <div className="flex items-end gap-2">
            <div className="flex gap-0.5 mb-0.5 flex-shrink-0">
              <button onClick={() => setShowTemplates(!showTemplates)}
                className="p-2 sm:p-2.5 rounded-xl transition-all"
                style={{ background: showTemplates ? T.gold : 'transparent', color: showTemplates ? '#fff' : T.textMuted }}
                title="Templates & IA"><Zap size={18} /></button>
              <button className="hidden sm:flex p-2.5 rounded-xl transition-colors" style={{ color: T.textMuted }}
                onMouseEnter={e => (e.currentTarget.style.background = T.hover)}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}><Paperclip size={18} /></button>
              <button className="hidden sm:flex p-2.5 rounded-xl transition-colors" style={{ color: T.textMuted }}
                onMouseEnter={e => (e.currentTarget.style.background = T.hover)}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}><Smile size={18} /></button>
            </div>
            <div className="flex-1">
              <textarea
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                placeholder="Digite uma mensagem..."
                className="w-full h-11 py-3 px-4 rounded-2xl text-sm font-medium resize-none outline-none transition-all"
                style={{ background: T.surface, color: T.text, border: `1px solid ${T.border}` }}
                onFocus={e => (e.currentTarget.style.borderColor = T.gold)}
                onBlur={e => (e.currentTarget.style.borderColor = T.border)}
              />
            </div>
            <button onClick={handleSend} disabled={!newMessage.trim()}
              className="h-11 w-11 flex items-center justify-center rounded-2xl transition-all disabled:opacity-40 flex-shrink-0"
              style={{ background: '#C49D5B', color: '#fff' }}>
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* ═══════════════ INFO PANEL (RIGHT) ═══════════════ */}
      {showInfo && (
        <div className="hidden lg:flex w-72 flex-col flex-shrink-0"
          style={{ borderLeft: `1px solid ${T.border}`, background: T.surface }}>
          <div className="p-5 text-center flex-shrink-0" style={{ borderBottom: `1px solid ${T.border}`, background: T.elevated }}>
            <button className="absolute right-2 top-2 p-1 rounded-lg lg:hidden" onClick={() => setShowInfo(false)}
              style={{ color: T.textMuted }}><X size={16} /></button>
            <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-xl font-bold mb-3"
              style={{ background: 'rgba(196,157,91,0.12)', color: T.gold }}>
              {activeConversation.nome[0]}
            </div>
            <h3 className="font-bold text-sm" style={{ color: T.text }}>{activeConversation.nome}</h3>
            <p className="text-xs mt-1 font-medium" style={{ color: T.textMuted }}>{activeConversation.telefone}</p>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            <section>
              <h4 className="text-[10px] font-bold uppercase tracking-widest mb-2.5" style={{ color: T.textTertiary }}>CRM Insight</h4>
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 text-xs" style={{ color: T.textMuted }}>
                  <Clock size={14} style={{ color: T.textTertiary }} />
                  <span className="font-medium">Última visita: 14:32</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] px-2 py-1 rounded-lg font-bold w-fit"
                  style={{ background: 'var(--s-cold-bg)', color: 'var(--s-cold)' }}>
                  <ShieldCheck size={12} /><span>Lead Qualificado</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold" style={{ color: T.text }}>
                  <AlertCircle size={14} style={{ color: T.textTertiary }} />
                  <span>Value: R$ 2.4M</span>
                </div>
              </div>
            </section>

            <section>
              <h4 className="text-[10px] font-bold uppercase tracking-widest mb-2.5" style={{ color: T.textTertiary }}>Segmentação</h4>
              <div className="flex flex-wrap gap-1.5">
                <span className="px-2 py-1 rounded-lg text-[10px] font-bold"
                  style={{ background: 'rgba(196,157,91,0.10)', color: T.gold, border: `1px solid rgba(196,157,91,0.20)` }}>Reserva Atlantis</span>
                <span className="px-2 py-1 rounded-lg text-[10px] font-bold"
                  style={{ background: 'var(--s-cold-bg)', color: 'var(--s-cold)', border: '1px solid rgba(123,158,196,0.20)' }}>Investidor</span>
                <span className="px-2 py-1 rounded-lg text-[10px] font-bold"
                  style={{ background: 'var(--s-done-bg)', color: 'var(--s-done)', border: '1px solid rgba(107,184,123,0.20)' }}>Alta Renda</span>
              </div>
            </section>

            <section>
              <h4 className="text-[10px] font-bold uppercase tracking-widest mb-2.5" style={{ color: T.textTertiary }}>Notas de Contexto</h4>
              <div className="p-3 rounded-xl relative overflow-hidden"
                style={{ background: T.elevated, border: `1px solid ${T.border}` }}>
                <div className="absolute top-0 left-0 w-1 h-full" style={{ background: T.gold }} />
                <p className="text-[10px] italic leading-relaxed font-medium pl-2" style={{ color: T.textMuted }}>
                  "Busca rentabilidade anual superior a 15%. Interessada em unidades com vista mar definitiva em Boa Viagem."
                </p>
              </div>
            </section>
          </div>

          <div className="p-4 flex-shrink-0" style={{ borderTop: `1px solid ${T.border}`, background: T.elevated }}>
            <button className="w-full h-10 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
              style={{ background: '#C49D5B', color: '#fff' }}>
              Ver Ficha Completa →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
