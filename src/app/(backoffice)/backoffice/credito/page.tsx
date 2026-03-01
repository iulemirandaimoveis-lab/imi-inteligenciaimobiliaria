'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus, Search, DollarSign, Calculator, TrendingUp, CheckCircle, Clock,
  AlertCircle, User, Building2, ChevronRight, Eye, Edit, BarChart2,
  Home, CreditCard, Landmark, Percent, Calendar, ArrowRight
} from 'lucide-react'
import Link from 'next/link'

// ============================================================
// DADOS MOCK — Crédito
// ============================================================

const OPERACOES = [
  {
    id: '1', protocolo: 'CRD-2026-001', status: 'aprovado',
    cliente: 'João Paulo Ferreira', tipo: 'Financiamento SFH',
    banco: 'Caixa Econômica Federal', valorSolicitado: 480000,
    valorImovel: 600000, prazoMeses: 360, taxa: 10.5, parcela: 4328,
    imóvel: 'Apartamento — Boa Viagem', dataSolicitacao: '2026-01-15',
    observacoes: 'FGTS autorizado. Análise positiva.'
  },
  {
    id: '2', protocolo: 'CRD-2026-002', status: 'analise',
    cliente: 'Ana Beatriz Correia', tipo: 'Financiamento SFI',
    banco: 'Bradesco', valorSolicitado: 1200000,
    valorImovel: 1500000, prazoMeses: 240, taxa: 12.0, parcela: 13800,
    imóvel: 'Cobertura — Boa Viagem', dataSolicitacao: '2026-02-01',
    observacoes: 'Renda qualificada. Aguardando avaliação do imóvel.'
  },
  {
    id: '3', protocolo: 'CRD-2026-003', status: 'documentacao',
    cliente: 'Roberto Cavalcante', tipo: 'Home Equity',
    banco: 'Itaú', valorSolicitado: 300000,
    valorImovel: 800000, prazoMeses: 120, taxa: 13.5, parcela: 4567,
    imóvel: 'Casa — Setúbal', dataSolicitacao: '2026-02-10',
    observacoes: 'Imóvel quitado como garantia.'
  },
]

const STATUS_CONFIG = {
  aprovado: { label: 'Aprovado', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  analise: { label: 'Em Análise', color: 'bg-blue-100 text-blue-700', icon: Clock },
  documentacao: { label: 'Documentação', color: 'bg-amber-100 text-amber-700', icon: AlertCircle },
  recusado: { label: 'Recusado', color: 'bg-red-100 text-red-700', icon: AlertCircle },
}

// ============================================================
// SIMULADOR DE CRÉDITO
// ============================================================

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
    <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">
      <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
        <Calculator size={18} className="text-[#486581]" /> Simulador de Crédito Imobiliário
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-gray-500 block mb-1">Valor do Imóvel</label>
          <div className="relative">
            <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
            <input type="number" value={valorImovel} onChange={e => setValorImovel(Number(e.target.value))}
              className="w-full h-9 pl-8 pr-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#334E68]" />
          </div>
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Entrada / FGTS</label>
          <div className="relative">
            <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
            <input type="number" value={entrada} onChange={e => setEntrada(Number(e.target.value))}
              className="w-full h-9 pl-8 pr-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#334E68]" />
          </div>
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Prazo (meses)</label>
          <select value={prazo} onChange={e => setPrazo(Number(e.target.value))}
            className="w-full h-9 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#334E68] bg-white">
            {[60, 120, 180, 240, 300, 360, 420].map(p => <option key={p} value={p}>{p} meses ({p / 12} anos)</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Taxa de Juros (% a.a.)</label>
          <div className="relative">
            <Percent className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
            <input type="number" step="0.1" value={taxa} onChange={e => setTaxa(Number(e.target.value))}
              className="w-full h-9 pl-8 pr-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#334E68]" />
          </div>
        </div>
      </div>

      {/* Sistema de Amortização */}
      <div className="flex gap-2">
        {(['PRICE', 'SAC'] as const).map(s => (
          <button key={s} onClick={() => setSistema(s)}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-all ${sistema === s ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}>
            Sistema {s}
          </button>
        ))}
      </div>

      {/* Resultados */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { l: 'Valor Financiado', v: formatCurrency(valorFinanciado), c: 'text-gray-900' },
          { l: 'LTV', v: `${ltv.toFixed(0)}%`, c: ltv > 80 ? 'text-red-600' : 'text-emerald-600' },
          { l: sistema === 'PRICE' ? 'Parcela Fixa' : '1ª Parcela', v: formatCurrency(primeiraParcela), c: 'text-[#486581] font-bold text-base' },
          { l: sistema === 'SAC' ? 'Última Parcela' : 'Total Juros', v: sistema === 'SAC' ? formatCurrency(ultimaParcela) : formatCurrency(totalJuros), c: 'text-gray-900' },
        ].map(item => (
          <div key={item.l} className="p-3 bg-gray-50 rounded-xl text-center">
            <p className="text-xs text-gray-500 mb-0.5">{item.l}</p>
            <p className={`text-base font-bold ${item.c}`}>{item.v}</p>
          </div>
        ))}
      </div>

      {/* Renda mínima */}
      <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
        <User size={16} className="text-amber-600 flex-shrink-0" />
        <p className="text-sm text-amber-800">
          Renda mínima estimada: <strong>{formatCurrency(primeiraParcela * 3)}/mês</strong> (comprometimento máx. 30%)
        </p>
      </div>

      <Link href="/backoffice/credito/novo"
        className="flex items-center justify-center gap-2 h-10 w-full bg-[#102A43] text-white rounded-xl text-sm font-semibold hover:bg-[#16162A] transition-colors">
        Iniciar Processo de Crédito <ArrowRight size={16} />
      </Link>
    </div>
  )
}

