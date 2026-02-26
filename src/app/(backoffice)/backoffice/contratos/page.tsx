'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Plus, Search, FileText, CheckCircle, Clock, AlertCircle,
    Globe, Lock, FileSignature, ChevronRight, Sparkles, X
} from 'lucide-react'
import { MODELOS_CONTRATOS, CATEGORIAS_LABEL, IDIOMAS_LABEL } from '@/lib/modelos-contratos'
import type { ContratoGerado } from '@/types/contratos'

const T = {
    bg: 'transparent', surface: 'var(--bo-surface)', elevated: 'var(--bo-elevated)',
    border: 'var(--bo-border)', borderGold: 'var(--bo-border-gold)',
    text: 'var(--bo-text)', textSub: 'var(--bo-text-muted)', textDim: 'var(--bo-text-muted)',
    gold: '#C49D5B',
}

const STATUS_CFG: Record<string, { label: string; text: string; bg: string; icon: any }> = {
    rascunho: { label: 'Rascunho', text: '#4E5669', bg: 'rgba(78,86,105,0.15)', icon: FileText },
    gerado: { label: 'Gerado', text: '#7B9EC4', bg: 'rgba(123,158,196,0.12)', icon: CheckCircle },
    aguardando_assinatura: { label: 'Aguard. Assinatura', text: '#C49D5B', bg: 'rgba(196,157,91,0.12)', icon: Clock },
    assinado_parcial: { label: 'Parcialmente Assinado', text: '#E8A87C', bg: 'rgba(232,168,124,0.12)', icon: AlertCircle },
    assinado: { label: 'Assinado', text: '#6BB87B', bg: 'rgba(107,184,123,0.12)', icon: CheckCircle },
    cancelado: { label: 'Cancelado', text: '#E57373', bg: 'rgba(229,115,115,0.12)', icon: X },
}

const CONTRATOS_MOCK: ContratoGerado[] = [
    { id: '1', numero: 'IMI-2026-CTR-001', modelo_id: 'promessa-cv', modelo_nome: 'Promessa de Compra e Venda', categoria: 'venda', status: 'assinado', idioma_primario: 'pt', contratante: { nome: 'Carlos Eduardo Martins', email: 'carlos@empresa.com', tipo: 'pessoa_fisica', cpf_cnpj: '123.456.789-00' }, contratado: { nome: 'IMI — Iule Miranda', email: 'iulemirandaimoveis@gmail.com', tipo: 'pessoa_fisica', cpf_cnpj: '987.654.321-00' }, dados_contrato: { valor_total: 950000 }, criado_por: 'iule@imi.imb.br', criado_por_nome: 'Iule Miranda', criado_em: '2026-02-10T10:00:00Z', atualizado_em: '2026-02-12T14:00:00Z' },
    { id: '2', numero: 'IMI-2026-CTR-002', modelo_id: 'captacao-venda', modelo_nome: 'Captação com Exclusividade — Venda', categoria: 'captacao', status: 'aguardando_assinatura', idioma_primario: 'pt', contratante: { nome: 'João Pedro Almeida', email: 'joao@hotmail.com', tipo: 'pessoa_fisica', cpf_cnpj: '234.567.890-11' }, contratado: { nome: 'IMI — Iule Miranda', email: 'iulemirandaimoveis@gmail.com', tipo: 'pessoa_fisica', cpf_cnpj: '987.654.321-00' }, dados_contrato: { preco_anuncio: 1200000 }, criado_por: 'iule@imi.imb.br', criado_por_nome: 'Iule Miranda', criado_em: '2026-02-14T09:00:00Z', atualizado_em: '2026-02-14T09:00:00Z' },
    { id: '3', numero: 'IMI-2026-CTR-003', modelo_id: 'swf-agreement', modelo_nome: 'Sovereign Wealth Fund Advisory', categoria: 'fundo_investimento', status: 'gerado', idioma_primario: 'en', idiomas_adicionais: ['ar', 'pt'], contratante: { nome: 'Abu Dhabi Investment Authority', email: 'investments@adia.ae', tipo: 'pessoa_juridica', cpf_cnpj: '', razao_social: 'ADIA' }, contratado: { nome: 'IMI Real Estate Intelligence', email: 'iulemirandaimoveis@gmail.com', tipo: 'pessoa_juridica', cpf_cnpj: '00.000.000/0001-00', razao_social: 'IMI' }, dados_contrato: { target_aum_usd: 50000000 }, criado_por: 'iule@imi.imb.br', criado_por_nome: 'Iule Miranda', criado_em: '2026-02-18T15:00:00Z', atualizado_em: '2026-02-18T15:00:00Z' },
    { id: '4', numero: 'IMI-2026-CTR-004', modelo_id: 'servicos-avaliacao', modelo_nome: 'Serviços de Avaliação Imobiliária', categoria: 'avaliacao', status: 'assinado', idioma_primario: 'pt', contratante: { nome: 'Banco Bradesco S.A.', email: 'juridico@bradesco.com.br', tipo: 'pessoa_juridica', cpf_cnpj: '60.746.948/0001-12', razao_social: 'Banco Bradesco' }, contratado: { nome: 'IMI — Iule Miranda', email: 'iulemirandaimoveis@gmail.com', tipo: 'pessoa_fisica', cpf_cnpj: '987.654.321-00' }, dados_contrato: { honorarios: 1500 }, criado_por: 'iule@imi.imb.br', criado_por_nome: 'Iule Miranda', criado_em: '2026-02-05T11:00:00Z', atualizado_em: '2026-02-06T16:00:00Z' },
]

