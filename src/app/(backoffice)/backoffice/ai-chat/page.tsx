'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { T } from '@/app/(backoffice)/lib/theme'
import { PageIntelHeader } from '@/app/(backoffice)/components/ui/PageIntelHeader'
import { toast } from 'sonner'
import {
  MessageSquare,
  Send,
  Plus,
  Zap,
  Brain,
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen,
  Loader2,
  Bot,
  User,
  Clock,
  Trash2,
  Hash,
} from 'lucide-react'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface Conversation {
  id: string
  title: string
  model: string
  updated_at: string
}

interface UsageInfo {
  inputTokens: number
  outputTokens: number
  costUsd: number
}

type ModelId = 'claude-haiku-4-5' | 'claude-sonnet-4-6' | 'claude-opus-4-6'

const MODEL_OPTIONS: { id: ModelId; label: string; icon: React.ReactNode; desc: string }[] = [
  { id: 'claude-haiku-4-5', label: 'Haiku', icon: <Zap size={14} />, desc: 'Rapido' },
  { id: 'claude-sonnet-4-6', label: 'Sonnet', icon: <Brain size={14} />, desc: 'Balanceado' },
  { id: 'claude-opus-4-6', label: 'Opus', icon: <Sparkles size={14} />, desc: 'Poderoso' },
]

const QUICK_ACTIONS = [
  { label: 'Resumo dos leads ativos', icon: <Hash size={15} /> },
  { label: 'Status dos contratos', icon: <MessageSquare size={15} /> },
  { label: 'Performance da equipe', icon: <Zap size={15} /> },
  { label: 'Analise de mercado Recife', icon: <Brain size={15} /> },
]

/* ------------------------------------------------------------------ */
/*  Simple markdown renderer                                           */
/* ------------------------------------------------------------------ */

function renderMarkdown(text: string): React.ReactNode {
  const blocks = text.split('\n')
  const elements: React.ReactNode[] = []
  let codeBlock: string[] | null = null
  let codeLang = ''

  blocks.forEach((line, i) => {
    // Code block fences
    if (line.startsWith('```')) {
      if (codeBlock === null) {
        codeBlock = []
        codeLang = line.slice(3).trim()
      } else {
        elements.push(
          <pre
            key={`code-${i}`}
            style={{
              background: T.muted,
              border: `1px solid ${T.border}`,
              borderRadius: T.radius.md,
              padding: '12px 14px',
              fontSize: '12.5px',
              fontFamily: 'var(--font-mono)',
              overflowX: 'auto',
              margin: '8px 0',
              color: T.text,
              lineHeight: 1.55,
            }}
          >
            {codeLang && (
              <span style={{ fontSize: '10px', color: T.textMuted, display: 'block', marginBottom: 6 }}>
                {codeLang}
              </span>
            )}
            <code>{codeBlock.join('\n')}</code>
          </pre>,
        )
        codeBlock = null
        codeLang = ''
      }
      return
    }

    if (codeBlock !== null) {
      codeBlock.push(line)
      return
    }

    // Headers
    if (line.startsWith('### ')) {
      elements.push(
        <h4 key={i} style={{ fontSize: '14px', fontWeight: 700, color: T.text, margin: '12px 0 4px' }}>
          {formatInline(line.slice(4))}
        </h4>,
      )
      return
    }
    if (line.startsWith('## ')) {
      elements.push(
        <h3 key={i} style={{ fontSize: '15px', fontWeight: 700, color: T.text, margin: '14px 0 4px' }}>
          {formatInline(line.slice(3))}
        </h3>,
      )
      return
    }
    if (line.startsWith('# ')) {
      elements.push(
        <h2 key={i} style={{ fontSize: '16px', fontWeight: 700, color: T.text, margin: '16px 0 6px' }}>
          {formatInline(line.slice(2))}
        </h2>,
      )
      return
    }

    // Unordered lists
    if (/^[-*]\s/.test(line)) {
      elements.push(
        <div key={i} style={{ display: 'flex', gap: 8, margin: '2px 0', paddingLeft: 4 }}>
          <span style={{ color: T.accent, flexShrink: 0, marginTop: 2 }}>&#8226;</span>
          <span style={{ lineHeight: 1.55 }}>{formatInline(line.slice(2))}</span>
        </div>,
      )
      return
    }

    // Ordered lists
    const olMatch = line.match(/^(\d+)\.\s(.*)/)
    if (olMatch) {
      elements.push(
        <div key={i} style={{ display: 'flex', gap: 8, margin: '2px 0', paddingLeft: 4 }}>
          <span style={{ color: T.accent, flexShrink: 0, fontWeight: 600, fontSize: '12px', marginTop: 2 }}>
            {olMatch[1]}.
          </span>
          <span style={{ lineHeight: 1.55 }}>{formatInline(olMatch[2])}</span>
        </div>,
      )
      return
    }

    // Empty line
    if (!line.trim()) {
      elements.push(<div key={i} style={{ height: 8 }} />)
      return
    }

    // Regular paragraph
    elements.push(
      <p key={i} style={{ margin: '2px 0', lineHeight: 1.6 }}>
        {formatInline(line)}
      </p>,
    )
  })

  return <>{elements}</>
}

