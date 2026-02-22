'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
    Download, FileText, DollarSign, Users, Building2,
    Briefcase, Scale, BarChart2, Calendar, ChevronDown,
    TrendingUp, FileSpreadsheet, File
} from 'lucide-react'

const T = {
    bg: 'transparent', surface: 'var(--bo-surface)', elevated: 'var(--bo-elevated)',
    border: 'var(--bo-border)', borderGold: 'var(--bo-border-gold)',
    text: 'var(--bo-text)', textSub: 'var(--bo-text-muted)', textDim: 'var(--bo-text-muted)',
    gold: '#C49D5B',
}

const RELATORIOS = [
    {
        id: 1, categoria: 'avaliacoes', label: 'Avaliações do Mês',
        descricao: 'Lista completa de laudos com honorários, status e grau NBR 14653',
        icon: Scale, formatos: ['PDF', 'Excel'],
    },
    {
        id: 2, categoria: 'financeiro', label: 'Honorários Recebidos',
        descricao: 'Fluxo de recebimento de honorários por período, cliente e finalidade',
        icon: DollarSign, formatos: ['PDF', 'Excel'],
    },
    {
        id: 3, categoria: 'crm', label: 'Pipeline de Leads',
        descricao: 'Funil completo com taxa de conversão, origem e score médio',
        icon: Users, formatos: ['PDF', 'Excel'],
    },
    {
        id: 4, categoria: 'imoveis', label: 'Portfólio Ativo',
        descricao: 'Inventário completo de imóveis com VGV, status e métricas de visita',
        icon: Building2, formatos: ['PDF', 'Excel'],
    },
    {
        id: 5, categoria: 'consultorias', label: 'Consultorias',
        descricao: 'Projetos de consultoria com fases, entregas e receita por cliente',
        icon: Briefcase, formatos: ['PDF'],
    },
    {
        id: 6, categoria: 'financeiro', label: 'DRE Simplificado',
        descricao: 'Demonstração de resultado com receitas e despesas operacionais',
        icon: TrendingUp, formatos: ['PDF', 'Excel'],
    },
]

const CAT_MAP: Record<string, { label: string; text: string; bg: string }> = {
    avaliacoes: { label: 'Avaliações', text: '#A89EC4', bg: 'rgba(168,158,196,0.12)' },
    financeiro: { label: 'Financeiro', text: '#6BB87B', bg: 'rgba(107,184,123,0.12)' },
    crm: { label: 'CRM', text: '#7B9EC4', bg: 'rgba(123,158,196,0.12)' },
    imoveis: { label: 'Imóveis', text: '#C49D5B', bg: 'rgba(196,157,91,0.12)' },
    consultorias: { label: 'Consultorias', text: '#E8A87C', bg: 'rgba(232,168,124,0.12)' },
}

const CATEGORIAS = ['Todos', 'Avaliações', 'Financeiro', 'CRM', 'Imóveis', 'Consultorias']
const CAT_KEYS: Record<string, string> = {
    'Todos': 'all', 'Avaliações': 'avaliacoes', 'Financeiro': 'financeiro',
    'CRM': 'crm', 'Imóveis': 'imoveis', 'Consultorias': 'consultorias',
}

const PERIODOS = ['Este mês', 'Mês anterior', 'Último trimestre', 'Este ano', 'Personalizado']

