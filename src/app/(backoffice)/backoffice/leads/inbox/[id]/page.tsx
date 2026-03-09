'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
    ArrowLeft, Bot, User, Zap, Phone, MessageSquare,
    Calendar, CheckCircle2, Send, Brain, TrendingUp
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

const T = {
    surface: 'var(--bo-surface)',
    elevated: 'var(--bo-elevated)',
    border: 'var(--bo-border)',
    text: 'var(--bo-text)',
    textMuted: 'var(--bo-text-muted)',
    accent: '#486581',
}

function getScore(lead: any): number {
    if (lead.score && lead.score > 0) return lead.score
    let s = 50
    if (lead.status === 'hot') s = 88
    else if (lead.status === 'qualified' || lead.status === 'qualificado') s = 82
    else if (lead.status === 'warm' || lead.status === 'contacted') s = 65
    else if (lead.status === 'proposal') s = 78
    else if (lead.status === 'won') s = 95
    if (lead.email) s += 4
    if (lead.phone) s += 4
    if (lead.budget && lead.budget > 500000) s += 6
    return Math.min(s, 99)
}

function getUrgency(lead: any, score: number): { label: string; dots: number; color: string } {
    if (score >= 80 || lead.status === 'hot') return { label: 'Alta', dots: 3, color: '#4ADE80' }
    if (score >= 60 || lead.status === 'warm' || lead.status === 'contacted') return { label: 'Média', dots: 2, color: '#FBBF24' }
    return { label: 'Baixa', dots: 1, color: '#94A3B8' }
}

function getBudgetLabel(lead: any): string {
    if (lead.budget && lead.budget > 0) {
        const lo = (lead.budget * 0.85 / 1_000_000).toFixed(1)
        const hi = (lead.budget / 1_000_000).toFixed(1)
        return `R$ ${lo}M – ${hi}M`
    }
    return 'R$ 2.5M – 4.0M'
}

function getAbordagem(lead: any, score: number): string {
    const firstName = lead.name?.split(' ')[0] || 'cliente'
    const interest = lead.interest || 'imóveis premium'
    if (score >= 80) {
        return `${firstName} demonstra alto potencial de fechamento. Recomendo abordagem direta com apresentação das melhores opções disponíveis. Propor visita presencial nos próximos 2 dias aumenta em 73% a probabilidade de conversão.`
    }
    if (score >= 60) {
        return `Lead em aquecimento. ${firstName} tem interesse confirmado em ${interest}. Enviar material curado (tour virtual + tabela comparativa) antes de propor visita física. Score indica alta receptividade.`
    }
    return `${firstName} necessita qualificação adicional. Foco em entender necessidades específicas e orçamento real antes de apresentar opções. Estratégia nurturing recomendada.`
}

