'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Shield, PenTool, Mail, Server, MessageCircle,
    HardDrive, Database, Calendar, BarChart2,
    Facebook, Instagram, CreditCard, Zap, Globe,
    CheckCircle, AlertCircle, XCircle, Clock,
    X, Eye, EyeOff, ExternalLink,
    RefreshCw, Settings, Plug, Linkedin, Music2,
    Sparkles
} from 'lucide-react'
import { INTEGRACOES, CATEGORIAS_INTEGRACAO } from '@/lib/integracoes-registry'
import type { Integracao, IntegracaoStatus } from '@/types/contratos'
import { PageIntelHeader, KPICard } from '../../components/ui'
import { T } from '../../lib/theme'
import { getStatusConfig } from '../../lib/constants'

const ICONES: Record<string, any> = {
    Shield, PenTool, Mail, Server, MessageCircle, HardDrive,
    Database, Calendar, BarChart2, Facebook, Instagram,
    CreditCard, Zap, Globe, Settings, Linkedin, Music2,
    Sparkles,
}

const STATUS_ICONS_INT: Record<string, any> = {
    conectado: CheckCircle, desconectado: XCircle, erro: AlertCircle, pendente: Clock, nao_configurado: XCircle,
}
const STATUS_CFG = Object.fromEntries(
    ['conectado', 'desconectado', 'erro', 'pendente', 'nao_configurado'].map(key => {
        const cfg = getStatusConfig(key)
        return [key, { label: cfg.label, text: cfg.dot, bg: `${cfg.dot}1f`, icon: STATUS_ICONS_INT[key] || Clock, dot: cfg.dot }]
    })
) as Record<IntegracaoStatus, { label: string; text: string; bg: string; icon: any; dot: string }>

