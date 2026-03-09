'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
    Download, Users, Building2, Scale, DollarSign,
    Briefcase, TrendingUp, ChevronDown, FileSpreadsheet, File,
    BarChart2, LineChart as LineChartIcon, PieChart,
} from 'lucide-react'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, LineChart, Line, Cell,
} from 'recharts'
import useSWR from 'swr'
import { createClient } from '@/lib/supabase/client'
import { PageIntelHeader, FilterTabs } from '../../components/ui'
import { T } from '../../lib/theme'

const supabase = createClient()

const FUNNEL_STAGES = [
    { key: 'new', label: 'Novos', color: 'var(--bo-accent)' },
    { key: 'contacted', label: 'Contatados', color: '#5B7A9C' },
    { key: 'visit_scheduled', label: 'Visita Agendada', color: '#6B8FAF' },
    { key: 'proposal', label: 'Proposta', color: '#7BA3C2' },
    { key: 'won', label: 'Fechados', color: '#4CAF7D' },
    { key: 'lost', label: 'Perdidos', color: '#E87C7C' },
]

function useLeadsFunnel() {
    return useSWR('leads-funnel', async () => {
        const { data, error } = await supabase.from('leads').select('status')
        if (error) throw error
        const counts: Record<string, number> = {}
        for (const row of data || []) counts[row.status] = (counts[row.status] || 0) + 1
        return FUNNEL_STAGES.map(s => ({ ...s, value: counts[s.key] || 0 }))
    })
}

function useLeadsTemporal() {
    return useSWR('leads-temporal', async () => {
        const since = new Date()
        since.setDate(since.getDate() - 77) // 11 weeks
        const { data, error } = await supabase
            .from('leads').select('created_at')
            .gte('created_at', since.toISOString())
            .order('created_at', { ascending: true })
        if (error) throw error
        const weeks: Record<string, number> = {}
        for (const row of data || []) {
            const d = new Date(row.created_at)
            const mon = new Date(d)
            mon.setDate(d.getDate() - ((d.getDay() + 6) % 7))
            const key = mon.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
            weeks[key] = (weeks[key] || 0) + 1
        }
        return Object.entries(weeks).map(([semana, leads]) => ({ semana, leads }))
    })
}

function useLeadsByDev() {
    return useSWR('leads-by-dev', async () => {
        const { data, error } = await (supabase as any)
            .from('leads')
            .select('development:developments(name)')
        if (error) throw error
        const counts: Record<string, number> = {}
        for (const row of (data as any[]) || []) {
            const name = row.development?.name || 'Sem imóvel'
            counts[name] = (counts[name] || 0) + 1
        }
        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1]).slice(0, 6)
            .map(([name, leads]) => ({ name: name.length > 18 ? name.slice(0, 17) + '…' : name, leads }))
    })
}

// ── Report card data (static — templates para geração)
const RELATORIOS = [
    { id: 1, categoria: 'avaliacoes', label: 'Avaliações do Mês', descricao: 'Lista completa de laudos com honorários, status e grau NBR 14653', icon: Scale, formatos: ['PDF', 'Excel'] },
    { id: 2, categoria: 'financeiro', label: 'Honorários Recebidos', descricao: 'Fluxo de recebimento de honorários por período, cliente e finalidade', icon: DollarSign, formatos: ['PDF', 'Excel'] },
    { id: 3, categoria: 'crm', label: 'Pipeline de Leads', descricao: 'Funil completo com taxa de conversão, origem e score médio', icon: Users, formatos: ['PDF', 'Excel'] },
    { id: 4, categoria: 'imoveis', label: 'Portfólio Ativo', descricao: 'Inventário completo de imóveis com VGV, status e métricas de visita', icon: Building2, formatos: ['PDF', 'Excel'] },
    { id: 5, categoria: 'consultorias', label: 'Consultorias', descricao: 'Projetos de consultoria com fases, entregas e receita por cliente', icon: Briefcase, formatos: ['PDF'] },
    { id: 6, categoria: 'financeiro', label: 'DRE Simplificado', descricao: 'Demonstração de resultado com receitas e despesas operacionais', icon: TrendingUp, formatos: ['PDF', 'Excel'] },
]

const CAT_MAP: Record<string, { label: string; text: string; bg: string }> = {
    avaliacoes: { label: 'Avaliações', text: '#A89EC4', bg: 'rgba(168,158,196,0.12)' },
    financeiro: { label: 'Financeiro', text: '#6BB87B', bg: 'rgba(107,184,123,0.12)' },
    crm: { label: 'CRM', text: '#7B9EC4', bg: 'rgba(123,158,196,0.12)' },
    imoveis: { label: 'Imóveis', text: 'var(--bo-accent)', bg: 'rgba(72,101,129,0.12)' },
    consultorias: { label: 'Consultorias', text: '#E8A87C', bg: 'rgba(232,168,124,0.12)' },
}

