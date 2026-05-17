'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
    Palette, Settings, Sparkles, Download, ExternalLink, RefreshCw,
    CheckCircle2, XCircle, Loader2, Play, Image as ImageIcon,
    FileText, Layout, Monitor, Smartphone, Globe, ChevronRight,
    Wand2, BookOpen, Package, Star, Clock, Search, Filter,
    Code, Presentation, Mail, Home, Building2, AlertCircle,
    Eye, Copy, Trash2, Plus, Server,
} from 'lucide-react'
import { T } from '@/app/(backoffice)/lib/theme'
import { PageIntelHeader, KPICard } from '@/app/(backoffice)/components/ui'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

// ── Types ─────────────────────────────────────────────────────────
type Skill = {
    id: string
    name: string
    description: string
    category: string
    surface?: string
    icon?: string
    tags?: string[]
}

type DesignSystem = {
    id: string
    name: string
    description?: string
    tags?: string[]
}

type Artifact = {
    id: string
    name: string
    skill?: string
    html?: string
    createdAt: string
    thumbnail?: string
}

type TabId = 'studio' | 'skills' | 'systems' | 'history' | 'settings'
type ConnectionStatus = 'idle' | 'checking' | 'ok' | 'error'

// ── Real estate skill categories ──────────────────────────────────
const REALESTATE_SKILLS = [
    { id: 'property-listing', name: 'Listagem de Imóvel', description: 'Página web responsiva para divulgação de imóvel com fotos, características e localização.', category: 'Portfólio', icon: Home, color: '#C8A44A', bg: 'rgba(200,164,74,0.12)' },
    { id: 'property-presentation', name: 'Apresentação de Imóvel', description: 'Deck executivo de slides para apresentação a compradores ou investidores.', category: 'Apresentação', icon: Presentation, color: '#4ADE80', bg: 'rgba(74,222,128,0.10)' },
    { id: 'market-report', name: 'Relatório de Mercado', description: 'Documento analítico com indicadores, tendências e dados de mercado imobiliário.', category: 'Relatório', icon: FileText, color: '#60A5FA', bg: 'rgba(96,165,250,0.12)' },
    { id: 'email-marketing', name: 'Email Marketing', description: 'Template de email responsivo para prospecção ou divulgação de lançamentos.', category: 'Marketing', icon: Mail, color: '#F472B6', bg: 'rgba(244,114,182,0.10)' },
    { id: 'property-brochure', name: 'Folheto de Imóvel', description: 'Material visual premium de 1 página para imprimir ou enviar digitalmente.', category: 'Marketing', icon: Layout, color: '#A78BFA', bg: 'rgba(167,139,250,0.12)' },
    { id: 'investment-analysis', name: 'Análise de Investimento', description: 'Dashboard financeiro com ROI, cap rate e comparativo de rentabilidade.', category: 'Financeiro', icon: Building2, color: '#34D399', bg: 'rgba(52,211,153,0.10)' },
    { id: 'neighborhood-guide', name: 'Guia do Bairro', description: 'Página informativa com infraestrutura, pontos de interesse e perfil do bairro.', category: 'Localização', icon: Globe, color: '#FB923C', bg: 'rgba(251,146,60,0.10)' },
    { id: 'landing-page', name: 'Landing Page de Captação', description: 'Página de alta conversão para captação de leads qualificados.', category: 'Captação', icon: Monitor, color: '#38BDF8', bg: 'rgba(56,189,248,0.10)' },
    { id: 'mobile-listing', name: 'Card Mobile de Imóvel', description: 'Card visual otimizado para compartilhar no WhatsApp e redes sociais.', category: 'Social', icon: Smartphone, color: '#F59E0B', bg: 'rgba(245,158,11,0.10)' },
    { id: 'agency-portfolio', name: 'Portfólio da Imobiliária', description: 'Site institucional com apresentação de serviços e diferenciais.', category: 'Institucional', icon: Package, color: '#E879F9', bg: 'rgba(232,121,249,0.10)' },
]

