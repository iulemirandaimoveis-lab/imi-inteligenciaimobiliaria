'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Search, MoreVertical, Phone, Video, Send, Paperclip, Smile,
  Check, CheckCheck, Clock, ArrowLeft, Settings, ShieldCheck,
  AlertCircle, MessageSquare, Zap, Sparkles, Loader2, X, MessageCircle,
} from 'lucide-react'
import { useWhatsapp, WhatsappConversation, WhatsappMessage } from '@/hooks/backoffice/use-whatsapp'
import { T } from '@/app/(backoffice)/lib/theme'

/* ── Design Tokens ──────────────────────────────────────────── */
const TEMPLATES_WHATSAPP = [
  { id: 'visita', label: 'Agendar Visita', text: 'Olá [Nome], podemos agendar uma visita técnica para amanhã às 10h ou 15h? Estarei com o material completo.' },
  { id: 'laudo', label: 'Enviar Laudo', text: 'Segue em anexo o laudo de avaliação técnica conforme NBR 14653. Fico à disposição para dúvidas.' },
  { id: 'invest', label: 'Dados Investimento', text: 'O yield médio nesta região está em 0,72% a.m., com valorização histórica de 18% ao ano.' },
]

function formatTime(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000)
  if (diffDays === 0) return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  if (diffDays === 1) return 'Ontem'
  if (diffDays < 7) return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() || '?'
}

function EmptyState({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center" style={{ background: T.surface }}>
      <MessageCircle size={40} style={{ color: T.textTertiary, opacity: 0.4, marginBottom: 12 }} />
      <p className="text-sm font-semibold" style={{ color: T.text }}>{title}</p>
      <p className="text-xs mt-1" style={{ color: T.textMuted }}>{sub}</p>
    </div>
  )
}

