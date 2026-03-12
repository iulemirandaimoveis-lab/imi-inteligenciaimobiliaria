'use client'

import { useState, useEffect } from 'react'
import {
    Sparkles, Bot, CheckCircle2, XCircle, AlertCircle,
    RefreshCw, Play, Image as ImageIcon, FileText, Loader2,
    ChevronRight, BarChart3, Settings, Cpu, Braces, Clock, History,
} from 'lucide-react'
import { T } from '@/app/(backoffice)/lib/theme'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'

// ── Providers catalog ─────────────────────────────────────────────
const PROVIDERS = [
    {
        id: 'anthropic',
        name: 'Anthropic Claude',
        models: ['claude-sonnet-4-6', 'claude-haiku-4-5-20251001'],
        color: '#D97706',
        bg: 'rgba(217,119,6,0.12)',
        logo: '🧠',
        envKey: 'ANTHROPIC_API_KEY',
        description: 'Líder em raciocínio e copywriting. Padrão para geração de conteúdo.',
        docsUrl: 'https://docs.anthropic.com',
        tasks: ['roteiro', 'email', 'analise_lead', 'custom'],
    },
    {
        id: 'openai',
        name: 'OpenAI GPT-4o',
        models: ['gpt-4o', 'gpt-4o-mini'],
        color: '#10A37F',
        bg: 'rgba(16,163,127,0.12)',
        logo: '🤖',
        envKey: 'OPENAI_API_KEY',
        description: 'Excelente para copywriting e e-mails. Fallback automático do Claude.',
        docsUrl: 'https://platform.openai.com/docs',
        tasks: ['legenda', 'hashtags', 'email', 'roteiro'],
    },
    {
        id: 'google',
        name: 'Google Gemini',
        models: ['gemini-2.0-flash', 'gemini-2.0-flash-exp'],
        color: '#4285F4',
        bg: 'rgba(66,133,244,0.12)',
        logo: '✨',
        envKey: 'GOOGLE_AI_API_KEY',
        description: 'Geração nativa de imagens. Ideal para posts visuais de imóveis.',
        docsUrl: 'https://ai.google.dev',
        tasks: ['imagem', 'legenda', 'hashtags', 'imagem_prompt'],
    },
    {
        id: 'xai',
        name: 'xAI Grok',
        models: ['grok-2-1212'],
        color: '#1DA1F2',
        bg: 'rgba(29,161,242,0.12)',
        logo: '⚡',
        envKey: 'XAI_API_KEY',
        description: 'Conhecimento em tempo real via X. Análise de tendências de mercado.',
        docsUrl: 'https://docs.x.ai',
        tasks: ['tema', 'custom'],
    },
    {
        id: 'azure',
        name: 'Azure OpenAI',
        models: ['gpt-4o (Azure)'],
        color: '#0078D4',
        bg: 'rgba(0,120,212,0.12)',
        logo: '☁️',
        envKey: 'AZURE_OPENAI_API_KEY',
        description: 'Hospedagem Azure com compliance LGPD. GitHub Copilot Enterprise.',
        docsUrl: 'https://learn.microsoft.com/azure/ai-services/openai',
        tasks: ['roteiro', 'email'],
    },
    {
        id: 'groq',
        name: 'Groq (Ultrarrápido)',
        models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'],
        color: '#F55036',
        bg: 'rgba(245,80,54,0.12)',
        logo: '🚀',
        envKey: 'GROQ_API_KEY',
        description: '10x mais rápido que GPU. Llama 3.3 70B para respostas em <500ms.',
        docsUrl: 'https://console.groq.com/docs',
        tasks: ['tema', 'descricao', 'hashtags'],
    },
]