/** Inline formatting: bold, inline code */
function formatInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = []
  const regex = /(\*\*(.+?)\*\*|`([^`]+)`)/g
  let lastIdx = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIdx) parts.push(text.slice(lastIdx, match.index))
    if (match[2]) {
      parts.push(<strong key={match.index} style={{ fontWeight: 700 }}>{match[2]}</strong>)
    } else if (match[3]) {
      parts.push(
        <code
          key={match.index}
          style={{
            background: T.muted,
            border: `1px solid ${T.borderLight}`,
            borderRadius: T.radius.xs,
            padding: '1px 5px',
            fontSize: '0.9em',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {match[3]}
        </code>,
      )
    }
    lastIdx = match.index + match[0].length
  }
  if (lastIdx < text.length) parts.push(text.slice(lastIdx))
  return parts.length === 1 ? parts[0] : <>{parts}</>
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'agora'
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  const days = Math.floor(hrs / 24)
  return `${days}d`
}

function modelBadgeColor(model: string): string {
  if (model.includes('haiku')) return T.success
  if (model.includes('opus')) return 'var(--warning)'
  return T.accent
}

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */

export default function AiChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [model, setModel] = useState<ModelId>('claude-sonnet-4-6')
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [showSidebar, setShowSidebar] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const [usage, setUsage] = useState<UsageInfo | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  /* Auto-scroll on new messages / streaming */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingText])

  /* Fetch conversation history */
  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/ai-chat/conversations')
      if (res.ok) {
        const data = await res.json()
        setConversations(data.conversations ?? [])
      }
    } catch {
      /* silent */
    }
  }, [])

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  /* Load a conversation */
  const loadConversation = async (conv: Conversation) => {
    try {
      const res = await fetch(`/api/ai-chat/conversations/${conv.id}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setMessages(data.messages ?? [])
      setConversationId(conv.id)
      setModel((data.model as ModelId) || 'claude-sonnet-4-6')
      setUsage(null)
      setShowSidebar(false)
    } catch {
      toast.error('Erro ao carregar conversa')
    }
  }

  /* New conversation */
  const startNewConversation = () => {
    setMessages([])
    setConversationId(null)
    setStreamingText('')
    setUsage(null)
    textareaRef.current?.focus()
  }

  /* ---- Streaming send ---- */
  const handleSend = async (overrideInput?: string) => {
    const text = (overrideInput ?? input).trim()
    if (!text || loading) return
    const userMsg: ChatMessage = { role: 'user', content: text }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)
    setStreamingText('')
    setUsage(null)

    // Reset textarea height
    if (textareaRef.current) textareaRef.current.style.height = 'auto'

    try {
      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          model,
          conversationId,
          history: messages,
        }),
      })

      if (!res.ok) throw new Error('request failed')

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const parsed = JSON.parse(line.slice(6))
            if (parsed.text) {
              accumulated += parsed.text
              setStreamingText(accumulated)
            }
            if (parsed.done) {
              setConversationId(parsed.conversationId)
              setUsage(parsed.usage ?? null)
            }
          } catch {
            /* skip malformed SSE */
          }
        }
      }

      setMessages((prev) => [...prev, { role: 'assistant', content: accumulated }])
      setStreamingText('')
      fetchConversations()
    } catch {
      toast.error('Erro ao enviar mensagem')
    } finally {
      setLoading(false)
    }
  }

  /* Quick action */
  const handleQuickAction = (label: string) => {
    setInput(label)
    handleSend(label)
  }

  /* Keyboard shortcuts */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'n') {
        e.preventDefault()
        startNewConversation()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* Auto-resize textarea */
  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 160) + 'px'
  }

  const isEmpty = messages.length === 0 && !streamingText

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <PageIntelHeader
        moduleLabel="CENTRAL DE IA"
        title="IMI AI Chat"
        subtitle="Assistente inteligente para analise de dados e suporte operacional"
        live
        actions={
          <button
            onClick={() => setShowSidebar((s) => !s)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 14px',
              borderRadius: T.radius.md,
              border: `1px solid ${T.border}`,
              background: T.surface,
              color: T.textMuted,
              fontSize: '12px',
              fontFamily: 'var(--font-sans)',
              fontWeight: 500,
              cursor: 'pointer',
              transition: `all ${T.transition.fast}`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = T.hover
              e.currentTarget.style.borderColor = T.borderStrong
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = T.surface
              e.currentTarget.style.borderColor = T.border
            }}
          >
            {showSidebar ? <PanelLeftClose size={14} /> : <PanelLeftOpen size={14} />}
            <span className="hidden sm:inline">Historico</span>
          </button>
        }
      />

      {/* Main layout */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0, gap: 0, position: 'relative' }}>
        {/* ---- Sidebar ---- */}
        {showSidebar && (
          <>
            {/* Mobile overlay */}
            <div
              className="sm:hidden"
              onClick={() => setShowSidebar(false)}
              style={{
                position: 'fixed',
                inset: 0,
                background: T.overlay,
                zIndex: 40,
              }}
            />
            <aside
              style={{
                width: 280,
                minWidth: 280,
                borderRight: `1px solid ${T.border}`,
                background: T.surface,
                display: 'flex',
                flexDirection: 'column',
                overflowY: 'auto',
                zIndex: 41,
              }}
              className="fixed sm:relative inset-y-0 left-0 sm:inset-auto"
            >
              {/* Sidebar header */}
              <div
                style={{
                  padding: '14px 16px',
                  borderBottom: `1px solid ${T.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span style={{ fontSize: '12px', fontWeight: 700, color: T.textMuted, fontFamily: 'var(--font-mono)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  Conversas
                </span>
                <button
                  onClick={startNewConversation}
                  title="Nova conversa (Ctrl+N)"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 28,
                    height: 28,
                    borderRadius: T.radius.sm,
                    border: `1px solid ${T.border}`,
                    background: 'transparent',
                    color: T.textMuted,
                    cursor: 'pointer',
                    transition: `all ${T.transition.fast}`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = T.hover
                    e.currentTarget.style.color = T.accent
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = T.textMuted
                  }}
                >
                  <Plus size={14} />
                </button>
              </div>

              {/* Conversation list */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
                {conversations.length === 0 ? (
                  <div style={{ padding: '24px 12px', textAlign: 'center' }}>
                    <MessageSquare size={20} style={{ color: T.textDim, margin: '0 auto 8px' }} />
                    <p style={{ fontSize: '12px', color: T.textDim }}>Nenhuma conversa ainda</p>
                  </div>
                ) : (
                  conversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => loadConversation(conv)}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4,
                        width: '100%',
                        textAlign: 'left',
                        padding: '10px 12px',
                        borderRadius: T.radius.md,
                        border: 'none',
                        background: conv.id === conversationId ? T.activeBg : 'transparent',
                        cursor: 'pointer',
                        transition: `background ${T.transition.fast}`,
                        marginBottom: 2,
                      }}
                      onMouseEnter={(e) => {
                        if (conv.id !== conversationId) e.currentTarget.style.background = T.hover
                      }}
                      onMouseLeave={(e) => {
                        if (conv.id !== conversationId) e.currentTarget.style.background = 'transparent'
                      }}
                    >
                      <span
                        style={{
                          fontSize: '13px',
                          fontWeight: 500,
                          color: T.text,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {conv.title || 'Sem titulo'}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 600,
                            color: modelBadgeColor(conv.model),
                            fontFamily: 'var(--font-mono)',
                            textTransform: 'uppercase',
                          }}
                        >
                          {conv.model.split('-')[1] ?? conv.model}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '10px', color: T.textDim }}>
                          <Clock size={9} />
                          {timeAgo(conv.updated_at)}
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </aside>
          </>
        )}

        {/* ---- Chat area ---- */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, minWidth: 0 }}>
          {/* Top bar: model selector + new conversation */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 16px',
              borderBottom: `1px solid ${T.border}`,
              background: T.surface,
              flexShrink: 0,
            }}
          >
            {/* Model selector */}
            <div style={{ display: 'flex', gap: 4, borderRadius: T.radius.md, border: `1px solid ${T.border}`, padding: 3 }}>
              {MODEL_OPTIONS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setModel(m.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '5px 12px',
                    borderRadius: T.radius.sm,
                    border: 'none',
                    background: model === m.id ? T.activeBg : 'transparent',
                    color: model === m.id ? T.accent : T.textMuted,
                    fontSize: '12px',
                    fontWeight: model === m.id ? 700 : 500,
                    fontFamily: 'var(--font-sans)',
                    cursor: 'pointer',
                    transition: `all ${T.transition.fast}`,
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={(e) => {
                    if (model !== m.id) e.currentTarget.style.background = T.hover
                  }}
                  onMouseLeave={(e) => {
                    if (model !== m.id) e.currentTarget.style.background = 'transparent'
                  }}
                >
                  {m.icon}
                  <span>{m.label}</span>
                  <span className="hidden md:inline" style={{ fontSize: '10px', opacity: 0.7 }}>
                    {m.desc}
                  </span>
                </button>
              ))}
            </div>

            {/* New conversation */}
            <button
              onClick={startNewConversation}
              title="Nova conversa (Ctrl+N)"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: T.radius.md,
                border: `1px solid ${T.border}`,
                background: 'transparent',
                color: T.textMuted,
                fontSize: '12px',
                fontWeight: 500,
                fontFamily: 'var(--font-sans)',
                cursor: 'pointer',
                transition: `all ${T.transition.fast}`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = T.hover
                e.currentTarget.style.borderColor = T.accent
                e.currentTarget.style.color = T.accent
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.borderColor = T.border
                e.currentTarget.style.color = T.textMuted
              }}
            >
              <Plus size={14} />
              <span className="hidden sm:inline">Nova conversa</span>
            </button>
          </div>

          {/* Messages area */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '20px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            {/* Empty state */}
            {isEmpty && (
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 24,
                  padding: '40px 16px',
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: T.radius.xl,
                    background: T.activeBg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: T.shadowMd,
                  }}
                >
                  <Bot size={28} style={{ color: T.accent }} />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <h2
                    style={{
                      fontSize: '18px',
                      fontWeight: 700,
                      color: T.text,
                      fontFamily: 'var(--font-serif)',
                      marginBottom: 6,
                    }}
                  >
                    Como posso ajudar?
                  </h2>
                  <p style={{ fontSize: '13px', color: T.textMuted, maxWidth: 360, lineHeight: 1.5 }}>
                    Pergunte sobre leads, contratos, performance ou qualquer dado da plataforma IMI.
                  </p>
                </div>

                {/* Quick actions */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: 8,
                    width: '100%',
                    maxWidth: 520,
                  }}
                >
                  {QUICK_ACTIONS.map((qa) => (
                    <button
                      key={qa.label}
                      onClick={() => handleQuickAction(qa.label)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '12px 14px',
                        borderRadius: T.radius.md,
                        border: `1px solid ${T.border}`,
                        background: T.surface,
                        color: T.text,
                        fontSize: '13px',
                        fontWeight: 500,
                        fontFamily: 'var(--font-sans)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: `all ${T.transition.fast}`,
                        boxShadow: T.shadowXs,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = T.accent
                        e.currentTarget.style.background = T.hover
                        e.currentTarget.style.boxShadow = T.shadowSm
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = T.border
                        e.currentTarget.style.background = T.surface
                        e.currentTarget.style.boxShadow = T.shadowXs
                      }}
                    >
                      <span style={{ color: T.accent, flexShrink: 0 }}>{qa.icon}</span>
                      {qa.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Chat messages */}
            {messages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '100%',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    gap: 10,
                    maxWidth: '75%',
                    flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                    alignItems: 'flex-start',
                  }}
                >
                  {/* Avatar */}
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: T.radius.full,
                      background: msg.role === 'user' ? T.activeBg : T.muted,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      border: `1px solid ${msg.role === 'user' ? T.borderActive : T.border}`,
                    }}
                  >
                    {msg.role === 'user' ? (
                      <User size={13} style={{ color: T.accent }} />
                    ) : (
                      <Bot size={13} style={{ color: T.textMuted }} />
                    )}
                  </div>

                  {/* Bubble */}
                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: T.radius.lg,
                      background: msg.role === 'user' ? T.activeBg : T.surface,
                      border: `1px solid ${msg.role === 'user' ? T.borderActive : T.border}`,
                      boxShadow: T.shadowXs,
                      fontSize: '13.5px',
                      lineHeight: 1.6,
                      color: T.text,
                      fontFamily: 'var(--font-sans)',
                      overflowWrap: 'break-word',
                      wordBreak: 'break-word',
                    }}
                  >
                    {msg.role === 'assistant' ? renderMarkdown(msg.content) : msg.content}
                  </div>
                </div>
              </div>
            ))}

            {/* Streaming indicator */}
            {streamingText && (
              <div style={{ display: 'flex', justifyContent: 'flex-start', maxWidth: '100%' }}>
                <div style={{ display: 'flex', gap: 10, maxWidth: '75%', alignItems: 'flex-start' }}>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: T.radius.full,
                      background: T.muted,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      border: `1px solid ${T.border}`,
                    }}
                  >
                    <Bot size={13} style={{ color: T.accent }} />
                  </div>
                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: T.radius.lg,
                      background: T.surface,
                      border: `1px solid ${T.borderActive}`,
                      boxShadow: T.shadowSm,
                      fontSize: '13.5px',
                      lineHeight: 1.6,
                      color: T.text,
                      fontFamily: 'var(--font-sans)',
                      overflowWrap: 'break-word',
                      wordBreak: 'break-word',
                    }}
                  >
                    {renderMarkdown(streamingText)}
                    <span
                      style={{
                        display: 'inline-block',
                        width: 6,
                        height: 14,
                        background: T.accent,
                        borderRadius: 1,
                        marginLeft: 2,
                        animation: 'blink 1s step-end infinite',
                        verticalAlign: 'text-bottom',
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Typing dots (loading, no streaming yet) */}
            {loading && !streamingText && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: T.radius.full,
                      background: T.muted,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      border: `1px solid ${T.border}`,
                    }}
                  >
                    <Bot size={13} style={{ color: T.accent }} />
                  </div>
                  <div
                    style={{
                      padding: '12px 18px',
                      borderRadius: T.radius.lg,
                      background: T.surface,
                      border: `1px solid ${T.border}`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <Loader2 size={14} style={{ color: T.accent, animation: 'spin 1s linear infinite' }} />
                    <span style={{ fontSize: '12px', color: T.textMuted }}>Pensando...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* ---- Input area ---- */}
          <div
            style={{
              flexShrink: 0,
              padding: '12px 16px 16px',
              borderTop: `1px solid ${T.border}`,
              background: T.surface,
              backdropFilter: 'blur(12px)',
            }}
          >
            {/* Usage badge */}
            {usage && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  marginBottom: 8,
                }}
              >
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '3px 10px',
                    borderRadius: T.radius.full,
                    background: T.muted,
                    border: `1px solid ${T.borderLight}`,
                    fontSize: '10.5px',
                    fontFamily: 'var(--font-mono)',
                    color: T.textDim,
                    fontWeight: 500,
                  }}
                >
                  <Zap size={10} style={{ color: T.accent }} />
                  {usage.inputTokens + usage.outputTokens} tokens &middot; ~${usage.costUsd.toFixed(4)}
                </span>
              </div>
            )}

            {/* Input row */}
            <div
              style={{
                display: 'flex',
                gap: 8,
                alignItems: 'flex-end',
                borderRadius: T.radius.lg,
                border: `1px solid ${T.border}`,
                background: T.elevated,
                padding: '8px 10px',
                transition: `border-color ${T.transition.fast}`,
              }}
            >
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleTextareaInput}
                onKeyDown={handleKeyDown}
                placeholder="Envie uma mensagem..."
                rows={1}
                disabled={loading}
                style={{
                  flex: 1,
                  resize: 'none',
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  color: T.text,
                  fontSize: '13.5px',
                  fontFamily: 'var(--font-sans)',
                  lineHeight: 1.5,
                  padding: '4px 4px',
                  maxHeight: 160,
                  overflowY: 'auto',
                }}
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || loading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 34,
                  height: 34,
                  borderRadius: T.radius.md,
                  border: 'none',
                  background: input.trim() && !loading ? T.accent : T.muted,
                  color: input.trim() && !loading ? T.textInverse : T.textDisabled,
                  cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                  flexShrink: 0,
                  transition: `all ${T.transition.fast}`,
                }}
              >
                {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={15} />}
              </button>
            </div>

            {/* Helper text */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: 6,
                padding: '0 4px',
              }}
            >
              <span style={{ fontSize: '10px', color: T.textDim }}>
                Enter para enviar &middot; Shift+Enter para nova linha
              </span>
              <span style={{ fontSize: '10px', color: T.textDim }}>Ctrl+N nova conversa</span>
            </div>
          </div>
        </div>
      </div>

      {/* Blink keyframe for cursor */}
      <style jsx global>{`
        @keyframes blink {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0;
          }
        }
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  )
}
