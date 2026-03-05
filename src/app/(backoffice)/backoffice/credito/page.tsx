'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { createClient } from '@/lib/supabase/client'
import {
  Plus, DollarSign, Calculator, CheckCircle, Clock,
  AlertCircle, User, Eye, Landmark, Percent, ArrowRight, FileX, Loader2,
} from 'lucide-react'
import Link from 'next/link'

const supabase = createClient()

const T = {
  surface: 'var(--bo-surface)',
  elevated: 'var(--bo-elevated)',
  border: 'var(--bo-border)',
  text: 'var(--bo-text)',
  textMuted: 'var(--bo-text-muted)',
  hover: 'var(--bo-hover)',
  accent: 'var(--bo-accent)',
}

interface CreditApplication {
  id: string
  protocol: string
  client_name: string
  client_email: string
  bank: string | null
  financed_amount: number
  property_value: number
  term_months: number
  interest_rate: number | null
  monthly_payment: number | null
  system: string | null
  status: string
  property_address: string
  created_at: string
}

function useCreditApplications() {
  return useSWR('credit_applications', async () => {
    const { data, error } = await supabase
      .from('credit_applications')
      .select('id, protocol, client_name, client_email, bank, financed_amount, property_value, term_months, interest_rate, monthly_payment, system, status, property_address, created_at')
      .order('created_at', { ascending: false })
      .limit(50)
    if (error) throw error
    return (data ?? []) as CreditApplication[]
  })
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  pending:       { label: 'Pendente',     color: '#94A3B8', bg: 'rgba(148,163,184,0.1)', icon: Clock },
  approved:      { label: 'Aprovado',     color: '#4ADE80', bg: 'rgba(74,222,128,0.1)',  icon: CheckCircle },
  under_review:  { label: 'Em Análise',   color: '#60A5FA', bg: 'rgba(96,165,250,0.1)',  icon: Clock },
  documents:     { label: 'Documentação', color: '#FCD34D', bg: 'rgba(252,211,77,0.1)',  icon: AlertCircle },
  rejected:      { label: 'Recusado',     color: '#F87171', bg: 'rgba(248,113,113,0.1)', icon: AlertCircle },
  aprovado:      { label: 'Aprovado',     color: '#4ADE80', bg: 'rgba(74,222,128,0.1)',  icon: CheckCircle },
  analise:       { label: 'Em Análise',   color: '#60A5FA', bg: 'rgba(96,165,250,0.1)',  icon: Clock },
  documentacao:  { label: 'Documentação', color: '#FCD34D', bg: 'rgba(252,211,77,0.1)',  icon: AlertCircle },
  recusado:      { label: 'Recusado',     color: '#F87171', bg: 'rgba(248,113,113,0.1)', icon: AlertCircle },
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

  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)

  const inputS: React.CSSProperties = {
    background: T.elevated, border: `1px solid ${T.border}`, color: T.text,
    height: '36px', borderRadius: '8px', padding: '0 10px 0 30px', fontSize: '13px', outline: 'none', width: '100%',
  }

  return (
    <div className="rounded-xl p-6 space-y-5" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
      <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: T.text }}>
        <Calculator size={16} style={{ color: T.accent }} /> Simulador de Crédito Imobiliário
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs block mb-1" style={{ color: T.textMuted }}>Valor do Imóvel</label>
          <div className="relative">
            <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2" size={13} style={{ color: T.textMuted }} />
            <input type="number" value={valorImovel} onChange={e => setValorImovel(Number(e.target.value))} style={inputS} />
          </div>
        </div>
        <div>
          <label className="text-xs block mb-1" style={{ color: T.textMuted }}>Entrada / FGTS</label>
          <div className="relative">
            <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2" size={13} style={{ color: T.textMuted }} />
            <input type="number" value={entrada} onChange={e => setEntrada(Number(e.target.value))} style={inputS} />
          </div>
        </div>
        <div>
          <label className="text-xs block mb-1" style={{ color: T.textMuted }}>Prazo (meses)</label>
          <select value={prazo} onChange={e => setPrazo(Number(e.target.value))}
            style={{ ...inputS, padding: '0 10px' }}>
            {[60, 120, 180, 240, 300, 360, 420].map(p => <option key={p} value={p}>{p} meses ({p / 12} anos)</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs block mb-1" style={{ color: T.textMuted }}>Taxa de Juros (% a.a.)</label>
          <div className="relative">
            <Percent className="absolute left-2 top-1/2 -translate-y-1/2" size={13} style={{ color: T.textMuted }} />
            <input type="number" step="0.1" value={taxa} onChange={e => setTaxa(Number(e.target.value))} style={inputS} />
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        {(['PRICE', 'SAC'] as const).map(s => (
          <button key={s} onClick={() => setSistema(s)}
            className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: sistema === s ? T.accent : T.elevated,
              border: `1px solid ${sistema === s ? T.accent : T.border}`,
              color: sistema === s ? '#fff' : T.textMuted,
            }}>
            Sistema {s}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { l: 'Valor Financiado', v: fmt(valorFinanciado), color: T.text },
          { l: 'LTV', v: `${ltv.toFixed(0)}%`, color: ltv > 80 ? '#F87171' : '#4ADE80' },
          { l: sistema === 'PRICE' ? 'Parcela Fixa' : '1ª Parcela', v: fmt(primeiraParcela), color: T.accent },
          { l: sistema === 'SAC' ? 'Última Parcela' : 'Total Juros', v: sistema === 'SAC' ? fmt(ultimaParcela) : fmt(totalJuros), color: T.text },
        ].map(item => (
          <div key={item.l} className="p-3 rounded-xl text-center" style={{ background: T.elevated }}>
            <p className="text-xs mb-0.5" style={{ color: T.textMuted }}>{item.l}</p>
            <p className="text-sm font-bold" style={{ color: item.color }}>{item.v}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(252,211,77,0.08)', border: '1px solid rgba(252,211,77,0.2)' }}>
        <User size={14} style={{ color: '#FCD34D' }} className="flex-shrink-0" />
        <p className="text-xs" style={{ color: '#FCD34D' }}>
          Renda mínima estimada: <strong>{fmt(primeiraParcela * 3)}/mês</strong> (comprometimento máx. 30%)
        </p>
      </div>

      <Link href="/backoffice/credito/novo"
        className="flex items-center justify-center gap-2 h-10 w-full rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
        style={{ background: '#1E3A5F' }}>
        Iniciar Processo de Crédito <ArrowRight size={14} />
      </Link>
    </div>
  )
}

export default function CreditoPage() {
  const [activeTab, setActiveTab] = useState<'operacoes' | 'simulador'>('simulador')
  const { data: operacoes, isLoading } = useCreditApplications()

  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)
  const list = operacoes ?? []
  const totalPortfolio = list.reduce((s, o) => s + (o.financed_amount ?? 0), 0)
  const isApproved = (s: string) => s === 'approved' || s === 'aprovado'
  const isReview = (s: string) => s === 'under_review' || s === 'analise'
  const isDocs = (s: string) => s === 'documents' || s === 'documentacao'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: T.text }}>Crédito Imobiliário</h1>
          <p className="text-xs mt-0.5" style={{ color: T.textMuted }}>Assessoria e simulações</p>
        </div>
        <Link href="/backoffice/credito/novo"
          className="flex items-center gap-2 h-9 px-4 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-all"
          style={{ background: '#1E3A5F' }}>
          <Plus size={15} /> Nova Operação
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { l: 'Portfólio Total', v: isLoading ? '—' : fmt(totalPortfolio), icon: DollarSign, color: T.accent, bg: 'rgba(72,101,129,0.12)' },
          { l: 'Aprovados',       v: isLoading ? '—' : list.filter(o => isApproved(o.status)).length, icon: CheckCircle, color: '#4ADE80', bg: 'rgba(74,222,128,0.1)' },
          { l: 'Em Análise',      v: isLoading ? '—' : list.filter(o => isReview(o.status)).length,   icon: Clock,        color: '#60A5FA', bg: 'rgba(96,165,250,0.1)' },
          { l: 'Documentação',    v: isLoading ? '—' : list.filter(o => isDocs(o.status)).length,     icon: AlertCircle,  color: '#FCD34D', bg: 'rgba(252,211,77,0.1)' },
        ].map(kpi => {
          const Icon = kpi.icon
          return (
            <div key={kpi.l} className="rounded-xl p-4" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{ background: kpi.bg }}>
                <Icon size={16} style={{ color: kpi.color }} />
              </div>
              <p className="text-xl font-bold" style={{ color: T.text }}>{kpi.v}</p>
              <p className="text-xs mt-0.5" style={{ color: T.textMuted }}>{kpi.l}</p>
            </div>
          )
        })}
      </div>

      {/* Tabs */}
      <div className="flex border-b" style={{ borderColor: T.border }}>
        {[{ v: 'simulador', l: 'Simulador' }, { v: 'operacoes', l: 'Operações' }].map(tab => (
          <button key={tab.v} onClick={() => setActiveTab(tab.v as any)}
            className="px-5 py-3 text-sm font-medium border-b-2 transition-colors"
            style={{
              borderBottomColor: activeTab === tab.v ? T.accent : 'transparent',
              color: activeTab === tab.v ? T.accent : T.textMuted,
            }}>
            {tab.l}
          </button>
        ))}
      </div>

      {activeTab === 'simulador' && <SimuladorCredito />}

      {activeTab === 'operacoes' && (
        <>
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 size={24} className="animate-spin" style={{ color: T.accent }} />
            </div>
          ) : list.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-4 rounded-xl" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
              <FileX size={32} className="opacity-30" style={{ color: T.textMuted }} />
              <p className="text-sm font-semibold" style={{ color: T.textMuted }}>Nenhuma operação de crédito</p>
              <Link href="/backoffice/credito/novo"
                className="flex items-center gap-2 h-9 px-4 rounded-xl text-sm font-semibold text-white"
                style={{ background: '#1E3A5F' }}>
                <Plus size={14} /> Nova Operação
              </Link>
            </div>
          ) : (
            <div className="rounded-xl overflow-hidden" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
              {list.map((op, i) => {
                const stt = STATUS_CONFIG[op.status] ?? STATUS_CONFIG.pending
                const StatusIcon = stt.icon
                return (
                  <div key={op.id}
                    className="flex items-center gap-4 p-4 transition-colors hover:opacity-90 group"
                    style={{ borderTop: i > 0 ? `1px solid ${T.border}` : 'none' }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: T.elevated }}>
                      <Landmark size={16} style={{ color: T.textMuted }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-mono" style={{ color: T.textMuted }}>{op.protocol}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1"
                          style={{ background: stt.bg, color: stt.color }}>
                          <StatusIcon size={10} /> {stt.label}
                        </span>
                      </div>
                      <p className="text-sm font-semibold" style={{ color: T.text }}>{op.client_name}</p>
                      <div className="flex items-center gap-3 mt-0.5" style={{ color: T.textMuted }}>
                        {op.system && <span className="text-xs">Sistema {op.system}</span>}
                        {op.bank && <span className="text-xs">{op.bank}</span>}
                        <span className="text-xs">{op.term_months / 12} anos</span>
                      </div>
                    </div>
                    <div className="hidden sm:block text-right">
                      <p className="text-sm font-bold" style={{ color: T.text }}>{fmt(op.financed_amount)}</p>
                      {op.monthly_payment && (
                        <p className="text-xs" style={{ color: T.textMuted }}>Parcela: {fmt(op.monthly_payment)}/mês</p>
                      )}
                    </div>
                    <Link href={`/backoffice/credito/${op.id}`}
                      className="w-8 h-8 rounded-lg flex items-center justify-center touch-always-visible opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: T.elevated, border: `1px solid ${T.border}` }}>
                      <Eye size={13} style={{ color: T.textMuted }} />
                    </Link>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