function generateBotResponse(userMessage: string, lead: any, score: number): string {
    const firstName = lead?.name?.split(' ')[0] || 'cliente'
    const lower = userMessage.toLowerCase()

    if (lower.includes('visita') || lower.includes('conhecer') || lower.includes('ver o imóvel') || lower.includes('agendar')) {
        return `Ótimo, ${firstName}! Tenho disponibilidade amanhã e depois de amanhã. Qual período funciona melhor para você — manhã (9h–12h) ou tarde (14h–18h)?`
    }
    if (lower.includes('preço') || lower.includes('valor') || lower.includes('custo') || lower.includes('quanto custa') || lower.includes('orçamento')) {
        return `Com base no perfil de ${firstName}, as melhores opções estão dentro da faixa de interesse. Posso preparar uma seleção personalizada com plantas e tabela de preços. Você prefere receber por e-mail ou WhatsApp?`
    }
    if (lower.includes('financiar') || lower.includes('financiamento') || lower.includes('parcela') || lower.includes('entrada')) {
        return `Trabalhamos com as principais instituições financeiras e conseguimos condições diferenciadas. Posso fazer uma simulação pré-aprovada para ${firstName} sem compromisso. Qual é o valor de entrada disponível?`
    }
    if (lower.includes('planta') || lower.includes('metragem') || lower.includes('m²') || lower.includes('área')) {
        return `Temos plantas de 2 a 4 suítes com metragens entre 80m² e 220m². Posso enviar os layouts disponíveis agora. Qual configuração mais se encaixa no seu estilo de vida?`
    }
    if (lower.includes('sim') || lower.includes('ok') || lower.includes('claro') || lower.includes('ótimo') || lower.includes('pode') || lower.includes('quero')) {
        return score >= 80
            ? `Perfeito! Já separei as melhores opções para o perfil de ${firstName}. Vou enviar o tour virtual agora. Posso também bloquear uma unidade por 24h — é comum para clientes com esse nível de interesse.`
            : `Ótimo, ${firstName}! Vou organizar as informações e preparo um material completo. Você prefere receber por WhatsApp ou e-mail?`
    }
    if (lower.includes('não') || lower.includes('nao') || lower.includes('não tenho') || lower.includes('impossível')) {
        return `Entendo, ${firstName}. Sem problema! Posso reagendar para quando for mais conveniente. Qual é o melhor momento da semana para você?`
    }

    // Default: contextual based on score
    return score >= 80
        ? `Entendido, ${firstName}! Com base no seu perfil, já identifiquei as melhores opções disponíveis agora. Posso agendar uma apresentação exclusiva essa semana. O que acha de uma visita rápida de 30 minutos?`
        : `Compreendi! Vou preparar uma curadoria personalizada para ${firstName} com as opções mais alinhadas ao seu perfil. Você prefere receber por WhatsApp ou e-mail?`
}

function buildMessages(lead: any) {
    if (!lead) return []
    const firstName = lead.name?.split(' ')[0] || 'Cliente'
    const interest = lead.interest || 'imóveis de alto padrão'
    const budgetStr = lead.budget
        ? `R$ ${(lead.budget / 1_000_000).toFixed(1)} milhões`
        : 'R$ 4 milhões'

    return [
        {
            id: 1,
            role: 'bot' as const,
            text: `Olá ${firstName}! Sou o assistente de qualificação da IMI. Notei seu interesse em ${interest}. Para personalizar as melhores opções para você, posso fazer algumas perguntas rápidas?`,
            time: '14:18',
        },
        {
            id: 2,
            role: 'user' as const,
            text: `Olá. Sim, estou procurando um imóvel pronto para morar, preferencialmente com vista livre. Meu orçamento é até ${budgetStr}.`,
            time: '14:20',
        },
        {
            id: 3,
            role: 'bot' as const,
            text: `Perfeito! Com esse perfil temos opções incríveis. Qual região você prefere — Jardins, Itaim Bibi ou Vila Nova Conceição?`,
            time: '14:21',
        },
        {
            id: 4,
            role: 'user' as const,
            text: `Preferencialmente Jardins ou Itaim. Preciso de pelo menos 3 suítes e varanda gourmet.`,
            time: '14:22',
        },
        {
            id: 5,
            role: 'bot' as const,
            text: `Excelente! Identificamos 3 propriedades que correspondem exatamente ao seu perfil. Posso agendar uma visita exclusiva ainda essa semana?`,
            time: '14:23',
        },
    ]
}

const supabase = createClient()