const SKILL_QUESTIONS: Record<string, Array<{ id: string; label: string; type: 'text' | 'textarea' | 'select'; options?: string[]; placeholder?: string; required?: boolean }>> = {
    'property-listing': [
        { id: 'property_type', label: 'Tipo de Imóvel', type: 'select', options: ['Apartamento', 'Casa', 'Cobertura', 'Loja', 'Sala Comercial', 'Terreno', 'Loteamento'], required: true },
        { id: 'address', label: 'Endereço / Bairro / Cidade', type: 'text', placeholder: 'Ex: Boa Viagem, Recife — PE', required: true },
        { id: 'price', label: 'Preço de Venda ou Aluguel', type: 'text', placeholder: 'Ex: R$ 850.000 ou R$ 3.500/mês' },
        { id: 'area', label: 'Área (m²)', type: 'text', placeholder: 'Ex: 120 m²' },
        { id: 'rooms', label: 'Quartos / Suítes / Vagas', type: 'text', placeholder: 'Ex: 3 quartos, 2 suítes, 2 vagas' },
        { id: 'highlights', label: 'Destaques do Imóvel', type: 'textarea', placeholder: 'Vista mar, piscina privativa, varanda gourmet, acabamento de alto padrão...' },
        { id: 'style', label: 'Estilo Visual', type: 'select', options: ['Luxo / Premium', 'Moderno', 'Minimalista', 'Corporativo', 'Aconchegante'] },
    ],
    'property-presentation': [
        { id: 'property_type', label: 'Tipo de Imóvel', type: 'select', options: ['Apartamento', 'Casa', 'Empreendimento', 'Terreno', 'Portfólio'], required: true },
        { id: 'title', label: 'Título da Apresentação', type: 'text', placeholder: 'Ex: Oportunidade Exclusiva — Penthouse Boa Viagem', required: true },
        { id: 'highlights', label: 'Diferenciais Principais', type: 'textarea', placeholder: 'Liste os 3-5 maiores diferenciais do imóvel...' },
        { id: 'price', label: 'Preço', type: 'text', placeholder: 'Ex: R$ 2.800.000' },
        { id: 'audience', label: 'Público-alvo', type: 'select', options: ['Comprador Final', 'Investidor', 'Locatário', 'Incorporadora'] },
    ],
    'market-report': [
        { id: 'market', label: 'Mercado / Região', type: 'text', placeholder: 'Ex: Recife — Zona Sul', required: true },
        { id: 'period', label: 'Período de Referência', type: 'text', placeholder: 'Ex: 1º Semestre 2026' },
        { id: 'segment', label: 'Segmento', type: 'select', options: ['Residencial', 'Comercial', 'Industrial', 'Geral'] },
        { id: 'highlights', label: 'Dados / Insights Principais', type: 'textarea', placeholder: 'Variação de preços, absorção, lançamentos, tendências...' },
    ],
    'email-marketing': [
        { id: 'subject', label: 'Assunto do Email', type: 'text', placeholder: 'Ex: Novo apartamento exclusivo em Boa Viagem!', required: true },
        { id: 'property_type', label: 'Tipo / Nome do Imóvel', type: 'text', placeholder: 'Ex: Cobertura Panorâmica 3 Suítes' },
        { id: 'cta', label: 'Chamada para Ação (CTA)', type: 'text', placeholder: 'Ex: Agende sua visita exclusiva' },
        { id: 'tone', label: 'Tom da Comunicação', type: 'select', options: ['Luxo', 'Urgência', 'Informativo', 'Amigável'] },
        { id: 'highlights', label: 'Pontos de Destaque', type: 'textarea', placeholder: 'Vista mar, 3 suítes, lazer completo, pronto para morar...' },
    ],
    default: [
        { id: 'title', label: 'Título / Tema', type: 'text', placeholder: 'Descreva o título ou tema do design', required: true },
        { id: 'description', label: 'Descrição', type: 'textarea', placeholder: 'Descreva em detalhes o que deve ser gerado...' },
        { id: 'style', label: 'Estilo Visual', type: 'select', options: ['Luxo / Premium', 'Moderno', 'Minimalista', 'Corporativo', 'Padrão'] },
    ],
}

const DEFAULT_SERVER = 'http://localhost:7456'

// ── Utility ───────────────────────────────────────────────────────
function buildPrompt(skillId: string, formValues: Record<string, string>): string {
    const skill = REALESTATE_SKILLS.find(s => s.id === skillId)
    const skillName = skill?.name ?? skillId
    const parts = [`Crie um ${skillName} para imobiliária com as seguintes informações:`]
    for (const [key, value] of Object.entries(formValues)) {
        if (value.trim()) parts.push(`- ${key.replace(/_/g, ' ')}: ${value}`)
    }
    parts.push('\nUse o sistema de design imobiliário brasileiro, cores sóbrias e tipografia elegante. Gere HTML completo, responsivo e pronto para uso.')
    return parts.join('\n')
}

