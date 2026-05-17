'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Building2, FileText, DollarSign, Clock, CheckCircle,
    Plus, Receipt, ArrowRight, X, Loader2, AlertCircle,
    Phone, Mail, MapPin, User, CreditCard,
    Info, Upload,
} from 'lucide-react'
import { toast } from 'sonner'
import { T } from '../../lib/theme'
import { PageIntelHeader } from '../../components/ui/PageIntelHeader'
import { KPICard } from '../../components/ui/KPICard'

/* ─── TIPOS ─────────────────────────────────────────────────────── */
interface Repasse {
    id: string
    empreendimento_nome: string
    cliente_nome: string
    valor_venda: number
    percentual_comissao: number
    valor_comissao_bruta: number
    valor_repasse_liquido: number
    status: string
    data_venda: string | null
    data_nf_emissao: string | null
    data_pagamento_construtora: string | null
    data_repasse_prevista: string | null
    data_repasse_realizada: string | null
    nota_fiscal_id: string | null
}

interface NotaFiscal {
    id: string
    numero: string | null
    nfse_numero: string | null
    tomador_nome: string
    valor_servicos: number
    valor_iss: number
    valor_liquido: number
    aliquota_iss: number
    status: string
    data_emissao: string | null
    data_competencia: string | null
    descricao_servico: string
    repasse_id: string | null
}

/* ─── CONSTANTES ────────────────────────────────────────────────── */
const MANO_CNPJ = '09.856.046/0001-43'
const MANO_AGENCIA_ID_PLACEHOLDER = 'MANO_IMOVEIS' // substituído pelo ID real via API

