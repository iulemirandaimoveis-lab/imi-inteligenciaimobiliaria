'use client'

import { useState, useCallback, lazy, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Video, Play, Download, Sparkles, Smartphone, Monitor, Square,
    ChevronRight, Loader2, CheckCircle2, RefreshCw, Settings2,
    Image as ImageIcon, FileText, TrendingUp, Zap,
} from 'lucide-react'
import { toast } from 'sonner'
import { T } from '@/app/(backoffice)/lib/theme'
import { PageIntelHeader } from '@/app/(backoffice)/components/ui'

// Lazy-load Remotion Player (client-only, large bundle)
const RemotionPlayerDynamic = lazy(() =>
    import('@remotion/player').then(m => ({ default: m.Player }))
)

// ── Tipos ──────────────────────────────────────────────────────────
type Format = 'tiktok' | 'reels' | 'youtube' | 'square' | 'story'
type Template = 'PropertyShowcase' | 'MarketReport'

const FORMAT_CONFIG: Record<Format, { label: string; icon: any; w: number; h: number; fps: number; dur: number; badge: string }> = {
    tiktok:   { label: 'TikTok',        icon: Smartphone, w: 1080, h: 1920, fps: 30, dur: 450, badge: '9:16 · 15s' },
    reels:    { label: 'Instagram Reels', icon: Smartphone, w: 1080, h: 1920, fps: 30, dur: 450, badge: '9:16 · 15s' },
    youtube:  { label: 'YouTube Shorts', icon: Smartphone, w: 1080, h: 1920, fps: 30, dur: 270, badge: '9:16 · 9s' },
    story:    { label: 'Story',          icon: Smartphone, w: 1080, h: 1920, fps: 30, dur: 300, badge: '9:16 · 10s' },
    square:   { label: 'Instagram Feed', icon: Square,     w: 1080, h: 1080, fps: 30, dur: 300, badge: '1:1 · 10s' },
}

const TEMPLATES: Array<{ id: Template; label: string; desc: string; icon: any; color: string }> = [
    {
        id: 'PropertyShowcase',
        label: 'Showcase de Imóvel',
        desc: 'Slides do empreendimento com preço, specs e CTA',
        icon: ImageIcon,
        color: '#2C7BE5',
    },
    {
        id: 'MarketReport',
        label: 'Relatório de Mercado',
        desc: 'Dados do mercado imobiliário com gráficos animados',
        icon: TrendingUp,
        color: T.success,
    },
]

// ── Loading placeholder ────────────────────────────────────────────
function PlayerPlaceholder() {
    return (
        <div className="flex flex-col items-center justify-center h-full gap-3">
            <Loader2 size={28} className="animate-spin" style={{ color: T.accent }} />
            <p className="text-xs" style={{ color: T.textDim }}>Carregando player…</p>
        </div>
    )
}

// ── Status indicator ───────────────────────────────────────────────
type RenderStatus = 'idle' | 'rendering' | 'done' | 'error'

function RenderStatusBadge({ status }: { status: RenderStatus }) {
    const cfg = {
        idle:      { label: 'Pronto',        color: T.textDim, icon: null },
        rendering: { label: 'Renderizando…', color: 'var(--bo-warning)', icon: Loader2 },
        done:      { label: 'Concluído!',    color: T.success, icon: CheckCircle2 },
        error:     { label: 'Erro',          color: T.error, icon: RefreshCw },
    }
    const c = cfg[status]
    const Icon = c.icon
    return (
        <motion.span
            layout
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full"
            style={{ color: c.color, background: `${c.color}18`, border: `1px solid ${c.color}30` }}
        >
            {Icon && <Icon size={11} className={status === 'rendering' ? 'animate-spin' : ''} />}
            {c.label}
        </motion.span>
    )
}

