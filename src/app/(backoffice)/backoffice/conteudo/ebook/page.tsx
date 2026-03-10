'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { T } from '@/app/(backoffice)/lib/theme'
import {
    BookOpen, Wand2, ImageIcon, Upload, Check, Loader2, ChevronRight,
    ChevronLeft, Sparkles, RefreshCw, Eye, Save, Plus, X, ArrowLeft,
    Palette, FileText, Target, Pen, Download, Globe,
} from 'lucide-react'

// ── Constants ─────────────────────────────────────────────────────────────────
const PILARES = ['Mercado', 'Investimento', 'Jurídico', 'Decoração', 'Financiamento', 'Luxo', 'Dubai', 'Internacional']
const TONS = [
    { value: 'Profissional', desc: 'Técnico, dados, autoridade' },
    { value: 'Educativo', desc: 'Didático, passo a passo' },
    { value: 'Premium', desc: 'Exclusivo, aspiracional' },
    { value: 'Conversacional', desc: 'Próximo, acessível' },
]
const ESTILOS_CAPA = [
    { value: 'premium', label: 'Premium', emoji: '✨', desc: 'Dark + dourado' },
    { value: 'moderno', label: 'Moderno', emoji: '⬛', desc: 'Geométrico bold' },
    { value: 'editorial', label: 'Editorial', emoji: '📰', desc: 'Magazine style' },
    { value: 'aquarela', label: 'Aquarela', emoji: '🎨', desc: 'Arte soft' },
    { value: 'foto', label: 'Fotográfico', emoji: '📸', desc: 'Aerial view' },
]
const STEPS = ['Configuração', 'Conteúdo', 'Capa', 'Publicar']

interface EbookConfig {
    titulo: string
    subtitulo: string
    pilar: string
    publico_alvo: string
    tom: string
    num_capitulos: number
    pontos_chave: string[]
    estilo_capa: string
}

const DEFAULT_CONFIG: EbookConfig = {
    titulo: '', subtitulo: '', pilar: 'Mercado',
    publico_alvo: 'Investidores imobiliários', tom: 'Profissional',
    num_capitulos: 5, pontos_chave: [], estilo_capa: 'premium',
}

// ── Step indicator ────────────────────────────────────────────────────────────
function StepBar({ current }: { current: number }) {
    return (
        <div className="flex items-center gap-2 mb-8">
            {STEPS.map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                        <motion.div
                            animate={{
                                background: i < current ? T.accent : i === current ? T.accent : T.hover,
                                scale: i === current ? 1.1 : 1,
                            }}
                            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                            style={{ color: i <= current ? '#0D0F14' : T.textMuted }}
                        >
                            {i < current ? <Check size={13} /> : i + 1}
                        </motion.div>
                        <span className="text-xs font-semibold hidden sm:block"
                            style={{ color: i === current ? T.text : T.textMuted }}>
                            {s}
                        </span>
                    </div>
                    {i < STEPS.length - 1 && (
                        <div className="w-8 h-px mx-1" style={{ background: i < current ? T.accent : T.border }} />
                    )}
                </div>
            ))}
        </div>
    )
}

// ── Chip ─────────────────────────────────────────────────────────────────────
function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
    return (
        <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={onClick}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all"
            style={active
                ? { background: `${T.accent}22`, borderColor: `${T.accent}55`, color: T.accent }
                : { background: T.hover, borderColor: T.border, color: T.textMuted }
            }
        >
            {label}
        </motion.button>
    )
}

