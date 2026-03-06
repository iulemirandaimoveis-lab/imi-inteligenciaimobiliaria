'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp, TrendingDown, DollarSign, Plus, Loader2,
  ArrowUpCircle, ArrowDownCircle, X, CheckCircle, Download,
} from 'lucide-react'
import { toast } from 'sonner'
import { PageIntelHeader } from '@/app/(backoffice)/components/ui/PageIntelHeader'
import { KPICard } from '@/app/(backoffice)/components/ui/KPICard'
import { FilterTabs, FilterTab } from '@/app/(backoffice)/components/ui/FilterTabs'
import { StatusBadge } from '@/app/(backoffice)/components/ui/StatusBadge'
import { SectionHeader } from '@/app/(backoffice)/components/ui/SectionHeader'

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

const STATUS_TX: Record<string, { statusKey: string; label: string }> = {
  pago:     { statusKey: 'done',   label: 'Pago'     },
  pendente: { statusKey: 'pend',   label: 'Pendente' },
  atrasado: { statusKey: 'hot',    label: 'Atrasado' },
  cancelado:{ statusKey: 'cancel', label: 'Cancelado'},
}

export default function FinanceiroPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [tipoFilter, setTipoFilter] = useState('todos')
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

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
        body: JSON.stringify({ ...form, amount: parseFloat(form.amount), due_date: form.due_date || null }),
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
      if (res.ok) { toast.success('Marcado como pago'); fetchTransactions() }
    } catch { toast.error('Erro ao atualizar') }
  }

  const filtered = transactions.filter(t =>
    t.status !== 'cancelado' && (tipoFilter === 'todos' || t.type === tipoFilter)
  )

  const totalReceitas = transactions.filter(t => t.type === 'receita' && t.status !== 'cancelado').reduce((s, t) => s + Number(t.amount), 0)
  const totalDespesas = transactions.filter(t => t.type === 'despesa' && t.status !== 'cancelado').reduce((s, t) => s + Number(t.amount), 0)
  const saldo = totalReceitas - totalDespesas
  const pendentes = transactions.filter(t => t.status === 'pendente').length

  const filterTabs: FilterTab[] = [
    { id: 'todos',   label: 'Todos',    count: filtered.length },
    { id: 'receita', label: 'Receitas', dotColor: 'var(--s-done)' },
    { id: 'despesa', label: 'Despesas', dotColor: 'var(--s-hot)'  },
  ]

  const inputStyle = {
    width: '100%', height: '44px', padding: '0 12px',
    borderRadius: '10px', fontSize: '13px', color: 'var(--bo-text)',
    background: 'var(--bo-surface)', border: '1px solid var(--bo-border)',
    outline: 'none', boxSizing: 'border-box' as const,
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ height: '72px', background: 'var(--bo-card)', border: '1px solid var(--bo-border)', borderRadius: '16px', animation: 'pulse 1.5s ease-in-out infinite' }} />
        <div style={{ display: 'flex', gap: '12px' }}>
          {[1,2,3,4].map(i => (
            <div key={i} style={{ flex: 1, height: '88px', background: 'var(--bo-card)', border: '1px solid var(--bo-border)', borderRadius: '16px', animation: 'pulse 1.5s ease-in-out infinite' }} />
          ))}
        </div>
        <div style={{ height: '300px', background: 'var(--bo-card)', border: '1px solid var(--bo-border)', borderRadius: '16px', animation: 'pulse 1.5s ease-in-out infinite' }} />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <PageIntelHeader
          moduleLabel="FINANCEIRO INTELLIGENCE"
          title="Financeiro"
          subtitle="Receitas, despesas e fluxo de caixa"
          actions={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => {
                  const month = new Date().toISOString().slice(0, 7)
                  const a = document.createElement('a')
                  a.href = `/api/export?module=financeiro&month=${month}`
                  a.download = `financeiro-${month}.csv`
                  a.click()
                }}
                title="Exportar CSV do mês atual"
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  height: '38px', padding: '0 14px', borderRadius: '12px',
                  fontSize: '12px', fontWeight: 600, color: 'var(--bo-text-muted)',
                  background: 'var(--bo-elevated)', border: '1px solid var(--bo-border)',
                  cursor: 'pointer', flexShrink: 0,
                }}
              >
                <Download size={13} /> CSV
              </button>
              <button
                onClick={() => setShowForm(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  height: '38px', padding: '0 18px', borderRadius: '12px',
                  fontSize: '13px', fontWeight: 700, color: '#fff',
                  background: 'linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)',
                  border: 'none', cursor: 'pointer',
                  boxShadow: '0 0 18px rgba(59,130,246,0.35)', flexShrink: 0,
                }}
              >
                <Plus size={15} />
                Novo Lançamento
              </button>
            </div>
          }
        />
      </motion.div>

      {/* KPI row */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.35 }}
        style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}
      >
        <div style={{ flexShrink: 0, minWidth: '130px', flex: '1 1 0' }}>
          <KPICard label="Receitas" value={formatCurrency(totalReceitas)} sublabel="entradas" icon={<ArrowUpCircle size={16} />} accent="green" />
        </div>
        <div style={{ flexShrink: 0, minWidth: '130px', flex: '1 1 0' }}>
          <KPICard label="Despesas" value={formatCurrency(totalDespesas)} sublabel="saídas" icon={<ArrowDownCircle size={16} />} accent="hot" />
        </div>
        <div style={{ flexShrink: 0, minWidth: '130px', flex: '1 1 0' }}>
          <KPICard
            label="Saldo"
            value={formatCurrency(saldo)}
            sublabel="balanço atual"
            icon={saldo >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            accent={saldo >= 0 ? 'green' : 'hot'}
          />
        </div>
        <div style={{ flexShrink: 0, minWidth: '110px', flex: '1 1 0' }}>
          <KPICard label="Pendentes" value={String(pendentes)} sublabel="a liquidar" icon={<DollarSign size={16} />} accent="warm" />
        </div>
      </motion.div>

      {/* Transactions panel */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.14, duration: 0.35 }}
        style={{ background: 'var(--bo-card)', border: '1px solid var(--bo-border)', borderRadius: '16px', overflow: 'hidden' }}
      >
        <div style={{ padding: '14px', borderBottom: '1px solid var(--bo-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          <SectionHeader title="Lançamentos" badge={filtered.length} />
          <FilterTabs tabs={filterTabs} active={tipoFilter} onChange={setTipoFilter} />
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: '48px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', textAlign: 'center' }}>
            <DollarSign size={32} color="var(--bo-text-muted)" />
            <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--bo-text)' }}>Nenhum lançamento encontrado</p>
            <p style={{ fontSize: '13px', color: 'var(--bo-text-muted)' }}>Registre receitas e despesas para controlar seu fluxo de caixa</p>
            <button
              onClick={() => setShowForm(true)}
              style={{
                marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px',
                height: '38px', padding: '0 18px', borderRadius: '12px',
                fontSize: '13px', fontWeight: 700, color: '#fff',
                background: 'linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)',
                border: 'none', cursor: 'pointer',
              }}
            >
              <Plus size={15} />Novo Lançamento
            </button>
          </div>
        ) : (
          <div>
            {filtered.map((t, i) => {
              const txStatus = STATUS_TX[t.status] || STATUS_TX.pendente
              return (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '12px 14px',
                    borderBottom: '1px solid var(--bo-border)',
                  }}
                >
                  <div style={{ flexShrink: 0 }}>
                    {t.type === 'receita'
                      ? <ArrowUpCircle size={22} color="var(--s-done)" />
                      : <ArrowDownCircle size={22} color="var(--s-hot)" />
                    }
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--bo-text)', marginBottom: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.description}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--bo-text-muted)', background: 'var(--bo-surface)', padding: '1px 6px', borderRadius: '6px', border: '1px solid var(--bo-border)' }}>
                        {t.category}
                      </span>
                      {t.due_date && (
                        <span style={{ fontSize: '10px', color: 'var(--bo-text-muted)' }}>
                          {new Date(t.due_date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                        </span>
                      )}
                      <StatusBadge status={txStatus.statusKey} label={txStatus.label} size="xs" dot />
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <p style={{ fontSize: '13px', fontWeight: 700, color: t.type === 'receita' ? 'var(--s-done)' : 'var(--s-hot)' }}>
                      {t.type === 'despesa' ? '−' : '+'}{formatCurrency(Number(t.amount))}
                    </p>
                    {t.status === 'pendente' && (
                      <button
                        onClick={() => markPaid(t.id)}
                        title="Marcar como pago"
                        style={{
                          width: '32px', height: '32px', borderRadius: '10px', flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: 'var(--s-done-bg)', border: 'none', cursor: 'pointer',
                        }}
                      >
                        <CheckCircle size={16} color="var(--s-done)" />
                      </button>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </motion.div>

      {/* Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ width: '100%', maxWidth: '480px', background: 'var(--bo-card)', border: '1px solid var(--bo-border)', borderRadius: '20px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--bo-text)' }}>Novo Lançamento</h3>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                <X size={18} color="var(--bo-text-muted)" />
              </button>
            </div>

            {/* Type toggle */}
            <div style={{ display: 'flex', gap: '8px' }}>
              {(['receita', 'despesa'] as const).map(tp => (
                <button key={tp} onClick={() => setForm(f => ({ ...f, type: tp }))}
                  style={{
                    flex: 1, height: '40px', borderRadius: '10px', fontSize: '13px', fontWeight: 600,
                    cursor: 'pointer', transition: 'all 0.18s ease',
                    background: form.type === tp ? (tp === 'receita' ? 'var(--s-done-bg)' : 'var(--s-hot-bg)') : 'var(--bo-surface)',
                    color: form.type === tp ? (tp === 'receita' ? 'var(--s-done)' : 'var(--s-hot)') : 'var(--bo-text-muted)',
                    border: `1px solid ${form.type === tp ? (tp === 'receita' ? 'var(--s-done)' : 'var(--s-hot)') : 'var(--bo-border)'}`,
                  }}>
                  {tp === 'receita' ? '↑ Receita' : '↓ Despesa'}
                </button>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--bo-text-muted)', display: 'block', marginBottom: '6px' }}>Descrição *</label>
                <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Ex: Comissão Venda Apt 905" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--bo-text-muted)', display: 'block', marginBottom: '6px' }}>Valor (R$) *</label>
                <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  placeholder="0.00" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--bo-text-muted)', display: 'block', marginBottom: '6px' }}>Categoria</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={inputStyle}>
                  {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--bo-text-muted)', display: 'block', marginBottom: '6px' }}>Data de Vencimento</label>
                <input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--bo-text-muted)', display: 'block', marginBottom: '6px' }}>Método de Pagamento</label>
                <select value={form.payment_method} onChange={e => setForm(f => ({ ...f, payment_method: e.target.value }))} style={inputStyle}>
                  <option value="">Não informado</option>
                  <option value="pix">PIX</option>
                  <option value="transferencia">Transferência</option>
                  <option value="boleto">Boleto</option>
                  <option value="cartao">Cartão</option>
                  <option value="dinheiro">Dinheiro</option>
                </select>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--bo-text-muted)', display: 'block', marginBottom: '6px' }}>Observações</label>
                <textarea value={form.notes || ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2} placeholder="Notas adicionais..."
                  style={{ ...inputStyle, height: 'auto', padding: '10px 12px', resize: 'none' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowForm(false)}
                style={{ flex: 1, height: '44px', borderRadius: '12px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', background: 'var(--bo-surface)', color: 'var(--bo-text-muted)', border: '1px solid var(--bo-border)' }}>
                Cancelar
              </button>
              <button onClick={handleSubmit} disabled={saving}
                style={{ flex: 1, height: '44px', borderRadius: '12px', fontSize: '13px', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', color: '#fff', background: 'linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: saving ? 0.7 : 1 }}>
                {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={16} />}
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
