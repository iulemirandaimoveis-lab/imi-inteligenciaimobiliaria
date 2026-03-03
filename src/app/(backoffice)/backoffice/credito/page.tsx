'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Search, DollarSign, Calculator, TrendingUp, CheckCircle, Clock,
  AlertCircle, User, Building2, ChevronRight, Eye, Edit, BarChart2,
  Home, CreditCard, Landmark, Percent, Calendar, ArrowRight, Loader2
} from 'lucide-react'
import Link from 'next/link'

const T = {
  bg: 'transparent', surface: 'var(--bo-surface)', elevated: 'var(--bo-elevated)',
  border: 'var(--bo-border)', borderGold: 'var(--bo-border-gold)',
  text: 'var(--bo-text)', textSub: 'var(--bo-text-muted)', textDim: 'var(--bo-text-muted)',
  gold: '#C49D5B',
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any; bg: string }> = {
  aprovado: { label: 'Aprovado', color: '#6BB87B', bg: 'rgba(107,184,123,0.12)', icon: CheckCircle },
  analise: { label: 'Em Análise', color: '#7B9EC4', bg: 'rgba(123,158,196,0.12)', icon: Clock },
  documentacao: { label: 'Documentação', color: '#C49D5B', bg: 'rgba(196,157,91,0.12)', icon: AlertCircle },
  recusado: { label: 'Recusado', color: '#E57373', bg: 'rgba(229,115,115,0.12)', icon: AlertCircle },
}