export default function WhatsappPage() {
  const supabase = createClient()

  // Get current user to use as tenantId
  const [tenantId, setTenantId] = useState<string>('')
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user?.id) setTenantId(data.user.id)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const {
    conversations,
    activeConversation,
    messages,
    loading,
    sendMessage: sendToDb,
    selectConversation: hookSelectConversation,
  } = useWhatsapp(tenantId)

  const [newMessage, setNewMessage] = useState('')
  const [search, setSearch] = useState('')
  const [showTemplates, setShowTemplates] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [showInfo, setShowInfo] = useState(false)
  const [mobileShowChat, setMobileShowChat] = useState(false)
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages])

  const handleSend = async () => {
    if (!newMessage.trim() || !activeConversation) return
    setSending(true)
    await sendToDb(activeConversation.id, newMessage)
    setNewMessage('')
    setShowTemplates(false)
    setSending(false)
  }

  const applyTemplate = (text: string) => {
    const firstName = activeConversation?.contact_name.split(' ')[0] ?? 'Cliente'
    setNewMessage(text.replace('[Nome]', firstName))
    setShowTemplates(false)
  }

  const generateAIReply = async () => {
    setAiLoading(true)
    setShowTemplates(false)
    const lastMsg = messages[messages.length - 1]?.content || ''
    try {
      const res = await fetch('/api/ai/router', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_type: 'legenda',
          prompt: `Gere uma resposta curta (máx 2 parágrafos) para o cliente ${activeConversation?.contact_name ?? 'Cliente'}.\nContexto da última mensagem dele: "${lastMsg}"`,
          platform: 'email',
          context: `Empresa: IMI. Mercado Imobiliário de Luxo em Recife.`
        })
      })
      const data = await res.json()
      if (data.success) setNewMessage(data.result)
    } catch (err) { console.error('AI Reply error:', err) }
    finally { setAiLoading(false) }
  }

  const selectConversation = (c: WhatsappConversation) => {
    hookSelectConversation(c)
    setMobileShowChat(true)
    setShowInfo(false)
  }

  const filteredConversations = conversations.filter(c =>
    c.contact_name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone_number.includes(search)
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
              <button className="p-2 rounded-xl transition-colors hover-card" style={{ color: T.textMuted }}>
                <MessageSquare size={18} />
              </button>
              <button className="p-2 rounded-xl transition-colors hover-card" style={{ color: T.textMuted }}>
                <Settings size={18} />
              </button>
            </div>
          </div>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: T.textTertiary }} />
            <input
              type="text"
              placeholder="Buscar conversa..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-xl text-sm font-medium outline-none transition-all"
              style={{ background: T.hover, color: T.text, border: `1px solid transparent` }}
              onFocus={e => (e.currentTarget.style.borderColor = T.accent)}
              onBlur={e => (e.currentTarget.style.borderColor = 'transparent')}
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 space-y-3 animate-pulse">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl flex-shrink-0" style={{ background: T.hover }} />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-32 rounded" style={{ background: T.hover }} />
                    <div className="h-2.5 w-48 rounded" style={{ background: T.hover }} />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-6 text-center">
              <MessageCircle size={28} style={{ color: T.textTertiary, opacity: 0.4, margin: '0 auto 8px' }} />
              <p className="text-xs font-medium" style={{ color: T.textMuted }}>
                {conversations.length === 0
                  ? 'Nenhuma conversa ainda.\nAs conversas do WhatsApp Business\naparecerão aqui.'
                  : 'Nenhum resultado para a busca.'}
              </p>
            </div>
          ) : (
            filteredConversations.map(conversa => {
              const active = activeConversation?.id === conversa.id
              return (
                <button
                  key={conversa.id}
                  onClick={() => selectConversation(conversa)}
                  className="w-full flex items-center gap-3 p-4 transition-all hover-card"
                  style={{
                    background: active ? T.elevated : 'transparent',
                    borderLeft: active ? `3px solid ${T.accent}` : '3px solid transparent',
                  }}
                  
                >
                  <div className="relative flex-shrink-0">
                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm"
                      style={{ background: 'var(--bo-active-bg)', color: T.accent }}>
                      {getInitials(conversa.contact_name)}
                    </div>
                    {conversa.status === 'active' && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full"
                        style={{ background: 'var(--s-done)', border: `2px solid ${T.elevated}` }} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <span className="text-sm font-semibold truncate" style={{ color: T.text }}>{conversa.contact_name}</span>
                      <span className="text-[10px] font-medium flex-shrink-0 ml-2" style={{ color: T.textTertiary }}>
                        {conversa.last_message_at ? formatTime(conversa.last_message_at) : ''}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-xs truncate" style={{ color: T.textMuted }}>{conversa.last_message_preview ?? ''}</p>
                      {conversa.unread_count > 0 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center text-white flex-shrink-0 ml-2"
                          style={{ background: T.accent }}>{conversa.unread_count}</span>
                      )}
                    </div>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* ═══════════════ CHAT AREA ═══════════════ */}
      <div className={`${mobileShowChat ? 'flex' : 'hidden'} lg:flex flex-1 flex-col min-w-0`}
        style={{ background: T.elevated }}>

        {!activeConversation ? (
          <EmptyState
            title="Selecione uma conversa"
            sub="Escolha uma conversa na lista à esquerda para começar a responder"
          />
        ) : (
          <>
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
                  style={{ background: 'var(--bo-active-bg)', color: T.accent }}>
                  {getInitials(activeConversation.contact_name)}
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm font-bold leading-tight truncate" style={{ color: T.text }}>{activeConversation.contact_name}</h2>
                  <div className="flex items-center gap-1.5 text-[10px] font-medium" style={{ color: T.textTertiary }}>
                    <span>{activeConversation.phone_number}</span>
                    <span>•</span>
                    <span className="px-1.5 py-0.5 rounded-md capitalize"
                      style={{ background: 'var(--bo-active-bg)', color: T.accent }}>{activeConversation.status}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-0.5 flex-shrink-0">
                {[Video, Phone, Search].map((Icon, i) => (
                  <button key={i} className="hidden sm:flex p-2 rounded-xl transition-colors hover-card"
                    style={{ color: T.textMuted }}>
                    <Icon size={18} />
                  </button>
                ))}
                <button className="p-2 rounded-xl transition-colors hover-card"
                  onClick={() => setShowInfo(!showInfo)}
                  style={{ color: showInfo ? T.accent : T.textMuted }}>
                  <MoreVertical size={18} />
                </button>
              </div>
            </div>

            {/* Encryption notice */}
            <div className="px-3 sm:px-5 py-1.5 flex items-center gap-2 flex-shrink-0"
              style={{ background: 'var(--s-warm-bg)', borderBottom: `1px solid var(--bo-hover)` }}>
              <ShieldCheck size={13} style={{ color: 'var(--s-warm)' }} />
              <p className="text-[10px] font-medium" style={{ color: 'var(--s-warm)' }}>
                Integração oficial via <span className="font-bold">WhatsApp Business API</span>. Mensagens criptografadas.
              </p>
            </div>

            {/* Messages Area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3"
              style={{ background: T.surface }}>
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <MessageCircle size={32} style={{ color: T.textTertiary, opacity: 0.3, marginBottom: 8 }} />
                  <p className="text-xs font-medium" style={{ color: T.textMuted }}>Nenhuma mensagem ainda</p>
                </div>
              ) : (
                <>
                  <div className="flex justify-center mb-4">
                    <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest"
                      style={{ background: T.elevated, color: T.textTertiary, border: `1px solid ${T.border}` }}>
                      Conversa
                    </span>
                  </div>
                  {messages.map(msg => {
                    const isOutbound = msg.direction === 'outbound'
                    return (
                      <div key={msg.id} className={`flex ${isOutbound ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 ${isOutbound ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}
                          style={isOutbound
                            ? { background: 'var(--bo-accent)', color: '#fff' }
                            : { background: T.elevated, border: `1px solid ${T.border}`, color: T.text }
                          }
                        >
                          <p className="text-sm leading-relaxed" style={isOutbound ? {} : { color: T.text }}>{msg.content}</p>
                          <div className="flex items-center justify-end gap-1 mt-1"
                            style={{ color: isOutbound ? 'rgba(255,255,255,0.65)' : T.textTertiary }}>
                            <span className="text-[10px] font-medium">{formatTime(msg.created_at)}</span>
                            {isOutbound && (msg.status === 'read' ? <CheckCheck size={12} /> : <Check size={12} />)}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </>
              )}
            </div>

            {/* Input Area */}
            <div className="flex-shrink-0 p-3 sm:p-4" style={{ borderTop: `1px solid ${T.border}`, background: T.elevated }}>
              {(showTemplates || aiLoading) && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {aiLoading ? (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold"
                      style={{ background: 'var(--bo-active-bg)', color: T.accent, border: `1px solid var(--bo-border)` }}>
                      <Loader2 size={14} className="animate-spin" /> IA formulando resposta...
                    </div>
                  ) : (
                    <>
                      {TEMPLATES_WHATSAPP.map(tpl => (
                        <button key={tpl.id} onClick={() => applyTemplate(tpl.text)}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors"
                          style={{ background: 'var(--bo-active-bg)', color: T.accent, border: `1px solid var(--bo-border)` }}>
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
                    style={{ background: showTemplates ? T.accent : 'transparent', color: showTemplates ? '#fff' : T.textMuted }}
                    title="Templates & IA"><Zap size={18} /></button>
                  <button className="hidden sm:flex p-2.5 rounded-xl transition-colors hover-card" style={{ color: T.textMuted }}><Paperclip size={18} /></button>
                  <button className="hidden sm:flex p-2.5 rounded-xl transition-colors hover-card" style={{ color: T.textMuted }}><Smile size={18} /></button>
                </div>
                <div className="flex-1">
                  <textarea
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                    placeholder="Digite uma mensagem..."
                    className="w-full h-11 py-3 px-4 rounded-2xl text-sm font-medium resize-none outline-none transition-all"
                    style={{ background: T.surface, color: T.text, border: `1px solid ${T.border}` }}
                    onFocus={e => (e.currentTarget.style.borderColor = T.accent)}
                    onBlur={e => (e.currentTarget.style.borderColor = T.border)}
                  />
                </div>
                <button onClick={handleSend} disabled={!newMessage.trim() || sending}
                  className="h-11 w-11 flex items-center justify-center rounded-2xl transition-all disabled:opacity-40 flex-shrink-0"
                  style={{ background: 'var(--bo-accent)', color: '#fff' }}>
                  {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ═══════════════ INFO PANEL (RIGHT) ═══════════════ */}
      {showInfo && activeConversation && (
        <div className="hidden md:flex w-72 flex-col flex-shrink-0"
          style={{ borderLeft: `1px solid ${T.border}`, background: T.surface }}>
          <div className="p-5 text-center flex-shrink-0 relative" style={{ borderBottom: `1px solid ${T.border}`, background: T.elevated }}>
            <button className="absolute right-3 top-3 p-1 rounded-lg" onClick={() => setShowInfo(false)}
              style={{ color: T.textMuted }}><X size={16} /></button>
            <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-xl font-bold mb-3"
              style={{ background: 'var(--bo-active-bg)', color: T.accent }}>
              {getInitials(activeConversation.contact_name)}
            </div>
            <h3 className="font-bold text-sm" style={{ color: T.text }}>{activeConversation.contact_name}</h3>
            <p className="text-xs mt-1 font-medium" style={{ color: T.textMuted }}>{activeConversation.phone_number}</p>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            <section>
              <h4 className="text-[10px] font-bold uppercase tracking-widest mb-2.5" style={{ color: T.textTertiary }}>CRM Insight</h4>
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 text-xs" style={{ color: T.textMuted }}>
                  <Clock size={14} style={{ color: T.textTertiary }} />
                  <span className="font-medium">
                    Última msg: {activeConversation.last_message_at ? formatTime(activeConversation.last_message_at) : '—'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] px-2 py-1 rounded-lg font-bold w-fit capitalize"
                  style={{ background: 'var(--s-cold-bg)', color: 'var(--s-cold)' }}>
                  <ShieldCheck size={12} /><span>{activeConversation.status}</span>
                </div>
                {activeConversation.unread_count > 0 && (
                  <div className="flex items-center gap-2 text-xs font-bold" style={{ color: T.text }}>
                    <AlertCircle size={14} style={{ color: T.textTertiary }} />
                    <span>{activeConversation.unread_count} msg(s) não lidas</span>
                  </div>
                )}
              </div>
            </section>

            {activeConversation.metadata && Object.keys(activeConversation.metadata).length > 0 && (
              <section>
                <h4 className="text-[10px] font-bold uppercase tracking-widest mb-2.5" style={{ color: T.textTertiary }}>Metadados</h4>
                <div className="p-3 rounded-xl" style={{ background: T.elevated, border: `1px solid ${T.border}` }}>
                  <pre className="text-[9px] whitespace-pre-wrap break-all" style={{ color: T.textMuted }}>
                    {JSON.stringify(activeConversation.metadata, null, 2)}
                  </pre>
                </div>
              </section>
            )}
          </div>

          <div className="p-4 flex-shrink-0" style={{ borderTop: `1px solid ${T.border}`, background: T.elevated }}>
            <button className="w-full h-10 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
              style={{ background: 'var(--bo-accent)', color: '#fff' }}>
              Ver Ficha Completa →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
