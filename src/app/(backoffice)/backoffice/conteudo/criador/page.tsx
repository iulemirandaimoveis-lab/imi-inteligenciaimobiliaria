'use client'

import { useState, useEffect } from 'react'
import {
    Sparkles, Building2, Instagram, Linkedin, Mail,
    ChevronDown, Copy, Check, Calendar,
    Loader2, Wand2, Bot, ImageIcon,
    Hash, MessageSquare
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

const T = {
    surface: 'var(--bo-surface)',
    elevated: 'var(--bo-elevated)',
    border: 'var(--bo-border)',
    text: 'var(--bo-text)',
    textMuted: 'var(--bo-text-muted)',
    hover: 'var(--bo-hover)',
}

const TEMAS = [
    { value: 'lancamento-luxo', label: 'Destaque de Lançamento de Luxo' },
    { value: 'investimento', label: 'Oportunidade de Investimento' },
    { value: 'bairro', label: 'Guia de Bairro em Recife' },
    { value: 'mercado', label: 'Análise de Mercado Imobiliário' },
    { value: 'dicas', label: 'Dicas para Compradores' },
    { value: 'construtora', label: 'Destaque de Construtora' },
    { value: 'airbnb', label: 'Potencial Airbnb / Temporada' },
]

const CANAIS = [
    { value: 'instagram', label: 'Instagram', icon: Instagram, color: '#E1306C', bg: 'rgba(225,48,108,0.12)' },
    { value: 'linkedin', label: 'LinkedIn', icon: Linkedin, color: '#0A66C2', bg: 'rgba(10,102,194,0.12)' },
    { value: 'newsletter', label: 'Newsletter', icon: Mail, color: '#6366F1', bg: 'rgba(99,102,241,0.12)' },
]

const OUTPUT_TABS = [
    { key: 'legenda', label: 'Legenda' },
    { key: 'reels', label: 'Script Reels' },
    { key: 'prompt', label: 'Image Prompt IA' },
]

function getUpcomingDays() {
    const days = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB']
    const today = new Date()
    return Array.from({ length: 5 }, (_, i) => {
        const d = new Date(today)
        d.setDate(today.getDate() + i)
        return { day: i === 0 ? 'HOJE' : days[d.getDay()], num: d.getDate() }
    })
}

export default function CriadorIAPage() {
    const [tema, setTema] = useState(TEMAS[0])
    const [showTemaDropdown, setShowTemaDropdown] = useState(false)
    const [developments, setDevelopments] = useState<any[]>([])
    const [selectedDev, setSelectedDev] = useState<any>(null)
    const [showDevDropdown, setShowDevDropdown] = useState(false)
    const [activeCanal, setActiveCanal] = useState(CANAIS[0])
    const [outputTab, setOutputTab] = useState<'legenda' | 'reels' | 'prompt'>('legenda')
    const [generating, setGenerating] = useState(false)
    const [output, setOutput] = useState<{ legenda: string; reels: string; prompt: string } | null>(null)
    const [copied, setCopied] = useState<string | null>(null)
    const UPCOMING = getUpcomingDays()

    useEffect(() => {
        const supabase = createClient()
        supabase.from('developments').select('id, name, slug, price_min, neighborhood').order('name').then(({ data }) => {
            setDevelopments(data || [])
            if (data && data.length > 0) setSelectedDev(data[0])
        })
    }, [])

    const handleGenerate = async () => {
        if (!selectedDev) { toast.error('Selecione um imóvel'); return }
        setGenerating(true)
        try {
            const res = await fetch('/api/claude/generate-social-content', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tema: tema.label,
                    canal: activeCanal.value,
                    development: {
                        name: selectedDev.name,
                        price_min: selectedDev.price_min,
                        neighborhood: selectedDev.neighborhood,
                    },
                }),
            })
            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || 'Erro ao gerar')
            }
            const data = await res.json()
            setOutput({ legenda: data.legenda, reels: data.reels, prompt: data.prompt })
            setOutputTab('legenda')
            toast.success('Conteúdo gerado com IA IMI!')
        } catch (e: any) {
            toast.error('Erro ao gerar: ' + e.message)
        } finally {
            setGenerating(false)
        }
    }

    const copyText = (text: string, key: string) => {
        navigator.clipboard.writeText(text)
        setCopied(key)
        toast.success('Copiado!')
        setTimeout(() => setCopied(null), 2000)
    }

    const currentOutputText = output
        ? outputTab === 'legenda' ? output.legenda
            : outputTab === 'reels' ? output.reels
                : output.prompt
        : null

    return (
        <div style={{ maxWidth: 540, margin: '0 auto', paddingBottom: 48 }}>

            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 2 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Bot size={20} style={{ color: '#fff' }} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: 22, fontWeight: 800, color: T.text, letterSpacing: '-0.3px', lineHeight: 1 }}>Criador IA</h1>
                        <p style={{ fontSize: 10, color: T.textMuted, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Engine de Inteligência Imobiliária</p>
                    </div>
                </div>
            </motion.div>

            {/* Step stepper pills */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
                {['Tema', 'Imóvel', 'Canal'].map((s, i) => (
                    <div key={s} style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '6px 14px', borderRadius: 20,
                        background: i === 0 ? 'rgba(99,102,241,0.15)' : T.elevated,
                        border: `1px solid ${i === 0 ? 'rgba(99,102,241,0.4)' : T.border}`,
                    }}>
                        <div style={{ width: 18, height: 18, borderRadius: '50%', background: i === 0 ? '#6366F1' : T.border, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontSize: 9, fontWeight: 800, color: i === 0 ? '#fff' : T.textMuted }}>{i + 1}</span>
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: i === 0 ? '#6366F1' : T.textMuted }}>{s}</span>
                    </div>
                ))}
            </motion.div>

            {/* TEMA DROPDOWN */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ marginBottom: 14 }}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', color: T.textMuted, textTransform: 'uppercase', marginBottom: 6 }}>
                    Definir Tema do Conteúdo
                </p>
                <div style={{ position: 'relative' }}>
                    <button
                        onClick={() => setShowTemaDropdown(!showTemaDropdown)}
                        style={{
                            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                            padding: '13px 16px', borderRadius: 14,
                            background: T.elevated, border: `1px solid ${T.border}`,
                            cursor: 'pointer',
                        }}
                    >
                        <span style={{ flex: 1, textAlign: 'left', fontSize: 13, fontWeight: 600, color: T.text }}>{tema.label}</span>
                        <ChevronDown size={16} style={{ color: T.textMuted, flexShrink: 0 }} />
                    </button>
                    <AnimatePresence>
                        {showTemaDropdown && (
                            <motion.div
                                initial={{ opacity: 0, y: -6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -6 }}
                                style={{
                                    position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
                                    background: T.surface, border: `1px solid ${T.border}`,
                                    borderRadius: 14, padding: 6, zIndex: 50,
                                    boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
                                }}
                            >
                                {TEMAS.map(t => (
                                    <button
                                        key={t.value}
                                        onClick={() => { setTema(t); setShowTemaDropdown(false) }}
                                        style={{
                                            width: '100%', textAlign: 'left', padding: '10px 12px', borderRadius: 8,
                                            background: tema.value === t.value ? 'rgba(99,102,241,0.1)' : 'transparent',
                                            border: 'none', cursor: 'pointer',
                                            fontSize: 13, fontWeight: tema.value === t.value ? 600 : 400,
                                            color: tema.value === t.value ? '#6366F1' : T.text,
                                        }}
                                    >
                                        {t.label}
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>

            {/* SELECIONAR PROPRIEDADE */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.13 }} style={{ marginBottom: 14 }}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', color: T.textMuted, textTransform: 'uppercase', marginBottom: 6 }}>
                    Selecionar Propriedade
                </p>
                <div style={{ position: 'relative' }}>
                    <button
                        onClick={() => setShowDevDropdown(!showDevDropdown)}
                        style={{
                            width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                            padding: '12px 14px', borderRadius: 14,
                            background: T.elevated, border: `1px solid ${T.border}`,
                            cursor: 'pointer',
                        }}
                    >
                        <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(99,102,241,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Building2 size={16} style={{ color: '#6366F1' }} />
                        </div>
                        <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
                            <p style={{ fontSize: 13, fontWeight: 700, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {selectedDev ? selectedDev.name : 'Selecionar...'}
                            </p>
                            {selectedDev?.price_min && (
                                <p style={{ fontSize: 10, color: T.textMuted }}>
                                    R$ {Number(selectedDev.price_min).toLocaleString('pt-BR')}
                                </p>
                            )}
                        </div>
                        <ChevronDown size={15} style={{ color: T.textMuted, flexShrink: 0 }} />
                    </button>
                    <AnimatePresence>
                        {showDevDropdown && (
                            <motion.div
                                initial={{ opacity: 0, y: -6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -6 }}
                                style={{
                                    position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
                                    background: T.surface, border: `1px solid ${T.border}`,
                                    borderRadius: 14, padding: 6, zIndex: 50,
                                    boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
                                    maxHeight: 220, overflowY: 'auto',
                                }}
                            >
                                {developments.map(dev => (
                                    <button
                                        key={dev.id}
                                        onClick={() => { setSelectedDev(dev); setShowDevDropdown(false) }}
                                        style={{
                                            width: '100%', textAlign: 'left', padding: '10px 12px', borderRadius: 8,
                                            background: selectedDev?.id === dev.id ? 'rgba(99,102,241,0.1)' : 'transparent',
                                            border: 'none', cursor: 'pointer',
                                            fontSize: 13, fontWeight: 500, color: T.text,
                                        }}
                                    >
                                        {dev.name}
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>

            {/* CANAIS */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }} style={{ marginBottom: 22 }}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', color: T.textMuted, textTransform: 'uppercase', marginBottom: 8 }}>
                    Canais de Destino
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                    {CANAIS.map(canal => {
                        const isActive = activeCanal.value === canal.value
                        const Icon = canal.icon
                        return (
                            <button
                                key={canal.value}
                                onClick={() => setActiveCanal(canal)}
                                style={{
                                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                                    height: 44, borderRadius: 12,
                                    background: isActive ? canal.bg : T.elevated,
                                    border: `1.5px solid ${isActive ? canal.color : T.border}`,
                                    cursor: 'pointer', transition: 'all 0.15s',
                                }}
                            >
                                <Icon size={16} style={{ color: isActive ? canal.color : T.textMuted }} />
                                <span style={{ fontSize: 12, fontWeight: 700, color: isActive ? canal.color : T.textMuted }}>{canal.label}</span>
                            </button>
                        )
                    })}
                </div>
            </motion.div>

            {/* GENERATE BUTTON */}
            <motion.button
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                onClick={handleGenerate}
                disabled={generating}
                style={{
                    width: '100%', height: 52, borderRadius: 16,
                    background: generating ? 'rgba(99,102,241,0.5)' : 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                    color: '#fff', fontSize: 15, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    border: 'none', cursor: generating ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 20px rgba(99,102,241,0.3)',
                    marginBottom: 28, transition: 'all 0.15s',
                }}
            >
                {generating ? <Loader2 size={20} className="animate-spin" /> : <Wand2 size={20} />}
                {generating ? 'Gerando conteúdo...' : '✦ Gerar com IA IMI'}
            </motion.button>

            {/* OUTPUT SECTION */}
            <AnimatePresence>
                {(output || generating) && (
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                            <p style={{ fontSize: 13, fontWeight: 800, color: T.text }}>Output Sugerido</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 8, background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)' }}>
                                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#6366F1', animation: 'pulse 2s infinite' }} />
                                <span style={{ fontSize: 9, fontWeight: 700, color: '#6366F1', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Gerado Agora</span>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div style={{ display: 'flex', gap: 4, marginBottom: 14, background: T.elevated, borderRadius: 12, padding: 4 }}>
                            {OUTPUT_TABS.map(tab => (
                                <button
                                    key={tab.key}
                                    onClick={() => setOutputTab(tab.key as any)}
                                    style={{
                                        flex: 1, height: 34, borderRadius: 10, fontSize: 11, fontWeight: 700,
                                        background: outputTab === tab.key ? T.surface : 'transparent',
                                        border: outputTab === tab.key ? `1px solid ${T.border}` : '1px solid transparent',
                                        color: outputTab === tab.key ? T.text : T.textMuted,
                                        cursor: 'pointer', transition: 'all 0.15s',
                                    }}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Content card */}
                        <div style={{ borderRadius: 18, background: 'linear-gradient(145deg, #1a2230, #111827)', border: '1px solid rgba(255,255,255,0.07)', padding: 20, marginBottom: 14, minHeight: 180 }}>
                            {generating ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, minHeight: 160 }}>
                                    <Loader2 size={28} className="animate-spin" style={{ color: '#6366F1' }} />
                                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>Gerando conteúdo com IA...</p>
                                </div>
                            ) : currentOutputText ? (
                                <>
                                    {outputTab === 'prompt' && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                                            <ImageIcon size={14} style={{ color: '#6366F1' }} />
                                            <span style={{ fontSize: 10, fontWeight: 700, color: '#6366F1', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Image Prompt IA</span>
                                        </div>
                                    )}
                                    {outputTab === 'legenda' && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                                            <Hash size={14} style={{ color: activeCanal.color }} />
                                            <span style={{ fontSize: 10, fontWeight: 700, color: activeCanal.color, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Legenda {activeCanal.label}</span>
                                        </div>
                                    )}
                                    {outputTab === 'reels' && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                                            <MessageSquare size={14} style={{ color: '#F59E0B' }} />
                                            <span style={{ fontSize: 10, fontWeight: 700, color: '#F59E0B', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Script Reels</span>
                                        </div>
                                    )}
                                    <p style={{ fontSize: 13, lineHeight: 1.7, color: 'rgba(255,255,255,0.85)', whiteSpace: 'pre-wrap', fontWeight: 400 }}>
                                        {currentOutputText}
                                    </p>
                                </>
                            ) : null}
                        </div>

                        {/* Actions */}
                        {output && !generating && (
                            <div style={{ display: 'flex', gap: 10, marginBottom: 28 }}>
                                <button
                                    onClick={() => currentOutputText && copyText(currentOutputText, outputTab)}
                                    style={{
                                        flex: 1, height: 46, borderRadius: 12, fontSize: 13, fontWeight: 700,
                                        background: T.elevated, border: `1px solid ${T.border}`,
                                        color: T.text, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                    }}
                                >
                                    {copied === outputTab ? <Check size={16} style={{ color: '#4ade80' }} /> : <Copy size={16} />}
                                    {copied === outputTab ? 'Copiado!' : 'Ajustar'}
                                </button>
                                <button
                                    style={{
                                        flex: 1, height: 46, borderRadius: 12, fontSize: 13, fontWeight: 700,
                                        background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                                        color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                        border: 'none', boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
                                    }}
                                    onClick={() => toast.success('Agendado para publicação!')}
                                >
                                    <Calendar size={16} />
                                    Agendar
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* UPCOMING POSTS */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                        Próximos Posts
                    </p>
                    <button style={{ fontSize: 11, fontWeight: 700, color: '#6366F1', background: 'none', border: 'none', cursor: 'pointer' }}>
                        Ver Calendário
                    </button>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    {UPCOMING.map((d, i) => (
                        <div
                            key={d.num}
                            style={{
                                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                                padding: '14px 6px', borderRadius: 16,
                                background: i === 0 ? 'rgba(99,102,241,0.12)' : T.elevated,
                                border: `1px solid ${i === 0 ? 'rgba(99,102,241,0.35)' : T.border}`,
                            }}
                        >
                            <span style={{ fontSize: 9, fontWeight: 700, color: i === 0 ? '#6366F1' : T.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                {d.day}
                            </span>
                            <span style={{ fontSize: 20, fontWeight: 800, color: i === 0 ? '#6366F1' : T.text }}>
                                {d.num}
                            </span>
                            {i < 3 && (
                                <div style={{ width: 5, height: 5, borderRadius: '50%', background: i === 0 ? '#6366F1' : 'rgba(255,255,255,0.2)' }} />
                            )}
                        </div>
                    ))}
                </div>
            </motion.div>
        </div>
    )
}