// ── Component ─────────────────────────────────────────────────────
export default function DesignStudioPage() {
    const [tab, setTab] = useState<TabId>('studio')
    const [serverUrl, setServerUrl] = useState(DEFAULT_SERVER)
    const [savedUrl, setSavedUrl] = useState(DEFAULT_SERVER)
    const [connStatus, setConnStatus] = useState<ConnectionStatus>('idle')
    const [remoteSkills, setRemoteSkills] = useState<Skill[]>([])
    const [remoteSystems, setRemoteSystems] = useState<DesignSystem[]>([])
    const [selectedSkill, setSelectedSkill] = useState<typeof REALESTATE_SKILLS[0] | null>(null)
    const [formValues, setFormValues] = useState<Record<string, string>>({})
    const [generating, setGenerating] = useState(false)
    const [artifact, setArtifact] = useState<Artifact | null>(null)
    const [history, setHistory] = useState<Artifact[]>([])
    const [skillSearch, setSkillSearch] = useState('')
    const [activeCategory, setActiveCategory] = useState('Todos')
    const [loadingSkills, setLoadingSkills] = useState(false)
    const iframeRef = useRef<HTMLIFrameElement>(null)

    // ── Load saved server URL from localStorage ───────────────────
    useEffect(() => {
        const saved = localStorage.getItem('imi_design_studio_url')
        if (saved) { setServerUrl(saved); setSavedUrl(saved) }
        const hist = localStorage.getItem('imi_design_studio_history')
        if (hist) { try { setHistory(JSON.parse(hist)) } catch { /* noop */ } }
    }, [])

    // ── Proxy call ────────────────────────────────────────────────
    const proxyCall = useCallback(async (path: string, method = 'GET', payload?: unknown) => {
        const res = await fetch('/api/design-studio/proxy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ serverUrl: savedUrl, path, method, payload }),
        })
        if (!res.ok) {
            const err = await res.json().catch(() => ({ error: res.statusText }))
            throw new Error(err.error ?? 'Proxy error')
        }
        return res.json()
    }, [savedUrl])

    // ── Check connection ──────────────────────────────────────────
    async function checkConnection(url = savedUrl) {
        setConnStatus('checking')
        try {
            const res = await fetch('/api/design-studio/proxy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ serverUrl: url, path: '/api/skills', method: 'GET' }),
            })
            if (!res.ok) throw new Error('Connection failed')
            setConnStatus('ok')
            toast.success('Open Design conectado com sucesso!')
            return true
        } catch {
            setConnStatus('error')
            toast.error('Não foi possível conectar ao Open Design. Verifique se o servidor está rodando.')
            return false
        }
    }

    async function saveAndConnect() {
        const trimmed = serverUrl.trim().replace(/\/$/, '')
        localStorage.setItem('imi_design_studio_url', trimmed)
        setSavedUrl(trimmed)
        await checkConnection(trimmed)
    }

    // ── Load remote skills ────────────────────────────────────────
    async function loadRemoteSkills() {
        if (connStatus !== 'ok') return
        setLoadingSkills(true)
        try {
            const data = await proxyCall('/api/skills')
            if (Array.isArray(data)) setRemoteSkills(data)
            else if (data?.skills) setRemoteSkills(data.skills)
        } catch { /* use built-in skills */ }
        try {
            const dsData = await proxyCall('/api/design-systems')
            if (Array.isArray(dsData)) setRemoteSystems(dsData)
            else if (dsData?.designSystems) setRemoteSystems(dsData.designSystems)
        } catch { /* noop */ }
        setLoadingSkills(false)
    }

    useEffect(() => { if (connStatus === 'ok') loadRemoteSkills() }, [connStatus])

    // ── Generate artifact ─────────────────────────────────────────
    async function handleGenerate() {
        if (!selectedSkill) { toast.error('Selecione um template de design'); return }
        const required = (SKILL_QUESTIONS[selectedSkill.id] ?? SKILL_QUESTIONS.default)
            .filter(q => q.required)
            .filter(q => !formValues[q.id]?.trim())
        if (required.length > 0) { toast.error(`Preencha: ${required.map(q => q.label).join(', ')}`); return }

        setGenerating(true)
        setArtifact(null)

        const prompt = buildPrompt(selectedSkill.id, formValues)

        if (connStatus === 'ok') {
            try {
                const result = await proxyCall('/api/chat', 'POST', {
                    messages: [{ role: 'user', content: prompt }],
                    skill: selectedSkill.id,
                })
                const html = result?.content ?? result?.html ?? result?.artifact ?? ''
                if (html) {
                    const newArtifact: Artifact = {
                        id: Date.now().toString(),
                        name: formValues.title ?? formValues.property_type ?? selectedSkill.name,
                        skill: selectedSkill.name,
                        html,
                        createdAt: new Date().toISOString(),
                    }
                    setArtifact(newArtifact)
                    const updated = [newArtifact, ...history].slice(0, 20)
                    setHistory(updated)
                    localStorage.setItem('imi_design_studio_history', JSON.stringify(updated))
                    toast.success('Design gerado com sucesso!')
                } else {
                    throw new Error('Empty response from Open Design')
                }
            } catch (err: unknown) {
                toast.error(err instanceof Error ? err.message : 'Erro ao gerar design via Open Design')
                await generateWithIMIAI(prompt)
            }
        } else {
            await generateWithIMIAI(prompt)
        }
        setGenerating(false)
    }

    async function generateWithIMIAI(prompt: string) {
        try {
            const res = await fetch('/api/ai/router', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    task_type: 'custom',
                    prompt: `Você é um designer especialista em imóveis. ${prompt}\n\nGere APENAS código HTML completo, responsivo, bem estruturado com CSS inline, sem markdown, sem blocos de código, apenas HTML puro começando com <!DOCTYPE html>.`,
                    model_override: 'claude-sonnet',
                    max_tokens: 4000,
                }),
            })
            const data = await res.json()
            if (data.success && data.result) {
                const html = data.result.replace(/```html\n?/g, '').replace(/```\n?/g, '').trim()
                const newArtifact: Artifact = {
                    id: Date.now().toString(),
                    name: selectedSkill ? (formValues.title ?? formValues.property_type ?? selectedSkill.name) : 'Design',
                    skill: selectedSkill?.name,
                    html,
                    createdAt: new Date().toISOString(),
                }
                setArtifact(newArtifact)
                const updated = [newArtifact, ...history].slice(0, 20)
                setHistory(updated)
                localStorage.setItem('imi_design_studio_history', JSON.stringify(updated))
                toast.success('Design gerado via IA IMI!')
            } else {
                toast.error(data.error ?? 'Erro na geração de design')
            }
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Erro ao gerar design')
        }
    }

    function handleCopyHTML() {
        if (!artifact?.html) return
        navigator.clipboard.writeText(artifact.html).then(() => toast.success('HTML copiado!'))
    }

    function handleDownload() {
        if (!artifact?.html) return
        const blob = new Blob([artifact.html], { type: 'text/html' })
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = `${(artifact.name ?? 'design').replace(/\s+/g, '-').toLowerCase()}.html`
        a.click()
    }

    function handleOpenNewTab() {
        if (!artifact?.html) return
        const w = window.open('', '_blank')
        if (w) { w.document.write(artifact.html); w.document.close() }
    }

    function deleteArtifact(id: string) {
        const updated = history.filter(a => a.id !== id)
        setHistory(updated)
        localStorage.setItem('imi_design_studio_history', JSON.stringify(updated))
        if (artifact?.id === id) setArtifact(null)
        toast.success('Design removido')
    }

    // ── Derived state ─────────────────────────────────────────────
    const categories = ['Todos', ...Array.from(new Set(REALESTATE_SKILLS.map(s => s.category)))]
    const filteredSkills = REALESTATE_SKILLS.filter(s => {
        const matchCat = activeCategory === 'Todos' || s.category === activeCategory
        const matchSearch = skillSearch === '' || s.name.toLowerCase().includes(skillSearch.toLowerCase()) || s.description.toLowerCase().includes(skillSearch.toLowerCase())
        return matchCat && matchSearch
    })

    const questions = selectedSkill ? (SKILL_QUESTIONS[selectedSkill.id] ?? SKILL_QUESTIONS.default) : []

    // ── Render ────────────────────────────────────────────────────
    return (
        <div className="space-y-6">
            <PageIntelHeader
                moduleLabel="CONTEÚDO"
                title="Design Studio"
                subtitle="Gere materiais de marketing, apresentações e páginas de imóveis com IA"
                breadcrumbs={[
                    { label: 'Conteúdo', href: '/backoffice/conteudo/calendario' },
                    { label: 'Design Studio' },
                ]}
                actions={
                    <div className="flex items-center gap-2">
                        <ConnBadge status={connStatus} />
                        <button
                            onClick={() => setTab('settings')}
                            className="flex items-center gap-2 h-9 px-3 rounded-lg text-xs font-semibold transition-all"
                            style={{ background: T.elevated, color: T.textMuted, border: `1px solid ${T.border}` }}
                        >
                            <Settings size={14} />
                            Configurar
                        </button>
                    </div>
                }
            />

            {/* KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                <KPICard label="Templates"  value={String(REALESTATE_SKILLS.length)}  icon={<Layout size={14} />}         size="sm" />
                <KPICard label="Categorias" value={String(categories.length - 1)}     icon={<Filter size={14} />}         size="sm" accent="blue" />
                <KPICard label="Gerados"    value={String(history.length)}             icon={<Sparkles size={14} />}       size="sm" accent="green" />
                <KPICard label="Open Design" value={connStatus === 'ok' ? 'ON' : 'OFF'} icon={<Server size={14} />}       size="sm" accent={connStatus === 'ok' ? 'green' : undefined} />
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 rounded-xl" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                {([
                    { id: 'studio',   label: 'Criar Design',   icon: Wand2       },
                    { id: 'skills',   label: 'Templates',      icon: Layout      },
                    { id: 'systems',  label: 'Design Systems', icon: Palette     },
                    { id: 'history',  label: 'Histórico',      icon: Clock       },
                    { id: 'settings', label: 'Configurações',  icon: Settings    },
                ] as const).map(t => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold transition-all"
                        style={{
                            background: tab === t.id ? T.elevated : 'transparent',
                            color: tab === t.id ? T.accent : T.textMuted,
                            border: tab === t.id ? `1px solid ${T.border}` : '1px solid transparent',
                        }}
                    >
                        <t.icon size={13} />
                        <span className="hidden sm:inline">{t.label}</span>
                    </button>
                ))}
            </div>

            {/* ── Tab: Studio ──────────────────────────────────────── */}
            <AnimatePresence mode="wait">
                {tab === 'studio' && (
                    <motion.div key="studio" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left: form */}
                        <div className="space-y-4">
                            {/* Skill selector */}
                            <div className="rounded-xl p-5" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                                <h3 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: T.textMuted }}>1. Escolha o Template</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {REALESTATE_SKILLS.slice(0, 6).map(skill => (
                                        <button
                                            key={skill.id}
                                            onClick={() => { setSelectedSkill(skill); setFormValues({}) }}
                                            className="flex items-center gap-2.5 p-3 rounded-lg text-left transition-all"
                                            style={{
                                                background: selectedSkill?.id === skill.id ? skill.bg : T.elevated,
                                                border: `1px solid ${selectedSkill?.id === skill.id ? skill.color + '40' : T.border}`,
                                                color: selectedSkill?.id === skill.id ? skill.color : T.text,
                                            }}
                                        >
                                            <skill.icon size={14} style={{ flexShrink: 0, color: skill.color }} />
                                            <span className="text-xs font-semibold leading-tight">{skill.name}</span>
                                        </button>
                                    ))}
                                </div>
                                <button
                                    onClick={() => setTab('skills')}
                                    className="mt-3 w-full flex items-center justify-center gap-1.5 h-8 rounded-lg text-xs font-semibold transition-all"
                                    style={{ background: T.elevated, color: T.textMuted, border: `1px solid ${T.border}` }}
                                >
                                    <Plus size={12} />
                                    Ver todos os templates
                                </button>
                            </div>

                            {/* Form */}
                            {selectedSkill && (
                                <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                                    className="rounded-xl p-5" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                                    <div className="flex items-center gap-2 mb-4">
                                        <selectedSkill.icon size={16} style={{ color: selectedSkill.color }} />
                                        <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: T.textMuted }}>
                                            2. Preencha os Dados
                                        </h3>
                                    </div>
                                    <div className="space-y-3">
                                        {questions.map(q => (
                                            <div key={q.id}>
                                                <label className="text-[10px] font-bold uppercase tracking-wider mb-1 block" style={{ color: T.textMuted }}>
                                                    {q.label}{q.required && <span style={{ color: T.accent }}> *</span>}
                                                </label>
                                                {q.type === 'textarea' ? (
                                                    <textarea
                                                        rows={3}
                                                        value={formValues[q.id] ?? ''}
                                                        onChange={e => setFormValues(prev => ({ ...prev, [q.id]: e.target.value }))}
                                                        placeholder={q.placeholder}
                                                        className="w-full p-3 rounded-lg text-xs resize-none"
                                                        style={{ background: T.elevated, color: T.text, border: `1px solid ${T.border}` }}
                                                    />
                                                ) : q.type === 'select' ? (
                                                    <select
                                                        value={formValues[q.id] ?? ''}
                                                        onChange={e => setFormValues(prev => ({ ...prev, [q.id]: e.target.value }))}
                                                        className="w-full h-9 px-3 rounded-lg text-xs"
                                                        style={{ background: T.elevated, color: T.text, border: `1px solid ${T.border}` }}
                                                    >
                                                        <option value="">Selecione...</option>
                                                        {q.options?.map(o => <option key={o} value={o}>{o}</option>)}
                                                    </select>
                                                ) : (
                                                    <input
                                                        type="text"
                                                        value={formValues[q.id] ?? ''}
                                                        onChange={e => setFormValues(prev => ({ ...prev, [q.id]: e.target.value }))}
                                                        placeholder={q.placeholder}
                                                        className="w-full h-9 px-3 rounded-lg text-xs"
                                                        style={{ background: T.elevated, color: T.text, border: `1px solid ${T.border}` }}
                                                    />
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        onClick={handleGenerate}
                                        disabled={generating}
                                        className="relative overflow-hidden mt-5 w-full h-11 rounded-lg text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                                        style={{ background: '#0A1624', color: '#fff', border: `1px solid ${selectedSkill.color}40` }}
                                    >
                                        {generating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                                        {generating ? 'Gerando Design...' : 'Gerar Design com IA'}
                                        <span style={{ position: 'absolute', bottom: 0, left: '12%', right: '12%', height: 2, background: `linear-gradient(90deg, transparent, ${selectedSkill.color}, transparent)`, opacity: 0.7, pointerEvents: 'none' }} />
                                    </button>

                                    {connStatus !== 'ok' && (
                                        <p className="text-[10px] mt-2 text-center" style={{ color: T.textMuted }}>
                                            Open Design não conectado — usando IA IMI (Claude Sonnet)
                                        </p>
                                    )}
                                </motion.div>
                            )}

                            {!selectedSkill && (
                                <div className="rounded-xl p-8 flex flex-col items-center gap-3 text-center" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                                    <Wand2 size={28} className="opacity-25" style={{ color: T.textMuted }} />
                                    <p className="text-sm font-medium" style={{ color: T.text }}>Selecione um template acima para começar</p>
                                    <p className="text-xs" style={{ color: T.textMuted }}>Preencha os dados do imóvel e a IA gerará o design completo</p>
                                </div>
                            )}
                        </div>

                        {/* Right: preview */}
                        <div className="space-y-3">
                            <div className="rounded-xl overflow-hidden" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                                <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${T.border}` }}>
                                    <div className="flex items-center gap-2">
                                        <Eye size={14} style={{ color: T.accent }} />
                                        <span className="text-xs font-bold" style={{ color: T.text }}>Preview</span>
                                        {artifact && (
                                            <span className="text-[10px] px-2 py-0.5 rounded-lg font-semibold" style={{ background: T.elevated, color: T.textMuted }}>
                                                {artifact.name}
                                            </span>
                                        )}
                                    </div>
                                    {artifact && (
                                        <div className="flex items-center gap-1.5">
                                            <button onClick={handleCopyHTML} title="Copiar HTML" className="w-7 h-7 rounded-lg flex items-center justify-center transition-all" style={{ background: T.elevated, color: T.textMuted }}>
                                                <Copy size={12} />
                                            </button>
                                            <button onClick={handleOpenNewTab} title="Abrir em nova aba" className="w-7 h-7 rounded-lg flex items-center justify-center transition-all" style={{ background: T.elevated, color: T.textMuted }}>
                                                <ExternalLink size={12} />
                                            </button>
                                            <button onClick={handleDownload} title="Baixar HTML" className="w-7 h-7 rounded-lg flex items-center justify-center transition-all" style={{ background: T.elevated, color: T.textMuted }}>
                                                <Download size={12} />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="relative" style={{ height: 480 }}>
                                    {generating ? (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                                            <div className="relative">
                                                <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: T.elevated }}>
                                                    <Sparkles size={28} style={{ color: T.accent }} />
                                                </div>
                                                <Loader2 size={40} className="animate-spin absolute -top-2 -right-2" style={{ color: T.accent, opacity: 0.4 }} />
                                            </div>
                                            <div className="text-center">
                                                <p className="text-sm font-semibold" style={{ color: T.text }}>Gerando seu design...</p>
                                                <p className="text-xs mt-1" style={{ color: T.textMuted }}>A IA está criando o layout completo</p>
                                            </div>
                                        </div>
                                    ) : artifact?.html ? (
                                        <iframe
                                            ref={iframeRef}
                                            srcDoc={artifact.html}
                                            sandbox="allow-scripts allow-same-origin"
                                            className="w-full h-full border-0"
                                            title={artifact.name}
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
                                            <ImageIcon size={32} className="opacity-20" style={{ color: T.textMuted }} />
                                            <p className="text-sm font-medium" style={{ color: T.text }}>Preview do design aqui</p>
                                            <p className="text-xs" style={{ color: T.textMuted }}>Selecione um template, preencha os dados e clique em &quot;Gerar Design&quot;</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Export options */}
                            {artifact && (
                                <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                                    className="rounded-xl p-4" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                                    <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: T.textMuted }}>Exportar</p>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { label: 'HTML', icon: Code, action: handleDownload },
                                            { label: 'Nova aba', icon: ExternalLink, action: handleOpenNewTab },
                                            { label: 'Copiar', icon: Copy, action: handleCopyHTML },
                                        ].map(opt => (
                                            <button key={opt.label} onClick={opt.action}
                                                className="flex flex-col items-center gap-1.5 p-3 rounded-lg transition-all text-center"
                                                style={{ background: T.elevated, color: T.textMuted, border: `1px solid ${T.border}` }}>
                                                <opt.icon size={14} />
                                                <span className="text-[10px] font-semibold">{opt.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                )}

                {/* ── Tab: Skills ──────────────────────────────────────── */}
                {tab === 'skills' && (
                    <motion.div key="skills" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="space-y-4">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative flex-1">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: T.textMuted }} />
                                <input
                                    value={skillSearch}
                                    onChange={e => setSkillSearch(e.target.value)}
                                    placeholder="Buscar templates..."
                                    className="w-full h-9 pl-9 pr-3 rounded-lg text-xs"
                                    style={{ background: T.surface, color: T.text, border: `1px solid ${T.border}` }}
                                />
                            </div>
                            <div className="flex gap-1 flex-wrap">
                                {categories.map(cat => (
                                    <button key={cat} onClick={() => setActiveCategory(cat)}
                                        className="h-9 px-3 rounded-lg text-xs font-semibold transition-all"
                                        style={{
                                            background: activeCategory === cat ? T.accent : T.elevated,
                                            color: activeCategory === cat ? T.surface : T.textMuted,
                                        }}>
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredSkills.map((skill, i) => (
                                <motion.button
                                    key={skill.id}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.04 }}
                                    onClick={() => { setSelectedSkill(skill); setFormValues({}); setTab('studio') }}
                                    className="p-5 rounded-xl text-left transition-all group"
                                    style={{ background: T.surface, border: `1px solid ${T.border}` }}
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: skill.bg }}>
                                            <skill.icon size={18} style={{ color: skill.color }} />
                                        </div>
                                        <span className="text-[9px] font-bold uppercase px-2 py-1 rounded-lg" style={{ background: T.elevated, color: T.textMuted }}>
                                            {skill.category}
                                        </span>
                                    </div>
                                    <h3 className="text-sm font-bold mb-1.5" style={{ color: T.text }}>{skill.name}</h3>
                                    <p className="text-xs leading-relaxed" style={{ color: T.textMuted }}>{skill.description}</p>
                                    <div className="mt-4 flex items-center gap-1.5" style={{ color: skill.color }}>
                                        <span className="text-[10px] font-bold uppercase">Usar template</span>
                                        <ChevronRight size={11} />
                                    </div>
                                </motion.button>
                            ))}
                        </div>

                        {connStatus === 'ok' && remoteSkills.length > 0 && (
                            <div className="mt-8">
                                <h3 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: T.textMuted }}>
                                    Skills do Open Design ({remoteSkills.length})
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {remoteSkills.map(sk => (
                                        <div key={sk.id} className="p-4 rounded-xl" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                                            <div className="flex items-center gap-2 mb-2">
                                                <Package size={14} style={{ color: T.accent }} />
                                                <span className="text-xs font-bold" style={{ color: T.text }}>{sk.name}</span>
                                            </div>
                                            {sk.description && <p className="text-xs" style={{ color: T.textMuted }}>{sk.description}</p>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* ── Tab: Design Systems ──────────────────────────────── */}
                {tab === 'systems' && (
                    <motion.div key="systems" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="space-y-4">
                        {connStatus !== 'ok' ? (
                            <SetupPrompt onConfigure={() => setTab('settings')} />
                        ) : loadingSkills ? (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {Array.from({ length: 9 }).map((_, i) => (
                                    <div key={i} className="h-24 rounded-xl animate-pulse" style={{ background: T.surface }} />
                                ))}
                            </div>
                        ) : (
                            <>
                                <p className="text-xs" style={{ color: T.textMuted }}>
                                    {remoteSystems.length > 0
                                        ? `${remoteSystems.length} design systems disponíveis no seu Open Design`
                                        : 'Conecte ao Open Design para ver os 72 design systems disponíveis'}
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {remoteSystems.map((ds, i) => (
                                        <motion.div key={ds.id}
                                            initial={{ opacity: 0, y: 4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.03 }}
                                            className="p-4 rounded-xl" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                                            <div className="flex items-center gap-2 mb-1">
                                                <Star size={12} style={{ color: T.accent }} />
                                                <span className="text-xs font-bold" style={{ color: T.text }}>{ds.name}</span>
                                            </div>
                                            {ds.description && <p className="text-xs" style={{ color: T.textMuted }}>{ds.description}</p>}
                                        </motion.div>
                                    ))}
                                </div>
                            </>
                        )}
                    </motion.div>
                )}

                {/* ── Tab: History ─────────────────────────────────────── */}
                {tab === 'history' && (
                    <motion.div key="history" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        {history.length === 0 ? (
                            <div className="py-20 flex flex-col items-center gap-3 text-center">
                                <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: T.surface }}>
                                    <Clock size={24} style={{ color: T.textMuted, opacity: 0.4 }} />
                                </div>
                                <p className="text-sm font-semibold" style={{ color: T.text }}>Nenhum design gerado ainda</p>
                                <p className="text-xs" style={{ color: T.textMuted }}>Seus designs aparecerão aqui após a geração</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {history.map(item => (
                                    <div key={item.id} className="flex items-center gap-4 p-4 rounded-xl"
                                        style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                                        <div className="w-20 h-14 rounded-lg overflow-hidden flex-shrink-0" style={{ background: T.elevated }}>
                                            {item.html ? (
                                                <iframe srcDoc={item.html} sandbox="allow-scripts" className="w-full h-full border-0 scale-[0.5] origin-top-left pointer-events-none" style={{ width: '200%', height: '200%' }} title={item.name} />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <ImageIcon size={16} style={{ color: T.textMuted, opacity: 0.3 }} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold truncate" style={{ color: T.text }}>{item.name}</p>
                                            <p className="text-xs" style={{ color: T.textMuted }}>
                                                {item.skill} · {new Date(item.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <button onClick={() => { setArtifact(item); setTab('studio') }}
                                                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                                                style={{ background: T.elevated, color: T.textMuted }}>
                                                <Eye size={13} />
                                            </button>
                                            <button onClick={() => { if (item.html) { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([item.html], { type: 'text/html' })); a.download = `${item.name.replace(/\s+/g, '-')}.html`; a.click() } }}
                                                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                                                style={{ background: T.elevated, color: T.textMuted }}>
                                                <Download size={13} />
                                            </button>
                                            <button onClick={() => deleteArtifact(item.id)}
                                                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                                                style={{ background: T.elevated, color: T.error }}>
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}

                {/* ── Tab: Settings ────────────────────────────────────── */}
                {tab === 'settings' && (
                    <motion.div key="settings" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Connection config */}
                        <div className="rounded-xl p-6 space-y-5" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                            <div className="flex items-center gap-2">
                                <Server size={16} style={{ color: T.accent }} />
                                <h3 className="text-sm font-bold" style={{ color: T.text }}>Conectar ao Open Design</h3>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest mb-1.5 block" style={{ color: T.textMuted }}>
                                    URL do Servidor Open Design
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="url"
                                        value={serverUrl}
                                        onChange={e => setServerUrl(e.target.value)}
                                        placeholder="http://localhost:7456"
                                        className="flex-1 h-9 px-3 rounded-lg text-xs"
                                        style={{ background: T.elevated, color: T.text, border: `1px solid ${T.border}` }}
                                    />
                                    <button
                                        onClick={saveAndConnect}
                                        disabled={connStatus === 'checking'}
                                        className="h-9 px-4 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-50"
                                        style={{ background: T.accent, color: T.surface }}>
                                        {connStatus === 'checking' ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
                                        Conectar
                                    </button>
                                </div>
                                <ConnBadge status={connStatus} className="mt-2" />
                            </div>

                            <div className="rounded-lg p-4 space-y-2" style={{ background: T.elevated, border: `1px solid ${T.border}` }}>
                                <p className="text-xs font-bold" style={{ color: T.text }}>Como iniciar o Open Design:</p>
                                <div className="space-y-1.5">
                                    {[
                                        { step: '1', cmd: 'git clone https://github.com/nexu-io/open-design.git' },
                                        { step: '2', cmd: 'cd open-design && pnpm install' },
                                        { step: '3', cmd: 'pnpm tools-dev run web' },
                                    ].map(item => (
                                        <div key={item.step} className="flex items-start gap-2">
                                            <span className="text-[10px] font-bold w-4 flex-shrink-0 mt-0.5" style={{ color: T.accent }}>{item.step}.</span>
                                            <code className="text-[10px] font-mono break-all" style={{ color: T.textMuted }}>{item.cmd}</code>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-[10px] mt-2" style={{ color: T.textMuted }}>
                                    Ou via Docker: <code className="px-1 rounded" style={{ background: T.surface }}>docker compose up -d</code> (porta 7456)
                                </p>
                            </div>
                        </div>

                        {/* About */}
                        <div className="rounded-xl p-6 space-y-4" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                            <div className="flex items-center gap-2">
                                <BookOpen size={16} style={{ color: T.accent }} />
                                <h3 className="text-sm font-bold" style={{ color: T.text }}>Sobre o Open Design</h3>
                            </div>

                            <div className="space-y-3">
                                {[
                                    { icon: Layout, label: '72 Design Systems', desc: 'Linear, Stripe, Vercel, Apple e mais' },
                                    { icon: Sparkles, label: '31 Skills Prontas', desc: 'Protótipos, decks, emails, dashboards' },
                                    { icon: Code, label: 'Export Múltiplo', desc: 'HTML, PDF, PPTX, ZIP, Markdown' },
                                    { icon: Globe, label: 'Local-First', desc: 'Roda no seu computador ou servidor' },
                                ].map(item => (
                                    <div key={item.label} className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: T.elevated }}>
                                            <item.icon size={14} style={{ color: T.accent }} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold" style={{ color: T.text }}>{item.label}</p>
                                            <p className="text-[10px]" style={{ color: T.textMuted }}>{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-3" style={{ borderTop: `1px solid ${T.border}` }}>
                                <p className="text-[10px]" style={{ color: T.textMuted }}>
                                    O Design Studio também funciona <strong style={{ color: T.text }}>sem o Open Design</strong> — a IA IMI (Claude Sonnet) gerará o design diretamente.
                                    Conectar ao Open Design adiciona 72 design systems profissionais e 31 skills especializadas.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

// ── Sub-components ────────────────────────────────────────────────
function ConnBadge({ status, className = '' }: { status: ConnectionStatus; className?: string }) {
    const configs = {
        idle:     { icon: AlertCircle, label: 'Não configurado', color: T.textMuted, bg: T.elevated },
        checking: { icon: Loader2,     label: 'Verificando...',  color: T.textMuted, bg: T.elevated },
        ok:       { icon: CheckCircle2, label: 'Conectado',      color: 'var(--success)', bg: 'rgba(16,185,129,0.10)' },
        error:    { icon: XCircle,      label: 'Erro de conexão', color: 'var(--error)', bg: 'rgba(239,68,68,0.10)' },
    }
    const cfg = configs[status]
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold ${className}`}
            style={{ background: cfg.bg, color: cfg.color }}>
            <cfg.icon size={11} className={status === 'checking' ? 'animate-spin' : ''} />
            Open Design: {cfg.label}
        </span>
    )
}

function SetupPrompt({ onConfigure }: { onConfigure: () => void }) {
    return (
        <div className="py-16 flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: T.surface }}>
                <Server size={24} style={{ color: T.textMuted, opacity: 0.5 }} />
            </div>
            <div>
                <p className="text-sm font-semibold" style={{ color: T.text }}>Open Design não conectado</p>
                <p className="text-xs mt-1" style={{ color: T.textMuted }}>Configure o servidor para acessar os 72 design systems</p>
            </div>
            <button onClick={onConfigure}
                className="flex items-center gap-2 h-9 px-4 rounded-lg text-xs font-bold transition-all"
                style={{ background: T.accent, color: T.surface }}>
                <Settings size={14} />
                Configurar Open Design
            </button>
        </div>
    )
}