// ============================================================
// PÁGINA PRINCIPAL
// ============================================================

export default function CreditoPage() {
  const [activeTab, setActiveTab] = useState<'operacoes' | 'simulador'>('simulador')

  const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)

  const totalPortfolio = OPERACOES.reduce((s, o) => s + o.valorSolicitado, 0)
  const aprovados = OPERACOES.filter(o => o.status === 'aprovado').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Crédito Imobiliário</h1>
          <p className="text-xs text-gray-500 mt-0.5">Assessoria e simulações</p>
        </div>
        <Link href="/backoffice/credito/novo"
          className="flex items-center gap-2 h-9 px-4 bg-[#102A43] text-white rounded-xl text-sm font-semibold hover:bg-[#16162A] transition-colors">
          <Plus size={16} /> Nova Operação
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { l: 'Portfólio Total', v: formatCurrency(totalPortfolio), icon: DollarSign, c: 'text-[#486581] bg-amber-50' },
          { l: 'Aprovados', v: aprovados, icon: CheckCircle, c: 'text-emerald-600 bg-emerald-50' },
          { l: 'Em Análise', v: OPERACOES.filter(o => o.status === 'analise').length, icon: Clock, c: 'text-blue-600 bg-blue-50' },
          { l: 'Documentação', v: OPERACOES.filter(o => o.status === 'documentacao').length, icon: AlertCircle, c: 'text-amber-600 bg-amber-50' },
        ].map(kpi => {
          const Icon = kpi.icon
          return (
            <div key={kpi.l} className="bg-white rounded-xl border border-gray-100 p-4">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${kpi.c}`}>
                <Icon size={16} />
              </div>
              <p className="text-xl font-bold text-gray-900">{kpi.v}</p>
              <p className="text-xs text-gray-500 mt-0.5">{kpi.l}</p>
            </div>
          )
        })}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {[{ v: 'simulador', l: '🧮 Simulador' }, { v: 'operacoes', l: '📁 Operações' }].map(tab => (
          <button key={tab.v} onClick={() => setActiveTab(tab.v as any)}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.v ? 'border-[#334E68] text-[#486581]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {tab.l}
          </button>
        ))}
      </div>

      {activeTab === 'simulador' && <SimuladorCredito />}

      {activeTab === 'operacoes' && (
        <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
          {OPERACOES.map(op => {
            const Stt = STATUS_CONFIG[op.status as keyof typeof STATUS_CONFIG]
            const StatusIcon = Stt.icon
            return (
              <div key={op.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors group">
                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <Landmark size={18} className="text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-mono text-gray-400">{op.protocolo}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${Stt.color}`}>
                      <StatusIcon size={11} /> {Stt.label}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">{op.cliente}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                    <span>{op.tipo}</span>
                    <span>{op.banco}</span>
                    <span>{op.prazoMeses / 12} anos</span>
                  </div>
                </div>
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-bold text-gray-900">{formatCurrency(op.valorSolicitado)}</p>
                  <p className="text-xs text-gray-500">Parcela: {formatCurrency(op.parcela)}/mês</p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link href={`/backoffice/credito/${op.id}`} className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-white transition-colors">
                    <Eye size={14} />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