const STATUS_REPASSE: Record<string, { label: string; color: string; bg: string }> = {
    aguardando_nf:          { label: 'Aguardando NF',    color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
    nf_emitida:             { label: 'NF Emitida',        color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
    pago_pela_construtora:  { label: 'Pago (construtora)', color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
    repasse_disponivel:     { label: 'Disponível',        color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
    repassado:              { label: 'Recebido',          color: '#6b7280', bg: 'rgba(107,114,128,0.12)' },
    cancelado:              { label: 'Cancelado',         color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
}

const STATUS_NF: Record<string, { label: string; color: string }> = {
    rascunho:   { label: 'Rascunho',   color: '#6b7280' },
    emitida:    { label: 'Emitida',    color: '#22c55e' },
    cancelada:  { label: 'Cancelada',  color: '#ef4444' },
    substituida:{ label: 'Substituída',color: '#f59e0b' },
}

const fmt = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

const fmtDate = (d: string | null) =>
    d ? new Date(d + 'T00:00:00').toLocaleDateString('pt-BR') : '—'

/* ─── COMPONENTE BADGE STATUS ───────────────────────────────────── */
function StatusBadge({ statusKey, map }: { statusKey: string; map: Record<string, { label: string; color: string; bg?: string }> }) {
    const cfg = map[statusKey] ?? { label: statusKey, color: '#6b7280', bg: 'rgba(107,114,128,0.12)' }
    return (
        <span
            className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{ color: cfg.color, background: cfg.bg ?? `${cfg.color}18` }}
        >
            {cfg.label}
        </span>
    )
}

/* ─── PÁGINA PRINCIPAL ──────────────────────────────────────────── */
export default function ImobiliáriasParceirasPage() {
    const [activeTab, setActiveTab] = useState<'contrato' | 'repasses' | 'notas'>('contrato')
    const [repasses, setRepasses] = useState<Repasse[]>([])
    const [notas, setNotas] = useState<NotaFiscal[]>([])
    const [agencyId, setAgencyId] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [showRepasseModal, setShowRepasseModal] = useState(false)
    const [showNFModal, setShowNFModal] = useState(false)

    /* ── Busca agency ID da Mano Imóveis ── */
    useEffect(() => {
        fetch('/api/partner-agencies')
            .then(r => r.json())
            .then(({ data }) => {
                const mano = (data as Array<{ id: string; name: string }>)?.find(a => a.name === 'Mano Imóveis')
                if (mano) setAgencyId(mano.id)
            })
            .catch(() => {})
    }, [])

    const loadRepasses = useCallback(async () => {
        if (!agencyId) return
        setLoading(true)
        try {
            const r = await fetch(`/api/financeiro/repasses?agency_id=${agencyId}`)
            const { data } = await r.json()
            setRepasses(data ?? [])
        } finally {
            setLoading(false)
        }
    }, [agencyId])

    const loadNotas = useCallback(async () => {
        if (!agencyId) return
        setLoading(true)
        try {
            const r = await fetch(`/api/financeiro/notas-fiscais?agency_id=${agencyId}`)
            const { data } = await r.json()
            setNotas(data ?? [])
        } finally {
            setLoading(false)
        }
    }, [agencyId])

    useEffect(() => {
        if (activeTab === 'repasses') loadRepasses()
        if (activeTab === 'notas') loadNotas()
    }, [activeTab, loadRepasses, loadNotas])

    /* ── KPIs dos repasses ── */
    const totalAReceber = repasses
        .filter((r: Repasse) => !['repassado', 'cancelado'].includes(r.status))
        .reduce((s: number, r: Repasse) => s + r.valor_repasse_liquido, 0)
    const aguardandoNF = repasses.filter((r: Repasse) => r.status === 'aguardando_nf').length
    const nfEmitida    = repasses.filter((r: Repasse) => r.status === 'nf_emitida').length
    const recebidos    = repasses.filter((r: Repasse) => r.status === 'repassado').reduce((s: number, r: Repasse) => s + r.valor_repasse_liquido, 0)

    const TABS = [
        { id: 'contrato', label: 'Contrato',        icon: FileText    },
        { id: 'repasses', label: 'Repasses',         icon: DollarSign  },
        { id: 'notas',    label: 'Notas Fiscais',    icon: Receipt     },
    ] as const

    return (
        <div className="min-h-screen" style={{ background: T.background }}>
            <PageIntelHeader
                moduleLabel="PARCEIROS"
                title="Imobiliárias Parceiras"
                subtitle="Contratos, comissões e notas fiscais com imobiliárias parceiras"
            />

            <div className="max-w-5xl mx-auto px-4 pb-16 space-y-6">

                {/* ── Card Mano Imóveis ── */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl p-5"
                    style={{ background: T.surface, border: `1px solid ${T.border}` }}
                >
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                        {/* Logo placeholder */}
                        <div
                            className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0"
                            style={{ background: 'rgba(239,68,68,0.12)' }}
                        >
                            <Building2 size={28} style={{ color: '#ef4444' }} />
                        </div>

                        <div className="flex-1 space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                                <h2 className="text-lg font-semibold" style={{ color: T.text }}>
                                    Mano Imóveis
                                </h2>
                                <span
                                    className="text-xs font-medium px-2 py-0.5 rounded-full"
                                    style={{ color: '#22c55e', background: 'rgba(34,197,94,0.12)' }}
                                >
                                    Contrato Ativo
                                </span>
                                <span
                                    className="text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1"
                                    style={{ color: '#f59e0b', background: 'rgba(245,158,11,0.10)' }}
                                >
                                    <Info size={11} />
                                    Contrato PF — aguardando CNPJ da IMI
                                </span>
                            </div>

                            <p className="text-sm" style={{ color: T.muted }}>
                                Severino José Alves Paes Imóveis Eirelle · CNPJ {MANO_CNPJ}
                            </p>

                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm" style={{ color: T.muted }}>
                                <span className="flex items-center gap-1">
                                    <MapPin size={13} />
                                    Av. Dantas Barreto, 02, Centro — Garanhuns/PE
                                </span>
                                <span className="flex items-center gap-1">
                                    <Phone size={13} />
                                    (87) 99828-0223
                                </span>
                                <span className="flex items-center gap-1">
                                    <Mail size={13} />
                                    vendas@manoimoveis.com.br
                                </span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* ── Tabs ── */}
                <div
                    className="flex gap-1 p-1 rounded-xl"
                    style={{ background: T.surfaceAlt ?? T.surface, border: `1px solid ${T.border}` }}
                >
                    {TABS.map(tab => {
                        const Icon = tab.icon
                        const active = activeTab === tab.id
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                                style={{
                                    background: active ? T.accent ?? 'var(--accent-500)' : 'transparent',
                                    color: active ? '#fff' : T.muted,
                                }}
                            >
                                <Icon size={15} />
                                {tab.label}
                            </button>
                        )
                    })}
                </div>

                {/* ══ TAB: CONTRATO ══════════════════════════════════════════ */}
                {activeTab === 'contrato' && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                    >
                        {/* Info box PF */}
                        <div
                            className="flex gap-3 p-4 rounded-xl text-sm"
                            style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}
                        >
                            <AlertCircle size={18} style={{ color: '#f59e0b', shrink: 0 }} className="shrink-0 mt-0.5" />
                            <div style={{ color: T.text }}>
                                <strong>Contrato na pessoa física (atual)</strong> — Iule Miranda da S. Bezerra (CPF 048.986.523-90, CRECI-PE 17933).
                                Assim que o CNPJ da IMI for aberto, o contrato será aditado para pessoa jurídica com os mesmos termos.
                            </div>
                        </div>

                        <div
                            className="rounded-xl divide-y"
                            style={{ background: T.surface, border: `1px solid ${T.border}`, divideColor: T.border }}
                        >
                            {/* Contratado */}
                            <div className="p-5">
                                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: T.text }}>
                                    <User size={15} /> Contratado (IMI)
                                </h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                                    <Field label="Nome" value="Iule Miranda da S. Bezerra" />
                                    <Field label="CPF" value="048.986.523-90" />
                                    <Field label="CRECI-PE" value="17933" />
                                    <Field label="Telefone" value="(87) 98614-1487" />
                                    <Field label="E-mail" value="iule.miranda.imoveis@email.com" />
                                </div>
                            </div>

                            {/* Dados bancários */}
                            <div className="p-5">
                                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: T.text }}>
                                    <CreditCard size={15} /> Dados Bancários (BTG)
                                </h3>
                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 text-sm">
                                    <Field label="Banco" value="BTG Pactual" />
                                    <Field label="Agência" value="819" />
                                    <Field label="Conta" value="870658-4" />
                                    <Field label="OP" value="020" />
                                </div>
                            </div>

                            {/* Regras de comissão */}
                            <div className="p-5">
                                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: T.text }}>
                                    <DollarSign size={15} /> Regras de Comissão (Cláusula 5ª)
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                                    <Field label="Prazo de repasse" value="3 dias úteis após pagamento da construtora" />
                                    <Field label="Prazo de pagamento" value="12 a 30 dias após emissão da NF" />
                                    <Field label="% Comissão" value="Conforme tabela de cada empreendimento" />
                                </div>
                            </div>

                            {/* Vigência e foro */}
                            <div className="p-5">
                                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: T.text }}>
                                    <FileText size={15} /> Vigência e Foro
                                </h3>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <Field label="Vigência" value="Prazo indeterminado (Cláusula 9ª)" />
                                    <Field label="Foro" value="Comarca de Garanhuns/PE (Cláusula 10ª)" />
                                </div>
                            </div>
                        </div>

                        {/* Fluxo de comissão visual */}
                        <div
                            className="rounded-xl p-5"
                            style={{ background: T.surface, border: `1px solid ${T.border}` }}
                        >
                            <h3 className="text-sm font-semibold mb-4" style={{ color: T.text }}>
                                Fluxo de Comissão
                            </h3>
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                                {[
                                    { icon: CheckCircle, label: 'Venda realizada', color: '#22c55e' },
                                    { icon: Receipt,     label: 'Emitir NF',       color: '#3b82f6' },
                                    { icon: Building2,   label: 'Construtora paga Mano', color: '#8b5cf6' },
                                    { icon: Clock,       label: 'Aguarda 3 dias úteis', color: '#f59e0b' },
                                    { icon: DollarSign,  label: 'IMI recebe repasse', color: '#22c55e' },
                                ].map((step, i, arr) => (
                                    <>
                                        <div key={step.label} className="flex items-center gap-1.5 px-3 py-2 rounded-lg" style={{ background: `${step.color}12`, color: step.color }}>
                                            <step.icon size={13} />
                                            <span className="font-medium">{step.label}</span>
                                        </div>
                                        {i < arr.length - 1 && <ArrowRight size={14} key={`arrow-${i}`} style={{ color: T.muted }} />}
                                    </>
                                ))}
                            </div>
                        </div>

                        {/* Upload */}
                        <button
                            onClick={() => toast.info('Upload de contrato em breve')}
                            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all hover:opacity-80"
                            style={{ border: `1px dashed ${T.border}`, color: T.muted, background: 'transparent' }}
                        >
                            <Upload size={15} />
                            Upload do Contrato Digitalizado
                        </button>
                    </motion.div>
                )}

                {/* ══ TAB: REPASSES ══════════════════════════════════════════ */}
                {activeTab === 'repasses' && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                    >
                        {/* KPIs */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <KPICard label="A Receber" value={fmt(totalAReceber)} icon={<DollarSign size={18} />} />
                            <KPICard label="Aguardando NF" value={String(aguardandoNF)} icon={<Clock size={18} />} />
                            <KPICard label="NF Emitida" value={String(nfEmitida)} icon={<Receipt size={18} />} />
                            <KPICard label="Total Recebido" value={fmt(recebidos)} icon={<CheckCircle size={18} />} />
                        </div>

                        {/* Header ação */}
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold" style={{ color: T.text }}>
                                Histórico de Repasses
                            </h3>
                            <button
                                onClick={() => setShowRepasseModal(true)}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-80"
                                style={{ background: 'var(--accent-500)', color: '#fff' }}
                            >
                                <Plus size={14} />
                                Registrar Venda
                            </button>
                        </div>

                        {loading ? (
                            <div className="flex justify-center py-12">
                                <Loader2 size={24} className="animate-spin" style={{ color: T.muted }} />
                            </div>
                        ) : repasses.length === 0 ? (
                            <EmptyState
                                icon={DollarSign}
                                title="Nenhum repasse registrado"
                                subtitle="Registre uma venda para iniciar o controle de comissões"
                            />
                        ) : (
                            <div className="space-y-2">
                                {repasses.map((r, i) => (
                                    <motion.div
                                        key={r.id}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.03 }}
                                        className="rounded-xl p-4"
                                        style={{ background: T.surface, border: `1px solid ${T.border}` }}
                                    >
                                        <div className="flex flex-wrap items-start justify-between gap-2">
                                            <div>
                                                <div className="font-medium text-sm" style={{ color: T.text }}>
                                                    {r.empreendimento_nome}
                                                </div>
                                                <div className="text-xs mt-0.5" style={{ color: T.muted }}>
                                                    {r.cliente_nome} · Venda: {fmtDate(r.data_venda)}
                                                </div>
                                            </div>
                                            <StatusBadge statusKey={r.status} map={STATUS_REPASSE} />
                                        </div>
                                        <div className="mt-3 flex flex-wrap gap-4 text-xs" style={{ color: T.muted }}>
                                            <span>Venda: <strong style={{ color: T.text }}>{fmt(r.valor_venda)}</strong></span>
                                            <span>{r.percentual_comissao}% comissão → <strong style={{ color: T.text }}>{fmt(r.valor_comissao_bruta)}</strong></span>
                                            {r.data_repasse_prevista && (
                                                <span>Repasse previsto: <strong style={{ color: T.text }}>{fmtDate(r.data_repasse_prevista)}</strong></span>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}

                {/* ══ TAB: NOTAS FISCAIS ═════════════════════════════════════ */}
                {activeTab === 'notas' && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                    >
                        {/* Info ISS */}
                        <div
                            className="flex gap-3 p-4 rounded-xl text-sm"
                            style={{ background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.2)' }}
                        >
                            <Info size={16} className="shrink-0 mt-0.5" style={{ color: '#3b82f6' }} />
                            <div style={{ color: T.text }}>
                                <strong>ISS sobre serviços de corretagem:</strong> código LC 116 — 10.05 (Intermediação imobiliária).
                                Alíquota padrão: <strong>2,00%</strong> (município de Garanhuns/PE). A NF deve ser emitida antes do pagamento pela construtora.
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold" style={{ color: T.text }}>
                                Notas Fiscais de Serviços
                            </h3>
                            <button
                                onClick={() => setShowNFModal(true)}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-80"
                                style={{ background: 'var(--accent-500)', color: '#fff' }}
                            >
                                <Plus size={14} />
                                Nova NF
                            </button>
                        </div>

                        {loading ? (
                            <div className="flex justify-center py-12">
                                <Loader2 size={24} className="animate-spin" style={{ color: T.muted }} />
                            </div>
                        ) : notas.length === 0 ? (
                            <EmptyState
                                icon={Receipt}
                                title="Nenhuma nota fiscal"
                                subtitle="Emita uma NFS-e para liberar o pagamento pela construtora"
                            />
                        ) : (
                            <div className="space-y-2">
                                {notas.map((nf, i) => (
                                    <motion.div
                                        key={nf.id}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.03 }}
                                        className="rounded-xl p-4"
                                        style={{ background: T.surface, border: `1px solid ${T.border}` }}
                                    >
                                        <div className="flex flex-wrap items-start justify-between gap-2">
                                            <div>
                                                <div className="font-medium text-sm" style={{ color: T.text }}>
                                                    {nf.nfse_numero
                                                        ? `NFS-e nº ${nf.nfse_numero}`
                                                        : nf.numero
                                                        ? `NF nº ${nf.numero}`
                                                        : 'Rascunho'}
                                                </div>
                                                <div className="text-xs mt-0.5" style={{ color: T.muted }}>
                                                    Tomador: {nf.tomador_nome}
                                                    {nf.data_emissao && ` · Emitida em ${fmtDate(nf.data_emissao)}`}
                                                    {nf.data_competencia && ` · Competência: ${fmtDate(nf.data_competencia)}`}
                                                </div>
                                            </div>
                                            <StatusBadge statusKey={nf.status} map={STATUS_NF} />
                                        </div>
                                        <div className="mt-3 flex flex-wrap gap-4 text-xs" style={{ color: T.muted }}>
                                            <span>Serviços: <strong style={{ color: T.text }}>{fmt(nf.valor_servicos)}</strong></span>
                                            <span>ISS ({nf.aliquota_iss}%): <strong style={{ color: T.text }}>{fmt(nf.valor_iss)}</strong></span>
                                            <span>Líquido: <strong style={{ color: '#22c55e' }}>{fmt(nf.valor_liquido)}</strong></span>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}
            </div>

            {/* ══ MODAL: REGISTRAR VENDA / REPASSE ══════════════════════════ */}
            <AnimatePresence>
                {showRepasseModal && (
                    <RepasseModal
                        agencyId={agencyId}
                        onClose={() => setShowRepasseModal(false)}
                        onSaved={() => { setShowRepasseModal(false); loadRepasses() }}
                    />
                )}
            </AnimatePresence>

            {/* ══ MODAL: NOVA NOTA FISCAL ════════════════════════════════════ */}
            <AnimatePresence>
                {showNFModal && (
                    <NFModal
                        agencyId={agencyId}
                        repasses={repasses.filter(r => r.status === 'aguardando_nf')}
                        onClose={() => setShowNFModal(false)}
                        onSaved={() => { setShowNFModal(false); loadNotas(); loadRepasses() }}
                    />
                )}
            </AnimatePresence>
        </div>
    )
}

/* ─── FIELD ─────────────────────────────────────────────────────── */
function Field({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <div className="text-xs mb-0.5" style={{ color: T.muted }}>{label}</div>
            <div className="text-sm font-medium" style={{ color: T.text }}>{value}</div>
        </div>
    )
}

/* ─── EMPTY STATE ───────────────────────────────────────────────── */
function EmptyState({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle: string }) {
    return (
        <div
            className="flex flex-col items-center justify-center py-16 rounded-xl text-center"
            style={{ border: `1px dashed ${T.border}` }}
        >
            <Icon size={32} style={{ color: T.muted }} className="mb-3 opacity-40" />
            <p className="font-medium text-sm" style={{ color: T.text }}>{title}</p>
            <p className="text-xs mt-1" style={{ color: T.muted }}>{subtitle}</p>
        </div>
    )
}

/* ─── MODAL REPASSE ─────────────────────────────────────────────── */
function RepasseModal({
    agencyId,
    onClose,
    onSaved,
}: {
    agencyId: string | null
    onClose: () => void
    onSaved: () => void
}) {
    const [saving, setSaving] = useState(false)
    const [form, setForm] = useState({
        empreendimento_nome: '',
        cliente_nome: '',
        valor_venda: '',
        percentual_comissao: '5',
        data_venda: new Date().toISOString().split('T')[0],
    })

    const comissao = (parseFloat(form.valor_venda || '0') * parseFloat(form.percentual_comissao || '0')) / 100

    const handleSave = async () => {
        if (!agencyId) return toast.error('Agência não carregada')
        if (!form.empreendimento_nome || !form.valor_venda) return toast.error('Preencha os campos obrigatórios')
        setSaving(true)
        try {
            const res = await fetch('/api/financeiro/repasses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    agency_id: agencyId,
                    empreendimento_nome: form.empreendimento_nome,
                    cliente_nome: form.cliente_nome || 'Não informado',
                    valor_venda: parseFloat(form.valor_venda),
                    percentual_comissao: parseFloat(form.percentual_comissao),
                    data_venda: form.data_venda,
                }),
            })
            if (!res.ok) throw new Error('Erro ao salvar')
            toast.success('Venda registrada! Emita a NF para avançar.')
            onSaved()
        } catch {
            toast.error('Falha ao registrar venda')
        } finally {
            setSaving(false)
        }
    }

    return (
        <ModalWrapper title="Registrar Venda / Repasse" onClose={onClose}>
            <div className="space-y-3">
                <InputField label="Empreendimento *" value={form.empreendimento_nome} onChange={v => setForm(f => ({ ...f, empreendimento_nome: v }))} placeholder="Ex: Loteamento Miguel Marques" />
                <InputField label="Cliente" value={form.cliente_nome} onChange={v => setForm(f => ({ ...f, cliente_nome: v }))} placeholder="Nome do cliente" />
                <div className="grid grid-cols-2 gap-3">
                    <InputField label="Valor da Venda (R$) *" value={form.valor_venda} onChange={v => setForm(f => ({ ...f, valor_venda: v }))} type="number" placeholder="0" />
                    <InputField label="% Comissão" value={form.percentual_comissao} onChange={v => setForm(f => ({ ...f, percentual_comissao: v }))} type="number" placeholder="5" />
                </div>
                <InputField label="Data da Venda" value={form.data_venda} onChange={v => setForm(f => ({ ...f, data_venda: v }))} type="date" />
                {comissao > 0 && (
                    <div
                        className="text-sm p-3 rounded-lg flex items-center gap-2"
                        style={{ background: 'rgba(34,197,94,0.08)', color: '#22c55e' }}
                    >
                        <DollarSign size={14} />
                        Comissão a receber: <strong>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(comissao)}</strong>
                    </div>
                )}
            </div>
            <ModalFooter saving={saving} onClose={onClose} onSave={handleSave} saveLabel="Registrar" />
        </ModalWrapper>
    )
}

/* ─── MODAL NF ──────────────────────────────────────────────────── */
function NFModal({
    agencyId,
    repasses,
    onClose,
    onSaved,
}: {
    agencyId: string | null
    repasses: Repasse[]
    onClose: () => void
    onSaved: () => void
}) {
    const [saving, setSaving] = useState(false)
    const today = new Date()
    const [form, setForm] = useState({
        tomador_nome: 'Mano Imóveis',
        tomador_cpf_cnpj: MANO_CNPJ,
        valor_servicos: '',
        descricao_servico: 'Serviços de corretagem imobiliária — intermediação de compra e venda/locação de imóveis, conforme contrato',
        data_competencia: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`,
        repasse_id: '',
        observacoes: '',
    })

    const iss = (parseFloat(form.valor_servicos || '0') * 0.02)
    const liquido = parseFloat(form.valor_servicos || '0') - iss

    const handleSave = async () => {
        if (!agencyId) return toast.error('Agência não carregada')
        if (!form.valor_servicos) return toast.error('Informe o valor dos serviços')
        setSaving(true)
        try {
            const res = await fetch('/api/financeiro/notas-fiscais', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tomador_nome: form.tomador_nome,
                    tomador_cpf_cnpj: form.tomador_cpf_cnpj,
                    valor_servicos: parseFloat(form.valor_servicos),
                    descricao_servico: form.descricao_servico,
                    data_competencia: form.data_competencia,
                    agency_id: agencyId,
                    repasse_id: form.repasse_id || undefined,
                    observacoes: form.observacoes || undefined,
                }),
            })
            if (!res.ok) throw new Error('Erro')
            toast.success('Nota fiscal criada como rascunho. Emita pelo portal da prefeitura e atualize o número.')
            onSaved()
        } catch {
            toast.error('Falha ao criar nota fiscal')
        } finally {
            setSaving(false)
        }
    }

    return (
        <ModalWrapper title="Nova Nota Fiscal de Serviços" onClose={onClose}>
            <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                    <InputField label="Tomador" value={form.tomador_nome} onChange={v => setForm(f => ({ ...f, tomador_nome: v }))} />
                    <InputField label="CNPJ do Tomador" value={form.tomador_cpf_cnpj} onChange={v => setForm(f => ({ ...f, tomador_cpf_cnpj: v }))} />
                </div>
                <InputField label="Valor dos Serviços (R$) *" value={form.valor_servicos} onChange={v => setForm(f => ({ ...f, valor_servicos: v }))} type="number" placeholder="0" />
                <InputField label="Descrição do Serviço" value={form.descricao_servico} onChange={v => setForm(f => ({ ...f, descricao_servico: v }))} />
                <InputField label="Competência" value={form.data_competencia} onChange={v => setForm(f => ({ ...f, data_competencia: v }))} type="date" />

                {repasses.length > 0 && (
                    <div>
                        <label className="text-xs mb-1 block" style={{ color: T.muted }}>Vincular a Repasse</label>
                        <select
                            value={form.repasse_id}
                            onChange={e => {
                                const r = repasses.find(x => x.id === e.target.value)
                                setForm(f => ({
                                    ...f,
                                    repasse_id: e.target.value,
                                    valor_servicos: r ? String(r.valor_comissao_bruta) : f.valor_servicos,
                                }))
                            }}
                            className="w-full px-3 py-2 rounded-lg text-sm"
                            style={{ background: T.surfaceAlt ?? T.surface, border: `1px solid ${T.border}`, color: T.text }}
                        >
                            <option value="">Não vincular</option>
                            {repasses.map(r => (
                                <option key={r.id} value={r.id}>
                                    {r.empreendimento_nome} — {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(r.valor_comissao_bruta)}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                <InputField label="Observações" value={form.observacoes} onChange={v => setForm(f => ({ ...f, observacoes: v }))} placeholder="Opcional" />

                {parseFloat(form.valor_servicos || '0') > 0 && (
                    <div
                        className="text-sm p-3 rounded-lg space-y-1"
                        style={{ background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.15)' }}
                    >
                        <div className="flex justify-between" style={{ color: T.muted }}>
                            <span>Valor dos serviços</span>
                            <strong style={{ color: T.text }}>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(form.valor_servicos))}</strong>
                        </div>
                        <div className="flex justify-between" style={{ color: T.muted }}>
                            <span>ISS (2,00%)</span>
                            <span style={{ color: '#ef4444' }}>- {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(iss)}</span>
                        </div>
                        <div className="flex justify-between font-semibold" style={{ color: '#22c55e' }}>
                            <span>Valor líquido</span>
                            <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(liquido)}</span>
                        </div>
                    </div>
                )}
            </div>
            <ModalFooter saving={saving} onClose={onClose} onSave={handleSave} saveLabel="Criar Rascunho NF" />
        </ModalWrapper>
    )
}

/* ─── HELPER COMPONENTS ─────────────────────────────────────────── */
function ModalWrapper({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.5)' }}
            onClick={onClose}
        >
            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 24 }}
                onClick={e => e.stopPropagation()}
                className="w-full max-w-lg rounded-2xl p-6 space-y-4"
                style={{ background: T.surface, border: `1px solid ${T.border}` }}
            >
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold" style={{ color: T.text }}>{title}</h3>
                    <button onClick={onClose} style={{ color: T.muted }}><X size={18} /></button>
                </div>
                {children}
            </motion.div>
        </motion.div>
    )
}

function InputField({
    label, value, onChange, type = 'text', placeholder,
}: {
    label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string
}) {
    return (
        <div>
            <label className="text-xs mb-1 block" style={{ color: T.muted }}>{label}</label>
            <input
                type={type}
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ background: T.surfaceAlt ?? T.surface, border: `1px solid ${T.border}`, color: T.text }}
            />
        </div>
    )
}

function ModalFooter({
    saving, onClose, onSave, saveLabel,
}: {
    saving: boolean; onClose: () => void; onSave: () => void; saveLabel: string
}) {
    return (
        <div className="flex gap-3 pt-2">
            <button
                onClick={onClose}
                className="flex-1 py-2 rounded-lg text-sm font-medium"
                style={{ border: `1px solid ${T.border}`, color: T.muted }}
            >
                Cancelar
            </button>
            <button
                onClick={onSave}
                disabled={saving}
                className="flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all hover:opacity-80"
                style={{ background: 'var(--accent-500)', color: '#fff' }}
            >
                {saving ? <Loader2 size={14} className="animate-spin" /> : null}
                {saveLabel}
            </button>
        </div>
    )
}