const KPIS = [
    { label: 'Total', value: 4, icon: FileText, color: '#7B9EC4' },
    { label: 'Assinados', value: 2, icon: CheckCircle, color: '#6BB87B' },
    { label: 'Aguard. Assinatura', value: 1, icon: Clock, color: '#C49D5B' },
    { label: 'Internacionais', value: 1, icon: Globe, color: '#E8A87C' },
]

function StatusBadge({ status }: { status: string }) {
    const cfg = STATUS_CFG[status] || STATUS_CFG.rascunho
    const Icon = cfg.icon
    return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ color: cfg.text, background: cfg.bg }}>
            <Icon size={9} /> {cfg.label}
        </span>
    )
}

export default function ContratosPage() {
    const router = useRouter()
    const [search, setSearch] = useState('')
    const [filterStatus, setFilterStatus] = useState('todos')
    const [activeTab, setActiveTab] = useState<'lista' | 'modelos'>('lista')

    const filtered = CONTRATOS_MOCK.filter(c => {
        const q = search.toLowerCase()
        const ok = c.numero.toLowerCase().includes(q) ||
            c.modelo_nome.toLowerCase().includes(q) ||
            c.contratante.nome.toLowerCase().includes(q)
        const status = filterStatus === 'todos' || c.status === filterStatus
        return ok && status
    })

    return (
        <div className="space-y-5 max-w-7xl mx-auto">

            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold" style={{ color: T.text }}>Contratos</h1>
                    <p className="text-sm mt-0.5" style={{ color: T.textDim }}>
                        Geração por IA · Assinatura Digital · 5 idiomas
                    </p>
                </div>
                <motion.button whileTap={{ scale: 0.96 }}
                    onClick={() => router.push('/backoffice/contratos/novo')}
                    className="flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-semibold text-white flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg,#C49D5B,#8B5E1F)', boxShadow: '0 2px 12px rgba(196,157,91,0.30)' }}>
                    <Sparkles size={15} /> Novo Contrato
                </motion.button>
            </motion.div>

            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {KPIS.map((k, i) => (
                    <motion.div key={k.label}
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="rounded-2xl p-4"
                        style={{ background: T.elevated, border: `1px solid ${T.borderGold}` }}>
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                            style={{ background: `${k.color}18` }}>
                            <k.icon size={16} style={{ color: k.color }} />
                        </div>
                        <p className="text-2xl font-bold" style={{ color: T.text }}>{k.value}</p>
                        <p className="text-xs mt-0.5" style={{ color: T.textDim }}>{k.label}</p>
                    </motion.div>
                ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-2">
                {[
                    { key: 'lista', label: 'Meus Contratos', icon: FileText },
                    { key: 'modelos', label: 'Modelos Disponíveis', icon: Sparkles },
                ].map(tab => (
                    <button key={tab.key}
                        onClick={() => setActiveTab(tab.key as any)}
                        className="flex items-center gap-2 px-4 h-10 rounded-xl text-sm font-semibold transition-all"
                        style={{
                            background: activeTab === tab.key ? 'linear-gradient(135deg,#C49D5B,#8B5E1F)' : T.surface,
                            color: activeTab === tab.key ? 'white' : T.textDim,
                            border: `1px solid ${activeTab === tab.key ? T.borderGold : T.border}`,
                        }}>
                        <tab.icon size={14} /> {tab.label}
                    </button>
                ))}
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'lista' && (
                    <motion.div key="lista" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">

                        {/* Filters */}
                        <div className="rounded-2xl p-4 space-y-3" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="relative flex-1">
                                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: T.textDim }} />
                                    <input type="text" placeholder="Buscar por número, modelo ou cliente..."
                                        value={search} onChange={e => setSearch(e.target.value)}
                                        className="w-full h-10 pl-9 pr-4 rounded-xl text-sm outline-none"
                                        style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }}
                                    />
                                </div>
                                <div className="flex gap-2 overflow-x-auto">
                                    {['todos', 'assinado', 'aguardando_assinatura', 'gerado'].map(s => (
                                        <button key={s} onClick={() => setFilterStatus(s)}
                                            className="px-3 h-10 rounded-xl text-xs font-semibold flex-shrink-0"
                                            style={{
                                                background: filterStatus === s ? 'linear-gradient(135deg,#C49D5B,#8B5E1F)' : T.elevated,
                                                color: filterStatus === s ? 'white' : T.textDim,
                                                border: `1px solid ${filterStatus === s ? T.borderGold : T.border}`,
                                            }}>
                                            {s === 'todos' ? 'Todos' : STATUS_CFG[s]?.label || s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Lista */}
                        <div className="space-y-2">
                            {filtered.map((c, i) => (
                                <motion.div key={c.id}
                                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.04 }}
                                    onClick={() => router.push(`/backoffice/contratos/${c.id}`)}
                                    className="rounded-2xl cursor-pointer transition-all"
                                    style={{ background: T.surface, border: `1px solid ${T.border}` }}
                                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.border = `1px solid ${T.borderGold}`; (e.currentTarget as HTMLElement).style.background = T.elevated }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.border = `1px solid ${T.border}`; (e.currentTarget as HTMLElement).style.background = T.surface }}>
                                    <div className="flex items-center gap-3 p-4">
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                                            style={{ background: 'rgba(196,157,91,0.10)' }}>
                                            <FileSignature size={18} style={{ color: T.gold }} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                                <p className="text-xs font-mono" style={{ color: T.textDim }}>{c.numero}</p>
                                                <StatusBadge status={c.status} />
                                                <span className="text-[10px]">{IDIOMAS_LABEL[c.idioma_primario]?.flag}</span>
                                                {(c.idiomas_adicionais?.length || 0) > 0 && (
                                                    <span className="text-[10px]" style={{ color: T.textDim }}>
                                                        +{c.idiomas_adicionais?.map(l => IDIOMAS_LABEL[l]?.flag).join('')}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm font-semibold truncate" style={{ color: T.text }}>{c.modelo_nome}</p>
                                            <p className="text-[11px] mt-0.5" style={{ color: T.textDim }}>
                                                {c.contratante.nome} × {c.contratado.nome}
                                            </p>
                                        </div>
                                        <div className="text-right flex-shrink-0 hidden sm:block">
                                            <p className="text-[10px]" style={{ color: T.textDim }}>por {c.criado_por_nome}</p>
                                            <p className="text-[10px] mt-0.5" style={{ color: T.textDim }}>
                                                {new Date(c.criado_em).toLocaleDateString('pt-BR')}
                                            </p>
                                        </div>
                                        <ChevronRight size={14} style={{ color: T.textDim, flexShrink: 0 }} />
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {filtered.length === 0 && (
                            <div className="text-center py-16" style={{ color: T.textDim }}>
                                <FileText size={32} className="mx-auto mb-3 opacity-30" />
                                <p className="text-sm mb-3">Nenhum contrato encontrado</p>
                                <button onClick={() => router.push('/backoffice/contratos/novo')}
                                    className="text-xs font-semibold px-4 py-2 rounded-xl text-white"
                                    style={{ background: 'linear-gradient(135deg,#C49D5B,#8B5E1F)' }}>
                                    Gerar primeiro contrato
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}

                {activeTab === 'modelos' && (
                    <motion.div key="modelos" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                        {Object.entries(CATEGORIAS_LABEL).map(([cat, label]) => {
                            const modelos = MODELOS_CONTRATOS.filter(m => m.categoria === cat)
                            if (!modelos.length) return null
                            return (
                                <div key={cat}>
                                    <h3 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: T.textDim }}>{label}</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {modelos.map((m, i) => (
                                            <motion.div key={m.id}
                                                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.03 }}
                                                onClick={() => router.push(`/backoffice/contratos/novo?modelo=${m.id}`)}
                                                className="rounded-2xl p-4 cursor-pointer transition-all group"
                                                style={{ background: m.id === 'modelo-personalizado' ? 'rgba(196,157,91,0.06)' : T.surface, border: `1px solid ${m.id === 'modelo-personalizado' ? T.borderGold : T.border}` }}
                                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.border = `1px solid ${T.borderGold}`; (e.currentTarget as HTMLElement).style.background = T.elevated }}
                                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.border = `1px solid ${m.id === 'modelo-personalizado' ? T.borderGold : T.border}`; (e.currentTarget as HTMLElement).style.background = m.id === 'modelo-personalizado' ? 'rgba(196,157,91,0.06)' : T.surface }}>
                                                <div className="flex items-start gap-3">
                                                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                                                        style={{ background: `${m.cor}18` }}>
                                                        <FileText size={15} style={{ color: m.cor }} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-1.5 mb-1">
                                                            <p className="text-xs font-semibold" style={{ color: T.text }}>{m.nome}</p>
                                                            {m.popular && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(196,157,91,0.15)', color: T.gold }}>✦</span>}
                                                            {m.internacional && <Globe size={9} style={{ color: '#E8A87C' }} />}
                                                        </div>
                                                        <p className="text-[10px] line-clamp-2" style={{ color: T.textDim }}>{m.descricao}</p>
                                                        <div className="flex gap-0.5 mt-1.5">
                                                            {m.idiomas.map(l => <span key={l} className="text-[9px]">{IDIOMAS_LABEL[l]?.flag}</span>)}
                                                        </div>
                                                    </div>
                                                    <ChevronRight size={12} style={{ color: T.textDim, flexShrink: 0 }} />
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            )
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
