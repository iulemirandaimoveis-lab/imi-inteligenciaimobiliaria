'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
    TrendingUp, TrendingDown, DollarSign, Plus, Loader2,
    ArrowUpCircle, ArrowDownCircle, Download, X, CheckCircle,
} from 'lucide-react'
import { toast } from 'sonner'

const T = {
    bg: 'transparent', surface: 'var(--bo-surface)', elevated: 'var(--bo-elevated)',
    border: 'var(--bo-border)', borderGold: 'var(--bo-border-gold)',
    text: 'var(--bo-text)', textSub: 'var(--bo-text-muted)', textDim: 'var(--bo-text-muted)',
    gold: '#C49D5B',
}

interface Transaction {
    id: string
    type: 'receita' | 'despesa'
    category: string
    description: string
    amount: number
    due_date: string | null
    paid_date: string | null
    status: string
    payment_method: string | null
    notes: string | null
    created_at: string
}

const CATEGORIAS = [
    'Comissão', 'Honorário', 'Consultoria', 'Marketing',
    'Pessoal', 'Infraestrutura', 'Tecnologia', 'Jurídico', 'Outros'
]

const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

export default function FinanceiroPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [loading, setLoading] = useState(true)
    const [tipoFilter, setTipoFilter] = useState<'todos' | 'receita' | 'despesa'>('todos')
    const [showForm, setShowForm] = useState(false)
    const [saving, setSaving] = useState(false)

    // Form state
    const [form, setForm] = useState({
        type: 'receita' as 'receita' | 'despesa',
        category: 'Comissão',
        description: '',
        amount: '',
        due_date: '',
        status: 'pendente',
        payment_method: '',
        notes: '',
    })

    const fetchTransactions = async () => {
        try {
            const res = await fetch('/api/financeiro')
            if (res.ok) {
                const data = await res.json()
                setTransactions(data)
            }
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchTransactions() }, [])

    const handleSubmit = async () => {
        if (!form.description || !form.amount) {
            toast.error('Descrição e valor são obrigatórios')
            return
        }
        setSaving(true)
        try {
            const res = await fetch('/api/financeiro', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...form,
                    amount: parseFloat(form.amount),
                    due_date: form.due_date || null,
                }),
            })
            if (res.ok) {
                toast.success('Lançamento criado!')
                setShowForm(false)
                setForm({ type: 'receita', category: 'Comissão', description: '', amount: '', due_date: '', status: 'pendente', payment_method: '', notes: '' })
                fetchTransactions()
            } else {
                const data = await res.json()
                toast.error(data.error || 'Erro ao salvar')
            }
        } catch { toast.error('Erro de conexão') }
        finally { setSaving(false) }
    }

    const markPaid = async (id: string) => {
        try {
            const res = await fetch('/api/financeiro', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status: 'pago', paid_date: new Date().toISOString().split('T')[0] }),
            })
            if (res.ok) {
                toast.success('Marcado como pago')
                fetchTransactions()
            }
        } catch { toast.error('Erro ao atualizar') }
    }

    const filtered = transactions.filter(t =>
        t.status !== 'cancelado' && (tipoFilter === 'todos' || t.type === tipoFilter)
    )

    const totalReceitas = transactions.filter(t => t.type === 'receita' && t.status !== 'cancelado').reduce((s, t) => s + Number(t.amount), 0)
    const totalDespesas = transactions.filter(t => t.type === 'despesa' && t.status !== 'cancelado').reduce((s, t) => s + Number(t.amount), 0)
    const saldo = totalReceitas - totalDespesas
    const pendentes = transactions.filter(t => t.status === 'pendente').length

    if (loading) {
        return <div className="flex items-center justify-center h-64"><Loader2 size={24} className="animate-spin" style={{ color: T.gold }} /></div>
    }

    return (
        <div className="space-y-5 max-w-7xl mx-auto">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold" style={{ color: T.text }}>Financeiro</h1>
                    <p className="text-sm mt-0.5" style={{ color: T.textDim }}>Gestão de receitas, despesas e fluxo de caixa</p>
                </div>
                <motion.button whileTap={{ scale: 0.96 }} onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-semibold text-white flex-shrink-0"
                    style={{ background: T.gold, boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                    <Plus size={16} /> Novo Lançamento
                </motion.button>
            </motion.div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    { label: 'Receitas', value: totalReceitas, color: '#6BB87B', icon: ArrowUpCircle },
                    { label: 'Despesas', value: totalDespesas, color: '#E57373', icon: ArrowDownCircle },
                    { label: 'Saldo', value: saldo, color: saldo >= 0 ? '#6BB87B' : '#E57373', icon: saldo >= 0 ? TrendingUp : TrendingDown },
                    { label: 'Pendentes', value: pendentes, color: '#C49D5B', icon: DollarSign, isCount: true },
                ].map((kpi, i) => (
                    <motion.div key={kpi.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                        className="rounded-2xl p-4" style={{ background: T.elevated, border: `1px solid ${T.borderGold}` }}>
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: kpi.color }}>{kpi.label}</p>
                            <kpi.icon size={16} style={{ color: kpi.color }} />
                        </div>
                        <p className="text-xl font-bold" style={{ color: T.text }}>
                            {(kpi as any).isCount ? kpi.value : formatCurrency(kpi.value as number)}
                        </p>
                    </motion.div>
                ))}
            </div>

            {/* Filter + Table */}
            <div className="rounded-2xl overflow-hidden" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                <div className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3" style={{ borderBottom: `1px solid ${T.border}` }}>
                    <h2 className="text-sm font-bold" style={{ color: T.text }}>Lançamentos ({filtered.length})</h2>
                    <div className="flex items-center gap-1.5 overflow-x-auto">
                        {(['todos', 'receita', 'despesa'] as const).map(f => (
                            <button key={f} onClick={() => setTipoFilter(f)}
                                className="px-3.5 h-9 rounded-xl text-xs font-semibold transition-all flex-shrink-0"
                                style={{
                                    background: tipoFilter === f ? (f === 'receita' ? 'rgba(107,184,123,0.15)' : f === 'despesa' ? 'rgba(229,115,115,0.15)' : T.gold) : T.elevated,
                                    color: tipoFilter === f ? (f === 'receita' ? '#6BB87B' : f === 'despesa' ? '#E57373' : 'white') : T.textDim,
                                    border: `1px solid ${tipoFilter === f ? T.borderGold : T.border}`,
                                }}>
                                {f === 'todos' ? 'Todos' : f === 'receita' ? 'Receitas' : 'Despesas'}
                            </button>
                        ))}
                    </div>
                </div>

                {filtered.length === 0 ? (
                    <div className="p-12 text-center">
                        <DollarSign size={32} className="mx-auto mb-3 opacity-30" style={{ color: T.textDim }} />
                        <p className="text-sm font-semibold" style={{ color: T.textSub }}>Nenhum lançamento encontrado</p>
                        <p className="text-xs mt-1" style={{ color: T.textDim }}>Clique em "Novo Lançamento" para começar</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider" style={{ color: T.textDim }}>Data</th>
                                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider" style={{ color: T.textDim }}>Descrição</th>
                                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider hidden sm:table-cell" style={{ color: T.textDim }}>Categoria</th>
                                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider" style={{ color: T.textDim }}>Status</th>
                                    <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wider" style={{ color: T.textDim }}>Valor</th>
                                    <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wider" style={{ color: T.textDim }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(t => (
                                    <tr key={t.id} className="transition-colors" style={{ borderBottom: `1px solid ${T.border}` }}
                                        onMouseEnter={e => (e.currentTarget.style.background = T.elevated)}
                                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                        <td className="px-4 py-3 text-xs" style={{ color: T.textSub }}>
                                            {t.due_date ? new Date(t.due_date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                {t.type === 'receita'
                                                    ? <ArrowUpCircle size={14} className="flex-shrink-0" style={{ color: '#6BB87B' }} />
                                                    : <ArrowDownCircle size={14} className="flex-shrink-0" style={{ color: '#E57373' }} />}
                                                <span className="text-xs font-medium truncate max-w-[200px]" style={{ color: T.text }}>{t.description}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 hidden sm:table-cell">
                                            <span className="text-[10px] font-semibold px-2 py-1 rounded-lg" style={{ background: T.elevated, color: T.textSub }}>{t.category}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-[10px] font-semibold px-2 py-1 rounded-full" style={{
                                                color: t.status === 'pago' ? '#6BB87B' : t.status === 'atrasado' ? '#E57373' : '#C49D5B',
                                                background: t.status === 'pago' ? 'rgba(107,184,123,0.12)' : t.status === 'atrasado' ? 'rgba(229,115,115,0.12)' : 'rgba(196,157,91,0.12)',
                                            }}>
                                                {t.status === 'pago' ? 'Pago' : t.status === 'atrasado' ? 'Atrasado' : 'Pendente'}
                                            </span>
                                        </td>
                                        <td className={`px-4 py-3 text-right text-xs font-bold`} style={{ color: t.type === 'receita' ? '#6BB87B' : '#E57373' }}>
                                            {t.type === 'despesa' ? '−' : '+'}{formatCurrency(Number(t.amount))}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            {t.status === 'pendente' && (
                                                <button onClick={() => markPaid(t.id)} className="text-[10px] font-semibold px-2 py-1 rounded-lg transition-all"
                                                    style={{ color: '#6BB87B', background: 'rgba(107,184,123,0.08)' }}>
                                                    <CheckCircle size={12} className="inline mr-1" />Pagar
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* New Transaction Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)' }}>
                    <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
                        className="w-full max-w-lg rounded-2xl p-6 space-y-4" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold" style={{ color: T.text }}>Novo Lançamento</h3>
                            <button onClick={() => setShowForm(false)}><X size={18} style={{ color: T.textDim }} /></button>
                        </div>

                        {/* Type toggle */}
                        <div className="flex gap-2">
                            {(['receita', 'despesa'] as const).map(t => (
                                <button key={t} onClick={() => setForm(f => ({ ...f, type: t }))}
                                    className="flex-1 h-10 rounded-xl text-xs font-semibold transition-all"
                                    style={{
                                        background: form.type === t ? (t === 'receita' ? 'rgba(107,184,123,0.15)' : 'rgba(229,115,115,0.15)') : T.elevated,
                                        color: form.type === t ? (t === 'receita' ? '#6BB87B' : '#E57373') : T.textDim,
                                        border: `1px solid ${form.type === t ? T.borderGold : T.border}`,
                                    }}>
                                    {t === 'receita' ? '↑ Receita' : '↓ Despesa'}
                                </button>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="sm:col-span-2">
                                <label className="text-[11px] font-semibold mb-1 block" style={{ color: T.textDim }}>Descrição *</label>
                                <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                    placeholder="Ex: Comissão Venda Apt 905" className="w-full h-10 px-3 rounded-xl text-sm outline-none"
                                    style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }} />
                            </div>
                            <div>
                                <label className="text-[11px] font-semibold mb-1 block" style={{ color: T.textDim }}>Valor (R$) *</label>
                                <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                                    placeholder="0.00" className="w-full h-10 px-3 rounded-xl text-sm outline-none"
                                    style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }} />
                            </div>
                            <div>
                                <label className="text-[11px] font-semibold mb-1 block" style={{ color: T.textDim }}>Categoria</label>
                                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                                    className="w-full h-10 px-3 rounded-xl text-sm outline-none"
                                    style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }}>
                                    {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[11px] font-semibold mb-1 block" style={{ color: T.textDim }}>Data de Vencimento</label>
                                <input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
                                    className="w-full h-10 px-3 rounded-xl text-sm outline-none"
                                    style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }} />
                            </div>
                            <div>
                                <label className="text-[11px] font-semibold mb-1 block" style={{ color: T.textDim }}>Método de Pagamento</label>
                                <select value={form.payment_method} onChange={e => setForm(f => ({ ...f, payment_method: e.target.value }))}
                                    className="w-full h-10 px-3 rounded-xl text-sm outline-none"
                                    style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }}>
                                    <option value="">Não informado</option>
                                    <option value="pix">PIX</option>
                                    <option value="transferencia">Transferência</option>
                                    <option value="boleto">Boleto</option>
                                    <option value="cartao">Cartão</option>
                                    <option value="dinheiro">Dinheiro</option>
                                </select>
                            </div>
                            <div className="sm:col-span-2">
                                <label className="text-[11px] font-semibold mb-1 block" style={{ color: T.textDim }}>Observações</label>
                                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                                    rows={2} placeholder="Notas adicionais..." className="w-full px-3 py-2 rounded-xl text-sm outline-none resize-none"
                                    style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }} />
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button onClick={() => setShowForm(false)} className="flex-1 h-10 rounded-xl text-sm font-semibold"
                                style={{ background: T.elevated, color: T.textSub, border: `1px solid ${T.border}` }}>Cancelar</button>
                            <button onClick={handleSubmit} disabled={saving}
                                className="flex-1 h-10 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2"
                                style={{ background: T.gold }}>
                                {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                                {saving ? 'Salvando...' : 'Salvar'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    )
}