export default function EbookPage() {
    const supabase = createClient()

    const [step, setStep] = useState(0)
    const [config, setConfig] = useState<EbookConfig>(DEFAULT_CONFIG)
    const [newPonto, setNewPonto] = useState('')
    const [conteudo, setConteudo] = useState('')
    const [writing, setWriting] = useState(false)
    const [writeProgress, setWriteProgress] = useState(0)
    const [capaUrl, setCapaUrl] = useState<string | null>(null)
    const [generating, setGenerating] = useState(false)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [previewMode, setPreviewMode] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [uploadedCapa, setUploadedCapa] = useState<File | null>(null)
    const fileRef = useRef<HTMLInputElement>(null)
    const editorRef = useRef<HTMLTextAreaElement>(null)
    const abortRef = useRef<AbortController | null>(null)

    const set = (k: keyof EbookConfig, v: unknown) => setConfig(prev => ({ ...prev, [k]: v }))

    const addPonto = () => {
        if (!newPonto.trim()) return
        set('pontos_chave', [...config.pontos_chave, newPonto.trim()])
        setNewPonto('')
    }

    // ── Step 2: Write with streaming ─────────────────────────────────────────
    const handleWrite = useCallback(async () => {
        setWriting(true)
        setConteudo('')
        setWriteProgress(0)
        setError(null)
        abortRef.current = new AbortController()

        try {
            const res = await fetch('/api/ai/write-ebook', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: abortRef.current.signal,
                body: JSON.stringify({ ...config, stream: true }),
            })

            if (!res.ok) {
                const text = await res.text()
                let msg = 'Erro na API'
                try { msg = JSON.parse(text).error || msg } catch { /* html page */ }
                throw new Error(msg)
            }

            const reader = res.body?.getReader()
            const decoder = new TextDecoder()
            let accumulated = ''

            while (reader) {
                const { done, value } = await reader.read()
                if (done) break
                const chunk = decoder.decode(value)
                const lines = chunk.split('\n')
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6)
                        if (data === '[DONE]') break
                        try {
                            const parsed = JSON.parse(data)
                            accumulated += parsed.text
                            setConteudo(accumulated)
                            // Fake progress: ~5000 words target
                            setWriteProgress(Math.min(99, Math.round((accumulated.length / 20000) * 100)))
                        } catch { /* skip malformed */ }
                    }
                }
            }
            setWriteProgress(100)
        } catch (err: any) {
            if (err.name !== 'AbortError') setError(err.message || 'Erro na geração')
        } finally {
            setWriting(false)
        }
    }, [config])

    // ── Step 3: Generate cover ────────────────────────────────────────────────
    const handleGenerateCover = useCallback(async () => {
        setGenerating(true)
        setError(null)
        try {
            const res = await fetch('/api/ai/generate-cover', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    titulo: config.titulo,
                    subtitulo: config.subtitulo,
                    pilar: config.pilar,
                    estilo: config.estilo_capa,
                }),
            })
            const data = await res.json()
            if (!res.ok || !data.url) throw new Error(data.error || 'Erro na geração da capa')
            setCapaUrl(data.url)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setGenerating(false)
        }
    }, [config])

    // ── Handle user-uploaded cover ────────────────────────────────────────────
    const handleUploadCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setUploadedCapa(file)
        setCapaUrl(URL.createObjectURL(file))
    }

    // ── Step 4: Save to DB ────────────────────────────────────────────────────
    const handleSave = async () => {
        setSaving(true)
        setError(null)
        try {
            let coverUrl = capaUrl

            // Upload user-provided cover to Supabase Storage
            if (uploadedCapa && capaUrl?.startsWith('blob:')) {
                const ext = uploadedCapa.name.split('.').pop()
                const path = `ebooks/covers/${Date.now()}.${ext}`
                const { error: uploadErr } = await supabase.storage
                    .from('media')
                    .upload(path, uploadedCapa, { upsert: true })
                if (uploadErr) throw uploadErr
                const { data: pub } = supabase.storage.from('media').getPublicUrl(path)
                coverUrl = pub.publicUrl
            }

            const slug = config.titulo
                .toLowerCase()
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')
                .slice(0, 80)

            const { error: dbErr } = await supabase.from('ebooks').insert({
                title: config.titulo,
                subtitle: config.subtitulo || null,
                description: conteudo.slice(0, 500),
                pilar: config.pilar,
                publico_alvo: config.publico_alvo,
                tom: config.tom,
                num_capitulos: config.num_capitulos,
                pontos_chave: config.pontos_chave,
                conteudo,
                cover_image: coverUrl || null,
                capa_style: config.estilo_capa,
                slug,
                publication_status: 'rascunho',
                is_published: false,
            })
            if (dbErr) throw dbErr

            setSaved(true)
        } catch (err: any) {
            setError(err.message || 'Erro ao salvar')
        } finally {
            setSaving(false)
        }
    }

    // ── Word count ────────────────────────────────────────────────────────────
    const wordCount = conteudo.trim() ? conteudo.trim().split(/\s+/).length : 0

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <motion.div
                    animate={{ rotate: [0, 10, -5, 0] }}
                    transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                    className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${T.accent}20`, border: `1px solid ${T.accent}40` }}
                >
                    <BookOpen size={22} style={{ color: T.accent }} />
                </motion.div>
                <div>
                    <h1 className="text-2xl font-black" style={{ color: T.text }}>eBook Writer IA</h1>
                    <p className="text-sm" style={{ color: T.textMuted }}>
                        Claude Haiku escreve · DALL-E 3 cria a capa
                    </p>
                </div>
                {conteudo && (
                    <div className="ml-auto hidden sm:flex items-center gap-2">
                        <button
                            onClick={() => setPreviewMode(!previewMode)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
                            style={{ background: T.hover, color: T.textMuted, border: `1px solid ${T.border}` }}
                        >
                            <Eye size={13} />
                            {previewMode ? 'Editor' : 'Preview'}
                        </button>
                    </div>
                )}
            </div>

            <StepBar current={step} />

            <AnimatePresence mode="wait">

                {/* ── STEP 1: Configuração ───────────────────────────────────── */}
                {step === 0 && (
                    <motion.div key="s0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Left */}
                            <div className="space-y-5">
                                {/* Título */}
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: T.textMuted }}>
                                        Título do eBook *
                                    </label>
                                    <input
                                        value={config.titulo}
                                        onChange={e => set('titulo', e.target.value)}
                                        placeholder="Ex: O Guia Definitivo do Investimento Imobiliário"
                                        className="w-full h-12 px-4 rounded-xl text-sm font-medium outline-none"
                                        style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }}
                                        onFocus={e => (e.currentTarget.style.borderColor = T.accent)}
                                        onBlur={e => (e.currentTarget.style.borderColor = T.border)}
                                    />
                                </div>
                                {/* Subtítulo */}
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: T.textMuted }}>
                                        Subtítulo <span style={{ color: T.textTertiary }}>(opcional)</span>
                                    </label>
                                    <input
                                        value={config.subtitulo}
                                        onChange={e => set('subtitulo', e.target.value)}
                                        placeholder="Ex: Como multiplicar seu patrimônio no mercado imobiliário"
                                        className="w-full h-12 px-4 rounded-xl text-sm outline-none"
                                        style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }}
                                        onFocus={e => (e.currentTarget.style.borderColor = T.accent)}
                                        onBlur={e => (e.currentTarget.style.borderColor = T.border)}
                                    />
                                </div>
                                {/* Pilar */}
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest mb-3" style={{ color: T.textMuted }}>
                                        Pilar Temático
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {PILARES.map(p => (
                                            <Chip key={p} label={p} active={config.pilar === p} onClick={() => set('pilar', p)} />
                                        ))}
                                    </div>
                                </div>
                                {/* Público-alvo */}
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: T.textMuted }}>
                                        Público-Alvo
                                    </label>
                                    <input
                                        value={config.publico_alvo}
                                        onChange={e => set('publico_alvo', e.target.value)}
                                        placeholder="Ex: Investidores iniciantes, construtoras, compradores de imóvel de luxo..."
                                        className="w-full h-12 px-4 rounded-xl text-sm outline-none"
                                        style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }}
                                        onFocus={e => (e.currentTarget.style.borderColor = T.accent)}
                                        onBlur={e => (e.currentTarget.style.borderColor = T.border)}
                                    />
                                </div>
                            </div>

                            {/* Right */}
                            <div className="space-y-5">
                                {/* Tom */}
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest mb-3" style={{ color: T.textMuted }}>
                                        Tom da Escrita
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {TONS.map(t => (
                                            <motion.button
                                                key={t.value}
                                                whileTap={{ scale: 0.97 }}
                                                onClick={() => set('tom', t.value)}
                                                className="p-3 rounded-xl text-left border transition-all"
                                                style={config.tom === t.value
                                                    ? { background: `${T.accent}18`, borderColor: `${T.accent}55` }
                                                    : { background: T.elevated, borderColor: T.border }
                                                }
                                            >
                                                <p className="text-xs font-bold mb-0.5" style={{ color: config.tom === t.value ? T.accent : T.text }}>{t.value}</p>
                                                <p className="text-[10px]" style={{ color: T.textMuted }}>{t.desc}</p>
                                            </motion.button>
                                        ))}
                                    </div>
                                </div>

                                {/* Número de capítulos */}
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest mb-3" style={{ color: T.textMuted }}>
                                        Capítulos — <span style={{ color: T.accent }}>{config.num_capitulos}</span>
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="range" min={3} max={10} step={1}
                                            value={config.num_capitulos}
                                            onChange={e => set('num_capitulos', Number(e.target.value))}
                                            className="flex-1 accent-[var(--bo-accent)]"
                                        />
                                        <span className="text-2xl font-black tabular-nums w-8 text-center" style={{ color: T.text }}>
                                            {config.num_capitulos}
                                        </span>
                                    </div>
                                </div>

                                {/* Pontos-chave */}
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest mb-3" style={{ color: T.textMuted }}>
                                        Pontos-Chave <span style={{ color: T.textTertiary }}>(obrigatórios)</span>
                                    </label>
                                    <div className="flex gap-2 mb-2">
                                        <input
                                            value={newPonto}
                                            onChange={e => setNewPonto(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && addPonto()}
                                            placeholder="Ex: Análise de yield e valorização..."
                                            className="flex-1 h-9 px-3 rounded-xl text-xs outline-none"
                                            style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }}
                                        />
                                        <button onClick={addPonto}
                                            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
                                            style={{ background: T.accent, color: '#0D0F14' }}
                                        >
                                            <Plus size={14} />
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {config.pontos_chave.map((p, i) => (
                                            <span key={i}
                                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium"
                                                style={{ background: `${T.accent}18`, color: T.accent, border: `1px solid ${T.accent}33` }}
                                            >
                                                {p}
                                                <button onClick={() => set('pontos_chave', config.pontos_chave.filter((_, j) => j !== i))}>
                                                    <X size={10} />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end mt-8">
                            <motion.button
                                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                disabled={!config.titulo}
                                onClick={() => setStep(1)}
                                className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all"
                                style={config.titulo
                                    ? { background: T.accent, color: '#0D0F14' }
                                    : { background: T.hover, color: T.textMuted, cursor: 'not-allowed' }
                                }
                            >
                                Continuar <ChevronRight size={15} />
                            </motion.button>
                        </div>
                    </motion.div>
                )}

                {/* ── STEP 2: Conteúdo ──────────────────────────────────────── */}
                {step === 1 && (
                    <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                        {/* Config summary */}
                        <div className="flex flex-wrap items-center gap-2 mb-5 p-3 rounded-xl" style={{ background: T.elevated, border: `1px solid ${T.border}` }}>
                            <span className="text-xs font-bold" style={{ color: T.text }}>"{config.titulo}"</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: `${T.accent}20`, color: T.accent }}>{config.pilar}</span>
                            <span className="text-[10px]" style={{ color: T.textMuted }}>{config.num_capitulos} caps · {config.tom}</span>
                        </div>

                        {/* Write button / progress */}
                        {!writing && !conteudo && (
                            <div className="flex flex-col items-center justify-center py-20 gap-6">
                                <motion.div
                                    animate={{ y: [-4, 4, -4], rotate: [-3, 3, -3] }}
                                    transition={{ repeat: Infinity, duration: 2.5 }}
                                    className="w-20 h-20 rounded-3xl flex items-center justify-center"
                                    style={{ background: `${T.accent}20`, border: `1px solid ${T.accent}40` }}
                                >
                                    <Wand2 size={32} style={{ color: T.accent }} />
                                </motion.div>
                                <div className="text-center max-w-sm">
                                    <h2 className="text-xl font-black mb-2" style={{ color: T.text }}>Pronto para escrever?</h2>
                                    <p className="text-sm" style={{ color: T.textMuted }}>
                                        Claude Haiku vai gerar o eBook completo com {config.num_capitulos} capítulos, introdução e conclusão.
                                        Estimativa: ~{config.num_capitulos * 600} palavras.
                                    </p>
                                </div>
                                <motion.button
                                    whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                                    onClick={handleWrite}
                                    className="flex items-center gap-3 px-8 py-4 rounded-2xl text-sm font-bold shadow-lg"
                                    style={{ background: T.accent, color: '#0D0F14' }}
                                >
                                    <Sparkles size={16} />
                                    Gerar eBook com IA
                                </motion.button>
                            </div>
                        )}

                        {/* Writing progress */}
                        {writing && (
                            <div className="py-8">
                                <div className="flex items-center gap-3 mb-4">
                                    <Loader2 size={16} className="animate-spin" style={{ color: T.accent }} />
                                    <span className="text-sm font-medium" style={{ color: T.text }}>Claude Haiku está escrevendo...</span>
                                    <span className="text-xs ml-auto" style={{ color: T.textMuted }}>{writeProgress}%</span>
                                </div>
                                <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: T.hover }}>
                                    <motion.div
                                        className="h-full rounded-full"
                                        style={{ background: T.accent }}
                                        animate={{ width: `${writeProgress}%` }}
                                        transition={{ duration: 0.5 }}
                                    />
                                </div>
                                <p className="text-xs mt-3" style={{ color: T.textTertiary }}>
                                    {wordCount.toLocaleString()} palavras geradas...
                                </p>
                                {conteudo && (
                                    <div className="mt-4 p-4 rounded-xl text-xs font-mono overflow-hidden max-h-40"
                                        style={{ background: T.elevated, color: T.textMuted, border: `1px solid ${T.border}` }}>
                                        {conteudo.slice(-400)}
                                        <span className="animate-pulse">▌</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Editor */}
                        {conteudo && !writing && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="w-2 h-2 rounded-full" style={{ background: '#10B981' }} />
                                        <span className="text-xs font-semibold" style={{ color: T.textMuted }}>
                                            {wordCount.toLocaleString()} palavras geradas
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => setPreviewMode(!previewMode)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
                                            style={{ background: T.hover, color: T.textMuted, border: `1px solid ${T.border}` }}>
                                            <Eye size={12} /> {previewMode ? 'Editor' : 'Preview'}
                                        </button>
                                        <button onClick={handleWrite}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
                                            style={{ background: T.hover, color: T.textMuted, border: `1px solid ${T.border}` }}>
                                            <RefreshCw size={12} /> Regerar
                                        </button>
                                    </div>
                                </div>

                                <AnimatePresence mode="wait">
                                    {previewMode ? (
                                        <motion.div key="preview"
                                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                            className="p-6 rounded-2xl prose prose-invert max-w-none text-sm leading-relaxed"
                                            style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text, maxHeight: '60vh', overflowY: 'auto' }}
                                            dangerouslySetInnerHTML={{ __html: conteudo
                                                .replace(/^## (.+)$/gm, '<h2 class="text-lg font-black mt-6 mb-2">$1</h2>')
                                                .replace(/^### (.+)$/gm, '<h3 class="text-base font-bold mt-4 mb-1">$1</h3>')
                                                .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                                                .replace(/\n\n/g, '</p><p class="mb-3">')
                                                .replace(/^/, '<p class="mb-3">')
                                                .replace(/$/, '</p>')
                                            }}
                                        />
                                    ) : (
                                        <motion.textarea
                                            key="editor"
                                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                            ref={editorRef}
                                            value={conteudo}
                                            onChange={e => setConteudo(e.target.value)}
                                            className="w-full rounded-2xl p-5 text-sm leading-relaxed font-mono outline-none resize-none"
                                            style={{
                                                background: T.elevated, border: `1px solid ${T.border}`,
                                                color: T.text, minHeight: '60vh',
                                            }}
                                        />
                                    )}
                                </AnimatePresence>
                            </div>
                        )}

                        {error && <p className="text-xs mt-3 px-3 py-2 rounded-xl bg-red-500/10 text-red-400">{error}</p>}

                        <div className="flex justify-between mt-6">
                            <button onClick={() => setStep(0)} className="flex items-center gap-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
                                style={{ background: T.hover, color: T.textMuted, border: `1px solid ${T.border}` }}>
                                <ChevronLeft size={14} /> Voltar
                            </button>
                            <button disabled={!conteudo || writing} onClick={() => setStep(2)}
                                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all"
                                style={conteudo && !writing
                                    ? { background: T.accent, color: '#0D0F14' }
                                    : { background: T.hover, color: T.textMuted, cursor: 'not-allowed' }
                                }>
                                Criar Capa <ChevronRight size={15} />
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* ── STEP 3: Capa ──────────────────────────────────────────── */}
                {step === 2 && (
                    <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                            {/* Left: Controls */}
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest mb-3" style={{ color: T.textMuted }}>
                                        <Palette size={11} className="inline mr-1.5" />Estilo Visual da Capa
                                    </label>
                                    <div className="grid grid-cols-1 gap-2">
                                        {ESTILOS_CAPA.map(e => (
                                            <motion.button
                                                key={e.value} whileTap={{ scale: 0.98 }}
                                                onClick={() => { set('estilo_capa', e.value); setCapaUrl(null) }}
                                                className="flex items-center gap-3 p-3 rounded-xl border text-left transition-all"
                                                style={config.estilo_capa === e.value
                                                    ? { background: `${T.accent}18`, borderColor: `${T.accent}55` }
                                                    : { background: T.elevated, borderColor: T.border }
                                                }
                                            >
                                                <span className="text-xl">{e.emoji}</span>
                                                <div>
                                                    <p className="text-xs font-bold" style={{ color: config.estilo_capa === e.value ? T.accent : T.text }}>{e.label}</p>
                                                    <p className="text-[10px]" style={{ color: T.textMuted }}>{e.desc}</p>
                                                </div>
                                                {config.estilo_capa === e.value && <Check size={14} className="ml-auto flex-shrink-0" style={{ color: T.accent }} />}
                                            </motion.button>
                                        ))}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-col gap-2">
                                    <motion.button
                                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                                        disabled={generating}
                                        onClick={handleGenerateCover}
                                        className="flex items-center justify-center gap-2 h-11 rounded-xl text-sm font-bold"
                                        style={{ background: T.accent, color: '#0D0F14', opacity: generating ? 0.7 : 1 }}
                                    >
                                        {generating ? <><Loader2 size={14} className="animate-spin" /> Gerando com DALL-E 3...</> : <><Sparkles size={14} /> Gerar Capa com IA</>}
                                    </motion.button>

                                    {capaUrl && (
                                        <button onClick={handleGenerateCover} disabled={generating}
                                            className="flex items-center justify-center gap-2 h-10 rounded-xl text-xs font-semibold"
                                            style={{ background: T.hover, color: T.textMuted, border: `1px solid ${T.border}` }}>
                                            <RefreshCw size={12} /> Regenerar nova versão
                                        </button>
                                    )}

                                    <div className="relative">
                                        <input ref={fileRef} type="file" accept="image/*" onChange={handleUploadCover} className="sr-only" />
                                        <button onClick={() => fileRef.current?.click()}
                                            className="w-full flex items-center justify-center gap-2 h-10 rounded-xl text-xs font-semibold"
                                            style={{ background: T.hover, color: T.textMuted, border: `1px dashed ${T.border}` }}>
                                            <Upload size={12} /> Usar minha própria capa
                                        </button>
                                    </div>
                                </div>
                                {error && <p className="text-xs px-3 py-2 rounded-xl bg-red-500/10 text-red-400">{error}</p>}
                            </div>

                            {/* Right: Cover preview */}
                            <div className="flex flex-col items-center gap-4">
                                <div className="relative w-full max-w-[260px] aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl"
                                    style={{ background: T.elevated, border: `1px solid ${T.border}` }}>
                                    {capaUrl ? (
                                        <img src={capaUrl} alt="Capa" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-6">
                                            {generating ? (
                                                <>
                                                    <Loader2 size={24} className="animate-spin" style={{ color: T.accent }} />
                                                    <p className="text-xs text-center" style={{ color: T.textMuted }}>DALL-E 3 está criando a arte...</p>
                                                </>
                                            ) : (
                                                <>
                                                    <ImageIcon size={32} style={{ color: T.textTertiary, opacity: 0.4 }} />
                                                    <p className="text-xs text-center" style={{ color: T.textMuted }}>Gere ou faça upload da capa</p>
                                                </>
                                            )}
                                        </div>
                                    )}
                                    {/* Book spine effect */}
                                    <div className="absolute left-0 top-0 bottom-0 w-3" style={{
                                        background: 'linear-gradient(90deg, rgba(0,0,0,0.4), transparent)',
                                        pointerEvents: 'none',
                                    }} />
                                </div>

                                {capaUrl && (
                                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                                        <a href={capaUrl} download="capa-ebook.jpg" target="_blank" rel="noopener noreferrer"
                                            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl"
                                            style={{ background: T.hover, color: T.textMuted, border: `1px solid ${T.border}` }}>
                                            <Download size={12} /> Baixar capa
                                        </a>
                                    </motion.div>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-between mt-8">
                            <button onClick={() => setStep(1)} className="flex items-center gap-1 px-4 py-2.5 rounded-xl text-sm font-semibold"
                                style={{ background: T.hover, color: T.textMuted, border: `1px solid ${T.border}` }}>
                                <ChevronLeft size={14} /> Voltar
                            </button>
                            <button onClick={() => setStep(3)} className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold"
                                style={{ background: T.accent, color: '#0D0F14' }}>
                                Publicar <ChevronRight size={15} />
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* ── STEP 4: Publicar ──────────────────────────────────────── */}
                {step === 3 && (
                    <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                            {/* Summary */}
                            <div className="space-y-4">
                                <h2 className="text-lg font-black" style={{ color: T.text }}>Resumo do eBook</h2>
                                <div className="p-4 rounded-2xl space-y-3" style={{ background: T.elevated, border: `1px solid ${T.border}` }}>
                                    {[
                                        { icon: FileText, label: 'Título', value: config.titulo },
                                        config.subtitulo && { icon: FileText, label: 'Subtítulo', value: config.subtitulo },
                                        { icon: Target, label: 'Pilar', value: config.pilar },
                                        { icon: Pen, label: 'Tom', value: config.tom },
                                        { icon: BookOpen, label: 'Capítulos', value: `${config.num_capitulos}` },
                                        { icon: FileText, label: 'Palavras', value: wordCount.toLocaleString() },
                                    ].filter(Boolean).map((item: any) => (
                                        <div key={item.label} className="flex items-center gap-3">
                                            <item.icon size={13} style={{ color: T.textMuted, flexShrink: 0 }} />
                                            <span className="text-xs" style={{ color: T.textMuted }}>{item.label}</span>
                                            <span className="text-xs font-semibold ml-auto" style={{ color: T.text }}>{item.value}</span>
                                        </div>
                                    ))}
                                </div>

                                {config.pontos_chave.length > 0 && (
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: T.textMuted }}>Pontos-Chave Abordados</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {config.pontos_chave.map((p, i) => (
                                                <span key={i} className="px-2 py-0.5 rounded-lg text-xs"
                                                    style={{ background: `${T.accent}18`, color: T.accent, border: `1px solid ${T.accent}30` }}>
                                                    {p}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Save button */}
                                <AnimatePresence mode="wait">
                                    {saved ? (
                                        <motion.div key="saved" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                                            className="flex flex-col items-center gap-3 py-8 text-center">
                                            <div className="w-16 h-16 rounded-full flex items-center justify-center"
                                                style={{ background: '#10B98120', border: '2px solid #10B981' }}>
                                                <Check size={24} style={{ color: '#10B981' }} />
                                            </div>
                                            <p className="font-bold text-lg" style={{ color: T.text }}>eBook salvo com sucesso!</p>
                                            <p className="text-sm" style={{ color: T.textMuted }}>Acesse em Inteligência → eBooks</p>
                                            <div className="flex gap-2 mt-2">
                                                <a href="/backoffice/inteligencia/ebooks"
                                                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold"
                                                    style={{ background: T.accent, color: '#0D0F14' }}>
                                                    <Globe size={12} /> Ver eBooks
                                                </a>
                                                <button onClick={() => { setSaved(false); setStep(0); setConfig(DEFAULT_CONFIG); setConteudo(''); setCapaUrl(null) }}
                                                    className="px-4 py-2 rounded-xl text-xs font-bold"
                                                    style={{ background: T.hover, color: T.textMuted, border: `1px solid ${T.border}` }}>
                                                    Novo eBook
                                                </button>
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <motion.div key="save-btn" className="flex flex-col gap-2">
                                            {error && <p className="text-xs px-3 py-2 rounded-xl bg-red-500/10 text-red-400">{error}</p>}
                                            <motion.button
                                                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                                                onClick={handleSave} disabled={saving}
                                                className="flex items-center justify-center gap-2 h-12 rounded-xl text-sm font-bold w-full shadow-lg"
                                                style={{ background: T.accent, color: '#0D0F14', opacity: saving ? 0.7 : 1 }}
                                            >
                                                {saving ? <><Loader2 size={15} className="animate-spin" /> Salvando...</> : <><Save size={15} /> Salvar eBook no Catálogo</>}
                                            </motion.button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Cover + content snippet */}
                            <div className="flex flex-col items-center gap-4">
                                {capaUrl && (
                                    <div className="w-full max-w-[220px] aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl">
                                        <img src={capaUrl} alt="Capa" className="w-full h-full object-cover" />
                                    </div>
                                )}
                                <div className="w-full p-4 rounded-xl text-xs leading-relaxed"
                                    style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.textMuted, maxHeight: 200, overflowY: 'auto', fontFamily: 'Georgia, serif' }}>
                                    {conteudo.slice(0, 600)}...
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-start mt-6">
                            <button onClick={() => setStep(2)} className="flex items-center gap-1 px-4 py-2.5 rounded-xl text-sm font-semibold"
                                style={{ background: T.hover, color: T.textMuted, border: `1px solid ${T.border}` }}>
                                <ChevronLeft size={14} /> Voltar
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