// ── Routing table ─────────────────────────────────────────────────
const ROUTING_TABLE = [
    { task: 'Geração de Roteiro',     primary: 'Claude Sonnet',   fallback: 'GPT-4o',        icon: FileText },
    { task: 'Caption Redes Sociais',  primary: 'Gemini Flash',    fallback: 'Claude Haiku',  icon: Sparkles },
    { task: 'Descrição de Imóvel',    primary: 'Claude Haiku',    fallback: 'Gemini Flash',  icon: FileText },
    { task: 'Hashtags',               primary: 'Gemini Flash',    fallback: 'Claude Haiku',  icon: Braces   },
    { task: 'Email Marketing',        primary: 'Claude Sonnet',   fallback: 'GPT-4o',        icon: FileText },
    { task: 'Análise de Lead',        primary: 'Claude Sonnet',   fallback: 'GPT-4o',        icon: BarChart3},
    { task: 'Geração de Imagem',      primary: 'Gemini 2.0 Flash Exp', fallback: 'DALL-E 3', icon: ImageIcon},
    { task: 'Pauta / Tema',           primary: 'Claude Haiku',    fallback: 'Gemini Flash',  icon: Cpu      },
]

type TestResult = {
    model: string
    response: string
    latency: number
    cost: number
    error?: string
}

type AIRequest = {
    id: string
    task_type: string
    model_used: string
    prompt: string
    result: string | null
    cost_usd: number | null
    latency_ms: number | null
    success: boolean
    created_at: string
    user_id?: string
}

