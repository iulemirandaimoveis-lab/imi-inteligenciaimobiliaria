/**
 * SALVAR EM: src/app/(backoffice)/backoffice/conteudo/automacao/page.tsx
 *
 * Fluxo multi-step de geração de conteúdo com IA.
 * Steps: Tema → Roteiro → Imagem → Vídeo → Calendário
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    Sparkles,
    ChevronRight,
    ChevronLeft,
    Check,
    Loader2,
    Lightbulb,
    FileText,
    Image,
    Video,
    Calendar,
    RefreshCw,
    Copy,
    Save,
    Instagram,
    Linkedin,
    Facebook,
    Youtube,
    Mail,
    Globe,
    Zap,
    Settings,
    Play,
    Plus,
    X,
    AlertCircle,
} from 'lucide-react'

// ⚠️ NÃO MODIFICAR - Temas sugeridos contextualizados Recife
const TEMAS_SUGERIDOS = [
    {
        id: 1,
        titulo: 'Valorização de Imóveis em Boa Viagem — Análise 2026',
        objetivo: 'Educar investidores sobre tendências do mercado local',
        publico: 'Investidores e family offices',
        formato: 'Blog + LinkedIn',
        palavras_chave: ['valorização', 'Boa Viagem', 'investimento', 'imóveis premium'],
    },
    {
        id: 2,
        titulo: 'Por que Candeias está se tornando o novo polo premium de Recife',
        objetivo: 'Posicionar IMI como autoridade em tendências de mercado',
        publico: 'Compradores de alto padrão',
        formato: 'Instagram Carrossel',
        palavras_chave: ['Candeias', 'premium', 'localização', 'potencial'],
    },
    {
        id: 3,
        titulo: 'Guia: Como Estruturar Patrimônio Imobiliário em Pernambuco',
        objetivo: 'Captar leads de perfil patrimonial elevado',
        publico: 'Famílias de alta renda, médicos, advogados',
        formato: 'E-book + Email marketing',
        palavras_chave: ['patrimônio', 'estruturação', 'Pernambuco', 'holding'],
    },
    {
        id: 4,
        titulo: 'Investidores Internacionais no Mercado de Recife — Oportunidades',
        objetivo: 'Atrair investidores do exterior para o portfólio IMI',
        publico: 'Family offices internacionais, brasileiros no exterior',
        formato: 'LinkedIn + Email EN',
        palavras_chave: ['international investment', 'Recife', 'Brazil', 'real estate'],
    },
]

// ⚠️ NÃO MODIFICAR - Plataformas disponíveis
const PLATAFORMAS = [
    { id: 'instagram', label: 'Instagram', icon: Instagram, color: 'text-pink-600 bg-pink-50' },
    { id: 'linkedin', label: 'LinkedIn', icon: Linkedin, color: 'text-blue-700 bg-blue-50' },
    { id: 'facebook', label: 'Facebook', icon: Facebook, color: 'text-blue-600 bg-blue-50' },
    { id: 'youtube', label: 'YouTube', icon: Youtube, color: 'text-red-600 bg-red-50' },
    { id: 'email', label: 'E-mail', icon: Mail, color: 'text-gray-700 bg-gray-100' },
    { id: 'blog', label: 'Blog/Site', icon: Globe, color: 'text-accent-600 bg-accent-50' },
]

// ⚠️ NÃO MODIFICAR - Modelos disponíveis
const MODELOS_TEXTO = [
    { id: 'claude-sonnet', label: 'Claude Sonnet', desc: 'Melhor qualidade', badge: 'Recomendado', badgeColor: 'bg-accent-100 text-accent-700' },
    { id: 'gpt-4o', label: 'GPT-4o', desc: 'Alta criatividade', badge: 'OpenAI', badgeColor: 'bg-green-100 text-green-700' },
    { id: 'gemini-pro', label: 'Gemini Pro', desc: 'Rápido e eficiente', badge: 'Google', badgeColor: 'bg-blue-100 text-blue-700' },
    { id: 'gemini-flash', label: 'Gemini Flash', desc: 'Custo mínimo', badge: 'Econômico', badgeColor: 'bg-gray-100 text-gray-600' },
]

// ⚠️ NÃO MODIFICAR - Histórico de fluxos mockados
const HISTORICO_FLUXOS = [
    {
        id: 1,
        tema: 'Reserva Atlantis — Lançamento Fase 2',
        modelo: 'Claude Sonnet',
        plataformas: ['Instagram', 'LinkedIn'],
        status: 'completo',
        criadoEm: '2026-02-17T14:30:00',
        pecas: 4,
        custo_usd: 0.12,
    },
    {
        id: 2,
        tema: 'Guia: Investir em Imóveis em Boa Viagem',
        modelo: 'Claude Sonnet',
        plataformas: ['Blog', 'LinkedIn', 'E-mail'],
        status: 'completo',
        criadoEm: '2026-02-15T10:00:00',
        pecas: 5,
        custo_usd: 0.18,
    },
    {
        id: 3,
        tema: 'Pina — Bairro em Alta no Mercado Premium',
        modelo: 'GPT-4o',
        plataformas: ['Instagram'],
        status: 'rascunho',
        criadoEm: '2026-02-12T16:00:00',
        pecas: 2,
        custo_usd: 0.06,
    },
]

// ─── Types ────────────────────────────────────────────────────────────────────

interface FlowState {
    step: number
    tema: {
        input: string
        selecionado: (typeof TEMAS_SUGERIDOS)[0] | null
        resultado: string
        loading: boolean
    }
    roteiro: {
        plataformas: string[]
        modelo: string
        resultado: string
        loading: boolean
    }
    imagem: {
        prompt: string
        modelo: string
        resultado: string
        url: string
        loading: boolean
    }
    video: {
        prompt: string
        duracao: string
        resultado: string
        loading: boolean
    }
    calendario: {
        data: string
        horario: string
        plataformas: string[]
        salvo: boolean
    }
}

const STEPS = [
    { id: 0, label: 'Tema', icon: Lightbulb, color: 'text-accent-600' },
    { id: 1, label: 'Roteiro', icon: FileText, color: 'text-blue-600' },
    { id: 2, label: 'Imagem', icon: Image, color: 'text-purple-600' },
    { id: 3, label: 'Vídeo', icon: Video, color: 'text-red-600' },
    { id: 4, label: 'Calendário', icon: Calendar, color: 'text-green-600' },
]

// ─── Componente principal ─────────────────────────────────────────────────────

export default function AutomacaoPage() {
    const router = useRouter()
    const [flow, setFlow] = useState<FlowState>({
        step: 0,
        tema: { input: '', selecionado: null, resultado: '', loading: false },
        roteiro: { plataformas: ['instagram'], modelo: 'claude-sonnet', resultado: '', loading: false },
        imagem: { prompt: '', modelo: 'gemini-pro', resultado: '', url: '', loading: false },
        video: { prompt: '', duracao: '15s', resultado: '', loading: false },
        calendario: { data: '', horario: '09:00', plataformas: ['instagram'], salvo: false },
    })
    const [activeTab, setActiveTab] = useState<'novo' | 'historico'>('novo')

    const formatDate = (iso: string) =>
        new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })

    const formatCost = (usd: number) => `$${usd.toFixed(4)}`

    // ── Geração de Tema via AI Router ─────────────────────────────────────────
    const gerarTema = async () => {
        if (!flow.tema.input.trim()) return
        setFlow(f => ({ ...f, tema: { ...f.tema, loading: true, resultado: '' } }))
        try {
            const res = await fetch('/api/ai/router', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    task_type: 'tema',
                    prompt: flow.tema.input,
                    context: 'Mercado imobiliário premium, Recife/PE, público de alta renda.',
                }),
            })
            const data = await res.json()
            if (data.success) {
                // Tenta parsear JSON; se não, usa texto puro
                let resultado = data.result
                try {
                    const parsed = JSON.parse(resultado)
                    resultado = JSON.stringify(parsed, null, 2)
                } catch { }
                setFlow(f => ({ ...f, tema: { ...f.tema, loading: false, resultado } }))
            } else {
                throw new Error(data.error)
            }
        } catch {
            setFlow(f => ({
                ...f,
                tema: {
                    ...f.tema,
                    loading: false,
                    resultado: '⚠️ API não disponível. Configure ANTHROPIC_API_KEY no .env.local para usar IA real.',
                },
            }))
        }
    }

    // ── Geração de Roteiro ────────────────────────────────────────────────────
    const gerarRoteiro = async () => {
        const temaTexto = flow.tema.selecionado?.titulo || flow.tema.input
        if (!temaTexto) return
        setFlow(f => ({ ...f, roteiro: { ...f.roteiro, loading: true, resultado: '' } }))
        try {
            const plataformasStr = flow.roteiro.plataformas.join(', ')
            const res = await fetch('/api/ai/router', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    task_type: 'roteiro',
                    prompt: `Crie um roteiro completo de conteúdo para: "${temaTexto}"\n\nPlataformas: ${plataformasStr}\n\nIncluir: gancho de abertura, 3-5 pontos principais, call-to-action específico por plataforma.`,
                    model_override: flow.roteiro.modelo,
                    platform: flow.roteiro.plataformas[0] as any,
                }),
            })
            const data = await res.json()
            if (data.success) {
                setFlow(f => ({ ...f, roteiro: { ...f.roteiro, loading: false, resultado: data.result } }))
            } else throw new Error(data.error)
        } catch {
            setFlow(f => ({
                ...f,
                roteiro: {
                    ...f.roteiro,
                    loading: false,
                    resultado: '⚠️ API não disponível. Configure as variáveis de ambiente para usar IA real.',
                },
            }))
        }
    }

    // ── Otimização de Prompt de Imagem ────────────────────────────────────────
    const otimizarPromptImagem = async () => {
        const contexto = flow.tema.selecionado?.titulo || flow.tema.input
        if (!contexto && !flow.imagem.prompt) return
        setFlow(f => ({ ...f, imagem: { ...f.imagem, loading: true } }))
        try {
            const res = await fetch('/api/ai/router', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    task_type: 'imagem_prompt',
                    prompt: flow.imagem.prompt || `Imagem para o tema: ${contexto}`,
                }),
            })
            const data = await res.json()
            if (data.success) {
                setFlow(f => ({ ...f, imagem: { ...f.imagem, loading: false, resultado: data.result } }))
            } else throw new Error(data.error)
        } catch {
            setFlow(f => ({
                ...f,
                imagem: {
                    ...f.imagem,
                    loading: false,
                    resultado: 'Luxury coastal apartment in Boa Viagem, Recife, Brazil. Modern architecture, ocean view, golden hour lighting, architectural photography, 85mm lens, f/2.8, magazine quality.',
                },
            }))
        }
    }

    // ── Gerar Vídeo (stub) ────────────────────────────────────────────────────
    const gerarVideo = async () => {
        setFlow(f => ({ ...f, video: { ...f.video, loading: true, resultado: '' } }))
        await new Promise(r => setTimeout(r, 1500))
        setFlow(f => ({
            ...f,
            video: {
                ...f.video,
                loading: false,
                resultado: JSON.stringify({
                    status: 'queued',
                    job_id: `kling_${Date.now()}`,
                    estimated_seconds: 120,
                    message: 'Vídeo enfileirado. Kling API será integrada na próxima versão.',
                }, null, 2),
            },
        }))
    }

    // ── Salvar no Calendário ──────────────────────────────────────────────────
    const salvarCalendario = () => {
        setFlow(f => ({ ...f, calendario: { ...f.calendario, salvo: true } }))
    }

    const nextStep = () => setFlow(f => ({ ...f, step: Math.min(f.step + 1, 4) }))
    const prevStep = () => setFlow(f => ({ ...f, step: Math.max(f.step - 1, 0) }))

    const togglePlataforma = (pid: string) => {
        setFlow(f => ({
            ...f,
            roteiro: {
                ...f.roteiro,
                plataformas: f.roteiro.plataformas.includes(pid)
                    ? f.roteiro.plataformas.filter(p => p !== pid)
                    : [...f.roteiro.plataformas, pid],
            },
        }))
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Automação IA</h1>
                    <p className="text-sm text-gray-600 mt-1">
                        Gere conteúdo completo em minutos — do tema ao calendário
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setActiveTab('historico')}
                        className={`h-9 px-4 rounded-xl text-sm font-medium transition-colors ${activeTab === 'historico'
                                ? 'bg-gray-900 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        Histórico
                    </button>
                    <button
                        onClick={() => setActiveTab('novo')}
                        className={`flex items-center gap-2 h-9 px-4 rounded-xl text-sm font-medium transition-colors ${activeTab === 'novo'
                                ? 'bg-accent-600 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        <Sparkles size={16} />
                        Novo Fluxo
                    </button>
                </div>
            </div>

            {activeTab === 'historico' ? (
                // ── Tab Histórico ─────────────────────────────────────────────────────
                <div className="space-y-4">
                    <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
                        {HISTORICO_FLUXOS.map(fluxo => (
                            <div key={fluxo.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-accent-50 flex items-center justify-center">
                                        <Sparkles size={18} className="text-accent-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{fluxo.tema}</p>
                                        <div className="flex items-center gap-3 mt-0.5">
                                            <span className="text-xs text-gray-500">{fluxo.modelo}</span>
                                            <span className="text-xs text-gray-400">·</span>
                                            <span className="text-xs text-gray-500">{fluxo.pecas} peças</span>
                                            <span className="text-xs text-gray-400">·</span>
                                            <span className="text-xs text-gray-500">{formatCost(fluxo.custo_usd)}</span>
                                            <span className="text-xs text-gray-400">·</span>
                                            <span className="text-xs text-gray-500">{formatDate(fluxo.criadoEm)}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex gap-1">
                                        {fluxo.plataformas.map(p => (
                                            <span key={p} className="px-2 py-0.5 bg-gray-100 rounded-md text-xs text-gray-600">
                                                {p}
                                            </span>
                                        ))}
                                    </div>
                                    <span
                                        className={`px-2 py-1 rounded-lg text-xs font-medium ${fluxo.status === 'completo'
                                                ? 'bg-green-50 text-green-700'
                                                : 'bg-orange-50 text-orange-700'
                                            }`}
                                    >
                                        {fluxo.status === 'completo' ? 'Completo' : 'Rascunho'}
                                    </span>
                                    <button className="text-sm text-accent-600 hover:text-accent-700 font-medium">
                                        Continuar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                // ── Tab Novo Fluxo ────────────────────────────────────────────────────
                <div className="space-y-6">
                    {/* Stepper */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6">
                        <div className="flex items-center gap-2">
                            {STEPS.map((step, idx) => {
                                const Icon = step.icon
                                const isActive = flow.step === idx
                                const isComplete = flow.step > idx
                                return (
                                    <div key={step.id} className="flex items-center gap-2 flex-1">
                                        <button
                                            onClick={() => flow.step > idx && setFlow(f => ({ ...f, step: idx }))}
                                            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all flex-1 justify-center ${isActive
                                                    ? 'bg-accent-600 text-white shadow-sm'
                                                    : isComplete
                                                        ? 'bg-green-50 text-green-700'
                                                        : 'bg-gray-50 text-gray-400'
                                                }`}
                                        >
                                            {isComplete ? (
                                                <Check size={16} />
                                            ) : (
                                                <Icon size={16} />
                                            )}
                                            <span className="hidden sm:inline">{step.label}</span>
                                        </button>
                                        {idx < STEPS.length - 1 && (
                                            <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* ── STEP 0: TEMA ───────────────────────────────────────────────── */}
                    {flow.step === 0 && (
                        <div className="space-y-4">
                            {/* Input do tema */}
                            <div className="bg-white rounded-2xl border border-gray-100 p-6">
                                <h2 className="text-lg font-bold text-gray-900 mb-1">Defina o Tema</h2>
                                <p className="text-sm text-gray-600 mb-4">
                                    Descreva o tema ou escolha uma sugestão abaixo
                                </p>
                                <div className="space-y-3">
                                    <textarea
                                        value={flow.tema.input}
                                        onChange={e => setFlow(f => ({ ...f, tema: { ...f.tema, input: e.target.value } }))}
                                        placeholder="Ex: Por que Boa Viagem é o melhor bairro para investir em 2026..."
                                        className="w-full h-24 px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-accent-500 focus:border-transparent resize-none"
                                    />
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={gerarTema}
                                            disabled={!flow.tema.input || flow.tema.loading}
                                            className="flex items-center gap-2 h-11 px-6 bg-accent-600 text-white rounded-xl font-medium hover:bg-accent-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            {flow.tema.loading ? (
                                                <Loader2 size={18} className="animate-spin" />
                                            ) : (
                                                <Sparkles size={18} />
                                            )}
                                            {flow.tema.loading ? 'Gerando...' : 'Gerar com IA'}
                                        </button>
                                        <span className="text-xs text-gray-400 ml-2">
                                            Powered by Claude Sonnet
                                        </span>
                                    </div>
                                </div>

                                {/* Output IA */}
                                {flow.tema.resultado && (
                                    <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Resultado da IA</span>
                                            <button
                                                onClick={() => navigator.clipboard.writeText(flow.tema.resultado)}
                                                className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
                                            >
                                                <Copy size={12} />
                                                Copiar
                                            </button>
                                        </div>
                                        <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">
                                            {flow.tema.resultado}
                                        </pre>
                                    </div>
                                )}
                            </div>

                            {/* Temas sugeridos */}
                            <div className="bg-white rounded-2xl border border-gray-100 p-6">
                                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
                                    Temas Sugeridos — Mercado Recife
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {TEMAS_SUGERIDOS.map(tema => (
                                        <button
                                            key={tema.id}
                                            onClick={() =>
                                                setFlow(f => ({
                                                    ...f,
                                                    tema: { ...f.tema, selecionado: tema, input: tema.titulo },
                                                }))
                                            }
                                            className={`text-left p-4 rounded-xl border transition-all ${flow.tema.selecionado?.id === tema.id
                                                    ? 'border-accent-500 bg-accent-50'
                                                    : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                                                }`}
                                        >
                                            <p className="text-sm font-medium text-gray-900 mb-1">{tema.titulo}</p>
                                            <p className="text-xs text-gray-500 mb-2">{tema.objetivo}</p>
                                            <div className="flex items-center gap-2">
                                                <span className="px-2 py-0.5 bg-gray-100 rounded-md text-xs text-gray-600">
                                                    {tema.formato}
                                                </span>
                                                <span className="px-2 py-0.5 bg-gray-100 rounded-md text-xs text-gray-600">
                                                    {tema.publico}
                                                </span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── STEP 1: ROTEIRO ────────────────────────────────────────────── */}
                    {flow.step === 1 && (
                        <div className="space-y-4">
                            <div className="bg-white rounded-2xl border border-gray-100 p-6">
                                <h2 className="text-lg font-bold text-gray-900 mb-1">Gerar Roteiro</h2>
                                <p className="text-sm text-gray-600 mb-4">
                                    Tema selecionado:{' '}
                                    <span className="font-medium text-gray-900">
                                        {flow.tema.selecionado?.titulo || flow.tema.input}
                                    </span>
                                </p>

                                {/* Seleção de plataformas */}
                                <div className="mb-4">
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                                        Plataformas
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {PLATAFORMAS.map(p => {
                                            const Icon = p.icon
                                            const selected = flow.roteiro.plataformas.includes(p.id)
                                            return (
                                                <button
                                                    key={p.id}
                                                    onClick={() => togglePlataforma(p.id)}
                                                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${selected
                                                            ? `${p.color} border-2 border-current`
                                                            : 'bg-gray-50 text-gray-500 border-2 border-transparent hover:bg-gray-100'
                                                        }`}
                                                >
                                                    <Icon size={16} />
                                                    {p.label}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>

                                {/* Seleção de modelo */}
                                <div className="mb-4">
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                                        Modelo de IA
                                    </label>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                        {MODELOS_TEXTO.map(m => (
                                            <button
                                                key={m.id}
                                                onClick={() => setFlow(f => ({ ...f, roteiro: { ...f.roteiro, modelo: m.id } }))}
                                                className={`p-3 rounded-xl border text-left transition-all ${flow.roteiro.modelo === m.id
                                                        ? 'border-accent-500 bg-accent-50'
                                                        : 'border-gray-100 hover:border-gray-200'
                                                    }`}
                                            >
                                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${m.badgeColor}`}>
                                                    {m.badge}
                                                </span>
                                                <p className="text-sm font-medium text-gray-900 mt-1">{m.label}</p>
                                                <p className="text-xs text-gray-500">{m.desc}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    onClick={gerarRoteiro}
                                    disabled={flow.roteiro.plataformas.length === 0 || flow.roteiro.loading}
                                    className="flex items-center gap-2 h-11 px-6 bg-accent-600 text-white rounded-xl font-medium hover:bg-accent-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {flow.roteiro.loading ? <Loader2 size={18} className="animate-spin" /> : <Zap size={18} />}
                                    {flow.roteiro.loading ? 'Gerando roteiro...' : 'Gerar Roteiro'}
                                </button>
                            </div>

                            {/* Resultado roteiro */}
                            {flow.roteiro.resultado && (
                                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-sm font-bold text-gray-900">Roteiro Gerado</h3>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => navigator.clipboard.writeText(flow.roteiro.resultado)}
                                                className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 h-8 px-3 rounded-lg hover:bg-gray-100"
                                            >
                                                <Copy size={12} />
                                                Copiar
                                            </button>
                                            <button
                                                onClick={gerarRoteiro}
                                                className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 h-8 px-3 rounded-lg hover:bg-gray-100"
                                            >
                                                <RefreshCw size={12} />
                                                Regenerar
                                            </button>
                                        </div>
                                    </div>
                                    <div className="prose prose-sm max-w-none">
                                        <pre className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed bg-gray-50 rounded-xl p-4 font-sans">
                                            {flow.roteiro.resultado}
                                        </pre>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── STEP 2: IMAGEM ─────────────────────────────────────────────── */}
                    {flow.step === 2 && (
                        <div className="space-y-4">
                            <div className="bg-white rounded-2xl border border-gray-100 p-6">
                                <h2 className="text-lg font-bold text-gray-900 mb-1">Gerar Imagem</h2>
                                <p className="text-sm text-gray-600 mb-4">
                                    Descreva a imagem ou deixe a IA otimizar o prompt automaticamente
                                </p>

                                <div className="space-y-3">
                                    <textarea
                                        value={flow.imagem.prompt}
                                        onChange={e => setFlow(f => ({ ...f, imagem: { ...f.imagem, prompt: e.target.value } }))}
                                        placeholder="Ex: Apartamento premium com vista para o mar em Boa Viagem, pôr do sol dourado..."
                                        className="w-full h-20 px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-accent-500 resize-none"
                                    />
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={otimizarPromptImagem}
                                            disabled={flow.imagem.loading}
                                            className="flex items-center gap-2 h-10 px-4 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 disabled:opacity-50"
                                        >
                                            {flow.imagem.loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                                            Otimizar Prompt com IA
                                        </button>
                                        <span className="text-xs text-gray-400">Claude Haiku</span>
                                    </div>
                                </div>

                                {flow.imagem.resultado && (
                                    <div className="mt-4 p-4 bg-purple-50 rounded-xl border border-purple-100">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-bold text-purple-700 uppercase tracking-wider">
                                                Prompt Otimizado
                                            </span>
                                            <button
                                                onClick={() => navigator.clipboard.writeText(flow.imagem.resultado)}
                                                className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700"
                                            >
                                                <Copy size={12} />
                                                Copiar
                                            </button>
                                        </div>
                                        <p className="text-sm text-purple-900 leading-relaxed">{flow.imagem.resultado}</p>
                                    </div>
                                )}

                                {/* Integração futura */}
                                <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-100 flex items-start gap-3">
                                    <AlertCircle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-amber-900">Geração de imagem via API</p>
                                        <p className="text-xs text-amber-700 mt-0.5">
                                            Conecte Gemini Imagen, DALL-E 3 ou Midjourney para gerar imagens diretamente.
                                            O prompt otimizado acima pode ser usado em qualquer ferramenta de geração.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── STEP 3: VÍDEO ──────────────────────────────────────────────── */}
                    {flow.step === 3 && (
                        <div className="space-y-4">
                            <div className="bg-white rounded-2xl border border-gray-100 p-6">
                                <h2 className="text-lg font-bold text-gray-900 mb-1">Gerar Vídeo</h2>
                                <p className="text-sm text-gray-600 mb-4">
                                    Crie vídeos curtos para Reels e Stories com Kling AI
                                </p>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                                            Script do Vídeo
                                        </label>
                                        <textarea
                                            value={flow.video.prompt}
                                            onChange={e => setFlow(f => ({ ...f, video: { ...f.video, prompt: e.target.value } }))}
                                            placeholder="Ex: Câmera drone sobrevoando Boa Viagem ao pôr do sol, com vista para o Reserva Atlantis..."
                                            className="w-full h-20 px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-accent-500 resize-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                                            Duração
                                        </label>
                                        <div className="flex gap-2">
                                            {['5s', '10s', '15s', '30s'].map(d => (
                                                <button
                                                    key={d}
                                                    onClick={() => setFlow(f => ({ ...f, video: { ...f.video, duracao: d } }))}
                                                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${flow.video.duracao === d
                                                            ? 'bg-red-600 text-white'
                                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                        }`}
                                                >
                                                    {d}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <button
                                        onClick={gerarVideo}
                                        disabled={flow.video.loading}
                                        className="flex items-center gap-2 h-11 px-6 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 disabled:opacity-50"
                                    >
                                        {flow.video.loading ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} />}
                                        {flow.video.loading ? 'Processando...' : 'Gerar Vídeo com Kling'}
                                    </button>
                                </div>

                                {flow.video.resultado && (
                                    <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">
                                            Status da Geração
                                        </span>
                                        <pre className="text-xs text-gray-700 font-mono">{flow.video.resultado}</pre>
                                    </div>
                                )}

                                <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-start gap-3">
                                    <AlertCircle size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
                                    <p className="text-xs text-blue-700">
                                        Kling API será integrada na próxima fase. Por enquanto, o job fica enfileirado para
                                        processamento quando a integração for ativada.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── STEP 4: CALENDÁRIO ─────────────────────────────────────────── */}
                    {flow.step === 4 && (
                        <div className="space-y-4">
                            <div className="bg-white rounded-2xl border border-gray-100 p-6">
                                <h2 className="text-lg font-bold text-gray-900 mb-1">Agendar no Calendário</h2>
                                <p className="text-sm text-gray-600 mb-4">
                                    Defina quando e onde publicar o conteúdo gerado
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                                            Data de Publicação
                                        </label>
                                        <input
                                            type="date"
                                            value={flow.calendario.data}
                                            onChange={e => setFlow(f => ({ ...f, calendario: { ...f.calendario, data: e.target.value } }))}
                                            className="w-full h-11 px-4 border border-gray-200 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-accent-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                                            Horário
                                        </label>
                                        <input
                                            type="time"
                                            value={flow.calendario.horario}
                                            onChange={e => setFlow(f => ({ ...f, calendario: { ...f.calendario, horario: e.target.value } }))}
                                            className="w-full h-11 px-4 border border-gray-200 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-accent-500"
                                        />
                                    </div>
                                </div>

                                {/* Resumo do fluxo */}
                                <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
                                    <h3 className="text-sm font-bold text-gray-900 mb-3">Resumo do Conteúdo</h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Tema</span>
                                            <span className="text-gray-900 font-medium truncate max-w-xs text-right">
                                                {flow.tema.selecionado?.titulo || flow.tema.input || '—'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Roteiro</span>
                                            <span className={`font-medium ${flow.roteiro.resultado ? 'text-green-700' : 'text-gray-400'}`}>
                                                {flow.roteiro.resultado ? '✓ Gerado' : 'Pendente'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Imagem</span>
                                            <span className={`font-medium ${flow.imagem.resultado ? 'text-green-700' : 'text-gray-400'}`}>
                                                {flow.imagem.resultado ? '✓ Prompt otimizado' : 'Pendente'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Vídeo</span>
                                            <span className={`font-medium ${flow.video.resultado ? 'text-green-700' : 'text-gray-400'}`}>
                                                {flow.video.resultado ? '✓ Enfileirado' : 'Pendente'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Modelo usado</span>
                                            <span className="text-gray-900 font-medium">{flow.roteiro.modelo || 'claude-sonnet'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 flex items-center gap-3">
                                    <button
                                        onClick={salvarCalendario}
                                        disabled={!flow.calendario.data || flow.calendario.salvo}
                                        className="flex items-center gap-2 h-11 px-6 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 disabled:opacity-50"
                                    >
                                        {flow.calendario.salvo ? <Check size={18} /> : <Save size={18} />}
                                        {flow.calendario.salvo ? 'Salvo no Calendário!' : 'Salvar no Calendário'}
                                    </button>
                                    <button
                                        onClick={() => router.push('/backoffice/conteudo/calendario')}
                                        className="h-11 px-6 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200"
                                    >
                                        Ver Calendário
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Navegação entre steps */}
                    <div className="flex items-center justify-between pt-2">
                        <button
                            onClick={prevStep}
                            disabled={flow.step === 0}
                            className="flex items-center gap-2 h-11 px-6 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 disabled:opacity-40"
                        >
                            <ChevronLeft size={18} />
                            Anterior
                        </button>
                        <span className="text-sm text-gray-500">
                            Etapa {flow.step + 1} de {STEPS.length}
                        </span>
                        <button
                            onClick={nextStep}
                            disabled={flow.step === STEPS.length - 1}
                            className="flex items-center gap-2 h-11 px-6 bg-accent-600 text-white rounded-xl font-medium hover:bg-accent-700 disabled:opacity-40"
                        >
                            Próxima
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
