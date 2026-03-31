'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
    ArrowLeft, Send, CheckCircle2, XCircle, DollarSign,
    Calendar, Building2, Users, MessageSquare, Clock,
    AlertCircle, Loader2,
} from 'lucide-react'
import {
    usePartnership,
    acceptPartnership,
    rejectPartnership,
    cancelPartnership,
    completePartnership,
    type Partnership,
} from '@/hooks/use-partnerships'
import { T } from '../../../lib/theme'
import { formatCurrency } from '@/lib/format'

/* ─── CONSTANTS ───────────────────────────────────────────────── */

function fmtDate(d: string | null): string {
    if (!d) return '\u2014'
    return new Date(d).toLocaleDateString('pt-BR')
}

function fmtTime(d: string | null): string {
    if (!d) return ''
    return new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function fmtDateTime(d: string): string {
    return `${fmtDate(d)} ${fmtTime(d)}`
}

function isSameDay(a: string, b: string): boolean {
    return new Date(a).toDateString() === new Date(b).toDateString()
}

const STATUS_CFG: Record<
    Partnership['status'],
    { label: string; color: string; bg: string }
> = {
    proposed:    { label: 'Proposta',    color: 'var(--accent-400)', bg: 'rgba(61,111,255,0.12)' },
    negotiating: { label: 'Negociando',  color: 'var(--warning)',    bg: 'rgba(251,191,36,0.12)' },
    accepted:    { label: 'Aceita',      color: 'var(--success)',    bg: 'rgba(34,197,94,0.12)' },
    active:      { label: 'Ativa',       color: 'var(--success)',    bg: 'rgba(34,197,94,0.12)' },
    completed:   { label: 'Conclu\u00edda',   color: 'var(--info)',       bg: 'rgba(96,165,250,0.12)' },
    cancelled:   { label: 'Cancelada',   color: 'var(--error)',      bg: 'rgba(239,68,68,0.12)' },
    rejected:    { label: 'Rejeitada',   color: 'var(--error)',      bg: 'rgba(239,68,68,0.12)' },
    expired:     { label: 'Expirada',    color: 'var(--error)',      bg: 'rgba(239,68,68,0.12)' },
}

const TERMINAL_STATUSES = ['completed', 'cancelled', 'rejected', 'expired']

/* ─── MESSAGE TYPES ───────────────────────────────────────────── */

interface PartnershipMessage {
    id: string
    partnership_id: string
    sender_id: string
    sender_name: string
    sender_avatar: string | null
    content: string
    message_type: 'text' | 'system' | 'commission_proposal' | 'visit_schedule' | 'completion'
    metadata: Record<string, unknown> | null
    read_by_owner: boolean
    read_by_partner: boolean
    is_deleted: boolean
    created_at: string
}

/* ─── ROOT PAGE ───────────────────────────────────────────────── */

export default function PartnershipChatPage() {
    const { id } = useParams<{ id: string }>()
    const router = useRouter()
    const { partnership, isLoading: partnershipLoading, isError: partnershipError, mutate: mutatePartnership } = usePartnership(id)

    const [messages, setMessages] = useState<PartnershipMessage[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [loadingMessages, setLoadingMessages] = useState(true)
    const [msgError, setMsgError] = useState<string | null>(null)
    const [sending, setSending] = useState(false)
    const [actionLoading, setActionLoading] = useState<string | null>(null)
    const [showCompleteModal, setShowCompleteModal] = useState(false)
    const [saleValueInput, setSaleValueInput] = useState('')

    const messagesEndRef = useRef<HTMLDivElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

    /* ── Fetch messages ─────────────────────────────────────────── */

    const fetchMessages = useCallback(async () => {
        if (!id) return
        try {
            const res = await fetch(`/api/partnerships/${id}/messages?limit=100`)
            if (!res.ok) throw new Error('Erro ao carregar mensagens')
            const json = await res.json()
            setMessages(json.data ?? [])
            setMsgError(null)
        } catch (err) {
            setMsgError(err instanceof Error ? err.message : 'Erro desconhecido')
        } finally {
            setLoadingMessages(false)
        }
    }, [id])

    useEffect(() => {
        fetchMessages()
    }, [fetchMessages])

    // Supabase Realtime subscription for instant message delivery
    useEffect(() => {
        if (!id) return
        const { createClient } = require('@/lib/supabase/client')
        const supabase = createClient()
        const channel = supabase
            .channel(`partnership-msgs-${id}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'partnership_messages',
                filter: `partnership_id=eq.${id}`,
            }, () => { fetchMessages() })
            .subscribe()

        // Fallback poll every 15s (in case realtime hiccups)
        pollRef.current = setInterval(fetchMessages, 15000)
        return () => {
            supabase.removeChannel(channel)
            if (pollRef.current) clearInterval(pollRef.current)
        }
    }, [id, fetchMessages])

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    /* ── Send message ───────────────────────────────────────────── */

    const handleSend = useCallback(async () => {
        const text = newMessage.trim()
        if (!text || sending) return
        setSending(true)
        setNewMessage('')
        try {
            const res = await fetch(`/api/partnerships/${id}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: text }),
            })
            if (!res.ok) {
                const errJson = await res.json().catch(() => ({ error: 'Erro ao enviar' }))
                throw new Error(errJson.error ?? 'Erro ao enviar mensagem')
            }
            const json = await res.json()
            setMessages(prev => [...prev, json.data])
        } catch (err) {
            setMsgError(err instanceof Error ? err.message : 'Erro ao enviar')
        } finally {
            setSending(false)
            textareaRef.current?.focus()
        }
    }, [newMessage, sending, id])

    /* ── Actions ─────────────────────────────────────────────────── */

    const handleAction = useCallback(async (action: string) => {
        if (actionLoading) return
        setActionLoading(action)
        try {
            switch (action) {
                case 'accept':
                    await acceptPartnership(id)
                    break
                case 'reject':
                    await rejectPartnership(id)
                    break
                case 'cancel':
                    await cancelPartnership(id)
                    break
                case 'complete': {
                    setShowCompleteModal(true)
                    setActionLoading(null)
                    return
                }
            }
            await mutatePartnership()
            await fetchMessages()
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Erro na ação')
        } finally {
            setActionLoading(null)
        }
    }, [actionLoading, id, mutatePartnership, fetchMessages])

    /* ── Auto-resize textarea ───────────────────────────────────── */

    const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setNewMessage(e.target.value)
        const el = e.target
        el.style.height = 'auto'
        el.style.height = `${Math.min(el.scrollHeight, 120)}px`
    }

    /* ── Loading / Error states ──────────────────────────────────── */

    if (partnershipLoading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.text, fontFamily: 'var(--font-ui, var(--font-outfit, sans-serif))' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                    <Loader2 size={28} style={{ color: T.gold, animation: 'spin 1s linear infinite' }} />
                    <span style={{ fontSize: 13, color: T.textMuted }}>Carregando parceria...</span>
                </div>
            </div>
        )
    }

    if (partnershipError || !partnership) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.text, fontFamily: 'var(--font-ui, var(--font-outfit, sans-serif))' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center' }}>
                    <AlertCircle size={32} style={{ color: T.error }} />
                    <p style={{ fontSize: 14, color: T.text, margin: 0 }}>Parceria não encontrada</p>
                    <button onClick={() => router.push('/backoffice/parcerias')}
                        style={{ padding: '8px 20px', borderRadius: T.radius.md, border: `1px solid ${T.border}`, background: T.surface, color: T.text, fontSize: 13, cursor: 'pointer' }}>
                        Voltar para Parcerias
                    </button>
                </div>
            </div>
        )
    }

    const sc = STATUS_CFG[partnership.status] ?? STATUS_CFG.proposed
    const isTerminal = TERMINAL_STATUSES.includes(partnership.status)

    return (
        <div style={{ minHeight: '100vh', color: T.text, fontFamily: 'var(--font-ui, var(--font-outfit, sans-serif))' }}>
            <style>{`
                .pc-input::placeholder { color: ${T.textDim}; }
                .pc-input:focus { outline: none; border-color: ${T.gold} !important; box-shadow: 0 0 0 3px rgba(61,111,255,0.10); }
                .pc-btn:hover:not(:disabled) { opacity: 0.85; }
                .pc-action:hover:not(:disabled) { filter: brightness(1.1); }
                .pc-back:hover { background: ${T.hover} !important; }
                .pc-link:hover { color: ${T.gold} !important; text-decoration: underline; }
                @keyframes spin  { to { transform: rotate(360deg) } }
                @keyframes fade  { from { opacity:0; transform:translateY(4px) } to { opacity:1; transform:translateY(0) } }
                .pc-ani { animation: fade 200ms ease forwards; }
                @media (max-width: 767px) { .pc-sidebar { display: none !important; } .pc-main { grid-template-columns: 1fr !important; } }
            `}</style>

            {/* ── Top header ──────────────────────────────────────── */}
            <div style={{ padding: '16px 24px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
                <button onClick={() => router.push('/backoffice/parcerias')} className="pc-back"
                    style={{ width: 36, height: 36, borderRadius: T.radius.md, border: `1px solid ${T.border}`, background: 'transparent', color: T.textMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, transition: 'all 150ms' }}>
                    <ArrowLeft size={16} />
                </button>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <h1 style={{ fontSize: 16, fontWeight: 700, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {partnership.property_name}
                        </h1>
                        <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: T.radius.full, color: sc.color, background: sc.bg, flexShrink: 0 }}>
                            {sc.label}
                        </span>
                    </div>
                    <p style={{ fontSize: 12, color: T.textMuted, margin: '2px 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        Parceria com {partnership.partner_name}
                    </p>
                </div>
            </div>

            {/* ── Main layout ────────────────────────────────────── */}
            <div className="pc-main" style={{ display: 'grid', gridTemplateColumns: '1fr 300px', height: 'calc(100vh - 73px)' }}>

                {/* ── LEFT: Chat panel ─────────────────────────── */}
                <div style={{ display: 'flex', flexDirection: 'column', borderRight: `1px solid ${T.border}` }}>

                    {/* Messages area */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {loadingMessages ? (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                                <Loader2 size={22} style={{ color: T.gold, animation: 'spin 1s linear infinite' }} />
                            </div>
                        ) : msgError && messages.length === 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 10 }}>
                                <AlertCircle size={24} style={{ color: T.error }} />
                                <p style={{ fontSize: 13, color: T.textMuted }}>{msgError}</p>
                                <button onClick={fetchMessages}
                                    style={{ padding: '6px 16px', borderRadius: T.radius.md, border: `1px solid ${T.border}`, background: T.surface, color: T.text, fontSize: 12, cursor: 'pointer' }}>
                                    Tentar novamente
                                </button>
                            </div>
                        ) : messages.length === 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 10, opacity: 0.6 }}>
                                <div style={{ width: 52, height: 52, borderRadius: T.radius.lg, background: T.accentBg, border: `1px solid ${T.borderGold}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <MessageSquare size={24} style={{ color: T.gold }} />
                                </div>
                                <p style={{ fontSize: 13, color: T.textMuted }}>Envie a primeira mensagem</p>
                            </div>
                        ) : (
                            <>
                                {messages.map((msg, i) => {
                                    const showDateSep = i === 0 || !isSameDay(messages[i - 1].created_at, msg.created_at)
                                    return (
                                        <div key={msg.id}>
                                            {showDateSep && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0 12px' }}>
                                                    <div style={{ flex: 1, height: 1, background: T.border }} />
                                                    <span style={{ fontSize: 11, color: T.textDim, fontWeight: 600, flexShrink: 0 }}>
                                                        {fmtDate(msg.created_at)}
                                                    </span>
                                                    <div style={{ flex: 1, height: 1, background: T.border }} />
                                                </div>
                                            )}
                                            <MessageBubble
                                                msg={msg}
                                                isOwner={msg.sender_id === partnership.owner_user_id}
                                                partnership={partnership}
                                                onAction={handleAction}
                                                actionLoading={actionLoading}
                                            />
                                        </div>
                                    )
                                })}
                            </>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input area */}
                    {!isTerminal && (
                        <div style={{ padding: '12px 24px 16px', borderTop: `1px solid ${T.border}`, display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                            <textarea
                                ref={textareaRef}
                                className="pc-input"
                                value={newMessage}
                                onChange={handleTextareaChange}
                                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                                placeholder="Digite sua mensagem... (Enter para enviar)"
                                disabled={sending}
                                rows={1}
                                style={{
                                    flex: 1, padding: '10px 14px', borderRadius: T.radius.md,
                                    background: T.surface, border: `1.5px solid ${T.border}`,
                                    color: T.text, fontSize: 13, resize: 'none',
                                    fontFamily: 'inherit', lineHeight: 1.5,
                                    transition: `all ${T.transition.fast}`, minHeight: 42, maxHeight: 120,
                                }}
                            />
                            <button onClick={handleSend} disabled={sending || !newMessage.trim()} className="pc-btn"
                                style={{
                                    width: 42, height: 42, borderRadius: T.radius.md, border: 'none',
                                    cursor: sending || !newMessage.trim() ? 'not-allowed' : 'pointer',
                                    background: sending || !newMessage.trim() ? T.surface : '#0A1624',
                                    color: sending || !newMessage.trim() ? T.textDim : '#fff',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    flexShrink: 0, transition: `all ${T.transition.fast}`,
                                }}>
                                {sending
                                    ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                                    : <Send size={16} />}
                            </button>
                        </div>
                    )}

                    {isTerminal && (
                        <div style={{ padding: '14px 24px', borderTop: `1px solid ${T.border}`, textAlign: 'center' }}>
                            <p style={{ fontSize: 12, color: T.textDim, margin: 0 }}>
                                Esta parceria foi {STATUS_CFG[partnership.status]?.label.toLowerCase() ?? 'encerrada'}. N\u00e3o \u00e9 poss\u00edvel enviar novas mensagens.
                            </p>
                        </div>
                    )}
                </div>

                {/* ── RIGHT: Sidebar ──────────────────────────── */}
                <div className="pc-sidebar" style={{ overflowY: 'auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>

                    {/* Status card */}
                    <SidebarCard title="Status">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{
                                width: 8, height: 8, borderRadius: T.radius.full,
                                background: sc.color, flexShrink: 0,
                            }} />
                            <span style={{ fontSize: 13, fontWeight: 600, color: sc.color }}>{sc.label}</span>
                        </div>
                    </SidebarCard>

                    {/* Property card */}
                    <SidebarCard title="Im\u00f3vel">
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                            <Building2 size={14} style={{ color: T.gold, marginTop: 2, flexShrink: 0 }} />
                            <div>
                                <button onClick={() => router.push(`/backoffice/imoveis/${partnership.property_id}`)} className="pc-link"
                                    style={{ fontSize: 13, fontWeight: 600, color: T.text, background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}>
                                    {partnership.property_name}
                                </button>
                                {partnership.property_price != null && (
                                    <p style={{ fontSize: 12, color: T.textMuted, margin: '4px 0 0' }}>
                                        {formatCurrency(partnership.property_price)}
                                    </p>
                                )}
                            </div>
                        </div>
                    </SidebarCard>

                    {/* Commission details */}
                    <SidebarCard title="Comiss\u00e3o">
                        <CommissionBar
                            ownerPct={partnership.commission_owner_pct}
                            partnerPct={partnership.commission_partner_pct}
                            ownerName={partnership.owner_name}
                            partnerName={partnership.partner_name}
                        />
                    </SidebarCard>

                    {/* Action buttons */}
                    {!isTerminal && (
                        <SidebarCard title="A\u00e7\u00f5es">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {partnership.status === 'proposed' && (
                                    <>
                                        <ActionButton
                                            label="Aceitar"
                                            color={T.success}
                                            bg={T.successBg}
                                            icon={<CheckCircle2 size={14} />}
                                            loading={actionLoading === 'accept'}
                                            disabled={!!actionLoading}
                                            onClick={() => handleAction('accept')}
                                        />
                                        <ActionButton
                                            label="Recusar"
                                            color={T.error}
                                            bg={T.errorBg}
                                            icon={<XCircle size={14} />}
                                            loading={actionLoading === 'reject'}
                                            disabled={!!actionLoading}
                                            onClick={() => handleAction('reject')}
                                        />
                                    </>
                                )}
                                {(partnership.status === 'accepted' || partnership.status === 'active') && (
                                    <>
                                        <ActionButton
                                            label="Concluir Neg\u00f3cio"
                                            color={T.success}
                                            bg={T.successBg}
                                            icon={<DollarSign size={14} />}
                                            loading={actionLoading === 'complete'}
                                            disabled={!!actionLoading}
                                            onClick={() => handleAction('complete')}
                                        />
                                        <ActionButton
                                            label="Cancelar"
                                            color={T.error}
                                            bg={T.errorBg}
                                            icon={<XCircle size={14} />}
                                            loading={actionLoading === 'cancel'}
                                            disabled={!!actionLoading}
                                            onClick={() => handleAction('cancel')}
                                        />
                                    </>
                                )}
                                {(partnership.status === 'negotiating') && (
                                    <ActionButton
                                        label="Cancelar"
                                        color={T.error}
                                        bg={T.errorBg}
                                        icon={<XCircle size={14} />}
                                        loading={actionLoading === 'cancel'}
                                        disabled={!!actionLoading}
                                        onClick={() => handleAction('cancel')}
                                    />
                                )}
                            </div>
                        </SidebarCard>
                    )}

                    {/* Lead info */}
                    {partnership.lead_name && (
                        <SidebarCard title="Lead">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Users size={14} style={{ color: T.gold, flexShrink: 0 }} />
                                <span style={{ fontSize: 13, color: T.text }}>{partnership.lead_name}</span>
                            </div>
                        </SidebarCard>
                    )}

                    {/* Timeline */}
                    <SidebarCard title="Linha do Tempo">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <TimelineItem label="Proposta" date={partnership.proposed_at} icon={<MessageSquare size={12} />} />
                            <TimelineItem label="Resposta" date={partnership.updated_at !== partnership.proposed_at ? partnership.updated_at : null} icon={<CheckCircle2 size={12} />} />
                            {partnership.status === 'completed' && partnership.sale_value != null && (
                                <TimelineItem
                                    label={`Venda: ${formatCurrency(partnership.sale_value)}`}
                                    date={partnership.updated_at}
                                    icon={<DollarSign size={12} />}
                                />
                            )}
                        </div>
                    </SidebarCard>
                </div>
            </div>

            {/* Complete Sale Modal */}
            {showCompleteModal && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 999,
                    background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }} onClick={() => setShowCompleteModal(false)}>
                    <div onClick={e => e.stopPropagation()} style={{
                        background: T.bg, border: `1px solid ${T.borderGold}`,
                        borderRadius: T.radius.xl, padding: 28, width: 400, maxWidth: '90vw',
                        boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
                    }}>
                        <h3 style={{ fontFamily: T.font.display, fontSize: 20, color: T.gold, marginBottom: 4 }}>
                            Concluir Negócio
                        </h3>
                        <p style={{ fontSize: 13, color: T.textDim, marginBottom: 20 }}>
                            Informe o valor final da venda para calcular as comissões automaticamente.
                        </p>
                        <label style={{ fontSize: 12, fontWeight: 600, color: T.textMuted, marginBottom: 6, display: 'block' }}>
                            Valor da venda (R$)
                        </label>
                        <input
                            type="text"
                            value={saleValueInput}
                            onChange={e => setSaleValueInput(e.target.value)}
                            placeholder="Ex: 850.000,00"
                            autoFocus
                            style={{
                                width: '100%', height: 44, padding: '0 14px',
                                background: T.elevated, border: `1px solid ${T.borderLight}`,
                                borderRadius: T.radius.md, color: T.text,
                                fontSize: 16, fontFamily: T.font.mono, outline: 'none',
                                marginBottom: 20,
                            }}
                            onKeyDown={e => {
                                if (e.key === 'Enter') {
                                    const val = parseFloat(saleValueInput.replace(/[^\d.,]/g, '').replace(',', '.'))
                                    if (!isNaN(val) && val > 0) {
                                        setShowCompleteModal(false)
                                        setActionLoading('complete')
                                        completePartnership(id, val).then(() => mutatePartnership()).finally(() => setActionLoading(null))
                                    }
                                }
                            }}
                        />
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setShowCompleteModal(false)}
                                style={{
                                    padding: '10px 20px', borderRadius: T.radius.md,
                                    background: 'transparent', border: `1px solid ${T.borderLight}`,
                                    color: T.textMuted, fontSize: 13, cursor: 'pointer',
                                }}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => {
                                    const val = parseFloat(saleValueInput.replace(/[^\d.,]/g, '').replace(',', '.'))
                                    if (isNaN(val) || val <= 0) return
                                    setShowCompleteModal(false)
                                    setActionLoading('complete')
                                    completePartnership(id, val).then(() => mutatePartnership()).finally(() => setActionLoading(null))
                                }}
                                style={{
                                    padding: '10px 24px', borderRadius: T.radius.md,
                                    background: T.gold, color: T.bg, border: 'none',
                                    fontSize: 13, fontWeight: 600, cursor: 'pointer',
                                }}
                            >
                                <DollarSign size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                                Confirmar Conclusão
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   SUB-COMPONENTS
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

/* ── MessageBubble ────────────────────────────────────────────── */

function MessageBubble({
    msg,
    isOwner,
    partnership,
    onAction,
    actionLoading,
}: {
    msg: PartnershipMessage
    isOwner: boolean
    partnership: Partnership
    onAction: (action: string) => void
    actionLoading: string | null
}) {
    const time = fmtTime(msg.created_at)

    // System message
    if (msg.message_type === 'system') {
        return (
            <div className="pc-ani" style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
                <span style={{
                    fontSize: 11, color: T.textDim, fontStyle: 'italic',
                    background: T.subtle, padding: '4px 14px',
                    borderRadius: T.radius.full, maxWidth: '80%', textAlign: 'center',
                }}>
                    {msg.content}
                </span>
            </div>
        )
    }

    // Commission proposal
    if (msg.message_type === 'commission_proposal') {
        const meta = msg.metadata as { owner_pct?: number; partner_pct?: number } | null
        return (
            <div className="pc-ani" style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
                <div style={{
                    width: '85%', maxWidth: 400, padding: 16, borderRadius: T.radius.lg,
                    background: T.surface, border: `1px solid ${T.borderGold}`,
                    boxShadow: T.shadowSm,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <DollarSign size={14} style={{ color: T.gold }} />
                        <span style={{ fontSize: 12, fontWeight: 700, color: T.gold, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                            Proposta de Comiss\u00e3o
                        </span>
                    </div>
                    <p style={{ fontSize: 13, color: T.text, margin: '0 0 12px' }}>{msg.content}</p>
                    {meta && (
                        <CommissionBar
                            ownerPct={meta.owner_pct ?? null}
                            partnerPct={meta.partner_pct ?? null}
                            ownerName={partnership.owner_name}
                            partnerName={partnership.partner_name}
                        />
                    )}
                    {!TERMINAL_STATUSES.includes(partnership.status) && (
                        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                            <button onClick={() => onAction('accept')} disabled={!!actionLoading} className="pc-action"
                                style={{ flex: 1, padding: '7px 12px', borderRadius: T.radius.md, border: 'none', background: T.success, color: '#fff', fontSize: 12, fontWeight: 600, cursor: actionLoading ? 'not-allowed' : 'pointer', transition: 'all 150ms' }}>
                                Aceitar
                            </button>
                            <button disabled={!!actionLoading} className="pc-action"
                                style={{ flex: 1, padding: '7px 12px', borderRadius: T.radius.md, border: `1px solid ${T.border}`, background: T.surface, color: T.text, fontSize: 12, fontWeight: 600, cursor: actionLoading ? 'not-allowed' : 'pointer', transition: 'all 150ms' }}>
                                Contraproposta
                            </button>
                            <button onClick={() => onAction('reject')} disabled={!!actionLoading} className="pc-action"
                                style={{ flex: 1, padding: '7px 12px', borderRadius: T.radius.md, border: 'none', background: T.error, color: '#fff', fontSize: 12, fontWeight: 600, cursor: actionLoading ? 'not-allowed' : 'pointer', transition: 'all 150ms' }}>
                                Recusar
                            </button>
                        </div>
                    )}
                    <span style={{ fontSize: 10, color: T.textDim, marginTop: 8, display: 'block' }}>{msg.sender_name} \u2022 {time}</span>
                </div>
            </div>
        )
    }

    // Visit schedule
    if (msg.message_type === 'visit_schedule') {
        const meta = msg.metadata as { date?: string; time?: string; address?: string } | null
        return (
            <div className="pc-ani" style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
                <div style={{
                    width: '85%', maxWidth: 400, padding: 16, borderRadius: T.radius.lg,
                    background: T.surface, border: `1px solid ${T.border}`,
                    boxShadow: T.shadowSm,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <Calendar size={14} style={{ color: T.info }} />
                        <span style={{ fontSize: 12, fontWeight: 700, color: T.info, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                            Visita Agendada
                        </span>
                    </div>
                    <p style={{ fontSize: 13, color: T.text, margin: '0 0 8px' }}>{msg.content}</p>
                    {meta && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: T.textMuted }}>
                            {meta.date && <span><Clock size={11} style={{ marginRight: 4 }} />{meta.date} {meta.time ? `\u00e0s ${meta.time}` : ''}</span>}
                            {meta.address && <span><Building2 size={11} style={{ marginRight: 4 }} />{meta.address}</span>}
                        </div>
                    )}
                    <span style={{ fontSize: 10, color: T.textDim, marginTop: 8, display: 'block' }}>{msg.sender_name} \u2022 {time}</span>
                </div>
            </div>
        )
    }

    // Completion
    if (msg.message_type === 'completion') {
        const meta = msg.metadata as { sale_value?: number; owner_commission?: number; partner_commission?: number } | null
        return (
            <div className="pc-ani" style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
                <div style={{
                    width: '85%', maxWidth: 400, padding: 16, borderRadius: T.radius.lg,
                    background: T.successBg, border: `1px solid rgba(34,197,94,0.25)`,
                    boxShadow: T.shadowSm,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <CheckCircle2 size={14} style={{ color: T.success }} />
                        <span style={{ fontSize: 12, fontWeight: 700, color: T.success, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                            Neg\u00f3cio Conclu\u00eddo
                        </span>
                    </div>
                    <p style={{ fontSize: 13, color: T.text, margin: '0 0 10px' }}>{msg.content}</p>
                    {meta && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
                            {meta.sale_value != null && (
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: T.textMuted }}>Valor da venda</span>
                                    <span style={{ color: T.text, fontWeight: 600 }}>{formatCurrency(meta.sale_value)}</span>
                                </div>
                            )}
                            {meta.owner_commission != null && (
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: T.textMuted }}>Comiss\u00e3o Captador</span>
                                    <span style={{ color: T.success, fontWeight: 600 }}>{formatCurrency(meta.owner_commission)}</span>
                                </div>
                            )}
                            {meta.partner_commission != null && (
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: T.textMuted }}>Comiss\u00e3o Parceiro</span>
                                    <span style={{ color: T.success, fontWeight: 600 }}>{formatCurrency(meta.partner_commission)}</span>
                                </div>
                            )}
                        </div>
                    )}
                    <span style={{ fontSize: 10, color: T.textDim, marginTop: 8, display: 'block' }}>{time}</span>
                </div>
            </div>
        )
    }

    // Regular text message
    const isRight = isOwner
    return (
        <div className="pc-ani" style={{
            display: 'flex', justifyContent: isRight ? 'flex-end' : 'flex-start',
            padding: '3px 0',
        }}>
            <div style={{ maxWidth: '75%', display: 'flex', flexDirection: 'column', alignItems: isRight ? 'flex-end' : 'flex-start' }}>
                <span style={{ fontSize: 10, color: T.textDim, marginBottom: 3, paddingLeft: isRight ? 0 : 2, paddingRight: isRight ? 2 : 0 }}>
                    {msg.sender_name}
                </span>
                <div style={{
                    padding: '10px 14px',
                    borderRadius: isRight
                        ? `${T.radius.lg} ${T.radius.lg} ${T.radius.xs} ${T.radius.lg}`
                        : `${T.radius.lg} ${T.radius.lg} ${T.radius.lg} ${T.radius.xs}`,
                    background: isRight ? T.gold : T.surface,
                    color: isRight ? T.textInverse : T.text,
                    border: isRight ? 'none' : `1px solid ${T.border}`,
                    fontSize: 13, lineHeight: 1.55, wordBreak: 'break-word',
                }}>
                    {msg.content}
                </div>
                <span style={{ fontSize: 10, color: T.textDim, marginTop: 3, paddingLeft: isRight ? 0 : 2, paddingRight: isRight ? 2 : 0 }}>
                    {time}
                </span>
            </div>
        </div>
    )
}

/* ── CommissionBar ────────────────────────────────────────────── */

function CommissionBar({
    ownerPct,
    partnerPct,
    ownerName,
    partnerName,
}: {
    ownerPct: number | null
    partnerPct: number | null
    ownerName: string
    partnerName: string
}) {
    const oPct = ownerPct ?? 50
    const pPct = partnerPct ?? 50

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 6 }}>
                <span style={{ color: T.textMuted }}>{ownerName}</span>
                <span style={{ color: T.textMuted }}>{partnerName}</span>
            </div>
            <div style={{ display: 'flex', height: 8, borderRadius: T.radius.full, overflow: 'hidden', background: T.subtle }}>
                <div style={{
                    width: `${oPct}%`, background: T.gold,
                    borderRadius: `${T.radius.full} 0 0 ${T.radius.full}`,
                    transition: `width ${T.transition.normal}`,
                }} />
                <div style={{
                    width: `${pPct}%`, background: T.info,
                    borderRadius: `0 ${T.radius.full} ${T.radius.full} 0`,
                    transition: `width ${T.transition.normal}`,
                }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginTop: 6 }}>
                <span style={{ fontWeight: 700, color: T.gold }}>{oPct}%</span>
                <span style={{ fontWeight: 700, color: T.info }}>{pPct}%</span>
            </div>
        </div>
    )
}

/* ── SidebarCard ──────────────────────────────────────────────── */

function SidebarCard({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div style={{
            background: T.surface, border: `1px solid ${T.border}`,
            borderRadius: T.radius.lg, padding: 14,
            boxShadow: T.shadowXs,
        }}>
            <p style={{
                fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase',
                color: T.textDim, fontWeight: 700, margin: '0 0 10px',
            }}>
                {title}
            </p>
            {children}
        </div>
    )
}

/* ── ActionButton ─────────────────────────────────────────────── */

function ActionButton({
    label,
    color,
    bg,
    icon,
    loading,
    disabled,
    onClick,
}: {
    label: string
    color: string
    bg: string
    icon: React.ReactNode
    loading: boolean
    disabled: boolean
    onClick: () => void
}) {
    return (
        <button onClick={onClick} disabled={disabled} className="pc-action"
            style={{
                width: '100%', padding: '8px 12px', borderRadius: T.radius.md,
                border: `1px solid ${color}30`, background: bg,
                color, fontSize: 12, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                transition: `all ${T.transition.fast}`,
                opacity: disabled && !loading ? 0.5 : 1,
            }}>
            {loading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : icon}
            {label}
        </button>
    )
}

/* ── TimelineItem ─────────────────────────────────────────────── */

function TimelineItem({ label, date, icon }: { label: string; date: string | null; icon: React.ReactNode }) {
    const hasDate = !!date
    return (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <div style={{
                width: 24, height: 24, borderRadius: T.radius.full,
                background: hasDate ? T.accentBg : T.subtle,
                border: `1px solid ${hasDate ? T.borderGold : T.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: hasDate ? T.gold : T.textDim, flexShrink: 0,
            }}>
                {icon}
            </div>
            <div>
                <p style={{ fontSize: 12, color: T.text, margin: 0, fontWeight: 500 }}>{label}</p>
                <p style={{ fontSize: 11, color: T.textDim, margin: '2px 0 0' }}>
                    {hasDate ? fmtDateTime(date) : 'Pendente'}
                </p>
            </div>
        </div>
    )
}