// ── Main Page ──────────────────────────────────────────────────────
export default function VideoCreatorPage() {
    const [selectedTemplate, setSelectedTemplate] = useState<Template>('PropertyShowcase')
    const [selectedFormat, setSelectedFormat] = useState<Format>('tiktok')
    const [renderStatus, setRenderStatus] = useState<RenderStatus>('idle')
    const [showPlayer, setShowPlayer] = useState(false)
    const [tab, setTab] = useState<'templates' | 'editor' | 'preview'>('templates')

    // PropertyShowcase fields
    const [title, setTitle] = useState('Apartamento Premium')
    const [subtitle, setSubtitle] = useState('Vista mar · Acabamento de alto padrão')
    const [price, setPrice] = useState('R$ 890k')
    const [neighborhood, setNeighborhood] = useState('Boa Viagem')
    const [area, setArea] = useState('72m²')
    const [bedrooms, setBedrooms] = useState(3)

    const fmt = FORMAT_CONFIG[selectedFormat]

    // Remotion component + props
    // Dynamically imported to avoid SSR issues
    const [RemotionComp, setRemotionComp] = useState<any>(null)
    const [compProps, setCompProps] = useState<any>(null)

    const loadComposition = useCallback(async () => {
        try {
            if (selectedTemplate === 'PropertyShowcase') {
                const { PropertyShowcase } = await import('@/remotion/compositions/PropertyShowcase')
                setRemotionComp(() => PropertyShowcase)
                setCompProps({
                    title, subtitle, price,
                    neighborhood, city: 'Recife, PE',
                    area, bedrooms, bathrooms: 2, parking: 2,
                    images: [],
                    accentColor: '#2C7BE5',
                })
            } else {
                const { MarketReport, marketReportDefaultProps } = await import('@/remotion/compositions/MarketReport')
                setRemotionComp(() => MarketReport)
                setCompProps(marketReportDefaultProps)
            }
            setShowPlayer(true)
            setTab('preview')
        } catch (err) {
            toast.error('Erro ao carregar composição')
        }
    }, [selectedTemplate, title, subtitle, price, neighborhood, area, bedrooms])

    const handleRender = useCallback(async () => {
        if (renderStatus === 'rendering') return
        setRenderStatus('rendering')
        try {
            const res = await fetch('/api/ai/render-video', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    template: selectedTemplate,
                    format: selectedFormat,
                    props: compProps,
                }),
            })
            if (!res.ok) throw new Error(await res.text())
            const { video_url } = await res.json()
            setRenderStatus('done')
            toast.success('Vídeo renderizado! Fazendo download…')
            window.open(video_url, '_blank')
        } catch {
            setRenderStatus('error')
            toast.error('Render falhou. Configure REMOTION_SERVE_URL nas variáveis de ambiente.')
        }
    }, [renderStatus, selectedTemplate, selectedFormat, compProps])

    const TABS = [
        { id: 'templates', label: 'Template', icon: FileText },
        { id: 'editor',    label: 'Conteúdo', icon: Settings2 },
        { id: 'preview',   label: 'Preview',  icon: Play },
    ] as const

    return (
        <div className="space-y-5">
            {/* Header */}
            <PageIntelHeader
                moduleLabel="CONTEÚDO"
                title="Criador de Vídeo IA"
                subtitle="Templates Remotion · TikTok · Reels · YouTube Shorts"
                actions={
                    <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleRender}
                        disabled={!showPlayer || renderStatus === 'rendering'}
                        className="bo-btn bo-btn-primary"
                        style={{ background: T.success, boxShadow: '0 0 20px rgba(52,211,153,0.3)' }}
                    >
                        {renderStatus === 'rendering'
                            ? <Loader2 size={15} className="animate-spin" />
                            : <Download size={15} />
                        }
                        <span className="hidden sm:inline">Renderizar Vídeo</span>
                    </motion.button>
                }
            />

            {/* Layout: 2 colunas em desktop */}
            <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-5">

                {/* ── PAINEL ESQUERDO ── */}
                <div className="space-y-4">

                    {/* Tab navigation */}
                    <div className="flex gap-1 p-1 rounded-xl" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                        {TABS.map(t => (
                            <motion.button
                                key={t.id}
                                onClick={() => setTab(t.id)}
                                whileTap={{ scale: 0.96 }}
                                className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg text-xs font-semibold transition-all"
                                style={{
                                    background: tab === t.id ? T.accent : 'transparent',
                                    color: tab === t.id ? 'white' : T.textDim,
                                }}
                            >
                                <t.icon size={12} />
                                {t.label}
                            </motion.button>
                        ))}
                    </div>

                    {/* ── TAB: Templates ── */}
                    <AnimatePresence mode="wait">
                        {tab === 'templates' && (
                            <motion.div
                                key="templates"
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 8 }}
                                className="space-y-3"
                            >
                                {/* Format selection */}
                                <div className="rounded-2xl p-4 space-y-3" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                                    <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: T.textDim }}>Formato</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {(Object.entries(FORMAT_CONFIG) as [Format, typeof FORMAT_CONFIG.tiktok][]).map(([key, cfg]) => (
                                            <motion.button
                                                key={key}
                                                onClick={() => setSelectedFormat(key)}
                                                whileTap={{ scale: 0.95 }}
                                                className="flex flex-col gap-1 p-3 rounded-xl text-left transition-all"
                                                style={{
                                                    background: selectedFormat === key ? `${T.accent}20` : T.elevated,
                                                    border: `1px solid ${selectedFormat === key ? T.accent : T.border}`,
                                                }}
                                            >
                                                <cfg.icon size={14} style={{ color: selectedFormat === key ? T.accent : T.textDim }} />
                                                <p className="text-[11px] font-semibold" style={{ color: selectedFormat === key ? T.accent : T.text }}>
                                                    {cfg.label}
                                                </p>
                                                <p className="text-[9px]" style={{ color: T.textDim }}>{cfg.badge}</p>
                                            </motion.button>
                                        ))}
                                    </div>
                                </div>

                                {/* Template selection */}
                                <div className="rounded-2xl p-4 space-y-3" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                                    <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: T.textDim }}>Template</p>
                                    <div className="space-y-2">
                                        {TEMPLATES.map(tpl => (
                                            <motion.button
                                                key={tpl.id}
                                                onClick={() => setSelectedTemplate(tpl.id)}
                                                whileHover={{ x: 2 }}
                                                whileTap={{ scale: 0.98 }}
                                                className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all"
                                                style={{
                                                    background: selectedTemplate === tpl.id ? `${tpl.color}12` : T.elevated,
                                                    border: `1px solid ${selectedTemplate === tpl.id ? tpl.color + '44' : T.border}`,
                                                }}
                                            >
                                                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                                                    style={{ background: `${tpl.color}18` }}>
                                                    <tpl.icon size={16} style={{ color: tpl.color }} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[12px] font-semibold" style={{ color: T.text }}>{tpl.label}</p>
                                                    <p className="text-[10px] truncate" style={{ color: T.textDim }}>{tpl.desc}</p>
                                                </div>
                                                {selectedTemplate === tpl.id && (
                                                    <CheckCircle2 size={14} style={{ color: tpl.color, flexShrink: 0 }} />
                                                )}
                                            </motion.button>
                                        ))}
                                    </div>
                                </div>

                                <motion.button
                                    onClick={() => setTab('editor')}
                                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                                    className="w-full h-10 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold text-white"
                                    style={{ background: T.accent }}
                                >
                                    Próximo <ChevronRight size={15} />
                                </motion.button>
                            </motion.div>
                        )}

                        {/* ── TAB: Editor ── */}
                        {tab === 'editor' && (
                            <motion.div
                                key="editor"
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 8 }}
                                className="space-y-3"
                            >
                                <div className="rounded-2xl p-4 space-y-3" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                                    <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: T.textDim }}>
                                        Conteúdo — {selectedTemplate === 'PropertyShowcase' ? 'Imóvel' : 'Relatório'}
                                    </p>

                                    {selectedTemplate === 'PropertyShowcase' ? (
                                        <div className="space-y-3">
                                            {[
                                                { label: 'Título do Empreendimento', val: title, set: setTitle, placeholder: 'Apartamento Premium' },
                                                { label: 'Subtítulo', val: subtitle, set: setSubtitle, placeholder: 'Vista mar · Alto padrão' },
                                                { label: 'Preço', val: price, set: setPrice, placeholder: 'R$ 890k' },
                                                { label: 'Bairro', val: neighborhood, set: setNeighborhood, placeholder: 'Boa Viagem' },
                                                { label: 'Área', val: area, set: setArea, placeholder: '72m²' },
                                            ].map(f => (
                                                <div key={f.label}>
                                                    <label className="block text-[10px] font-semibold mb-1" style={{ color: T.textDim }}>
                                                        {f.label}
                                                    </label>
                                                    <input
                                                        value={f.val}
                                                        onChange={e => f.set(e.target.value)}
                                                        placeholder={f.placeholder}
                                                        className="w-full h-8 px-3 rounded-lg text-xs outline-none"
                                                        style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }}
                                                        onFocus={e => { e.currentTarget.style.border = `1px solid ${T.borderGold}` }}
                                                        onBlur={e => { e.currentTarget.style.border = `1px solid ${T.border}` }}
                                                    />
                                                </div>
                                            ))}
                                            <div>
                                                <label className="block text-[10px] font-semibold mb-1" style={{ color: T.textDim }}>Quartos</label>
                                                <div className="flex gap-1.5">
                                                    {[1, 2, 3, 4, 5].map(n => (
                                                        <motion.button
                                                            key={n}
                                                            onClick={() => setBedrooms(n)}
                                                            whileTap={{ scale: 0.88 }}
                                                            className="w-9 h-8 rounded-lg text-xs font-bold transition-all"
                                                            style={{
                                                                background: bedrooms === n ? T.accent : T.elevated,
                                                                color: bedrooms === n ? 'white' : T.textDim,
                                                                border: `1px solid ${bedrooms === n ? T.borderGold : T.border}`,
                                                            }}
                                                        >
                                                            {n}
                                                        </motion.button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-xs" style={{ color: T.textMuted }}>
                                            Relatório usa dados do mercado IMI automaticamente.
                                            Configuração avançada disponível em breve.
                                        </p>
                                    )}
                                </div>

                                <motion.button
                                    onClick={loadComposition}
                                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                                    className="w-full h-10 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold text-white"
                                    style={{ background: T.accent }}
                                >
                                    <Play size={15} /> Gerar Preview
                                </motion.button>
                            </motion.div>
                        )}

                        {/* ── TAB: Preview (info) ── */}
                        {tab === 'preview' && (
                            <motion.div
                                key="preview"
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 8 }}
                                className="space-y-3"
                            >
                                <div className="rounded-2xl p-4 space-y-3" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                                    <div className="flex items-center justify-between">
                                        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: T.textDim }}>Status do Render</p>
                                        <RenderStatusBadge status={renderStatus} />
                                    </div>

                                    <div className="space-y-2">
                                        {[
                                            { label: 'Formato', value: `${fmt.w}×${fmt.h}px` },
                                            { label: 'Taxa', value: `${fmt.fps}fps` },
                                            { label: 'Duração', value: `${fmt.dur / fmt.fps}s` },
                                            { label: 'Template', value: selectedTemplate },
                                        ].map(({ label, value }) => (
                                            <div key={label} className="flex items-center justify-between text-xs">
                                                <span style={{ color: T.textDim }}>{label}</span>
                                                <span className="font-semibold" style={{ color: T.text }}>{value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="rounded-2xl p-4" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                                    <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: T.textDim }}>Renderizar para</p>
                                    <div className="space-y-1.5">
                                        {['TikTok', 'Instagram Reels', 'YouTube Shorts', 'Download MP4'].map((dest, i) => (
                                            <div key={dest} className="flex items-center gap-2 text-xs" style={{ color: i === 0 ? T.accent : T.textMuted }}>
                                                <Zap size={11} />
                                                {dest}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* ── PAINEL DIREITO: Preview ── */}
                <div
                    className="rounded-2xl overflow-hidden flex items-center justify-center"
                    style={{
                        background: T.surface,
                        border: `1px solid ${T.border}`,
                        minHeight: 520,
                    }}
                >
                    <AnimatePresence mode="wait">
                        {!showPlayer ? (
                            <motion.div
                                key="empty"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex flex-col items-center gap-4"
                            >
                                <motion.div
                                    animate={{ y: [0, -8, 0] }}
                                    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                                    className="w-20 h-20 rounded-3xl flex items-center justify-center"
                                    style={{ background: `${T.accent}18` }}
                                >
                                    <Video size={36} style={{ color: T.accent, opacity: 0.7 }} />
                                </motion.div>
                                <div className="text-center">
                                    <p className="text-base font-bold mb-1" style={{ color: T.text }}>Preview do Vídeo</p>
                                    <p className="text-sm" style={{ color: T.textMuted }}>
                                        Configure o conteúdo e clique em "Gerar Preview"
                                    </p>
                                </div>
                                <motion.button
                                    onClick={() => setTab('editor')}
                                    whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                                    className="bo-btn bo-btn-primary"
                                    style={{ background: T.accent }}
                                >
                                    <Sparkles size={14} /> Criar Vídeo
                                </motion.button>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="player"
                                initial={{ opacity: 0, scale: 0.96 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0 }}
                                className="w-full h-full flex items-center justify-center p-6"
                                style={{ minHeight: 520 }}
                            >
                                <Suspense fallback={<PlayerPlaceholder />}>
                                    {RemotionComp && compProps && (
                                        <div style={{
                                            width: fmt.h > fmt.w ? 280 : 460,
                                            aspectRatio: `${fmt.w}/${fmt.h}`,
                                            borderRadius: 12,
                                            overflow: 'hidden',
                                            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                                        }}>
                                            <RemotionPlayerDynamic
                                                component={RemotionComp}
                                                inputProps={compProps}
                                                durationInFrames={fmt.dur}
                                                fps={fmt.fps}
                                                compositionWidth={fmt.w}
                                                compositionHeight={fmt.h}
                                                controls
                                                loop
                                                style={{ width: '100%', height: '100%' }}
                                            />
                                        </div>
                                    )}
                                </Suspense>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Info box */}
            <div
                className="rounded-2xl p-4 flex items-start gap-3"
                style={{ background: `${T.accent}0a`, border: `1px solid ${T.accent}22` }}
            >
                <Zap size={16} style={{ color: T.accent, flexShrink: 0, marginTop: 1 }} />
                <div>
                    <p className="text-xs font-semibold mb-0.5" style={{ color: T.text }}>
                        Renderização via Remotion Lambda (Produção)
                    </p>
                    <p className="text-[11px]" style={{ color: T.textMuted }}>
                        Para render em produção, configure <code className="text-xs px-1 py-0.5 rounded" style={{ background: T.elevated }}>REMOTION_SERVE_URL</code> e{' '}
                        <code className="text-xs px-1 py-0.5 rounded" style={{ background: T.elevated }}>REMOTION_AWS_ACCESS_KEY</code> no ambiente.
                        O preview acima usa o Remotion Player diretamente no browser.
                    </p>
                </div>
            </div>
        </div>
    )
}
