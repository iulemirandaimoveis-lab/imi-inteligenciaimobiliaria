'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Shield, PenTool, Mail, Server, MessageCircle,
    HardDrive, Database, Calendar, BarChart2,
    Facebook, Instagram, CreditCard, Zap, Globe,
    CheckCircle, AlertCircle, XCircle, Clock,
    X, Eye, EyeOff, ExternalLink,
    RefreshCw, Settings, Plug, Sparkles, Table2,
} from 'lucide-react'
import { INTEGRACOES, CATEGORIAS_INTEGRACAO } from '@/lib/integracoes-registry'
import type { Integracao, IntegracaoStatus } from '@/types/contratos'
import { PageIntelHeader, KPICard } from '../../components/ui'
import { T } from '../../lib/theme'

const ICONES: Record<string, any> = {
    Shield, PenTool, Mail, Server, MessageCircle, HardDrive,
    Database, Calendar, BarChart2, Facebook, Instagram,
    CreditCard, Zap, Globe, Settings, Sparkles, Table: Table2,
}

const STATUS_CFG: Record<IntegracaoStatus, { label: string; text: string; bg: string; icon: any; dot: string }> = {
    conectado:       { label: 'Conectado',       text: '#6BB87B', bg: 'rgba(107,184,123,0.12)', icon: CheckCircle, dot: '#6BB87B' },
    desconectado:    { label: 'Desconectado',    text: '#E8A87C', bg: 'rgba(232,168,124,0.12)', icon: XCircle,    dot: '#E8A87C' },
    erro:            { label: 'Erro',            text: '#E57373', bg: 'rgba(229,115,115,0.12)', icon: AlertCircle, dot: '#E57373' },
    pendente:        { label: 'Pendente',        text: 'var(--bo-accent)', bg: 'var(--bo-active-bg)', icon: Clock, dot: 'var(--bo-accent)' },
    nao_configurado: { label: 'Não configurado', text: '#4E5669', bg: 'rgba(78,86,105,0.12)', icon: XCircle,     dot: '#4E5669' },
}

function StatusBadge({ status }: { status: IntegracaoStatus }) {
    const cfg = STATUS_CFG[status]
    return (
        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full"
            style={{ color: cfg.text, background: cfg.bg }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} />
            {cfg.label}
        </span>
    )
}