function SimuladorCredito() {
  const [valorImovel, setValorImovel] = useState(600000)
  const [entrada, setEntrada] = useState(120000)
  const [prazo, setPrazo] = useState(360)
  const [taxa, setTaxa] = useState(10.5)
  const [sistema, setSistema] = useState<'PRICE' | 'SAC'>('PRICE')

  const valorFinanciado = valorImovel - entrada
  const ltv = (valorFinanciado / valorImovel) * 100
  const taxaMensal = taxa / 100 / 12

  let parcelasSimuladas: { n: number; parcela: number; amortizacao: number; juros: number; saldo: number }[] = []

  if (sistema === 'PRICE') {
    const parcela = valorFinanciado * (taxaMensal * Math.pow(1 + taxaMensal, prazo)) / (Math.pow(1 + taxaMensal, prazo) - 1)
    let saldo = valorFinanciado
    for (let i = 1; i <= Math.min(prazo, 360); i++) {
      const juros = saldo * taxaMensal
      const amort = parcela - juros
      saldo -= amort
      parcelasSimuladas.push({ n: i, parcela, amortizacao: amort, juros, saldo: Math.max(0, saldo) })
    }
  } else {
    const amort = valorFinanciado / prazo
    let saldo = valorFinanciado
    for (let i = 1; i <= Math.min(prazo, 360); i++) {
      const juros = saldo * taxaMensal
      const parcela = amort + juros
      saldo -= amort
      parcelasSimuladas.push({ n: i, parcela, amortizacao: amort, juros, saldo: Math.max(0, saldo) })
    }
  }

  const primeiraParcela = parcelasSimuladas[0]?.parcela || 0
  const ultimaParcela = parcelasSimuladas[parcelasSimuladas.length - 1]?.parcela || 0
  const totalPago = parcelasSimuladas.reduce((s, p) => s + p.parcela, 0)
  const totalJuros = totalPago - valorFinanciado

  const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-6 space-y-5"
      style={{ background: T.surface, border: `1px solid ${T.border}` }}>
      <h3 className="text-base font-bold flex items-center gap-2" style={{ color: T.text }}>
        <Calculator size={18} style={{ color: T.gold }} /> Simulador de Crédito Imobiliário
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="text-xs block mb-1" style={{ color: T.textDim }}>Valor do Imóvel</label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2" size={15} style={{ color: T.textDim }} />
            <input type="number" value={valorImovel} onChange={e => setValorImovel(Number(e.target.value))}
              className="w-full h-10 pl-9 pr-3 rounded-xl text-sm focus:outline-none transition-all"
              style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }}
              onFocus={e => e.currentTarget.style.border = `1px solid ${T.borderGold}`}
              onBlur={e => e.currentTarget.style.border = `1px solid ${T.border}`}
            />
          </div>
        </div>
        <div>
          <label className="text-xs block mb-1" style={{ color: T.textDim }}>Entrada / FGTS</label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2" size={15} style={{ color: T.textDim }} />
            <input type="number" value={entrada} onChange={e => setEntrada(Number(e.target.value))}
              className="w-full h-10 pl-9 pr-3 rounded-xl text-sm focus:outline-none transition-all"
              style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }}
              onFocus={e => e.currentTarget.style.border = `1px solid ${T.borderGold}`}
              onBlur={e => e.currentTarget.style.border = `1px solid ${T.border}`}
            />
          </div>
        </div>
        <div>
          <label className="text-xs block mb-1" style={{ color: T.textDim }}>Prazo (meses)</label>
          <select value={prazo} onChange={e => setPrazo(Number(e.target.value))}
            className="w-full h-10 px-3 rounded-xl text-sm focus:outline-none transition-all"
            style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }}>
            {[60, 120, 180, 240, 300, 360, 420].map(p => <option key={p} value={p}>{p} meses ({p / 12} anos)</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs block mb-1" style={{ color: T.textDim }}>Taxa de Juros (% a.a.)</label>
          <div className="relative">
            <Percent className="absolute left-3 top-1/2 -translate-y-1/2" size={15} style={{ color: T.textDim }} />
            <input type="number" step="0.1" value={taxa} onChange={e => setTaxa(Number(e.target.value))}
              className="w-full h-10 pl-9 pr-3 rounded-xl text-sm focus:outline-none transition-all"
              style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }}
              onFocus={e => e.currentTarget.style.border = `1px solid ${T.borderGold}`}
              onBlur={e => e.currentTarget.style.border = `1px solid ${T.border}`}
            />
          </div>
        </div>
      </div>

      {/* Sistema */}
      <div className="flex gap-2">
        {(['PRICE', 'SAC'] as const).map(s => (
          <button key={s} onClick={() => setSistema(s)}
            className="flex-1 min-h-[44px] rounded-xl text-sm font-semibold transition-all"
            style={{
              background: sistema === s ? '#C49D5B' : T.elevated,
              color: sistema === s ? '#FFF' : T.textDim,
              border: `1px solid ${sistema === s ? T.borderGold : T.border}`
            }}>
            Sistema {s}
          </button>
        ))}
      </div>

      {/* Resultados */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { l: 'Valor Financiado', v: formatCurrency(valorFinanciado), c: T.text },
          { l: 'LTV', v: `${ltv.toFixed(0)}%`, c: ltv > 80 ? '#E57373' : '#6BB87B' },
          { l: sistema === 'PRICE' ? 'Parcela Fixa' : '1ª Parcela', v: formatCurrency(primeiraParcela), c: T.gold, bold: true },
          { l: sistema === 'SAC' ? 'Última Parcela' : 'Total Juros', v: sistema === 'SAC' ? formatCurrency(ultimaParcela) : formatCurrency(totalJuros), c: T.text },
        ].map((item, i) => (
          <motion.div key={item.l}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="p-4 rounded-xl text-center"
            style={{ background: T.elevated, border: `1px solid ${T.borderGold}` }}>
            <p className="text-xs mb-1" style={{ color: T.textDim }}>{item.l}</p>
            <p className={`${item.bold ? 'font-bold text-lg' : 'font-semibold text-base'}`} style={{ color: item.c }}>
              {item.v}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Renda */}
      <div className="flex items-center gap-3 p-4 rounded-xl"
        style={{ background: 'rgba(196,157,91,0.08)', border: `1px solid ${T.borderGold}` }}>
        <User size={18} style={{ color: T.gold, flexShrink: 0 }} />
        <p className="text-sm font-medium" style={{ color: T.text }}>
          Renda mínima estimada: <strong style={{ color: T.gold }}>{formatCurrency(primeiraParcela * 3)}/mês</strong> <span style={{ color: T.textDim }}>(comprometimento máx. 30%)</span>
        </p>
      </div>

      <Link href="/backoffice/credito/novo"
        className="flex items-center justify-center gap-2 min-h-[44px] w-full rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
        style={{ background: '#C49D5B' }}>
        Iniciar Processo de Crédito <ArrowRight size={16} />
      </Link>
    </motion.div>
  )
}

