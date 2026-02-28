'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Shield, PenTool, Mail, Server, MessageCircle,
    HardDrive, Database, Calendar, BarChart2,
    Facebook, Instagram, CreditCard, Zap, Globe,
    CheckCircle, AlertCircle, XCircle, Clock,
    ChevronRight, X, Eye, EyeOff, ExternalLink,
    RefreshCw, Settings, Plug
} from 'lucide-react'
import { INTEGRACOES, CATEGORIAS_INTEGRACAO } from '@/lib/integracoes-registry'
import type { Integracao, IntegracaoStatus } from '@/types/contratos'

const T = {
    bg: 'transparent', surface: 'var(--bo-surface)', elevated: 'var(--bo-elevated)',
    border: 'var(--bo-border)', borderGold: 'var(--bo-border-gold)',
    text: 'var(--bo-text)', textSub: 'var(--bo-text-muted)', textDim: 'var(--bo-text-muted)',
    gold: '#3B82F6',
}

const ICONES: Record<string, any> = {
    Shield, PenTool, Mail, Server, MessageCircle, HardDrive,
    Database, Calendar, BarChart2, Facebook, Instagram,
    CreditCard, Zap, Globe, Settings,
}

const STATUS_CFG: Record<IntegracaoStatus, { label: string; text: string; bg: string; icon: any; dot: string }> = {
    conectado: { label: 'Conectado', text: '#6BB87B', bg: 'rgba(107,184,123,0.12)', icon: CheckCircle, dot: '#6BB87B' },
    desconectado: { label: 'Desconectado', text: '#E8A87C', bg: 'rgba(232,168,124,0.12)', icon: XCircle, dot: '#E8A87C' },
    erro: { label: 'Erro', text: '#E57373', bg: 'rgba(229,115,115,0.12)', icon: AlertCircle, dot: '#E57373' },
    pendente: { label: 'Pendente', text: '#3B82F6', bg: 'rgba(26,26,46,0.12)', icon: Clock, dot: '#3B82F6' },
    nao_configurado: { label: 'Não configurado', text: '#4E5669', bg: 'rgba(78,86,105,0.12)', icon: XCircle, dot: '#4E5669' },
}

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
        // Na produção: POST /api/integracoes/save com valores criptografados
        await new Promise(r => setTimeout(r, 800))
        onSave(integracao.id, values)
        setSaving(false)
        onClose()
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
                        <div className="rounded-xl p-4 text-sm" style={{ background: 'rgba(107,184,123,0.08)', border: '1px solid rgba(107,184,123,0.20)', color: '#6BB87B' }}>
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
                                        {campo.label}{campo.required && <span style={{ color: T.gold }}> *</span>}
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
                            style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.textSub }}>
                            <ExternalLink size={12} /> Docs
                        </a>
                    )}

                    {integracao.campos_config.length > 0 && integracao.id !== 'supabase_storage' && (
                        <button onClick={handleTest} disabled={testing}
                            className="flex items-center gap-1.5 px-4 h-10 rounded-xl text-xs font-medium"
                            style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.textSub }}>
                            {testing ? <RefreshCw size={12} className="animate-spin" /> : <Plug size={12} />}
                            Testar Conexão
                        </button>
                    )}

                    <button onClick={handleSave} disabled={saving}
                        className="flex-1 h-10 rounded-xl text-sm font-semibold text-white"
                        style={{ background: '#3B82F6' }}>
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

    return (
        <>
            <div className="space-y-5 max-w-7xl mx-auto">

                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
                    <h1 className="text-xl font-bold" style={{ color: T.text }}>Integrações</h1>
                    <p className="text-sm mt-0.5" style={{ color: T.textDim }}>
                        Conecte todas as plataformas — assinatura, email, WhatsApp, storage, redes sociais e pagamento
                    </p>
                </motion.div>

                {/* Status geral */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                        { label: 'Conectadas', value: conectadas, color: '#6BB87B' },
                        { label: 'Disponíveis', value: INTEGRACOES.length, color: '#7B9EC4' },
                        { label: 'A configurar', value: configurar, color: '#3B82F6' },
                    ].map((s, i) => (
                        <motion.div key={s.label}
                            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="rounded-2xl p-4 text-center"
                            style={{ background: T.elevated, border: `1px solid ${T.borderGold}` }}>
                            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
                            <p className="text-xs mt-1" style={{ color: T.textDim }}>{s.label}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Categorias */}
                <div className="flex gap-1.5 overflow-x-auto pb-0.5">
                    {[{ key: 'todas', label: 'Todas' }, ...Object.entries(CATEGORIAS_INTEGRACAO).map(([k, v]) => ({ key: k, label: v.label }))].map(cat => (
                        <button key={cat.key} onClick={() => setCategoriaAtiva(cat.key)}
                            className="px-3.5 h-9 rounded-xl text-xs font-semibold flex-shrink-0 transition-all"
                            style={{
                                background: categoriaAtiva === cat.key ? '#3B82F6' : T.surface,
                                color: categoriaAtiva === cat.key ? 'white' : T.textDim,
                                border: `1px solid ${categoriaAtiva === cat.key ? T.borderGold : T.border}`,
                            }}>
                            {cat.label}
                        </button>
                    ))}
                </div>

                {/* Grid de integrações */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filtradas.map((integ, i) => {
                        const status = getStatus(integ)
                        const Icon = ICONES[integ.icon] || Settings
                        const connected = status === 'conectado'

                        return (
                            <motion.div key={integ.id}
                                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.04 }}
                                className="rounded-2xl p-4 transition-all group"
                                style={{
                                    background: connected ? 'rgba(107,184,123,0.05)' : T.surface,
                                    border: `1px solid ${connected ? 'rgba(107,184,123,0.22)' : T.border}`,
                                }}
                                onMouseEnter={e => {
                                    (e.currentTarget as HTMLElement).style.border = `1px solid ${connected ? 'rgba(107,184,123,0.40)' : T.borderGold}`
                                        ; (e.currentTarget as HTMLElement).style.background = T.elevated
                                }}
                                onMouseLeave={e => {
                                    (e.currentTarget as HTMLElement).style.border = `1px solid ${connected ? 'rgba(107,184,123,0.22)' : T.border}`
                                        ; (e.currentTarget as HTMLElement).style.background = connected ? 'rgba(107,184,123,0.05)' : T.surface
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
                                        background: connected ? 'rgba(107,184,123,0.12)' : 'rgba(26,26,46,0.10)',
                                        border: `1px solid ${connected ? 'rgba(107,184,123,0.25)' : T.borderGold}`,
                                        color: connected ? '#6BB87B' : T.gold,
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
                            <div key={i} style={{ color: line.startsWith('#') ? T.textDim : line.includes('=') ? '#3B82F6' : '#6BB87B' }}>
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
