'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { createClient } from '@/lib/supabase/client'
import {
  Plus, DollarSign, Calculator, CheckCircle, Clock,
  AlertCircle, User, Eye, Landmark, Percent, ArrowRight, FileX, Loader2,
  TrendingUp, Award,
} from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { PageIntelHeader, KPICard } from '../../components/ui'
import { T } from '../../lib/theme'
import { getStatusConfig } from '../../lib/constants'

const supabase = createClient()

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

const STATUS_ICONS: Record<string, React.ElementType> = {
  pending: Clock, approved: CheckCircle, under_review: Clock, documents: AlertCircle,
  rejected: AlertCircle, aprovado: CheckCircle, analise: Clock, documentacao: AlertCircle, recusado: AlertCircle,
}
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = Object.fromEntries(
  ['pending', 'approved', 'under_review', 'documents', 'rejected', 'aprovado', 'analise', 'documentacao', 'recusado'].map(key => {
    const cfg = getStatusConfig(key)
    return [key, { label: cfg.label, color: cfg.dot, bg: `${cfg.dot}14`, icon: STATUS_ICONS[key] || Clock }]
  })
) as Record<string, { label: string; color: string; bg: string; icon: React.ElementType }>

function SimuladorCredito() {
  const [valorImovel, setValorImovel] = useState(600000)
  const [entrada, setEntrada] = useState(120000)
  const [prazo, setPrazo] = useState(360)
  const [taxa, setTaxa] = useState(10.5)
  const [sistema, setSistema] = useState<'PRICE' | 'SAC'>('PRICE')
  const [yieldAnual, setYieldAnual] = useState(4.5)    // % yield bruto esperado a.a.
  const [despesasMensais, setDespesasMensais] = useState(1200) // cond + IPTU + manutenção

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

  // ── Investment analysis ───────────────────────────────────────────
  const aluguelMensal = Math.round(valorImovel * yieldAnual / 100 / 12)
  const cashFlow = aluguelMensal - despesasMensais - primeiraParcela
  const netYield = ((aluguelMensal - despesasMensais) * 12 / valorImovel) * 100
  const paybackAnos = aluguelMensal > despesasMensais
      ? valorImovel / ((aluguelMensal - despesasMensais) * 12)
      : Infinity
  const investGrade = netYield >= 5 && ltv <= 70 ? 'A'
      : netYield >= 4 ? 'B'
      : netYield >= 3 ? 'C' : 'D'
  const gradeMeta = investGrade === 'A'
      ? { label: 'Excelente', color: 'var(--s-done)', bg: 'var(--s-done-bg)', desc: 'Ótimo retorno com baixo risco de exposição' }
      : investGrade === 'B'
      ? { label: 'Bom', color: 'var(--s-cold)', bg: 'var(--s-cold-bg)', desc: 'Retorno atrativo dentro da média de mercado' }
      : investGrade === 'C'
      ? { label: 'Moderado', color: 'var(--s-warm)', bg: 'var(--s-warm-bg)', desc: 'Retorno abaixo da média — avaliar viabilidade' }
      : { label: 'Alto Risco', color: 'var(--s-hot)', bg: 'var(--s-hot-bg)', desc: 'Yield insuficiente — revisar parâmetros' }

  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)

  const inputS: React.CSSProperties = {
    background: T.elevated, border: `1px solid ${T.border}`, color: T.text,
    height: '36px', borderRadius: '8px', padding: '0 10px 0 30px', fontSize: '13px', outline: 'none', width: '100%',
  }

  return (
    <div className="rounded-2xl p-6 space-y-5" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
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
          { l: 'LTV', v: `${ltv.toFixed(0)}%`, color: ltv > 80 ? 'var(--s-hot)' : 'var(--s-done)' },
          { l: sistema === 'PRICE' ? 'Parcela Fixa' : '1ª Parcela', v: fmt(primeiraParcela), color: T.accent },
          { l: sistema === 'SAC' ? 'Última Parcela' : 'Total Juros', v: sistema === 'SAC' ? fmt(ultimaParcela) : fmt(totalJuros), color: T.text },
        ].map(item => (
          <div key={item.l} className="p-3 rounded-xl text-center" style={{ background: T.elevated }}>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: T.textMuted }}>{item.l}</p>
            <p className="text-sm font-bold" style={{ color: item.color, fontVariantNumeric: 'tabular-nums' }}>{item.v}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--s-warm-bg)', border: '1px solid rgba(245,158,11,0.2)' }}>
        <User size={14} style={{ color: 'var(--s-warm)' }} className="flex-shrink-0" />
        <p className="text-xs" style={{ color: 'var(--s-warm)' }}>
          Renda mínima estimada: <strong>{fmt(primeiraParcela * 3)}/mês</strong> (comprometimento máx. 30%)
        </p>
      </div>

      <Link href="/backoffice/credito/novo"
        className="flex items-center justify-center gap-2 w-full rounded-2xl text-sm font-bold text-white transition-all hover:opacity-90"
        style={{ height: '44px', background: T.accent, boxShadow: '0 4px 14px rgba(37,99,235,0.22)' }}>
        Iniciar Processo de Crédito <ArrowRight size={14} />
      </Link>

      {/* ─── Investment Analysis Panel ──────────────────────────── */}
      <div className="rounded-xl p-4 space-y-4" style={{ background: T.elevated, border: `1px solid ${T.border}` }}>
        <div className="flex items-center gap-2">
          <TrendingUp size={14} style={{ color: T.accent }} />
          <p className="text-xs font-bold uppercase tracking-wide" style={{ color: T.text }}>
            Análise de Investimento
          </p>
          <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(72,101,129,0.15)', color: T.textMuted }}>
            Simulação
          </span>
        </div>

        {/* Yield + Despesas inputs */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs block mb-1" style={{ color: T.textMuted }}>Yield Bruto Esperado (% a.a.)</label>
            <div className="relative">
              <Percent className="absolute left-2 top-1/2 -translate-y-1/2" size={13} style={{ color: T.textMuted }} />
              <input type="number" step="0.1" min="0" max="20" value={yieldAnual}
                onChange={e => setYieldAnual(Number(e.target.value))} style={inputS} />
            </div>
          </div>
          <div>
            <label className="text-xs block mb-1" style={{ color: T.textMuted }}>Despesas/Mês (Cond + IPTU)</label>
            <div className="relative">
              <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2" size={13} style={{ color: T.textMuted }} />
              <input type="number" value={despesasMensais}
                onChange={e => setDespesasMensais(Number(e.target.value))} style={inputS} />
            </div>
          </div>
        </div>

        {/* Metrics grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { l: 'Aluguel Estimado', v: fmt(aluguelMensal) + '/mês', color: T.text },
            {
              l: 'Cash Flow Mensal',
              v: (cashFlow >= 0 ? '+' : '') + fmt(cashFlow) + '/mês',
              color: cashFlow >= 0 ? 'var(--s-done)' : 'var(--s-hot)',
            },
            {
              l: 'Yield Líquido',
              v: `${netYield.toFixed(2)}% a.a.`,
              color: netYield >= 4 ? 'var(--s-done)' : netYield >= 3 ? T.accent : 'var(--s-hot)',
            },
            {
              l: 'Payback',
              v: isFinite(paybackAnos) ? `${paybackAnos.toFixed(0)} anos` : '—',
              color: T.textMuted,
            },
          ].map(item => (
            <div key={item.l} className="p-3 rounded-xl text-center" style={{ background: T.surface }}>
              <p className="text-[10px] mb-0.5" style={{ color: T.textMuted }}>{item.l}</p>
              <p className="text-xs font-bold" style={{ color: item.color }}>{item.v}</p>
            </div>
          ))}
        </div>

        {/* Investment Grade badge */}
        <div className="flex items-center gap-3 p-3 rounded-xl"
          style={{ background: gradeMeta.bg, border: `1px solid ${gradeMeta.color}30` }}>
          <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-xl font-black"
            style={{ background: gradeMeta.bg, color: gradeMeta.color, border: `2px solid ${gradeMeta.color}50` }}>
            {investGrade}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold" style={{ color: gradeMeta.color }}>
              Grau {investGrade} — {gradeMeta.label}
            </p>
            <p className="text-xs mt-0.5" style={{ color: gradeMeta.color + 'aa' }}>
              {gradeMeta.desc}
            </p>
          </div>
          <Award size={18} style={{ color: gradeMeta.color + '80', flexShrink: 0 }} />
        </div>

        <p className="text-[10px] text-center" style={{ color: T.textMuted }}>
          * Estimativa baseada em yield/despesas informados. Valores reais podem variar.
        </p>
      </div>
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
    <div className="space-y-5">
      <PageIntelHeader
        moduleLabel="CRÉDITO IMOBILIÁRIO"
        title="Crédito Imobiliário"
        subtitle="Assessoria e simulações"
        actions={
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => window.location.href = '/backoffice/credito/novo'}
            className="flex items-center gap-2 px-5 rounded-2xl text-sm font-bold text-white flex-shrink-0"
            style={{ height: '44px', background: T.accent, boxShadow: '0 4px 14px rgba(37,99,235,0.22)', border: 'none' }}
          >
            <Plus size={16} /> <span className="hidden sm:inline">Nova Operação</span>
          </motion.button>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        <KPICard label="Portfólio Total" value={isLoading ? '—' : fmt(totalPortfolio)} icon={<DollarSign size={16} />} accent="blue" size="sm" />
        <KPICard label="Aprovados" value={isLoading ? '—' : String(list.filter(o => isApproved(o.status)).length)} icon={<CheckCircle size={16} />} accent="green" size="sm" />
        <KPICard label="Em Análise" value={isLoading ? '—' : String(list.filter(o => isReview(o.status)).length)} icon={<Clock size={16} />} accent="cold" size="sm" />
        <KPICard label="Documentação" value={isLoading ? '—' : String(list.filter(o => isDocs(o.status)).length)} icon={<AlertCircle size={16} />} accent="warm" size="sm" />
      </div>

      {/* Tabs */}
      <div className="flex border-b" style={{ borderColor: T.border }}>
        {[{ v: 'simulador', l: 'Simulador' }, { v: 'operacoes', l: 'Operações' }].map(tab => (
          <button key={tab.v} onClick={() => setActiveTab(tab.v as any)}
            className="px-5 text-sm font-semibold border-b-2 transition-colors"
            style={{
              height: '44px',
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
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="skeleton-card p-4 flex items-center gap-3" style={{ animationDelay: `${i * 80}ms` }}>
                  <div className="skeleton w-10 h-10 rounded-xl flex-shrink-0" />
                  <div className="flex-1">
                    <div className="skeleton h-4 w-40 mb-2" />
                    <div className="skeleton h-3 w-56" />
                  </div>
                </div>
              ))}
            </div>
          ) : list.length === 0 ? (
            <div className="empty-state rounded-2xl" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
              <div className="empty-state-icon"><FileX size={24} /></div>
              <p className="empty-state-title">Nenhuma operação de crédito</p>
              <p className="empty-state-desc">Registre operações de crédito para acompanhar o processo.</p>
              <Link href="/backoffice/credito/novo"
                className="mt-4 flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-semibold text-white"
                style={{ background: T.accent }}>
                <Plus size={14} /> Nova Operação
              </Link>
            </div>
          ) : (
            <div className="rounded-2xl overflow-hidden" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
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
                      <p className="text-sm font-bold" style={{ color: T.text, fontVariantNumeric: 'tabular-nums' }}>{fmt(op.financed_amount)}</p>
                      {op.monthly_payment && (
                        <p className="text-xs" style={{ color: T.textMuted, fontVariantNumeric: 'tabular-nums' }}>Parcela: {fmt(op.monthly_payment)}/mês</p>
                      )}
                    </div>
                    <Link href={`/backoffice/credito/${op.id}`}
                      className="w-9 h-9 rounded-xl flex items-center justify-center sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
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