export default function CreditoPage() {
  const [activeTab, setActiveTab] = useState<'operacoes' | 'simulador'>('operacoes')
  const [operacoes, setOperacoes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchCredito() {
      try {
        const res = await fetch('/api/credito')
        if (res.ok) {
          const data = await res.json()
          setOperacoes(data.data || [])
        }
      } catch (err) {
        console.error('Error fetching credito', err)
      } finally {
        setLoading(false)
      }
    }
    fetchCredito()
  }, [])

  const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)
  const totalPortfolio = operacoes.reduce((s, o) => s + Number(o.financed_amount || 0), 0)
  const aprovados = operacoes.filter(o => o.status === 'aprovado').length

  const KPIS = [
    { l: 'Portfólio Total', v: formatCurrency(totalPortfolio), icon: DollarSign, color: '#C49D5B' },
    { l: 'Aprovados', v: aprovados, icon: CheckCircle, color: '#6BB87B' },
    { l: 'Em Análise', v: operacoes.filter(o => o.status === 'analise' || o.status === 'em_analise').length, icon: Clock, color: '#7B9EC4' },
    { l: 'Documentação', v: operacoes.filter(o => o.status === 'documentacao' || o.status === 'pendente').length, icon: AlertCircle, color: '#A89EC4' },
  ]

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold" style={{ color: T.text }}>Crédito Imobiliário</h1>
          <p className="text-sm mt-0.5" style={{ color: T.textDim }}>Assessoria e simulações com bancos parceiros</p>
        </div>
        <Link href="/backoffice/credito/novo"
          className="flex items-center gap-2 min-h-[44px] min-w-[44px] px-5 bg-[#C49D5B] text-white rounded-xl text-sm font-semibold transition-opacity hover:opacity-90 shadow-sm flex-shrink-0">
          <Plus size={16} /> <span className="hidden sm:inline">Nova Operação</span>
        </Link>
      </motion.div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {KPIS.map((kpi, i) => (
          <motion.div key={kpi.l}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-2xl p-4"
            style={{ background: T.elevated, border: `1px solid ${T.borderGold}` }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: `${kpi.color}18` }}>
              <kpi.icon size={16} style={{ color: kpi.color }} />
            </div>
            <p className="text-xl font-bold" style={{ color: T.text }}>{kpi.v}</p>
            <p className="text-xs mt-0.5" style={{ color: T.textDim }}>{kpi.l}</p>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[{ v: 'operacoes', l: '📁 Operações' }, { v: 'simulador', l: '🧮 Simulador' }].map(tab => (
          <button key={tab.v} onClick={() => setActiveTab(tab.v as any)}
            className="min-h-[44px] px-5 rounded-xl text-sm font-semibold transition-all flex-shrink-0"
            style={{
              background: activeTab === tab.v ? '#C49D5B' : T.surface,
              color: activeTab === tab.v ? '#FFF' : T.textDim,
              border: `1px solid ${activeTab === tab.v ? T.borderGold : T.border}`
            }}>
            {tab.l}
          </button>
        ))}
      </div>

      {activeTab === 'simulador' && <SimuladorCredito />}

      {activeTab === 'operacoes' && (
        <AnimatePresence mode="wait">
          <motion.div key="lista" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="rounded-2xl space-y-2">

            {loading && (
              <div className="flex justify-center items-center py-16">
                <Loader2 className="w-6 h-6 animate-spin" style={{ color: T.gold }} />
              </div>
            )}

            {!loading && operacoes.length === 0 && (
              <div className="p-16 text-center rounded-2xl" style={{ border: `1px solid ${T.border}`, background: T.surface }}>
                <Landmark size={32} className="mx-auto mb-4 opacity-30" style={{ color: T.textDim }} />
                <p className="text-sm font-medium" style={{ color: T.textDim }}>Nenhuma operação de crédito encontrada.</p>
                <button onClick={() => setActiveTab('simulador')} className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold" style={{ background: T.elevated, color: T.gold, border: `1px solid ${T.borderGold}` }}>
                  Usar simulador
                </button>
              </div>
            )}

            {!loading && operacoes.map((op, i) => {
              const Stt = STATUS_CONFIG[op.status] || STATUS_CONFIG.analise
              const StatusIcon = Stt.icon
              return (
                <motion.div key={op.id}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all group"
                  style={{ background: T.surface, border: `1px solid ${T.border}` }}
                  onMouseEnter={e => { e.currentTarget.style.border = `1px solid ${T.borderGold}`; e.currentTarget.style.background = T.elevated }}
                  onMouseLeave={e => { e.currentTarget.style.border = `1px solid ${T.border}`; e.currentTarget.style.background = T.surface }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(196,157,91,0.1)' }}>
                    <Landmark size={18} style={{ color: T.gold }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="text-xs font-mono" style={{ color: T.textDim }}>{op.protocol || 'CRD-XXXX'}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1" style={{ color: Stt.color, background: Stt.bg }}>
                        <StatusIcon size={9} /> {Stt.label}
                      </span>
                    </div>
                    <p className="text-sm font-semibold truncate" style={{ color: T.text }}>{op.client_name || 'Sem nome'}</p>
                    <div className="flex items-center gap-2 text-[11px] mt-0.5" style={{ color: T.textDim }}>
                      <span>{op.property_type || 'Imóvel'}</span>
                      {op.bank && <span>· {op.bank}</span>}
                      {op.term_months && <span>· {Math.floor(op.term_months / 12)} anos</span>}
                    </div>
                  </div>
                  <div className="hidden sm:block text-right flex-shrink-0">
                    <p className="text-sm font-bold" style={{ color: T.text }}>{formatCurrency(Number(op.financed_amount || 0))}</p>
                    <p className="text-[11px] mt-0.5" style={{ color: T.textDim }}>Parcela: {formatCurrency(Number(op.monthly_payment || 0))}/mês</p>
                  </div>
                  <div className="pl-2">
                    <ChevronRight size={14} style={{ color: T.textDim }} />
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  )
}