export default function IAHubPage() {
    const [providerStatus, setProviderStatus] = useState<Record<string, 'loading' | 'ok' | 'error' | 'unconfigured'>>({})
    const [testPrompt, setTestPrompt] = useState('Escreva uma legenda para Instagram de um apartamento premium com 3 quartos em Boa Viagem, Recife.')
    const [testModel, setTestModel] = useState<string>('claude-haiku')
    const [testTaskType, setTestTaskType] = useState<string>('legenda')
    const [testing, setTesting] = useState(false)
    const [testResult, setTestResult] = useState<TestResult | null>(null)
    const [imagePrompt, setImagePrompt] = useState('Sala de estar moderna em apartamento de alto padrão em Recife, vista mar, decoração minimalista')
    const [generatingImage, setGeneratingImage] = useState(false)
    const [generatedImage, setGeneratedImage] = useState<string | null>(null)

    // History from ai_requests table
    const [aiHistory, setAiHistory] = useState<AIRequest[]>([])
    const [historyLoading, setHistoryLoading] = useState(true)

    // Per-provider "Testar Conexão" state
    const [testingConn, setTestingConn] = useState<Record<string, boolean>>({})
    const [connResult, setConnResult] = useState<Record<string, 'ok' | 'fail' | null>>({})

    // Fetch AI request history from Supabase
    async function fetchAIHistory() {
        setHistoryLoading(true)
        try {
            const supabase = createClient()
            const { data, error } = await supabase
                .from('ai_requests')
                .select('id, task_type, model_used, prompt, result, cost_usd, latency_ms, success, created_at')
                .order('created_at', { ascending: false })
                .limit(20)
            if (error) {
                // Table might not exist yet — show empty state gracefully
                setAiHistory([])
            } else {
                setAiHistory(data || [])
            }
        } catch {
            setAiHistory([])
        } finally {
            setHistoryLoading(false)
        }
    }

    // Check provider health on mount
    useEffect(() => {
        checkAllProviders()
        fetchAIHistory()
    }, [])

    async function checkAllProviders() {
        const initial: Record<string, 'loading'> = {}
        PROVIDERS.forEach(p => { initial[p.id] = 'loading' })
        setProviderStatus(initial)

        // Check integration status endpoint — it detects env vars server-side
        try {
            const res = await fetch('/api/integracoes/status')
            if (res.ok) {
                const { data } = await res.json()
                const statusMap: Record<string, string> = {}
                for (const row of data || []) {
                    statusMap[row.integration_id] = row.status
                }

                // Map integration IDs to provider IDs
                const intToProvider: Record<string, string> = {
                    anthropic_claude: 'anthropic',
                    openai_gpt: 'openai',
                    google_gemini_ai: 'google',
                    xai_grok: 'xai',
                    azure_openai: 'azure',
                    groq_ai: 'groq',
                }

                const newStatus: Record<string, 'ok' | 'unconfigured'> = {}
                PROVIDERS.forEach(p => {
                    const intId = Object.entries(intToProvider).find(([, v]) => v === p.id)?.[0]
                    const intStatus = intId ? statusMap[intId] : undefined
                    newStatus[p.id] = intStatus === 'conectado' ? 'ok' : 'unconfigured'
                })
                setProviderStatus(newStatus)
            }
        } catch {
            const errStatus: Record<string, 'error'> = {}
            PROVIDERS.forEach(p => { errStatus[p.id] = 'error' })
            setProviderStatus(errStatus)
        }
    }

    async function handleTestConnection(providerId: string) {
        // Map provider ID to integration ID
        const providerToInt: Record<string, string> = {
            anthropic: 'anthropic_claude',
            openai: 'openai_gpt',
            google: 'google_gemini_ai',
            xai: 'xai_grok',
            azure: 'azure_openai',
            groq: 'groq_ai',
        }
        const integrationId = providerToInt[providerId] || providerId

        setTestingConn(prev => ({ ...prev, [providerId]: true }))
        setConnResult(prev => ({ ...prev, [providerId]: null }))

        try {
            const res = await fetch('/api/integracoes/test-connection', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ integration_id: integrationId, values: {} }),
            })
            const data = await res.json()
            setConnResult(prev => ({ ...prev, [providerId]: data.success ? 'ok' : 'fail' }))
            if (data.success) {
                setProviderStatus(prev => ({ ...prev, [providerId]: 'ok' }))
                toast.success(data.message || 'Conexão verificada!')
            } else {
                toast.error(data.message || 'Falha na conexão')
            }
        } catch {
            setConnResult(prev => ({ ...prev, [providerId]: 'fail' }))
            toast.error('Erro ao testar conexão')
        } finally {
            setTestingConn(prev => ({ ...prev, [providerId]: false }))
        }
    }

    async function handleTest() {
        if (!testPrompt.trim()) return
        setTesting(true)
        setTestResult(null)
        const start = Date.now()
        try {
            const res = await fetch('/api/ai/router', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    task_type: testTaskType,
                    prompt: testPrompt,
                    model_override: testModel,
                    max_tokens: 300,
                }),
            })
            const data = await res.json()
            const latency = Date.now() - start
            if (data.success) {
                setTestResult({
                    model: data.model_used,
                    response: data.result,
                    latency,
                    cost: data.cost_usd || 0,
                })
            } else {
                setTestResult({ model: testModel, response: '', latency, cost: 0, error: data.error || 'Erro desconhecido' })
            }
        } catch (e: any) {
            setTestResult({ model: testModel, response: '', latency: Date.now() - start, cost: 0, error: e.message })
        } finally {
            setTesting(false)
        }
    }

    async function handleGenerateImage() {
        if (!imagePrompt.trim()) return
        setGeneratingImage(true)
        setGeneratedImage(null)
        try {
            const res = await fetch('/api/ai/router', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    task_type: 'imagem_prompt',
                    prompt: imagePrompt,
                    model_override: 'gemini-flash',
                    max_tokens: 200,
                }),
            })
            const data = await res.json()
            if (data.success && data.image_url) {
                setGeneratedImage(data.image_url)
            } else {
                // Show the optimized prompt in the result (image gen requires content_item context)
                toast.success(`Prompt otimizado: ${data.result?.substring(0, 100)}...`)
                toast.info('A geração de imagem completa requer um content item no pipeline de conteúdo.')
            }
        } catch (e: any) {
            toast.error(e.message)
        } finally {
            setGeneratingImage(false)
        }
    }

    const statusIcon = (id: string) => {
        const s = providerStatus[id]
        if (s === 'loading') return <Loader2 size={14} className="animate-spin" style={{ color: T.textMuted }} />
        if (s === 'ok') return <CheckCircle2 size={14} style={{ color: T.success }} />
        if (s === 'unconfigured') return <AlertCircle size={14} style={{ color: '#F59E0B' }} />
        return <XCircle size={14} style={{ color: T.error }} />
    }

    const statusLabel = (id: string) => {
        const s = providerStatus[id]
        if (s === 'loading') return 'Verificando...'
        if (s === 'ok') return 'Configurado'
        if (s === 'unconfigured') return 'Não configurado'
        return 'Erro'
    }

    const configured = Object.values(providerStatus).filter(s => s === 'ok').length

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: T.elevated }}>
                        <Sparkles size={24} style={{ color: T.accent }} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold" style={{ color: T.text }}>Central de IA</h1>
                        <p className="text-sm mt-0.5" style={{ color: T.textMuted }}>
                            Gerencie modelos de linguagem e geração de imagens
                        </p>
                    </div>
                </div>
                <button
                    onClick={checkAllProviders}
                    className="flex items-center gap-2 h-10 px-4 rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
                    style={{ background: T.elevated, color: T.textMuted, border: `1px solid ${T.border}` }}
                >
                    <RefreshCw size={14} />
                    Verificar Status
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Providers', value: PROVIDERS.length, sub: 'suportados', color: T.accent, icon: Bot },
                    { label: 'Configurados', value: configured, sub: `de ${PROVIDERS.length}`, color: T.success, icon: CheckCircle2 },
                    { label: 'Tasks Mapeadas', value: ROUTING_TABLE.length, sub: 'com fallback', color: '#8B5CF6', icon: Braces },
                    { label: 'Modelos', value: PROVIDERS.reduce((n, p) => n + p.models.length, 0), sub: 'disponíveis', color: '#60A5FA', icon: Cpu },
                ].map((s) => (
                    <div key={s.label} className="rounded-2xl p-5" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                        <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: T.textMuted }}>{s.label}</p>
                        <div className="flex items-end justify-between">
                            <p className="text-3xl font-bold" style={{ color: T.text }}>{s.value}</p>
                            <s.icon size={20} style={{ color: s.color }} className="mb-1" />
                        </div>
                        <p className="text-[10px] font-medium mt-1" style={{ color: T.textMuted }}>{s.sub}</p>
                    </div>
                ))}
            </div>

            {/* Providers Grid */}
            <div>
                <h2 className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: T.textMuted }}>
                    Providers de IA
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {PROVIDERS.map((provider, i) => (
                        <motion.div
                            key={provider.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.06 }}
                            className="rounded-2xl p-5 flex flex-col gap-3"
                            style={{ background: T.surface, border: `1px solid ${T.border}` }}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                                        style={{ background: provider.bg }}>
                                        {provider.logo}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold" style={{ color: T.text }}>{provider.name}</p>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            {statusIcon(provider.id)}
                                            <span className="text-[10px] font-medium" style={{ color: T.textMuted }}>
                                                {statusLabel(provider.id)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <a
                                    href={`/backoffice/integracoes`}
                                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                                    style={{ background: T.elevated, color: T.textMuted }}
                                    title="Configurar"
                                >
                                    <Settings size={14} />
                                </a>
                            </div>

                            <p className="text-xs leading-relaxed" style={{ color: T.textMuted }}>
                                {provider.description}
                            </p>

                            <div className="flex flex-wrap gap-1.5">
                                {provider.models.map(m => (
                                    <span key={m} className="px-2 py-0.5 rounded-lg text-[10px] font-semibold"
                                        style={{ background: provider.bg, color: provider.color }}>
                                        {m}
                                    </span>
                                ))}
                            </div>

                            <div className="flex flex-wrap gap-1">
                                {provider.tasks.map(t => (
                                    <span key={t} className="px-1.5 py-0.5 rounded text-[9px] font-medium"
                                        style={{ background: T.elevated, color: T.textMuted }}>
                                        {t}
                                    </span>
                                ))}
                            </div>

                            {/* Status badge + Testar Conexão */}
                            <div className="flex items-center justify-between pt-2" style={{ borderTop: `1px solid ${T.border}` }}>
                                {(() => {
                                    const s = providerStatus[provider.id]
                                    const isOk = s === 'ok'
                                    return (
                                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{
                                            background: isOk ? 'rgba(16,185,129,0.12)' : 'rgba(107,114,128,0.10)',
                                            color: isOk ? '#10B981' : T.textMuted,
                                            border: `1px solid ${isOk ? 'rgba(16,185,129,0.25)' : 'rgba(107,114,128,0.18)'}`,
                                        }}>
                                            {isOk ? '● Conectado' : '○ Não Configurado'}
                                        </span>
                                    )
                                })()}
                                <button
                                    onClick={() => handleTestConnection(provider.id)}
                                    disabled={testingConn[provider.id]}
                                    className="flex items-center gap-1.5 h-7 px-3 rounded-lg text-[10px] font-semibold transition-all disabled:opacity-60"
                                    style={{
                                        background: T.elevated,
                                        color: connResult[provider.id] === 'ok' ? '#10B981'
                                            : connResult[provider.id] === 'fail' ? '#EF4444'
                                            : T.textMuted,
                                        border: `1px solid ${T.border}`,
                                    }}
                                >
                                    {testingConn[provider.id]
                                        ? <Loader2 size={11} className="animate-spin" />
                                        : connResult[provider.id] === 'ok'
                                        ? <CheckCircle2 size={11} />
                                        : connResult[provider.id] === 'fail'
                                        ? <XCircle size={11} />
                                        : <Play size={10} />}
                                    {testingConn[provider.id] ? 'Testando...'
                                        : connResult[provider.id] === 'ok' ? 'OK ✓'
                                        : connResult[provider.id] === 'fail' ? 'Falhou'
                                        : 'Testar'}
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Test Playground + Routing Table (side by side on desktop) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Test Playground */}
                <div className="rounded-2xl p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                    <div className="flex items-center gap-2 mb-4">
                        <Play size={16} style={{ color: T.accent }} />
                        <h2 className="text-sm font-bold" style={{ color: T.text }}>Playground de Testes</h2>
                    </div>

                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest mb-1 block" style={{ color: T.textMuted }}>
                                    Modelo
                                </label>
                                <select
                                    value={testModel}
                                    onChange={e => setTestModel(e.target.value)}
                                    className="w-full h-9 px-3 rounded-xl text-xs"
                                    style={{ background: T.elevated, color: T.text, border: `1px solid ${T.border}` }}
                                >
                                    <option value="claude-sonnet">Claude Sonnet</option>
                                    <option value="claude-haiku">Claude Haiku</option>
                                    <option value="gpt-4o">GPT-4o</option>
                                    <option value="gpt-4o-mini">GPT-4o-mini</option>
                                    <option value="gemini-pro">Gemini Pro</option>
                                    <option value="gemini-flash">Gemini Flash</option>
                                    <option value="grok-2">Grok-2</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest mb-1 block" style={{ color: T.textMuted }}>
                                    Tipo de Tarefa
                                </label>
                                <select
                                    value={testTaskType}
                                    onChange={e => setTestTaskType(e.target.value)}
                                    className="w-full h-9 px-3 rounded-xl text-xs"
                                    style={{ background: T.elevated, color: T.text, border: `1px solid ${T.border}` }}
                                >
                                    <option value="legenda">Legenda / Caption</option>
                                    <option value="roteiro">Roteiro</option>
                                    <option value="descricao">Descrição de Imóvel</option>
                                    <option value="hashtags">Hashtags</option>
                                    <option value="email">Email Marketing</option>
                                    <option value="tema">Pauta / Tema</option>
                                    <option value="analise_lead">Análise de Lead</option>
                                    <option value="custom">Custom</option>
                                </select>
                            </div>
                        </div>

                        <textarea
                            value={testPrompt}
                            onChange={e => setTestPrompt(e.target.value)}
                            rows={3}
                            className="w-full p-3 rounded-xl text-xs resize-none"
                            style={{ background: T.elevated, color: T.text, border: `1px solid ${T.border}` }}
                            placeholder="Digite seu prompt de teste..."
                        />

                        <button
                            onClick={handleTest}
                            disabled={testing || !testPrompt.trim()}
                            className="w-full h-10 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                            style={{ background: T.accent, color: 'white' }}
                        >
                            {testing ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
                            {testing ? 'Gerando...' : 'Testar Modelo'}
                        </button>

                        {testResult && (
                            <motion.div
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="rounded-xl p-4"
                                style={{ background: T.elevated, border: `1px solid ${T.border}` }}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: T.accent }}>
                                        {testResult.model}
                                    </span>
                                    <div className="flex items-center gap-3 text-[10px]" style={{ color: T.textMuted }}>
                                        <span>{testResult.latency}ms</span>
                                        {testResult.cost > 0 && <span>${testResult.cost.toFixed(5)}</span>}
                                    </div>
                                </div>
                                {testResult.error ? (
                                    <p className="text-xs" style={{ color: T.error }}>{testResult.error}</p>
                                ) : (
                                    <p className="text-xs leading-relaxed whitespace-pre-wrap" style={{ color: T.text }}>
                                        {testResult.response}
                                    </p>
                                )}
                            </motion.div>
                        )}
                    </div>
                </div>

                {/* Model Routing Table */}
                <div className="rounded-2xl p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                    <div className="flex items-center gap-2 mb-4">
                        <Braces size={16} style={{ color: '#8B5CF6' }} />
                        <h2 className="text-sm font-bold" style={{ color: T.text }}>Roteamento por Tarefa</h2>
                    </div>

                    <div className="space-y-1">
                        {ROUTING_TABLE.map((row) => (
                            <div key={row.task}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                                style={{ background: T.elevated }}
                            >
                                <row.icon size={14} style={{ color: T.textMuted, flexShrink: 0 }} />
                                <span className="text-xs flex-1 font-medium" style={{ color: T.text }}>{row.task}</span>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] px-2 py-0.5 rounded-lg font-semibold"
                                        style={{ background: 'rgba(72,101,129,0.15)', color: T.accent }}>
                                        {row.primary}
                                    </span>
                                    <ChevronRight size={10} style={{ color: T.textMuted }} />
                                    <span className="text-[10px] px-2 py-0.5 rounded-lg"
                                        style={{ background: T.elevated, color: T.textMuted, border: `1px solid ${T.border}` }}>
                                        {row.fallback}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <p className="text-[10px] mt-3" style={{ color: T.textMuted }}>
                        → primário | → fallback automático em caso de falha
                    </p>
                </div>
            </div>

            {/* Image Generation Test */}
            <div className="rounded-2xl p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                <div className="flex items-center gap-2 mb-4">
                    <ImageIcon size={16} style={{ color: '#4285F4' }} />
                    <h2 className="text-sm font-bold" style={{ color: T.text }}>Geração de Imagem — Gemini 2.0 Flash</h2>
                    <span className="text-[10px] px-2 py-0.5 rounded-lg font-semibold ml-1"
                        style={{ background: 'rgba(66,133,244,0.12)', color: '#4285F4' }}>
                        Experimental
                    </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="space-y-3">
                        <textarea
                            value={imagePrompt}
                            onChange={e => setImagePrompt(e.target.value)}
                            rows={3}
                            className="w-full p-3 rounded-xl text-xs resize-none"
                            style={{ background: T.elevated, color: T.text, border: `1px solid ${T.border}` }}
                            placeholder="Descreva a imagem a ser gerada..."
                        />
                        <button
                            onClick={handleGenerateImage}
                            disabled={generatingImage || !imagePrompt.trim()}
                            className="w-full h-10 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                            style={{ background: 'rgba(66,133,244,0.15)', color: '#4285F4', border: '1px solid rgba(66,133,244,0.3)' }}
                        >
                            {generatingImage ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                            {generatingImage ? 'Gerando com Gemini...' : 'Gerar Imagem'}
                        </button>
                        <p className="text-[10px]" style={{ color: T.textMuted }}>
                            Usa <strong>gemini-2.0-flash-exp</strong> com geração nativa de imagens.
                            Requer <code className="px-1 rounded" style={{ background: T.elevated }}>GOOGLE_AI_API_KEY</code> configurada.
                        </p>
                    </div>

                    <div className="rounded-xl overflow-hidden flex items-center justify-center min-h-32"
                        style={{ background: T.elevated, border: `1px solid ${T.border}` }}>
                        {generatingImage ? (
                            <div className="flex flex-col items-center gap-2">
                                <Loader2 size={24} className="animate-spin" style={{ color: '#4285F4' }} />
                                <span className="text-xs" style={{ color: T.textMuted }}>Gemini processando...</span>
                            </div>
                        ) : generatedImage ? (
                            <img src={generatedImage} alt="Generated" className="w-full h-full object-cover" />
                        ) : (
                            <div className="flex flex-col items-center gap-2 p-6 text-center">
                                <ImageIcon size={28} className="opacity-20" style={{ color: T.textMuted }} />
                                <span className="text-xs" style={{ color: T.textMuted }}>Preview da imagem gerada</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* AI Request History */}
            <div className="rounded-2xl p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                        <History size={16} style={{ color: T.accent }} />
                        <h2 className="text-sm font-bold" style={{ color: T.text }}>Histórico de Requisições</h2>
                    </div>
                    <button
                        onClick={fetchAIHistory}
                        className="flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-bold transition-all"
                        style={{ background: T.elevated, color: T.textMuted, border: `1px solid ${T.border}` }}>
                        <RefreshCw size={12} />
                        Atualizar
                    </button>
                </div>

                {historyLoading ? (
                    <div className="space-y-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-14 animate-pulse rounded-xl" style={{ background: T.elevated }} />
                        ))}
                    </div>
                ) : aiHistory.length === 0 ? (
                    <div className="py-16 flex flex-col items-center gap-3 text-center">
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                            style={{ background: T.elevated }}>
                            <Bot size={28} style={{ color: T.textMuted, opacity: 0.4 }} />
                        </div>
                        <h3 className="text-sm font-semibold" style={{ color: T.text }}>Nenhuma requisição ainda</h3>
                        <p className="text-xs max-w-xs" style={{ color: T.textMuted }}>
                            Use a IA em avaliações ou leads para ver o histórico aqui
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                                    {['Tarefa', 'Modelo', 'Status', 'Latência', 'Custo', 'Data'].map(h => (
                                        <th key={h} className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-widest"
                                            style={{ color: T.textMuted }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {aiHistory.map((req, i) => (
                                    <tr key={req.id}
                                        style={{ borderTop: i > 0 ? `1px solid ${T.border}` : 'none' }}>
                                        <td className="px-3 py-3">
                                            <span className="text-xs font-medium px-2 py-0.5 rounded-lg"
                                                style={{ background: T.elevated, color: T.text }}>
                                                {req.task_type || '—'}
                                            </span>
                                        </td>
                                        <td className="px-3 py-3">
                                            <span className="text-[10px] font-mono" style={{ color: T.textMuted }}>
                                                {req.model_used || '—'}
                                            </span>
                                        </td>
                                        <td className="px-3 py-3">
                                            {req.success ? (
                                                <CheckCircle2 size={14} style={{ color: T.success }} />
                                            ) : (
                                                <XCircle size={14} style={{ color: T.error }} />
                                            )}
                                        </td>
                                        <td className="px-3 py-3">
                                            <div className="flex items-center gap-1">
                                                <Clock size={11} style={{ color: T.textMuted }} />
                                                <span className="text-xs" style={{ color: T.textMuted }}>
                                                    {req.latency_ms ? `${req.latency_ms}ms` : '—'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-3 py-3">
                                            <span className="text-xs" style={{ color: T.textMuted }}>
                                                {req.cost_usd != null ? `$${req.cost_usd.toFixed(5)}` : '—'}
                                            </span>
                                        </td>
                                        <td className="px-3 py-3">
                                            <span className="text-xs" style={{ color: T.textMuted }}>
                                                {new Date(req.created_at).toLocaleDateString('pt-BR', {
                                                    day: '2-digit', month: '2-digit',
                                                    hour: '2-digit', minute: '2-digit'
                                                })}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}