// ── Modal de configuração ─────────────────────────────────────
function ConfigModal({
    integracao,
    initialValues,
    sourceMap,
    onClose,
    onSave,
}: {
    integracao: Integracao
    initialValues?: Record<string, string>
    sourceMap?: Record<string, 'db' | 'env'>
    onClose: () => void
    onSave: (id: string, values: Record<string, string>) => void
}) {
    const [values, setValues] = useState<Record<string, string>>(initialValues || {})
    const [showMasked, setShowMasked] = useState<Record<string, boolean>>({})
    const [testing, setTesting] = useState(false)
    const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null)
    const [saving, setSaving] = useState(false)
    const [syncing, setSyncing] = useState(false)
    const [syncResult, setSyncResult] = useState<{ ok: boolean; msg: string } | null>(null)

    const Icon = ICONES[integracao.icon] || Settings
    const isEnvConfigured = sourceMap?.[integracao.id] === 'env'

    const handleTest = async () => {
        setTesting(true)
        setTestResult(null)
        try {
            const res = await fetch('/api/integracoes/test-connection', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ integration_id: integracao.id, values }),
            })
            const data = await res.json()
            setTestResult({ ok: data.success, msg: data.message || (data.success ? 'Conexão bem-sucedida!' : 'Falha na conexão') })
        } catch {
            setTestResult({ ok: false, msg: 'Erro ao testar conexão' })
        } finally {
            setTesting(false)
        }
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const res = await fetch('/api/integracoes/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ integration_id: integracao.id, config: values }),
            })
            if (!res.ok) {
                const err = await res.json()
                console.error('Integração save error:', err)
            }
        } catch (e) {
            console.error('Integração save:', e)
        } finally {
            setSaving(false)
            onSave(integracao.id, values)
            onClose()
        }
    }

    const handleMetaSync = async () => {
        setSyncing(true)
        setSyncResult(null)
        try {
            const res = await fetch('/api/meta-ads', { method: 'POST' })
            const data = await res.json()
            if (res.ok) {
                setSyncResult({ ok: true, msg: `${data.synced || 0} campanhas sincronizadas com sucesso!` })
            } else {
                setSyncResult({ ok: false, msg: data.error || 'Erro ao sincronizar campanhas' })
            }
        } catch {
            setSyncResult({ ok: false, msg: 'Erro de rede ao sincronizar' })
        } finally {
            setSyncing(false)
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'var(--backdrop-bg, rgba(0,0,0,0.4))', backdropFilter: 'blur(8px)' }}
            onClick={e => e.target === e.currentTarget && onClose()}
        >
            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.97 }}
                className="w-full max-w-lg rounded-3xl overflow-hidden"
                style={{ background: T.surface, border: `1px solid ${T.borderGold}` }}
            >
                {/* Header */}
                <div className="flex items-center gap-4 p-6"
                    style={{ borderBottom: `1px solid ${T.border}` }}>
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                        style={{ background: `${integracao.cor}18`, border: `1px solid ${integracao.cor}30` }}>
                        <Icon size={22} style={{ color: integracao.cor }} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-base font-bold" style={{ color: T.text }}>{integracao.nome}</p>
                        <p className="text-xs" style={{ color: T.textDim }}>{integracao.descricao}</p>
                    </div>
                    <button onClick={onClose}
                        className="w-8 h-8 rounded-xl flex items-center justify-center"
                        style={{ background: T.elevated, border: `1px solid ${T.border}` }}>
                        <X size={14} style={{ color: T.textDim }} />
                    </button>
                </div>

                {/* Env var notice */}
                {isEnvConfigured && (
                    <div className="mx-6 mt-4 rounded-xl p-3 text-xs"
                        style={{ background: 'rgba(107,184,123,0.08)', border: '1px solid rgba(107,184,123,0.20)', color: '#6BB87B' }}>
                        ✓ Esta integração está ativa via variável de ambiente no Vercel. Os campos abaixo permitem sobrescrever com uma configuração específica salva no banco.
                    </div>
                )}

                {/* Campos */}
                <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
                    {integracao.id === 'supabase_storage' ? (
                        <div className="rounded-xl p-4 text-sm"
                            style={{ background: 'rgba(107,184,123,0.08)', border: '1px solid rgba(107,184,123,0.20)', color: '#6BB87B' }}>
                            ✓ Supabase Storage é o armazenamento interno do projeto. Já está configurado automaticamente via variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.
                        </div>
                    ) : integracao.campos_config.length === 0 ? (
                        <p className="text-sm" style={{ color: T.textDim }}>Nenhuma configuração manual necessária.</p>
                    ) : (
                        integracao.campos_config.map(campo => {
                            const isMasked = campo.masked && !showMasked[campo.key]
                            const isTextarea = campo.tipo === 'textarea' as any
                            return (
                                <div key={campo.key} className="space-y-1.5">
                                    <label className="text-[11px] font-semibold uppercase tracking-wider"
                                        style={{ color: T.textDim }}>
                                        {campo.label}{campo.required && <span style={{ color: T.accent }}> *</span>}
                                    </label>
                                    {campo.tipo === 'select' ? (
                                        <select
                                            value={values[campo.key] || ''}
                                            onChange={e => setValues(p => ({ ...p, [campo.key]: e.target.value }))}
                                            className="w-full h-10 px-3 rounded-xl text-sm outline-none"
                                            style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }}>
                                            <option value="">Selecionar...</option>
                                            {campo.opcoes?.map(o => <option key={o} value={o}>{o}</option>)}
                                        </select>
                                    ) : isTextarea ? (
                                        <textarea
                                            value={values[campo.key] || ''}
                                            onChange={e => setValues(p => ({ ...p, [campo.key]: e.target.value }))}
                                            placeholder={campo.placeholder}
                                            rows={4}
                                            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none font-mono text-xs"
                                            style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }}
                                        />
                                    ) : (
                                        <div className="relative">
                                            <input
                                                type={isMasked ? 'password' : campo.tipo === 'url' ? 'url' : 'text'}
                                                value={values[campo.key] || ''}
                                                onChange={e => setValues(p => ({ ...p, [campo.key]: e.target.value }))}
                                                placeholder={campo.placeholder || (isEnvConfigured && campo.masked ? '••••••• (via env var)' : campo.placeholder)}
                                                className="w-full h-10 px-3 rounded-xl text-sm outline-none font-mono"
                                                style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text, paddingRight: campo.masked ? '40px' : undefined }}
                                            />
                                            {campo.masked && (
                                                <button
                                                    onClick={() => setShowMasked(p => ({ ...p, [campo.key]: !p[campo.key] }))}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2"
                                                    style={{ color: T.textDim }}>
                                                    {showMasked[campo.key] ? <EyeOff size={13} /> : <Eye size={13} />}
                                                </button>
                                            )}
                                        </div>
                                    )}
                                    {campo.descricao && (
                                        <p className="text-[10px]" style={{ color: T.textDim }}>{campo.descricao}</p>
                                    )}
                                </div>
                            )
                        })
                    )}

                    {/* Meta Ads — botão de sincronização */}
                    {integracao.id === 'meta_ads' && (
                        <div className="space-y-2 pt-2" style={{ borderTop: `1px solid ${T.border}` }}>
                            <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: T.textDim }}>
                                Campanhas
                            </p>
                            <button
                                onClick={handleMetaSync}
                                disabled={syncing}
                                className="w-full h-10 rounded-xl text-xs font-semibold flex items-center justify-center gap-2"
                                style={{ background: 'rgba(8,102,255,0.10)', border: '1px solid rgba(8,102,255,0.25)', color: '#0866FF' }}>
                                {syncing
                                    ? <><RefreshCw size={13} className="animate-spin" /> Sincronizando campanhas...</>
                                    : <><RefreshCw size={13} /> Sincronizar Campanhas do Meta Ads</>}
                            </button>
                            {syncResult && (
                                <div className="rounded-xl p-3 text-xs"
                                    style={{
                                        background: syncResult.ok ? 'rgba(107,184,123,0.10)' : 'rgba(229,115,115,0.10)',
                                        border: `1px solid ${syncResult.ok ? 'rgba(107,184,123,0.25)' : 'rgba(229,115,115,0.25)'}`,
                                        color: syncResult.ok ? '#6BB87B' : '#E57373',
                                    }}>
                                    {syncResult.ok ? '✓' : '⚠'} {syncResult.msg}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Resultado do teste */}
                    {testResult && (
                        <div className="rounded-xl p-3 text-xs"
                            style={{
                                background: testResult.ok ? 'rgba(107,184,123,0.10)' : 'rgba(229,115,115,0.10)',
                                border: `1px solid ${testResult.ok ? 'rgba(107,184,123,0.25)' : 'rgba(229,115,115,0.25)'}`,
                                color: testResult.ok ? '#6BB87B' : '#E57373',
                            }}>
                            {testResult.ok ? '✓' : '⚠'} {testResult.msg}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex gap-3 p-6" style={{ borderTop: `1px solid ${T.border}` }}>
                    {integracao.docs_url && (
                        <a href={integracao.docs_url} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-4 h-10 rounded-xl text-xs font-medium"
                            style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.textMuted }}>
                            <ExternalLink size={12} /> Docs
                        </a>
                    )}

                    {(integracao.campos_config.length > 0 || isEnvConfigured) && integracao.id !== 'supabase_storage' && (
                        <button onClick={handleTest} disabled={testing}
                            className="flex items-center gap-1.5 px-4 h-10 rounded-xl text-xs font-medium"
                            style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.textMuted }}>
                            {testing ? <RefreshCw size={12} className="animate-spin" /> : <Plug size={12} />}
                            Testar
                        </button>
                    )}

                    {integracao.id !== 'supabase_storage' && (
                        <button onClick={handleSave} disabled={saving}
                            className="flex-1 h-10 rounded-xl text-sm font-semibold text-white"
                            style={{ background: 'var(--bo-accent)' }}>
                            {saving ? 'Salvando...' : 'Salvar Configuração'}
                        </button>
                    )}
                </div>
            </motion.div>
        </motion.div>
    )
}