const CATEGORIAS = ['Todos', 'Avaliações', 'Financeiro', 'CRM', 'Imóveis', 'Consultorias']
const CAT_KEYS: Record<string, string> = {
    'Todos': 'all', 'Avaliações': 'avaliacoes', 'Financeiro': 'financeiro',
    'CRM': 'crm', 'Imóveis': 'imoveis', 'Consultorias': 'consultorias',
}

const TABS = [
    { key: 'analytics', label: 'Analytics', icon: BarChart2 },
    { key: 'relatorios', label: 'Relatórios', icon: FileSpreadsheet },
]

const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
        <div className="rounded-xl px-3 py-2 text-xs shadow-lg"
            style={{ background: 'var(--bo-elevated)', border: '1px solid var(--bo-border)', color: 'var(--bo-text)' }}>
            <p className="font-semibold mb-1">{label}</p>
            {payload.map((p: any, i: number) => (
                <p key={i} style={{ color: p.color }}>{p.name}: <strong>{p.value}</strong></p>
            ))}
        </div>
    )
}

export default function RelatoriosPage() {
    const [tab, setTab] = useState<'analytics' | 'relatorios'>('analytics')
    const [catAtiva, setCatAtiva] = useState('Todos')
    const [gerando, setGerando] = useState<number | null>(null)

    const { data: funnel, isLoading: loadingFunnel } = useLeadsFunnel()
    const { data: temporal, isLoading: loadingTemporal } = useLeadsTemporal()
    const { data: byDev, isLoading: loadingByDev } = useLeadsByDev()

    const totalLeads = funnel?.reduce((s, f) => s + (f.key !== 'lost' ? f.value : 0), 0) || 0
    const won = funnel?.find(f => f.key === 'won')?.value || 0
    const conversionRate = totalLeads > 0 ? ((won / totalLeads) * 100).toFixed(1) : '0.0'

    const filtrados = RELATORIOS.filter(r => catAtiva === 'Todos' || r.categoria === CAT_KEYS[catAtiva])

    const handleGerar = async (id: number) => {
        setGerando(id)
        try {
            const relatorio = RELATORIOS.find(r => r.id === id)
            if (!relatorio) return

            const moduleName = relatorio.categoria === 'crm' ? 'crm' : relatorio.categoria
            const res = await fetch(`/api/export?module=${moduleName}`)
            if (!res.ok) throw new Error('Erro ao gerar relatório')

            const blob = await res.blob()
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `${relatorio.label.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
            toast.success(`${relatorio.label} exportado com sucesso!`)
        } catch (err: any) {
            toast.error(err.message || 'Erro ao gerar relatório')
        } finally {
            setGerando(null)
        }
    }

    return (
        <div className="space-y-5">
            <PageIntelHeader
                moduleLabel="RELATÓRIOS"
                title="Relatórios & Analytics"
                subtitle="Dados reais · Atualizado em tempo real"
            />

            {/* Tabs */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}
                className="flex gap-1 p-1 rounded-xl w-fit"
                style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                {TABS.map(t => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key as any)}
                        className="flex items-center gap-2 px-4 h-9 rounded-lg text-sm font-medium transition-all"
                        style={{
                            background: tab === t.key ? 'var(--bo-accent)' : 'transparent',
                            color: tab === t.key ? 'white' : T.textDim,
                        }}
                    >
                        <t.icon size={14} />
                        {t.label}
                    </button>
                ))}
            </motion.div>

            {/* Analytics Tab */}
            {tab === 'analytics' && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">

                    {/* KPI strip */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                            { label: 'Total Leads', value: funnel?.reduce((s, f) => s + f.value, 0) || 0, color: 'var(--bo-accent)' },
                            { label: 'Fechados', value: won, color: '#4CAF7D' },
                            { label: 'Taxa Conversão', value: `${conversionRate}%`, color: '#A89EC4' },
                            { label: 'Empreendimentos', value: byDev?.length || 0, color: '#E8A87C' },
                        ].map((kpi, i) => (
                            <div key={i} className="rounded-2xl p-4" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                                <p className="text-xs mb-2" style={{ color: T.textDim }}>{kpi.label}</p>
                                <p className="text-2xl font-bold" style={{ color: kpi.color }}>
                                    {loadingFunnel ? '—' : kpi.value}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Funil de leads */}
                    <div className="rounded-2xl p-5" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                        <p className="text-sm font-semibold mb-4" style={{ color: T.text }}>Funil de Leads</p>
                        {loadingFunnel ? (
                            <div className="h-48 flex items-center justify-center text-sm" style={{ color: T.textDim }}>Carregando...</div>
                        ) : (
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={funnel} layout="vertical" margin={{ left: 8, right: 24, top: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--bo-border)" horizontal={false} />
                                    <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--bo-text-muted)' }} axisLine={false} tickLine={false} />
                                    <YAxis dataKey="label" type="category" tick={{ fontSize: 11, fill: 'var(--bo-text-muted)' }} width={110} axisLine={false} tickLine={false} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="value" name="Leads" radius={[0, 4, 4, 0]} maxBarSize={20}>
                                        {funnel?.map((f, i) => <Cell key={i} fill={f.color} />)}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Leads por semana */}
                        <div className="rounded-2xl p-5" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                            <p className="text-sm font-semibold mb-4" style={{ color: T.text }}>Leads por Semana</p>
                            {loadingTemporal ? (
                                <div className="h-40 flex items-center justify-center text-sm" style={{ color: T.textDim }}>Carregando...</div>
                            ) : temporal?.length === 0 ? (
                                <div className="h-40 flex items-center justify-center text-sm" style={{ color: T.textDim }}>Nenhum dado no período</div>
                            ) : (
                                <ResponsiveContainer width="100%" height={160}>
                                    <LineChart data={temporal} margin={{ left: -10, right: 10, top: 4, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--bo-border)" />
                                        <XAxis dataKey="semana" tick={{ fontSize: 10, fill: 'var(--bo-text-muted)' }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 10, fill: 'var(--bo-text-muted)' }} axisLine={false} tickLine={false} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Line type="monotone" dataKey="leads" name="Leads" stroke="var(--bo-accent)" strokeWidth={2} dot={{ fill: 'var(--bo-accent)', r: 3 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            )}
                        </div>

                        {/* Top empreendimentos */}
                        <div className="rounded-2xl p-5" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                            <p className="text-sm font-semibold mb-4" style={{ color: T.text }}>Leads por Empreendimento</p>
                            {loadingByDev ? (
                                <div className="h-40 flex items-center justify-center text-sm" style={{ color: T.textDim }}>Carregando...</div>
                            ) : byDev?.length === 0 ? (
                                <div className="h-40 flex items-center justify-center text-sm" style={{ color: T.textDim }}>Nenhum dado</div>
                            ) : (
                                <ResponsiveContainer width="100%" height={160}>
                                    <BarChart data={byDev} layout="vertical" margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--bo-border)" horizontal={false} />
                                        <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--bo-text-muted)' }} axisLine={false} tickLine={false} />
                                        <YAxis dataKey="name" type="category" tick={{ fontSize: 9, fill: 'var(--bo-text-muted)' }} width={95} axisLine={false} tickLine={false} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Bar dataKey="leads" name="Leads" fill="var(--bo-accent)" radius={[0, 4, 4, 0]} maxBarSize={16} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Relatórios Tab */}
            {tab === 'relatorios' && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                    {/* Category filter */}
                    <FilterTabs
                        tabs={CATEGORIAS.map(cat => ({
                            id: cat,
                            label: cat,
                            count: cat === 'Todos' ? RELATORIOS.length : RELATORIOS.filter(r => r.categoria === CAT_KEYS[cat]).length,
                        }))}
                        active={catAtiva}
                        onChange={setCatAtiva}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {filtrados.map((r, i) => {
                            const cat = CAT_MAP[r.categoria]
                            const loading = gerando === r.id
                            return (
                                <motion.div key={r.id}
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.06 }}
                                    className="rounded-2xl p-5 transition-all hover-card"
                                    style={{ background: T.surface, border: `1px solid ${T.border}` }}

                                >
                                    <div className="flex items-start gap-4">
                                        <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                                            style={{ background: cat?.bg || 'var(--bo-active-bg)' }}>
                                            <r.icon size={20} style={{ color: cat?.text || T.accent }} />
                                        </div>
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
                                    <div className="flex items-center justify-between mt-4 pt-4"
                                        style={{ borderTop: `1px solid ${T.border}` }}>
                                        <div className="flex items-center gap-2">
                                            {r.formatos.map(f => (
                                                <div key={f} className="flex items-center gap-1 px-2 py-1 rounded-lg"
                                                    style={{ background: T.elevated, border: `1px solid ${T.border}` }}>
                                                    {f === 'PDF'
                                                        ? <File size={11} style={{ color: '#E8A87C' }} />
                                                        : <FileSpreadsheet size={11} style={{ color: '#6BB87B' }} />}
                                                    <span className="text-[10px] font-semibold" style={{ color: T.textDim }}>{f}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <motion.button whileTap={{ scale: 0.95 }}
                                            onClick={() => handleGerar(r.id)} disabled={loading}
                                            className="flex items-center gap-2 h-9 px-4 rounded-xl text-xs font-semibold text-white transition-all"
                                            style={{ background: loading ? 'var(--bo-elevated)' : 'var(--bo-accent)', opacity: loading ? 0.7 : 1 }}>
                                            {loading ? (
                                                <>
                                                    <motion.span animate={{ rotate: 360 }}
                                                        transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                                                        className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white inline-block" />
                                                    Gerando...
                                                </>
                                            ) : (
                                                <><Download size={13} />Gerar</>
                                            )}
                                        </motion.button>
                                    </div>
                                </motion.div>
                            )
                        })}
                    </div>
                </motion.div>
            )}
        </div>
    )
}
