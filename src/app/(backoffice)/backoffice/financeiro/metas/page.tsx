'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
    Target, TrendingUp, DollarSign, Scale, Plus,
    ChevronRight, Loader2, CheckCircle, Pencil, Save, X,
} from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { T } from '@/app/(backoffice)/lib/theme'

const fmt = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

function getMonthKey(offset = 0) {
    const d = new Date()
    d.setMonth(d.getMonth() + offset)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(key: string) {
    const [y, m] = key.split('-')
    return `${MONTHS[parseInt(m) - 1]} ${y}`
}

function ProgressBar({ pct, color }: { pct: number; color: string }) {
    const clamped = Math.min(pct, 100)
    return (
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${clamped}%` }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{ background: color }}
            />
        </div>
    )
}

export default function MetasPage() {
    const [loading, setLoading] = useState(true)
    const [goals, setGoals]   = useState<any[]>([])
    const [actuals, setActuals] = useState<{ revenue: number; avaliacoes: number }>({ revenue: 0, avaliacoes: 0 })
    const [editing, setEditing] = useState(false)
    const [saving, setSaving]   = useState(false)
    const currentMonth = getMonthKey(0)

    // Edit form state
    const [form, setForm] = useState({ target_revenue: '', target_avaliacoes: '' })

    const loadData = async () => {
        setLoading(true)
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setLoading(false); return }

        // Load goals for last 6 months
        const monthsBack = Array.from({ length: 6 }, (_, i) => getMonthKey(-i))
        const { data: goalsData } = await supabase
            .from('financial_goals')
            .select('*')
            .eq('user_id', user.id)
            .in('month', monthsBack)
            .order('month', { ascending: false })

        setGoals(goalsData || [])

        // Load actual transactions for current month
        const [y, m] = currentMonth.split('-')
        const start = `${y}-${m}-01`
        const lastDay = new Date(parseInt(y), parseInt(m), 0).getDate()
        const end = `${y}-${m}-${String(lastDay).padStart(2, '0')}`

        const { data: txs } = await supabase
            .from('financial_transactions')
            .select('type, amount, category')
            .in('status', ['pago', 'pendente'])
            .gte('due_date', start)
            .lte('due_date', end)

        const revenue = (txs || []).filter((t: any) => t.type === 'receita').reduce((s: number, t: any) => s + Number(t.amount), 0)
        const avals = (txs || []).filter((t: any) => t.category?.toLowerCase().includes('honorário') || t.category?.toLowerCase().includes('avaliação')).length

        setActuals({ revenue, avaliacoes: avals })

        // Pre-fill form with current month goal
        const currentGoal = (goalsData || []).find((g: any) => g.month === currentMonth)
        if (currentGoal) {
            setForm({ target_revenue: String(currentGoal.target_revenue || ''), target_avaliacoes: String(currentGoal.target_avaliacoes || '') })
        }

        setLoading(false)
    }

    useEffect(() => { loadData() }, [])

    const saveGoal = async () => {
        setSaving(true)
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setSaving(false); return }

        const payload = {
            user_id: user.id,
            month: currentMonth,
            target_revenue: parseFloat(form.target_revenue) || 0,
            target_avaliacoes: parseInt(form.target_avaliacoes) || 0,
        }

        const existing = goals.find(g => g.month === currentMonth)
        if (existing) {
            await supabase.from('financial_goals').update(payload).eq('id', existing.id)
        } else {
            await supabase.from('financial_goals').insert(payload)
        }

        toast.success('Meta salva com sucesso')
        setEditing(false)
        loadData()
        setSaving(false)
    }

    const currentGoal = goals.find(g => g.month === currentMonth)
    const revTarget  = currentGoal?.target_revenue || 0
    const avalTarget = currentGoal?.target_avaliacoes || 0
    const revPct     = revTarget > 0 ? Math.round((actuals.revenue / revTarget) * 100) : 0
    const avalPct    = avalTarget > 0 ? Math.round((actuals.avaliacoes / avalTarget) * 100) : 0

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Link href="/backoffice/financeiro" className="text-xs font-medium hover:underline" style={{ color: T.textMuted }}>
                            Financeiro
                        </Link>
                        <ChevronRight size={12} style={{ color: T.textMuted }} />
                        <span className="text-xs font-medium" style={{ color: T.text }}>Metas</span>
                    </div>
                    <h1 className="text-xl font-bold" style={{ color: T.text }}>Metas & Performance</h1>
                    <p className="text-sm mt-0.5" style={{ color: T.textMuted }}>{monthLabel(currentMonth)}</p>
                </div>
                <button
                    onClick={() => setEditing(!editing)}
                    className="flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-semibold text-white flex-shrink-0 transition-all"
                    style={{ background: editing ? 'rgba(229,115,115,0.2)' : T.accent, color: editing ? '#E57373' : 'white' }}
                >
                    {editing ? <><X size={15} /> Cancelar</> : <><Pencil size={15} /> Editar Metas</>}
                </button>
            </motion.div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="animate-spin" size={22} style={{ color: T.accent }} />
                </div>
            ) : (
                <>
                    {/* Current Month Progress */}
                    <div className="grid md:grid-cols-2 gap-4">
                        {/* Receita */}
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            className="rounded-2xl p-6" style={{ background: T.elevated, border: `1px solid ${T.borderGold}` }}>
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <DollarSign size={15} style={{ color: '#6BB87B' }} />
                                        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: T.textMuted }}>Receita do Mês</span>
                                    </div>
                                    <p className="text-2xl font-bold" style={{ color: T.text }}>{fmt(actuals.revenue)}</p>
                                </div>
                                {revPct >= 100 && (
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center"
                                        style={{ background: 'rgba(107,184,123,0.15)' }}>
                                        <CheckCircle size={16} style={{ color: '#6BB87B' }} />
                                    </div>
                                )}
                            </div>
                            {editing ? (
                                <div className="space-y-2">
                                    <label className="text-[11px] font-semibold" style={{ color: T.textMuted }}>Meta de Receita (R$)</label>
                                    <input
                                        type="number"
                                        value={form.target_revenue}
                                        onChange={e => setForm(f => ({ ...f, target_revenue: e.target.value }))}
                                        placeholder="Ex: 50000"
                                        className="w-full h-10 px-3 rounded-xl text-sm outline-none"
                                        style={{ background: T.surface, border: `1px solid ${T.borderGold}`, color: T.text }}
                                    />
                                </div>
                            ) : (
                                <>
                                    <ProgressBar pct={revPct} color={revPct >= 100 ? '#6BB87B' : revPct >= 60 ? 'var(--bo-accent)' : '#E8A87C'} />
                                    <div className="flex items-center justify-between mt-2">
                                        <span className="text-xs" style={{ color: T.textMuted }}>
                                            Meta: {revTarget > 0 ? fmt(revTarget) : 'não definida'}
                                        </span>
                                        <span className="text-xs font-bold" style={{ color: revPct >= 100 ? '#6BB87B' : T.textMuted }}>
                                            {revTarget > 0 ? `${revPct}%` : '—'}
                                        </span>
                                    </div>
                                </>
                            )}
                        </motion.div>

                        {/* Avaliações */}
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                            className="rounded-2xl p-6" style={{ background: T.elevated, border: `1px solid ${T.borderGold}` }}>
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <Scale size={15} style={{ color: 'var(--bo-accent)' }} />
                                        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: T.textMuted }}>Avaliações/Honorários</span>
                                    </div>
                                    <p className="text-2xl font-bold" style={{ color: T.text }}>{actuals.avaliacoes}</p>
                                </div>
                                {avalPct >= 100 && (
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center"
                                        style={{ background: 'rgba(107,184,123,0.15)' }}>
                                        <CheckCircle size={16} style={{ color: '#6BB87B' }} />
                                    </div>
                                )}
                            </div>
                            {editing ? (
                                <div className="space-y-2">
                                    <label className="text-[11px] font-semibold" style={{ color: T.textMuted }}>Meta de Avaliações/Honorários</label>
                                    <input
                                        type="number"
                                        value={form.target_avaliacoes}
                                        onChange={e => setForm(f => ({ ...f, target_avaliacoes: e.target.value }))}
                                        placeholder="Ex: 5"
                                        className="w-full h-10 px-3 rounded-xl text-sm outline-none"
                                        style={{ background: T.surface, border: `1px solid ${T.borderGold}`, color: T.text }}
                                    />
                                </div>
                            ) : (
                                <>
                                    <ProgressBar pct={avalPct} color={avalPct >= 100 ? '#6BB87B' : avalPct >= 60 ? 'var(--bo-accent)' : '#E8A87C'} />
                                    <div className="flex items-center justify-between mt-2">
                                        <span className="text-xs" style={{ color: T.textMuted }}>
                                            Meta: {avalTarget > 0 ? `${avalTarget} lançamentos` : 'não definida'}
                                        </span>
                                        <span className="text-xs font-bold" style={{ color: avalPct >= 100 ? '#6BB87B' : T.textMuted }}>
                                            {avalTarget > 0 ? `${avalPct}%` : '—'}
                                        </span>
                                    </div>
                                </>
                            )}
                        </motion.div>
                    </div>

                    {/* Save button when editing */}
                    {editing && (
                        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                            <button onClick={saveGoal} disabled={saving}
                                className="flex items-center gap-2 h-10 px-6 rounded-xl text-sm font-semibold text-white transition-all"
                                style={{ background: '#6BB87B', opacity: saving ? 0.7 : 1 }}>
                                {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                                {saving ? 'Salvando...' : 'Salvar Metas'}
                            </button>
                        </motion.div>
                    )}

                    {/* Historical goals */}
                    {goals.filter(g => g.month !== currentMonth).length > 0 && (
                        <div>
                            <h2 className="text-sm font-bold mb-3" style={{ color: T.textMuted }}>Histórico de Metas</h2>
                            <div className="space-y-2">
                                {goals.filter(g => g.month !== currentMonth).map((g, i) => {
                                    const rPct = g.target_revenue > 0 ? Math.min(100, Math.round((0 / g.target_revenue) * 100)) : 0
                                    return (
                                        <motion.div key={g.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                                            className="flex items-center gap-4 p-4 rounded-2xl"
                                            style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                                            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                                                style={{ background: T.elevated }}>
                                                <Target size={16} style={{ color: T.accent }} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold" style={{ color: T.text }}>{monthLabel(g.month)}</p>
                                                <p className="text-[11px]" style={{ color: T.textMuted }}>
                                                    Meta receita: {g.target_revenue > 0 ? fmt(g.target_revenue) : '—'} ·
                                                    Meta avaliações: {g.target_avaliacoes || '—'}
                                                </p>
                                            </div>
                                            <TrendingUp size={14} style={{ color: T.textMuted }} />
                                        </motion.div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* Empty state */}
                    {!currentGoal && !editing && (
                        <div className="rounded-2xl p-10 text-center" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                            <Target size={32} className="mx-auto mb-3 opacity-30" style={{ color: T.textMuted }} />
                            <p className="text-sm font-semibold mb-1" style={{ color: T.textMuted }}>Metas não definidas para {monthLabel(currentMonth)}</p>
                            <p className="text-xs mb-4" style={{ color: T.textMuted }}>Defina sua meta de receita e avaliações para acompanhar o progresso</p>
                            <button onClick={() => setEditing(true)}
                                className="inline-flex items-center gap-2 h-9 px-5 rounded-xl text-xs font-semibold text-white"
                                style={{ background: T.accent }}>
                                <Plus size={13} /> Definir Metas
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