// ── Página principal ──────────────────────────────────────────
export default function IntegracoesPage() {
    const [categoriaAtiva, setCategoriaAtiva] = useState('todas')
    const [integracaoAberta, setIntegracaoAberta] = useState<Integracao | null>(null)
    const [statusOverride, setStatusOverride] = useState<Record<string, IntegracaoStatus>>({})
    const [configMap, setConfigMap] = useState<Record<string, Record<string, string>>>({})
    const [sourceMap, setSourceMap] = useState<Record<string, 'db' | 'env'>>({})
    const [loadingStatus, setLoadingStatus] = useState(true)

    useEffect(() => {
        async function loadSavedStatuses() {
            try {
                const res = await fetch('/api/integracoes/status')
                if (res.ok) {
                    const { statusMap, configMap: cfgMap, sourceMap: srcMap } = await res.json()
                    if (statusMap && typeof statusMap === 'object') {
                        const overrides: Record<string, IntegracaoStatus> = {}
                        for (const [id, status] of Object.entries(statusMap)) {
                            if (status && status !== 'nao_configurado') {
                                overrides[id] = status as IntegracaoStatus
                            }
                        }
                        setStatusOverride(overrides)
                    }
                    if (cfgMap) setConfigMap(cfgMap as Record<string, Record<string, string>>)
                    if (srcMap) setSourceMap(srcMap as Record<string, 'db' | 'env'>)
                }
            } catch (err) {
                console.error('[integracoes] Failed to load saved statuses:', err)
            } finally {
                setLoadingStatus(false)
            }
        }
        loadSavedStatuses()
    }, [])

    const handleSave = (id: string, values: Record<string, string>) => {
        setStatusOverride(prev => ({ ...prev, [id]: 'conectado' }))
        setConfigMap(prev => ({ ...prev, [id]: values }))
        setSourceMap(prev => ({ ...prev, [id]: 'db' }))
    }

    const getStatus = (int: Integracao): IntegracaoStatus =>
        statusOverride[int.id] || int.status

    const filtradas = categoriaAtiva === 'todas'
        ? INTEGRACOES
        : INTEGRACOES.filter(i => i.categoria === categoriaAtiva)

    const conectadas  = INTEGRACOES.filter(i => getStatus(i) === 'conectado').length
    const configurar  = INTEGRACOES.filter(i => getStatus(i) === 'nao_configurado').length

    if (loadingStatus) return (
        <div className="space-y-5 max-w-7xl mx-auto">
            <div><div className="skeleton h-6 w-48 mb-2" /><div className="skeleton h-4 w-72" /></div>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="skeleton-card p-4" style={{ animationDelay: `${i * 100}ms` }}>
                        <div className="skeleton w-9 h-9 rounded-xl mb-3" />
                        <div className="skeleton lg h-5 w-16 mb-2" />
                        <div className="skeleton h-3 w-24" />
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="skeleton-card p-4" style={{ animationDelay: `${i * 60}ms` }}>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="skeleton w-10 h-10 rounded-xl" />
                            <div className="flex-1">
                                <div className="skeleton h-4 w-28 mb-1" />
                                <div className="skeleton h-3 w-20" />
                            </div>
                        </div>
                        <div className="skeleton h-3 w-full mb-1" />
                        <div className="skeleton h-3 w-3/4" />
                    </div>
                ))}
            </div>
        </div>
    )

    return (
        <>
            <div className="space-y-5 max-w-7xl mx-auto">

                <PageIntelHeader
                    moduleLabel="INTEGRAÇÕES"
                    title="Integrações"
                    subtitle="Conecte todas as plataformas — IA, assinatura, email, WhatsApp, Google, redes sociais e pagamento"
                />

                {/* ── ALERTA CRÍTICO: Rotação de chave Anthropic ─────────────── */}
                <div className="rounded-2xl p-4 flex flex-col sm:flex-row sm:items-start gap-4"
                    style={{ background: 'rgba(229,115,115,0.08)', border: '2px solid rgba(229,115,115,0.35)' }}>
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: 'rgba(229,115,115,0.15)' }}>
                            <AlertCircle size={20} style={{ color: '#E57373' }} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-bold" style={{ color: '#E57373' }}>
                                Ação necessária: Trocar ANTHROPIC_API_KEY
                            </p>
                            <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--bo-text-muted)' }}>
                                A chave atual da API Anthropic precisa ser revogada e substituída por uma nova.
                                Acesse <strong style={{ color: 'var(--bo-text)' }}>console.anthropic.com → API Keys → Revoke</strong> e gere uma nova chave.
                                Em seguida, atualize em <strong style={{ color: 'var(--bo-text)' }}>Vercel → Settings → Environment Variables → ANTHROPIC_API_KEY</strong>.
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                        <a
                            href="https://console.anthropic.com/settings/keys"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 h-9 px-4 rounded-xl text-xs font-bold whitespace-nowrap"
                            style={{ background: 'rgba(229,115,115,0.15)', border: '1px solid rgba(229,115,115,0.40)', color: '#E57373' }}
                        >
                            <ExternalLink size={12} /> Revogar Chave
                        </a>
                        <a
                            href="https://vercel.com/dashboard"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 h-9 px-4 rounded-xl text-xs font-bold whitespace-nowrap"
                            style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.textMuted }}
                        >
                            <ExternalLink size={12} /> Vercel
                        </a>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    <KPICard label="Conectadas"  value={String(conectadas)}        icon={<CheckCircle size={16} />} accent="green" size="sm" />
                    <KPICard label="Disponíveis" value={String(INTEGRACOES.length)} icon={<Plug size={16} />}       accent="blue"  size="sm" />
                    <KPICard label="A configurar" value={String(configurar)}        icon={<Settings size={16} />}   accent="warm"  size="sm" />
                </div>

                {/* Categorias */}
                <div className="flex gap-1.5 overflow-x-auto pb-0.5 -mx-1 px-1">
                    {[{ key: 'todas', label: 'Todas' }, ...Object.entries(CATEGORIAS_INTEGRACAO).map(([k, v]) => ({ key: k, label: v.label }))].map(cat => (
                        <button key={cat.key} onClick={() => setCategoriaAtiva(cat.key)}
                            className="px-3.5 h-9 rounded-xl text-xs font-semibold flex-shrink-0 transition-all"
                            style={{
                                background: categoriaAtiva === cat.key ? 'var(--bo-accent)' : T.surface,
                                color:      categoriaAtiva === cat.key ? 'white' : T.textDim,
                                border:     `1px solid ${categoriaAtiva === cat.key ? T.borderGold : T.border}`,
                            }}>
                            {cat.label}
                        </button>
                    ))}
                </div>

                {/* Grid de integrações */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filtradas.map((integ, i) => {
                        const status    = getStatus(integ)
                        const Icon      = ICONES[integ.icon] || Settings
                        const connected = status === 'conectado'
                        const fromEnv   = sourceMap[integ.id] === 'env'

                        return (
                            <motion.div key={integ.id}
                                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.04 }}
                                className="rounded-2xl p-4 transition-all group hover-card"
                                style={{
                                    background: connected ? 'rgba(107,184,123,0.05)' : T.surface,
                                    border: `1px solid ${connected ? 'rgba(107,184,123,0.22)' : T.border}`,
                                }}>
                                {/* Top */}
                                <div className="flex items-start gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                                        style={{ background: `${integ.cor}18`, border: `1px solid ${integ.cor}25` }}>
                                        <Icon size={18} style={{ color: integ.cor }} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <p className="text-sm font-semibold" style={{ color: T.text }}>{integ.nome}</p>
                                            {fromEnv && (
                                                <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase"
                                                    style={{ background: 'rgba(107,184,123,0.15)', color: '#6BB87B' }}>
                                                    env
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[11px] leading-relaxed mt-0.5 line-clamp-2" style={{ color: T.textDim }}>
                                            {integ.descricao}
                                        </p>
                                    </div>
                                </div>

                                {/* Meta */}
                                <div className="flex items-center justify-between">
                                    <StatusBadge status={status} />
                                    <div className="flex items-center gap-1.5">
                                        {integ.gratuito && (
                                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                                                style={{ background: 'rgba(107,184,123,0.12)', color: '#6BB87B' }}>
                                                Grátis
                                            </span>
                                        )}
                                        {integ.plano_minimo && (
                                            <span className="text-[9px] font-semibold" style={{ color: T.textDim }}>
                                                {integ.plano_minimo}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Action */}
                                <button
                                    onClick={() => setIntegracaoAberta(integ)}
                                    className="mt-3 w-full h-9 rounded-xl text-xs font-semibold transition-all"
                                    style={{
                                        background: connected ? 'rgba(107,184,123,0.12)' : 'var(--bo-active-bg)',
                                        border: `1px solid ${connected ? 'rgba(107,184,123,0.25)' : T.borderGold}`,
                                        color:  connected ? '#6BB87B' : T.accent,
                                    }}>
                                    {connected ? '⚙ Gerenciar' : '+ Configurar'}
                                </button>
                            </motion.div>
                        )
                    })}
                </div>

                {/* Info .env */}
                <div className="rounded-2xl p-4" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                    <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: T.textDim }}>
                        Variáveis de Ambiente — Vercel / .env.local
                    </p>
                    <p className="text-xs mb-3" style={{ color: T.textDim }}>
                        Integrações marcadas com <strong style={{ color: '#6BB87B' }}>env</strong> estão ativas via variável de ambiente no Vercel.
                        As configurações salvas aqui ficam no Supabase e sobrescrevem as env vars.
                    </p>
                    <div className="rounded-xl p-3 font-mono text-[10px] leading-relaxed overflow-x-auto"
                        style={{ background: 'var(--bo-surface)', border: `1px solid ${T.border}`, color: 'var(--s-done)' }}>
                        {[
                            '# IA',
                            'ANTHROPIC_API_KEY=sk-ant-api03-...',
                            'OPENAI_API_KEY=sk-proj-...',
                            'GOOGLE_AI_API_KEY=AIzaSy...',
                            'GROQ_API_KEY=gsk_...',
                            '',
                            '# Meta / Redes Sociais',
                            'META_ACCESS_TOKEN=',
                            'META_AD_ACCOUNT_ID=act_XXXXXXXXX',
                            '',
                            '# Email',
                            'RESEND_API_KEY=re_...',
                            'GMAIL_USER=contato@imi.imb.br',
                            'GMAIL_APP_PASSWORD=',
                            '',
                            '# WhatsApp',
                            'EVOLUTION_API_URL=https://evolution.seudominio.com',
                            'EVOLUTION_API_KEY=',
                            '',
                            '# Google',
                            'GDRIVE_FOLDER_ID=',
                            'GCAL_CLIENT_ID=',
                            'GCAL_CLIENT_SECRET=',
                        ].map((line, i) => (
                            <div key={i} style={{ color: line.startsWith('#') ? T.textDim : line.includes('=') ? 'var(--bo-accent)' : '#6BB87B' }}>
                                {line || '\u00A0'}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Modal de configuração */}
            <AnimatePresence>
                {integracaoAberta && (
                    <ConfigModal
                        integracao={integracaoAberta}
                        initialValues={configMap[integracaoAberta.id] as Record<string, string> | undefined}
                        sourceMap={sourceMap}
                        onClose={() => setIntegracaoAberta(null)}
                        onSave={handleSave}
                    />
                )}
            </AnimatePresence>
        </>
    )
}
