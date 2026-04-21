'use client'

import { useState, useEffect, useCallback, useRef, FormEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageCircle, QrCode, Smartphone, Send, Copy, X,
  CheckCheck, Clock, Wifi, WifiOff, ArrowRight, Zap, Users,
  RefreshCw, Loader2, AlertTriangle, Plus, Search, ArrowLeft,
  Phone, User, MessageSquare, ChevronRight, Inbox,
} from 'lucide-react'
import Link from 'next/link'
import { PageIntelHeader } from '@/app/(backoffice)/components/ui/PageIntelHeader'
import { useWhatsAppConversations, useWhatsAppMessages } from '@/hooks/use-whatsapp'
import type { Lead, WhatsAppMessage } from '@/types/crm'

// ── DS3 Style Helpers ─────────────────────────────────────────────────────────

const card: React.CSSProperties = {
  background: 'var(--bg-surface)',
  border: '1px solid var(--border-subtle)',
  borderRadius: 'var(--r-xl, 4px)',
  boxShadow: 'var(--shadow-xs)',
}

const elevated: React.CSSProperties = {
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border-subtle)',
  borderRadius: 'var(--r-lg, 4px)',
}

const label: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 11,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: 'var(--text-tertiary)',
  display: 'block',
  marginBottom: 8,
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getInitials(name: string | null): string {
  if (!name) return '??'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function formatTime(dateStr: string | null): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  if (diffDays === 1) return 'Ontem'
  if (diffDays < 7) return d.toLocaleDateString('pt-BR', { weekday: 'short' })
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

const AVATAR_COLORS = [
  'var(--info)', 'var(--accent-400)', 'var(--warning)',
  'var(--success)', '#9333ea', '#ec4899', '#06b6d4',
]

function getAvatarColor(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

const SETUP_STEPS = [
  'Abra o WhatsApp no celular',
  'Toque em Menu \u22EE > Aparelhos conectados',
  'Toque em Conectar um aparelho',
  'Escaneie o QR code com a c\u00E2mera',
]

// ── Main Component ────────────────────────────────────────────────────────────

type ConversationLead = Lead & { last_message?: WhatsAppMessage; unread_count?: number }

export default function WhatsAppPage() {
  // ── Connection state ──
  const [connected, setConnected] = useState(false)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [qrLoading, setQrLoading] = useState(false)
  const [qrError, setQrError] = useState<string | null>(null)
  const [apiConfigured, setApiConfigured] = useState(true)

  // ── Chat state ──
  const [activeLeadId, setActiveLeadId] = useState<string | null>(null)
  const [activeLead, setActiveLead] = useState<ConversationLead | null>(null)
  const [showChat, setShowChat] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showNewConversation, setShowNewConversation] = useState(false)
  const [newPhone, setNewPhone] = useState('')
  const [newName, setNewName] = useState('')
  const [newConvError, setNewConvError] = useState<string | null>(null)
  const [newConvLoading, setNewConvLoading] = useState(false)

  // ── Hooks ──
  const { conversations, loading: convsLoading } = useWhatsAppConversations()
  const { messages, loading: msgsLoading, sendMessage } = useWhatsAppMessages(activeLeadId)

  // ── Message input ──
  const [messageInput, setMessageInput] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // ── QR Code fetch ──
  const fetchQrCode = useCallback(async () => {
    setQrLoading(true)
    setQrError(null)
    try {
      const res = await fetch('/api/whatsapp/qr')
      const data = await res.json()
      if (data.connected) {
        setConnected(true)
        setQrCode(null)
      } else if (data.qrcode) {
        setConnected(false)
        setQrCode(data.qrcode)
      } else if (data.configured === false) {
        setApiConfigured(false)
        setQrError(data.error)
      } else if (data.error) {
        setQrError(data.error)
      }
    } catch {
      setQrError('Erro ao conectar com servidor')
    } finally {
      setQrLoading(false)
    }
  }, [])

  useEffect(() => { fetchQrCode() }, [fetchQrCode])

  useEffect(() => {
    if (connected) return
    const interval = setInterval(fetchQrCode, 30000)
    return () => clearInterval(interval)
  }, [connected, fetchQrCode])

  const handleDisconnect = async () => {
    try {
      await fetch('/api/whatsapp/qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'disconnect' }),
      })
      setConnected(false)
      setQrCode(null)
      fetchQrCode()
    } catch { /* */ }
  }

  // ── Select conversation ──
  const handleSelectConversation = (conv: ConversationLead) => {
    setActiveLeadId(conv.id)
    setActiveLead(conv)
    setShowChat(true)
    setSendError(null)
    setMessageInput('')
  }

  const handleCloseChat = () => {
    setShowChat(false)
    setActiveLeadId(null)
    setActiveLead(null)
    setMessageInput('')
    setSendError(null)
  }

  // ── Send message ──
  const handleSend = async () => {
    const text = messageInput.trim()
    if (!text || !activeLeadId || sending) return

    setSending(true)
    setSendError(null)
    try {
      const result = await sendMessage(text)
      if (result?.success || result?.status === 'sent' || result?.status === 'pending') {
        setMessageInput('')
        inputRef.current?.focus()
      } else {
        setSendError(result?.error || 'Erro ao enviar mensagem')
      }
    } catch (err) {
      setSendError('Erro de rede ao enviar')
    } finally {
      setSending(false)
    }
  }

  // ── New conversation ──
  const handleStartNewConversation = async (e: FormEvent) => {
    e.preventDefault()
    if (!newPhone.trim()) {
      setNewConvError('Informe o telefone')
      return
    }
    setNewConvLoading(true)
    setNewConvError(null)

    try {
      // Attempt to send a first greeting via the send API with a temporary lead lookup
      // First check if a lead with this phone already exists
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      let normalizedPhone = newPhone.replace(/\D/g, '')
      if (normalizedPhone.startsWith('0')) normalizedPhone = '55' + normalizedPhone.slice(1)
      if (!normalizedPhone.startsWith('55')) normalizedPhone = '55' + normalizedPhone

      // Search for existing lead
      const { data: existingLeads } = await supabase
        .from('leads')
        .select('*')
        .or(`phone.eq.${newPhone},phone_normalized.eq.${normalizedPhone}`)
        .limit(1)

      let leadId: string

      if (existingLeads && existingLeads.length > 0) {
        leadId = existingLeads[0].id
        // If the lead already has a whatsapp_jid, just open the chat
        setActiveLeadId(leadId)
        setActiveLead(existingLeads[0] as ConversationLead)
        setShowChat(true)
        setShowNewConversation(false)
        setNewPhone('')
        setNewName('')
        return
      }

      // Create a minimal lead entry
      const { data: newLead, error: createError } = await supabase
        .from('leads')
        .insert({
          name: newName.trim() || null,
          phone: newPhone.trim(),
          phone_normalized: normalizedPhone,
          source: 'whatsapp_organico',
          pipeline_stage: 'novo',
          temperature: 'morno',
          score: 0,
          whatsapp_jid: `${normalizedPhone}@s.whatsapp.net`,
        })
        .select('*')
        .single()

      if (createError) {
        setNewConvError('Erro ao criar contato: ' + createError.message)
        return
      }

      leadId = newLead.id
      setActiveLeadId(leadId)
      setActiveLead(newLead as ConversationLead)
      setShowChat(true)
      setShowNewConversation(false)
      setNewPhone('')
      setNewName('')
    } catch (err) {
      setNewConvError('Erro inesperado ao iniciar conversa')
    } finally {
      setNewConvLoading(false)
    }
  }

  // ── Auto-scroll messages ──
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  // ── Filter conversations ──
  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      conv.name?.toLowerCase().includes(q) ||
      conv.phone?.includes(q) ||
      conv.last_message?.body?.toLowerCase().includes(q)
    )
  })

  // ── Render ──
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── Header ── */}
      <PageIntelHeader
        moduleLabel="COMUNICA\u00C7\u00C3O"
        title="WhatsApp Business"
        subtitle="Gerencie conversas, templates e automa\u00E7\u00F5es via WhatsApp"
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              fontSize: 11, fontWeight: 700, padding: '4px 10px',
              borderRadius: 6,
              background: apiConfigured ? 'rgba(37,211,102,0.12)' : 'rgba(200,164,74,.12)',
              color: apiConfigured ? '#25D366' : 'var(--accent-400)',
              border: apiConfigured ? '1px solid rgba(37,211,102,0.30)' : '1px solid rgba(200,164,74,.30)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              fontFamily: 'var(--font-mono)',
            }}>
              {apiConfigured ? 'Evolution API' : 'API \u00B7 N\u00E3o Configurada'}
            </span>
            <button
              onClick={connected ? handleDisconnect : fetchQrCode}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                height: 38, padding: '0 16px',
                borderRadius: 'var(--r-md)',
                background: connected ? 'color-mix(in srgb, var(--success) 12%, transparent)' : 'var(--bg-elevated)',
                border: connected ? '1px solid color-mix(in srgb, var(--success) 35%, transparent)' : '1px solid var(--border-default)',
                color: connected ? 'var(--success)' : 'var(--text-secondary)',
                fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              {connected ? <Wifi size={14} /> : <WifiOff size={14} />}
              {connected ? 'Conectado' : 'Reconectar'}
            </button>
          </div>
        }
      />

      {/* ── Main Chat Layout ── */}
      <div style={{ display: 'flex', gap: 20, minHeight: 560 }}>

        {/* ── Left: Conversation List ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            ...card,
            width: showChat ? 340 : '100%',
            maxWidth: showChat ? 340 : 600,
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            transition: 'width 300ms ease, max-width 300ms ease',
          }}
        >
          {/* List Header */}
          <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <p style={{ fontFamily: 'var(--font-serif)', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Conversas
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: '3px 8px',
                  borderRadius: 6,
                  background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
                  fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)',
                }}>
                  {conversations.length}
                </span>
                <button
                  onClick={() => setShowNewConversation(true)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    height: 30, padding: '0 10px',
                    borderRadius: 'var(--r-md)',
                    background: 'rgba(37,211,102,0.12)',
                    border: '1px solid rgba(37,211,102,0.30)',
                    color: '#25D366',
                    fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600,
                    cursor: 'pointer',
                  }}
                  title="Iniciar nova conversa"
                >
                  <Plus size={12} />
                  Iniciar Conversa
                </button>
              </div>
            </div>
            {/* Search */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '6px 10px',
              borderRadius: 'var(--r-md)',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
            }}>
              <Search size={13} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Buscar conversa..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  flex: 1, background: 'transparent', border: 'none', outline: 'none',
                  color: 'var(--text-primary)', fontFamily: 'var(--font-sans)', fontSize: 12,
                }}
              />
            </div>
          </div>

          {/* Conversation Items */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
            {convsLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, gap: 8 }}>
                <Loader2 size={18} className="animate-spin" style={{ color: 'var(--accent-400)' }} />
                <span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontFamily: 'var(--font-sans)' }}>
                  Carregando...
                </span>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12, textAlign: 'center' }}>
                <Inbox size={32} style={{ color: 'var(--text-tertiary)', opacity: 0.4 }} />
                <p style={{ fontSize: 13, color: 'var(--text-tertiary)', fontFamily: 'var(--font-sans)', margin: 0, lineHeight: 1.5 }}>
                  {searchQuery
                    ? 'Nenhuma conversa encontrada'
                    : 'Nenhuma conversa ainda'}
                </p>
                {!searchQuery && (
                  <button
                    onClick={() => setShowNewConversation(true)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      height: 32, padding: '0 14px',
                      borderRadius: 'var(--r-md)',
                      background: 'rgba(37,211,102,0.12)',
                      border: '1px solid rgba(37,211,102,0.30)',
                      color: '#25D366',
                      fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <Plus size={13} />
                    Iniciar Conversa
                  </button>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {filteredConversations.map((conv) => {
                  const isActive = activeLeadId === conv.id
                  return (
                    <button
                      key={conv.id}
                      onClick={() => handleSelectConversation(conv)}
                      style={{
                        ...elevated,
                        padding: '10px 12px',
                        display: 'flex', alignItems: 'center', gap: 10,
                        cursor: 'pointer',
                        width: '100%',
                        textAlign: 'left',
                        transition: 'all 150ms ease',
                        background: isActive
                          ? 'color-mix(in srgb, var(--accent-400) 10%, var(--bg-elevated))'
                          : 'var(--bg-elevated)',
                        borderColor: isActive
                          ? 'color-mix(in srgb, var(--accent-400) 30%, transparent)'
                          : 'var(--border-subtle)',
                      }}
                    >
                      {/* Avatar */}
                      <div style={{
                        width: 38, height: 38, borderRadius: 6, flexShrink: 0,
                        background: getAvatarColor(conv.id),
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <span style={{
                          fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 700,
                          color: 'var(--text-inverse)',
                        }}>
                          {getInitials(conv.name)}
                        </span>
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                          <p style={{
                            fontSize: 13, fontWeight: 600, color: 'var(--text-primary)',
                            fontFamily: 'var(--font-sans)', margin: 0,
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          }}>
                            {conv.name || conv.phone || 'Sem nome'}
                          </p>
                          <span style={{
                            fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-tertiary)', flexShrink: 0,
                          }}>
                            {formatTime(conv.last_message?.created_at || conv.last_message_at)}
                          </span>
                        </div>
                        <p style={{
                          fontSize: 11, color: 'var(--text-tertiary)',
                          fontFamily: 'var(--font-sans)', margin: '2px 0 0',
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>
                          {conv.last_message?.body || conv.phone || 'Sem mensagens'}
                        </p>
                      </div>

                      <ChevronRight size={14} style={{ color: 'var(--text-tertiary)', opacity: 0.4, flexShrink: 0 }} />
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </motion.div>

        {/* ── Right: Chat Panel ── */}
        <AnimatePresence mode="wait">
          {showChat && activeLead ? (
            <motion.div
              key="chat-panel"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              style={{
                ...card,
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                minWidth: 0,
              }}
            >
              {/* Chat Header */}
              <div style={{
                padding: '12px 16px',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <button
                  onClick={handleCloseChat}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: 30, height: 30, borderRadius: 'var(--r-md)',
                    background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
                    cursor: 'pointer', flexShrink: 0,
                    color: 'var(--text-secondary)',
                  }}
                  title="Fechar conversa"
                >
                  <ArrowLeft size={14} />
                </button>

                <div style={{
                  width: 36, height: 36, borderRadius: 6, flexShrink: 0,
                  background: getAvatarColor(activeLead.id),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{
                    fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 700,
                    color: 'var(--text-inverse)',
                  }}>
                    {getInitials(activeLead.name)}
                  </span>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontSize: 14, fontWeight: 600, color: 'var(--text-primary)',
                    fontFamily: 'var(--font-sans)', margin: 0,
                  }}>
                    {activeLead.name || 'Sem nome'}
                  </p>
                  <p style={{
                    fontSize: 11, color: 'var(--text-tertiary)',
                    fontFamily: 'var(--font-mono)', margin: '1px 0 0',
                  }}>
                    {activeLead.phone}
                    {activeLead.pipeline_stage && (
                      <span style={{ marginLeft: 8, color: 'var(--accent-400)' }}>
                        {activeLead.pipeline_stage.replace(/_/g, ' ')}
                      </span>
                    )}
                  </p>
                </div>

                {!connected && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    padding: '3px 8px', borderRadius: 6,
                    background: 'rgba(245,158,11,0.10)',
                    border: '1px solid rgba(245,158,11,0.25)',
                  }}>
                    <WifiOff size={10} style={{ color: 'var(--warning)' }} />
                    <span style={{ fontSize: 10, color: 'var(--warning)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                      Offline
                    </span>
                  </div>
                )}
              </div>

              {/* Messages Area */}
              <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                background: 'color-mix(in srgb, var(--bg-muted) 50%, var(--bg-surface))',
              }}>
                {msgsLoading ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 8 }}>
                    <Loader2 size={18} className="animate-spin" style={{ color: 'var(--accent-400)' }} />
                    <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Carregando mensagens...</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div style={{
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    flex: 1, gap: 12, textAlign: 'center',
                  }}>
                    <MessageSquare size={36} style={{ color: 'var(--text-tertiary)', opacity: 0.3 }} />
                    <p style={{ fontSize: 13, color: 'var(--text-tertiary)', fontFamily: 'var(--font-sans)', margin: 0 }}>
                      Nenhuma mensagem ainda
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-sans)', margin: 0, opacity: 0.7 }}>
                      Envie a primeira mensagem para iniciar a conversa
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <MessageBubble key={msg.id} message={msg} />
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Send Error */}
              {sendError && (
                <div style={{
                  padding: '6px 16px',
                  background: 'rgba(239,68,68,0.08)',
                  borderTop: '1px solid rgba(239,68,68,0.20)',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <AlertTriangle size={12} style={{ color: 'var(--error, #ef4444)', flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: 'var(--error, #ef4444)', fontFamily: 'var(--font-sans)' }}>
                    {sendError}
                  </span>
                  <button
                    onClick={() => setSendError(null)}
                    style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: 2 }}
                  >
                    <X size={12} />
                  </button>
                </div>
              )}

              {/* Message Input */}
              <div style={{
                padding: '12px 16px',
                borderTop: '1px solid var(--border-subtle)',
                display: 'flex', alignItems: 'flex-end', gap: 8,
              }}>
                <textarea
                  ref={inputRef}
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSend()
                    }
                  }}
                  placeholder="Digite uma mensagem..."
                  rows={1}
                  style={{
                    flex: 1, resize: 'none',
                    padding: '8px 12px',
                    borderRadius: 'var(--r-md)',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-sans)', fontSize: 13,
                    outline: 'none',
                    maxHeight: 120,
                    lineHeight: 1.5,
                  }}
                />
                <button
                  onClick={handleSend}
                  disabled={!messageInput.trim() || sending}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: 38, height: 38, borderRadius: 'var(--r-md)',
                    background: messageInput.trim() ? '#25D366' : 'var(--bg-elevated)',
                    border: messageInput.trim() ? '1px solid rgba(37,211,102,0.50)' : '1px solid var(--border-subtle)',
                    cursor: messageInput.trim() ? 'pointer' : 'default',
                    flexShrink: 0,
                    transition: 'all 150ms ease',
                  }}
                >
                  {sending ? (
                    <Loader2 size={16} className="animate-spin" style={{ color: '#fff' }} />
                  ) : (
                    <Send size={16} style={{ color: messageInput.trim() ? '#fff' : 'var(--text-tertiary)' }} />
                  )}
                </button>
              </div>
            </motion.div>
          ) : !showChat ? (
            /* ── Right: Connection / Setup Panel (when no chat open) ── */
            <motion.div
              key="setup-panel"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ ...card, flex: 1, padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}
            >
              {/* Connection Card */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <div>
                    <p style={{ fontFamily: 'var(--font-serif)', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                      Conex\u00E3o do Dispositivo
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 3, fontFamily: 'var(--font-sans)' }}>
                      Escaneie o QR code para vincular seu n\u00FAmero
                    </p>
                  </div>
                  <div style={{
                    width: 32, height: 32, borderRadius: 'var(--r-md)',
                    background: connected ? 'color-mix(in srgb, var(--success) 12%, transparent)' : 'var(--bg-elevated)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Smartphone size={15} style={{ color: connected ? 'var(--success)' : 'var(--text-tertiary)' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  {/* QR Code */}
                  <div style={{
                    width: 200, height: 200, flexShrink: 0,
                    borderRadius: 'var(--r-lg)',
                    background: connected ? 'color-mix(in srgb, var(--success) 8%, var(--bg-elevated))' : 'var(--bg-elevated)',
                    border: connected ? '2px solid color-mix(in srgb, var(--success) 35%, transparent)' : '2px dashed var(--border-default)',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: 12,
                    overflow: 'hidden', position: 'relative',
                  }}>
                    {qrLoading ? (
                      <>
                        <Loader2 size={32} className="animate-spin" style={{ color: 'var(--accent-400)' }} />
                        <p style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', textAlign: 'center' }}>
                          Gerando QR Code...
                        </p>
                      </>
                    ) : connected ? (
                      <>
                        <CheckCheck size={48} style={{ color: 'var(--success)' }} />
                        <p style={{ fontSize: 12, color: 'var(--success)', fontWeight: 600, fontFamily: 'var(--font-sans)', textAlign: 'center' }}>
                          WhatsApp Conectado
                        </p>
                      </>
                    ) : qrCode ? (
                      <>
                        <img
                          src={qrCode.startsWith('data:') ? qrCode : `data:image/png;base64,${qrCode}`}
                          alt="WhatsApp QR Code"
                          style={{ width: 180, height: 180, borderRadius: 8, objectFit: 'contain' }}
                        />
                        <button
                          onClick={fetchQrCode}
                          style={{
                            position: 'absolute', bottom: 4, right: 4,
                            width: 24, height: 24, borderRadius: 6,
                            background: 'rgba(0,0,0,0.6)', border: 'none',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer',
                          }}
                        >
                          <RefreshCw size={12} style={{ color: '#fff' }} />
                        </button>
                      </>
                    ) : qrError ? (
                      <>
                        <AlertTriangle size={32} style={{ color: 'var(--warning)', opacity: 0.7 }} />
                        <p style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', textAlign: 'center', padding: '0 12px', lineHeight: 1.4 }}>
                          {qrError.length > 80 ? qrError.slice(0, 80) + '...' : qrError}
                        </p>
                        <button
                          onClick={fetchQrCode}
                          style={{ fontSize: 11, color: 'var(--accent-400)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                        >
                          Tentar novamente
                        </button>
                      </>
                    ) : (
                      <>
                        <QrCode size={56} style={{ color: 'var(--text-tertiary)', opacity: 0.5 }} />
                        <p style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', textAlign: 'center', lineHeight: 1.4, padding: '0 16px' }}>
                          Clique em Reconectar<br />para gerar o QR Code
                        </p>
                      </>
                    )}
                  </div>

                  {/* Steps */}
                  <div style={{ flex: 1, minWidth: 160 }}>
                    <p style={{ ...label, marginBottom: 12 }}>Como conectar</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {SETUP_STEPS.map((step, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                          <div style={{
                            width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                            background: 'rgba(200,164,74,.12)',
                            border: '1.5px solid rgba(200,164,74,.30)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: 'var(--accent-400)' }}>
                              {i + 1}
                            </span>
                          </div>
                          <p style={{ fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)', margin: 0, lineHeight: 1.5, paddingTop: 2 }}>
                            {step}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div style={{
                      marginTop: 16, padding: '10px 12px',
                      borderRadius: 'var(--r-md)',
                      background: 'color-mix(in srgb, var(--success) 6%, transparent)',
                      border: '1px solid color-mix(in srgb, var(--success) 18%, transparent)',
                      display: 'flex', alignItems: 'center', gap: 8,
                    }}>
                      <CheckCheck size={13} style={{ color: 'var(--success)', flexShrink: 0 }} />
                      <p style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)', margin: 0, lineHeight: 1.4 }}>
                        A sess\u00E3o fica ativa por at\u00E9 14 dias sem reconectar
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div style={{
                padding: '16px 20px',
                borderRadius: 'var(--r-lg)',
                background: 'linear-gradient(135deg, rgba(200,164,74,.07) 0%, transparent 100%)',
                border: '1px solid rgba(200,164,74,.18)',
                display: 'flex', alignItems: 'center', gap: 16,
              }}>
                <Zap size={20} style={{ color: 'var(--accent-400)', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-sans)', margin: 0 }}>
                    Automa\u00E7\u00E3o completa com Evolution API
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-sans)', margin: '2px 0 0' }}>
                    Configure EVOLUTION_API_URL e EVOLUTION_API_KEY
                  </p>
                </div>
                <Link
                  href="/backoffice/integracoes"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    height: 32, padding: '0 14px',
                    borderRadius: 'var(--r-md)',
                    background: 'var(--accent-400)',
                    color: 'var(--text-inverse)', textDecoration: 'none',
                    fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600,
                    flexShrink: 0,
                  }}
                >
                  Integra\u00E7\u00F5es
                  <ArrowRight size={12} />
                </Link>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {/* ── New Conversation Dialog ── */}
      <AnimatePresence>
        {showNewConversation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 1000,
            }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowNewConversation(false) }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              style={{
                ...card,
                padding: 24,
                width: 400,
                maxWidth: '90vw',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <p style={{ fontFamily: 'var(--font-serif)', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  Iniciar Conversa
                </p>
                <button
                  onClick={() => setShowNewConversation(false)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: 28, height: 28, borderRadius: 'var(--r-md)',
                    background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
                    cursor: 'pointer', color: 'var(--text-tertiary)',
                  }}
                >
                  <X size={14} />
                </button>
              </div>

              <form onSubmit={handleStartNewConversation} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <p style={label}>
                    <Phone size={10} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                    Telefone *
                  </p>
                  <input
                    type="tel"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="(11) 99999-9999"
                    style={{
                      width: '100%', padding: '8px 12px',
                      borderRadius: 'var(--r-md)',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-sans)', fontSize: 13,
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                    autoFocus
                  />
                </div>
                <div>
                  <p style={label}>
                    <User size={10} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                    Nome (opcional)
                  </p>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Nome do contato"
                    style={{
                      width: '100%', padding: '8px 12px',
                      borderRadius: 'var(--r-md)',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-sans)', fontSize: 13,
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {newConvError && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '6px 10px', borderRadius: 'var(--r-md)',
                    background: 'rgba(239,68,68,0.08)',
                    border: '1px solid rgba(239,68,68,0.20)',
                  }}>
                    <AlertTriangle size={12} style={{ color: 'var(--error, #ef4444)' }} />
                    <span style={{ fontSize: 11, color: 'var(--error, #ef4444)', fontFamily: 'var(--font-sans)' }}>
                      {newConvError}
                    </span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={newConvLoading}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    height: 40, padding: '0 20px',
                    borderRadius: 'var(--r-md)',
                    background: '#25D366',
                    border: '1px solid rgba(37,211,102,0.50)',
                    color: '#fff',
                    fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600,
                    cursor: newConvLoading ? 'wait' : 'pointer',
                    marginTop: 4,
                    transition: 'opacity 150ms ease',
                    opacity: newConvLoading ? 0.7 : 1,
                  }}
                >
                  {newConvLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <MessageCircle size={16} />
                  )}
                  {newConvLoading ? 'Criando...' : 'Abrir Conversa'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Message Bubble Component ──────────────────────────────────────────────────

function MessageBubble({ message }: { message: WhatsAppMessage }) {
  const isOutbound = message.direction === 'outbound'

  const statusIcon = () => {
    if (!isOutbound) return null
    switch (message.status) {
      case 'sent':
        return <Clock size={10} style={{ color: 'var(--text-tertiary)' }} />
      case 'delivered':
        return <CheckCheck size={10} style={{ color: 'var(--text-tertiary)' }} />
      case 'read':
        return <CheckCheck size={10} style={{ color: '#53bdeb' }} />
      case 'failed':
        return <AlertTriangle size={10} style={{ color: 'var(--error, #ef4444)' }} />
      default:
        return <Clock size={10} style={{ color: 'var(--text-tertiary)' }} />
    }
  }

  return (
    <div style={{
      display: 'flex',
      justifyContent: isOutbound ? 'flex-end' : 'flex-start',
      padding: '0 4px',
    }}>
      <div style={{
        maxWidth: '70%',
        padding: '8px 12px',
        borderRadius: isOutbound ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
        background: isOutbound
          ? 'color-mix(in srgb, #25D366 15%, var(--bg-elevated))'
          : 'var(--bg-elevated)',
        border: isOutbound
          ? '1px solid color-mix(in srgb, #25D366 25%, transparent)'
          : '1px solid var(--border-subtle)',
      }}>
        <p style={{
          fontSize: 13, color: 'var(--text-primary)',
          fontFamily: 'var(--font-sans)', margin: 0,
          lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
        }}>
          {message.body || (message.content_type !== 'text' ? `[${message.content_type}]` : '')}
        </p>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
          gap: 4, marginTop: 4,
        }}>
          {message.is_ai_generated && (
            <span style={{
              fontSize: 9, fontWeight: 600, padding: '1px 4px', borderRadius: 3,
              background: 'rgba(200,164,74,.12)', color: 'var(--accent-400)',
              fontFamily: 'var(--font-mono)',
            }}>
              IA
            </span>
          )}
          <span style={{
            fontSize: 10, color: 'var(--text-tertiary)',
            fontFamily: 'var(--font-mono)',
          }}>
            {new Date(message.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </span>
          {statusIcon()}
        </div>
        {message.status === 'failed' && (
          <p style={{
            fontSize: 10, color: 'var(--error, #ef4444)',
            fontFamily: 'var(--font-sans)', margin: '4px 0 0',
          }}>
            Falha no envio
          </p>
        )}
      </div>
    </div>
  )
}