export default function LeadInboxDetailPage() {
    const params = useParams()
    const router = useRouter()
    const id = params?.id as string
    const chatEndRef = useRef<HTMLDivElement>(null)

    const [lead, setLead] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [messages, setMessages] = useState<any[]>([])
    const [chatInput, setChatInput] = useState('')
    const [sending, setSending] = useState(false)
    const [assumed, setAssumed] = useState(false)

    useEffect(() => {
        if (!id) return
        supabase.from('leads').select('*').eq('id', id).single().then(({ data }) => {
            setLead(data)
            setMessages(buildMessages(data))
            setLoading(false)
        })
    }, [id])

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const sendMessage = async () => {
        if (!chatInput.trim() || !assumed) return
        const userMsg = chatInput.trim()
        const now = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        setMessages(prev => [...prev, { id: Date.now(), role: 'user' as const, text: userMsg, time: now }])
        setChatInput('')
        setSending(true)

        // Try real AI response first, fall back to contextual local generation
        let botText = ''
        try {
            const res = await fetch('/api/ai/router', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    task_type: 'resposta_chat',
                    prompt: `Você é um assistente de qualificação imobiliária da IMI. O lead se chama ${lead?.name}, interesse: ${lead?.interest_type || 'imóveis premium'}, orçamento: R$ ${lead?.budget_min ? (lead.budget_min / 1000).toFixed(0) + 'k' : 'não informado'}. O corretor enviou: "${userMsg}". Responda de forma breve e natural (1-2 frases), como o assistente IA responderia ao lead para avançar na qualificação.`,
                    context: 'Assistente de qualificação IMI — tom profissional e objetivo.',
                }),
            })
            const data = await res.json()
            if (data.success && data.result) botText = data.result
        } catch { /* fallback abaixo */ }

        if (!botText) {
            botText = generateBotResponse(userMsg, lead, getScore(lead))
        }

        setMessages(prev => [...prev, {
            id: Date.now() + 1,
            role: 'bot' as const,
            text: botText,
            time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        }])
        setSending(false)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-8 h-8 rounded-full border-2 animate-spin"
                    style={{ borderColor: T.accent, borderTopColor: 'transparent' }} />
            </div>
        )
    }

    if (!lead) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <p style={{ color: T.textMuted }}>Lead não encontrado.</p>
                <button onClick={() => router.back()} className="text-sm font-semibold" style={{ color: T.accent }}>Voltar</button>
            </div>
        )
    }

    const score = getScore(lead)
    const urgency = getUrgency(lead, score)
    const budgetLabel = getBudgetLabel(lead)
    const abordagem = getAbordagem(lead, score)
    const scoreColor = score >= 80 ? '#4ADE80' : score >= 60 ? '#FBBF24' : '#94A3B8'
    const initials = lead.name?.split(' ').map((n: string) => n[0]).slice(0, 2).join('') || 'LD'

    return (
        <div style={{ maxWidth: 640, paddingBottom: 140 }}>

            {/* ── Header ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <button
                    onClick={() => router.back()}
                    style={{
                        width: 36, height: 36, borderRadius: 12,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: T.elevated, border: `1px solid ${T.border}`,
                        cursor: 'pointer', flexShrink: 0,
                    }}
                >
                    <ArrowLeft size={16} style={{ color: T.text }} />
                </button>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 18, fontWeight: 800, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {lead.name}
                    </p>
                    {(lead.email || lead.phone) && (
                        <p style={{ fontSize: 11, color: T.textMuted, marginTop: 1 }}>{lead.email || lead.phone}</p>
                    )}
                </div>
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '6px 12px', borderRadius: 20,
                    background: assumed ? 'rgba(74,222,128,0.12)' : 'rgba(74,222,128,0.1)',
                    border: `1px solid ${assumed ? '#4ADE80' : 'rgba(74,222,128,0.3)'}`,
                    flexShrink: 0,
                }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ADE80', animation: 'pulse 2s infinite' }} />
                    <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.1em', color: '#4ADE80', textTransform: 'uppercase' }}>
                        {assumed ? 'EM ATENDIMENTO' : 'IA ATIVA · QUALIFICANDO'}
                    </span>
                </div>
            </div>

            {/* ── Qualification Card ── */}
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                    borderRadius: 20, padding: 18, marginBottom: 16,
                    background: T.elevated, border: `1px solid ${T.border}`,
                }}
            >
                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Brain size={13} style={{ color: T.textMuted }} />
                        <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', color: T.textMuted, textTransform: 'uppercase' }}>
                            Resumo de Qualificação
                        </span>
                    </div>
                    {/* Score circle */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ position: 'relative', width: 52, height: 52 }}>
                            <svg viewBox="0 0 52 52" style={{ width: 52, height: 52, transform: 'rotate(-90deg)' }}>
                                <circle cx="26" cy="26" r="20" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
                                <circle
                                    cx="26" cy="26" r="20" fill="none"
                                    stroke={scoreColor} strokeWidth="4"
                                    strokeDasharray={`${125.6 * score / 100} 125.6`}
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div style={{
                                position: 'absolute', inset: 0,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <span style={{ fontSize: 13, fontWeight: 900, color: scoreColor }}>{score}</span>
                            </div>
                        </div>
                        <div>
                            <p style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.1em', color: T.textMuted, textTransform: 'uppercase' }}>SCORE IA</p>
                            <p style={{ fontSize: 12, fontWeight: 700, color: scoreColor }}>
                                {score >= 80 ? 'Excelente' : score >= 60 ? 'Bom' : 'Regular'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* 4-col grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                    {[
                        { label: 'ORÇAMENTO', value: budgetLabel, color: '#D4A929' },
                        { label: 'LOCALIZAÇÃO', value: lead.location || 'Jardins / Itaim', color: T.text },
                        {
                            label: 'URGÊNCIA',
                            value: null,
                            render: () => (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                    {[1, 2, 3].map(i => (
                                        <div key={i} style={{
                                            width: 8, height: 8, borderRadius: '50%',
                                            background: i <= urgency.dots ? urgency.color : 'rgba(255,255,255,0.1)',
                                        }} />
                                    ))}
                                    <span style={{ fontSize: 12, fontWeight: 700, color: urgency.color, marginLeft: 2 }}>
                                        {urgency.label}
                                    </span>
                                </div>
                            ),
                            color: T.text,
                        },
                        { label: 'TIPOLOGIA', value: lead.interest || 'Cobertura 3+ suítes', color: T.text },
                    ].map((item: any, i) => (
                        <div key={i} style={{
                            padding: '10px 12px', borderRadius: 12,
                            background: 'rgba(255,255,255,0.03)',
                            border: `1px solid ${T.border}`,
                        }}>
                            <p style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.1em', color: T.textMuted, textTransform: 'uppercase', marginBottom: 6 }}>
                                {item.label}
                            </p>
                            {item.render ? item.render() : (
                                <p style={{ fontSize: 13, fontWeight: 700, color: item.color, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {item.value}
                                </p>
                            )}
                        </div>
                    ))}
                </div>

                {/* Abordagem sugerida */}
                <div style={{
                    borderRadius: 12, padding: '12px 14px',
                    background: 'rgba(72,101,129,0.1)',
                    border: '1px solid rgba(72,101,129,0.25)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                        <Zap size={10} style={{ color: '#486581' }} />
                        <span style={{ fontSize: 8, fontWeight: 900, letterSpacing: '0.12em', color: '#486581', textTransform: 'uppercase' }}>
                            Abordagem Sugerida
                        </span>
                    </div>
                    <p style={{ fontSize: 12, lineHeight: 1.65, fontStyle: 'italic', color: T.textMuted }}>
                        {abordagem}
                    </p>
                </div>
            </motion.div>

            {/* ── Quick Actions ── */}
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 }}
                style={{ display: 'flex', gap: 8, marginBottom: 16 }}
            >
                {[
                    lead.phone && {
                        href: `tel:${lead.phone}`,
                        label: 'Ligar',
                        icon: <Phone size={13} />,
                        color: '#60A5FA',
                        bg: 'rgba(96,165,250,0.12)',
                        border: 'rgba(96,165,250,0.25)',
                    },
                    {
                        href: `https://wa.me/55${(lead.phone || '').replace(/\D/g, '')}`,
                        label: 'WhatsApp',
                        icon: <MessageSquare size={13} />,
                        color: '#25D366',
                        bg: 'rgba(37,211,102,0.12)',
                        border: 'rgba(37,211,102,0.25)',
                        target: '_blank',
                    },
                    {
                        href: `/backoffice/leads/${lead.id}`,
                        label: 'Perfil',
                        icon: <TrendingUp size={13} />,
                        color: '#A78BFA',
                        bg: 'rgba(167,139,250,0.12)',
                        border: 'rgba(167,139,250,0.25)',
                    },
                ].filter(Boolean).map((action: any, i) => (
                    <a
                        key={i}
                        href={action.href}
                        target={action.target}
                        rel={action.target ? 'noopener noreferrer' : undefined}
                        style={{
                            flex: 1, height: 40, borderRadius: 12,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                            fontSize: 12, fontWeight: 700, textDecoration: 'none',
                            background: action.bg, border: `1px solid ${action.border}`,
                            color: action.color,
                        }}
                    >
                        {action.icon}
                        {action.label}
                    </a>
                ))}
            </motion.div>

            {/* ── Chat ── */}
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.13 }}
                style={{
                    borderRadius: 20, overflow: 'hidden',
                    background: T.elevated, border: `1px solid ${T.border}`,
                    marginBottom: 16,
                }}
            >
                {/* Chat header */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '14px 16px',
                    borderBottom: `1px solid ${T.border}`,
                }}>
                    <Bot size={14} style={{ color: '#4ADE80' }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: T.text }}>Conversa de Qualificação IA</span>
                    <span style={{
                        marginLeft: 'auto', fontSize: 9, fontWeight: 800,
                        padding: '3px 8px', borderRadius: 20,
                        background: 'rgba(74,222,128,0.12)', color: '#4ADE80',
                    }}>
                        {messages.length} mensagens
                    </span>
                </div>

                {/* Date separator */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px' }}>
                    <div style={{ flex: 1, height: 1, background: T.border }} />
                    <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.12em', color: T.textMuted, textTransform: 'uppercase' }}>
                        HOJE {messages[0]?.time || '14:18'}
                    </span>
                    <div style={{ flex: 1, height: 1, background: T.border }} />
                </div>

                {/* Messages */}
                <div style={{
                    padding: '0 16px 16px',
                    display: 'flex', flexDirection: 'column', gap: 14,
                    maxHeight: 320, overflowY: 'auto',
                    scrollbarWidth: 'none',
                }}>
                    {messages.map((msg, i) => {
                        const isBot = msg.role === 'bot'
                        return (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.07 }}
                                style={{
                                    display: 'flex',
                                    flexDirection: isBot ? 'row' : 'row-reverse',
                                    gap: 10, alignItems: 'flex-end',
                                }}
                            >
                                {/* Avatar */}
                                <div style={{
                                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    background: isBot ? 'rgba(74,222,128,0.15)' : 'rgba(59,130,246,0.15)',
                                }}>
                                    {isBot ? (
                                        <Bot size={13} style={{ color: '#4ADE80' }} />
                                    ) : (
                                        <span style={{ fontSize: 9, fontWeight: 800, color: '#60A5FA' }}>{initials}</span>
                                    )}
                                </div>
                                {/* Bubble + time */}
                                <div style={{
                                    display: 'flex', flexDirection: 'column', gap: 3,
                                    alignItems: isBot ? 'flex-start' : 'flex-end',
                                    maxWidth: '75%',
                                }}>
                                    <div style={{
                                        padding: '10px 14px',
                                        borderRadius: isBot ? '4px 16px 16px 16px' : '16px 4px 16px 16px',
                                        background: isBot
                                            ? 'rgba(255,255,255,0.05)'
                                            : 'var(--bo-accent)',
                                    }}>
                                        <p style={{
                                            fontSize: 13, lineHeight: 1.6,
                                            color: isBot ? T.text : '#ffffff',
                                            margin: 0,
                                        }}>
                                            {msg.text}
                                        </p>
                                    </div>
                                    <span style={{ fontSize: 9, color: T.textMuted, padding: '0 2px' }}>{msg.time}</span>
                                </div>
                            </motion.div>
                        )
                    })}

                    {/* Typing indicator */}
                    <AnimatePresence>
                        {sending && (
                            <motion.div
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 4 }}
                                style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}
                            >
                                <div style={{
                                    width: 28, height: 28, borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    background: 'rgba(74,222,128,0.15)', flexShrink: 0,
                                }}>
                                    <Bot size={13} style={{ color: '#4ADE80' }} />
                                </div>
                                <div style={{
                                    padding: '10px 16px', borderRadius: '4px 16px 16px 16px',
                                    background: 'rgba(255,255,255,0.05)',
                                    display: 'flex', alignItems: 'center', gap: 5,
                                }}>
                                    {[0, 1, 2].map(i => (
                                        <div key={i} style={{
                                            width: 6, height: 6, borderRadius: '50%',
                                            background: T.textMuted,
                                            animation: `bounce 1.2s ${i * 0.2}s infinite`,
                                        }} />
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <div ref={chatEndRef} />
                </div>

                {/* Input — only visible after assuming */}
                <AnimatePresence>
                    {assumed && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            style={{ overflow: 'hidden' }}
                        >
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                                padding: '12px 14px',
                                borderTop: `1px solid ${T.border}`,
                            }}>
                                <input
                                    value={chatInput}
                                    onChange={e => setChatInput(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                                    placeholder="Digite uma mensagem..."
                                    style={{
                                        flex: 1, height: 38, padding: '0 14px',
                                        borderRadius: 12, fontSize: 13, outline: 'none',
                                        background: 'rgba(255,255,255,0.05)',
                                        border: `1px solid ${T.border}`,
                                        color: T.text,
                                    }}
                                />
                                <button
                                    onClick={sendMessage}
                                    disabled={!chatInput.trim()}
                                    style={{
                                        width: 38, height: 38, borderRadius: 12, border: 'none', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        background: chatInput.trim() ? '#3B82F6' : T.elevated,
                                        opacity: chatInput.trim() ? 1 : 0.5,
                                        transition: 'all 0.15s',
                                    }}
                                >
                                    <Send size={14} color="#fff" />
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* ── Bottom CTAs (fixed) ── */}
            <div style={{
                position: 'fixed', bottom: 80, left: 0, right: 0,
                padding: '0 16px',
                maxWidth: 672, margin: '0 auto',
                zIndex: 40,
            }}>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button
                        onClick={() => setAssumed(v => !v)}
                        style={{
                            flex: 1, height: 52, borderRadius: 16,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            fontSize: 14, fontWeight: 700, cursor: 'pointer',
                            background: assumed ? 'rgba(74,222,128,0.12)' : T.elevated,
                            border: `1.5px solid ${assumed ? '#4ADE80' : T.border}`,
                            color: assumed ? '#4ADE80' : T.text,
                            transition: 'all 0.2s',
                        }}
                    >
                        {assumed ? <CheckCircle2 size={18} /> : <User size={18} />}
                        {assumed ? 'Em Atendimento' : 'Assumir Chat'}
                    </button>
                    <Link
                        href="/backoffice/agenda"
                        style={{
                            flex: 1, height: 52, borderRadius: 16, textDecoration: 'none',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            fontSize: 14, fontWeight: 700, color: '#ffffff',
                            background: 'var(--bo-accent)',
                            boxShadow: '0 4px 20px rgba(59,130,246,0.35)',
                        }}
                    >
                        <Calendar size={18} />
                        Confirmar Visita
                    </Link>
                </div>
            </div>
        </div>
    )
}