function StatusBadge({ status }: { status: IntegracaoStatus }) {
    const cfg = STATUS_CFG[status]
    const Icon = cfg.icon
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
    onClose,
    onSave,
}: {
    integracao: Integracao
    onClose: () => void
    onSave: (id: string, values: Record<string, string>) => void
}) {
    const [values, setValues] = useState<Record<string, string>>({})
    const [showMasked, setShowMasked] = useState<Record<string, boolean>>({})
    const [testing, setTesting] = useState(false)
    const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null)
    const [saving, setSaving] = useState(false)

    const Icon = ICONES[integracao.icon] || Settings

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

                {/* Campos */}
                <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
                    {integracao.id === 'supabase_storage' ? (
                        <div className="rounded-xl p-4 text-sm" style={{ background: 'rgba(107,184,123,0.08)', border: '1px solid rgba(107,184,123,0.20)', color: 'var(--bo-success)' }}>
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
                                    <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: T.textDim }}>
                                        {campo.label}{campo.required && <span style={{ color: T.accent }}> *</span>}
                                    </label>
                                    {campo.tipo === 'select' ? (
                                        <select
                                            value={values[campo.key] || ''}
                                            onChange={e => setValues(p => ({ ...p, [campo.key]: e.target.value }))}
                                            className="w-full h-10 px-3 rounded-xl text-sm outline-none"
                                            style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }}
                                        >
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
                                                placeholder={campo.placeholder}
                                                className="w-full h-10 px-3 rounded-xl text-sm outline-none font-mono"
                                                style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text, paddingRight: campo.masked ? '40px' : undefined }}
                                            />
                                            {campo.masked && (
                                                <button
                                                    onClick={() => setShowMasked(p => ({ ...p, [campo.key]: !p[campo.key] }))}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2"
                                                    style={{ color: T.textDim }}
                                                >
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

                    {/* Resultado do teste */}
                    {testResult && (
                        <div className="rounded-xl p-3 text-xs"
                            style={{
                                background: testResult.ok ? 'rgba(107,184,123,0.10)' : 'rgba(229,115,115,0.10)',
                                border: `1px solid ${testResult.ok ? 'rgba(107,184,123,0.25)' : 'rgba(229,115,115,0.25)'}`,
                                color: testResult.ok ? 'var(--bo-success)' : 'var(--bo-error)',
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

                    {integracao.campos_config.length > 0 && integracao.id !== 'supabase_storage' && (
                        <button onClick={handleTest} disabled={testing}
                            className="flex items-center gap-1.5 px-4 h-10 rounded-xl text-xs font-medium"
                            style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.textMuted }}>
                            {testing ? <RefreshCw size={12} className="animate-spin" /> : <Plug size={12} />}
                            Testar Conexão
                        </button>
                    )}

                    <button onClick={handleSave} disabled={saving}
                        className="flex-1 h-10 rounded-xl text-sm font-semibold text-white"
                        style={{ background: 'var(--bo-accent)' }}>
                        {saving ? 'Salvando...' : 'Salvar Configuração'}
                    </button>
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
    const [loadingStatus, setLoadingStatus] = useState(true)

    // Fetch saved integration statuses from DB on mount
    useEffect(() => {
        async function loadSavedStatuses() {
            try {
                const res = await fetch('/api/integracoes/status')
                if (res.ok) {
                    const { data } = await res.json()
                    if (Array.isArray(data) && data.length > 0) {
                        const overrides: Record<string, IntegracaoStatus> = {}
                        for (const row of data) {
                            const { integration_id, status } = row
                            if (integration_id && status && status !== 'nao_configurado') {
                                overrides[integration_id] = status as IntegracaoStatus
                            }
                        }
                        setStatusOverride(overrides)
                    }
                }
            } catch (err) {
                console.error('[integracoes] Failed to load saved statuses:', err)
            } finally {
                setLoadingStatus(false)
            }
        }
        loadSavedStatuses()
    }, [])

    const handleSave = (id: string, _values: Record<string, string>) => {
        setStatusOverride(prev => ({ ...prev, [id]: 'conectado' }))
    }

    const getStatus = (int: Integracao): IntegracaoStatus =>
        statusOverride[int.id] || int.status

    const filtradas = categoriaAtiva === 'todas'
        ? INTEGRACOES
        : INTEGRACOES.filter(i => i.categoria === categoriaAtiva)

    const conectadas = INTEGRACOES.filter(i => getStatus(i) === 'conectado').length
    const configurar = INTEGRACOES.filter(i => getStatus(i) === 'nao_configurado').length

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

                {/* Header */}
                <PageIntelHeader
                    moduleLabel="INTEGRAÇÕES"
                    title="Integrações"
                    subtitle="Conecte todas as plataformas — assinatura, email, WhatsApp, storage, redes sociais e pagamento"
                />

                {/* Status geral */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    <KPICard label="Conectadas" value={String(conectadas)} icon={<CheckCircle size={16} />} accent="green" size="sm" />
                    <KPICard label="Disponíveis" value={String(INTEGRACOES.length)} icon={<Plug size={16} />} accent="blue" size="sm" />
                    <KPICard label="A configurar" value={String(configurar)} icon={<Settings size={16} />} accent="warm" size="sm" />
                </div>

                {/* Categorias */}
                <div className="flex gap-1.5 overflow-x-auto pb-0.5 -mx-1 px-1">
                    {[{ key: 'todas', label: 'Todas' }, ...Object.entries(CATEGORIAS_INTEGRACAO).map(([k, v]) => ({ key: k, label: v.label }))].map(cat => (
                        <button key={cat.key} onClick={() => setCategoriaAtiva(cat.key)}
                            className="px-3.5 h-9 rounded-xl text-xs font-semibold flex-shrink-0 transition-all"
                            style={{
                                background: categoriaAtiva === cat.key ? 'var(--bo-accent)' : T.surface,
                                color: categoriaAtiva === cat.key ? 'white' : T.textDim,
                                border: `1px solid ${categoriaAtiva === cat.key ? T.borderGold : T.border}`,
                            }}>
                            {cat.label}
                        </button>
                    ))}
                </div>

                {/* Grid de integrações */}
                <div data-tour="integrations" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filtradas.map((integ, i) => {
                        const status = getStatus(integ)
                        const Icon = ICONES[integ.icon] || Settings
                        const connected = status === 'conectado'

                        return (
                            <motion.div key={integ.id}
                                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.04 }}
                                className="rounded-2xl p-4 transition-all group hover-card"
                                style={{
                                    background: connected ? 'rgba(107,184,123,0.05)' : T.surface,
                                    border: `1px solid ${connected ? 'rgba(107,184,123,0.22)' : T.border}`,
                                }}

                            >
                                {/* Top */}
                                <div className="flex items-start gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                                        style={{ background: `${integ.cor}18`, border: `1px solid ${integ.cor}25` }}>
                                        <Icon size={18} style={{ color: integ.cor }} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold" style={{ color: T.text }}>{integ.nome}</p>
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
                                                style={{ background: 'rgba(107,184,123,0.12)', color: 'var(--bo-success)' }}>
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
                                        color: connected ? 'var(--bo-success)' : T.accent,
                                    }}
                                >
                                    {connected ? '⚙ Gerenciar' : '+ Configurar'}
                                </button>
                            </motion.div>
                        )
                    })}
                </div>

                {/* Info .env */}
                <div className="rounded-2xl p-4" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                    <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: T.textDim }}>
                        Variáveis de Ambiente (.env.local)
                    </p>
                    <p className="text-xs mb-3" style={{ color: T.textDim }}>
                        As configurações salvas aqui são armazenadas criptografadas no Supabase. Para produção, adicione também ao Vercel → Settings → Environment Variables.
                    </p>
                    <div className="rounded-xl p-3 font-mono text-[10px] leading-relaxed overflow-x-auto"
                        style={{ background: 'var(--bo-surface)', border: `1px solid ${T.border}`, color: 'var(--s-done)' }}>
                        {[
                            '# Assinatura Digital',
                            'GOVBR_CLIENT_ID=',
                            'GOVBR_CLIENT_SECRET=',
                            'GOVBR_REDIRECT_URI=https://seusite.com/api/auth/govbr/callback',
                            'GOVBR_ENVIRONMENT=staging',
                            'CLICKSIGN_ACCESS_TOKEN=',
                            'CLICKSIGN_ENVIRONMENT=sandbox',
                            '',
                            '# Email',
                            'RESEND_API_KEY=re_...',
                            'RESEND_FROM_EMAIL=contratos@imi.imb.br',
                            '',
                            '# WhatsApp',
                            'EVOLUTION_API_URL=https://evolution.seudominio.com',
                            'EVOLUTION_API_KEY=',
                            'EVOLUTION_INSTANCE=IMI',
                            '',
                            '# Google Drive',
                            'GDRIVE_FOLDER_ID=',
                            'GDRIVE_SERVICE_ACCOUNT_JSON=',
                        ].map((line, i) => (
                            <div key={i} style={{ color: line.startsWith('#') ? T.textDim : line.includes('=') ? 'var(--bo-accent)' : 'var(--bo-success)' }}>
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
                        onClose={() => setIntegracaoAberta(null)}
                        onSave={handleSave}
                    />
                )}
            </AnimatePresence>
        </>
    )
}