export default function RelatoriosPage() {
    const [catAtiva, setCatAtiva] = useState('Todos')
    const [periodo, setPeriodo] = useState('Este mês')
    const [gerando, setGerando] = useState<number | null>(null)

    const filtrados = RELATORIOS.filter(r =>
        catAtiva === 'Todos' || r.categoria === CAT_KEYS[catAtiva]
    )

    const handleGerar = async (id: number) => {
        setGerando(id)
        await new Promise(r => setTimeout(r, 1500))
        setGerando(null)
    }

    return (
        <div className="space-y-5 max-w-5xl mx-auto">

            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-xl font-bold" style={{ color: T.text }}>Relatórios</h1>
                <p className="text-sm mt-0.5" style={{ color: T.textDim }}>Geração de relatórios executivos e operacionais</p>
            </motion.div>

            {/* Toolbar */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="flex flex-col sm:flex-row gap-3 items-start sm:items-center"
            >
                {/* Período selector */}
                <div className="relative">
                    <select
                        value={periodo}
                        onChange={e => setPeriodo(e.target.value)}
                        className="h-10 pl-4 pr-10 rounded-xl text-sm font-medium outline-none appearance-none cursor-pointer"
                        style={{
                            background: T.surface,
                            border: `1px solid ${T.border}`,
                            color: T.textSub,
                        }}
                    >
                        {PERIODOS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                        style={{ color: T.textDim }} />
                </div>

                {/* Category tabs — scrollable on mobile */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 flex-1">
                    {CATEGORIAS.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setCatAtiva(cat)}
                            className="px-3.5 h-10 rounded-xl text-xs font-semibold flex-shrink-0 transition-all"
                            style={{
                                background: catAtiva === cat ? 'linear-gradient(135deg, #C49D5B, #8B5E1F)' : T.surface,
                                color: catAtiva === cat ? 'white' : T.textDim,
                                border: `1px solid ${catAtiva === cat ? T.borderGold : T.border}`,
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </motion.div>

            {/* Report Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filtrados.map((r, i) => {
                    const cat = CAT_MAP[r.categoria]
                    const loading = gerando === r.id
                    return (
                        <motion.div
                            key={r.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.06 }}
                            className="rounded-2xl p-5 transition-all"
                            style={{ background: T.surface, border: `1px solid ${T.border}` }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.border = `1px solid ${T.borderGold}` }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.border = `1px solid ${T.border}` }}
                        >
                            <div className="flex items-start gap-4">
                                {/* Icon */}
                                <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                                    style={{ background: cat?.bg || 'rgba(196,157,91,0.10)' }}>
                                    <r.icon size={20} style={{ color: cat?.text || T.gold }} />
                                </div>

                                {/* Text */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="text-sm font-semibold" style={{ color: T.text }}>{r.label}</p>
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                            style={{ color: cat?.text, background: cat?.bg }}>
                                            {cat?.label}
                                        </span>
                                    </div>
                                    <p className="text-xs leading-relaxed" style={{ color: T.textDim }}>{r.descricao}</p>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-between mt-4 pt-4"
                                style={{ borderTop: `1px solid ${T.border}` }}>
                                {/* Format badges */}
                                <div className="flex items-center gap-2">
                                    {r.formatos.map(f => (
                                        <div key={f} className="flex items-center gap-1 px-2 py-1 rounded-lg"
                                            style={{ background: T.elevated, border: `1px solid ${T.border}` }}>
                                            {f === 'PDF'
                                                ? <File size={11} style={{ color: '#E8A87C' }} />
                                                : <FileSpreadsheet size={11} style={{ color: '#6BB87B' }} />
                                            }
                                            <span className="text-[10px] font-semibold" style={{ color: T.textDim }}>{f}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Generate button */}
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleGerar(r.id)}
                                    disabled={loading}
                                    className="flex items-center gap-2 h-9 px-4 rounded-xl text-xs font-semibold text-white transition-all"
                                    style={{
                                        background: loading
                                            ? 'rgba(196,157,91,0.30)'
                                            : 'linear-gradient(135deg, #C49D5B, #8B5E1F)',
                                        boxShadow: loading ? 'none' : '0 2px 10px rgba(196,157,91,0.25)',
                                        opacity: loading ? 0.7 : 1,
                                    }}
                                >
                                    {loading ? (
                                        <>
                                            <motion.span
                                                animate={{ rotate: 360 }}
                                                transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                                                className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white inline-block"
                                            />
                                            Gerando...
                                        </>
                                    ) : (
                                        <>
                                            <Download size={13} />
                                            Gerar
                                        </>
                                    )}
                                </motion.button>
                            </div>
                        </motion.div>
                    )
                })}
            </div>
        </div>
    )
}
