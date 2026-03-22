'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { ArrowLeft, ArrowRight, Check, Loader2, TrendingUp, ArrowUpRight } from 'lucide-react'
import { T } from '../../../../lib/theme'

const STEPS = ['Mercado', 'Imovel', 'Cenario', 'Resultado'] as const

interface FormData {
  market: string
  city: string
  propertyType: string
  area: number
  bedrooms: number
  purchasePrice: number
  condoFee: number
  iptu: number
  rentalIncome: number
  appreciation: number
  financingRate: number
  downPayment: number
  horizon: number
}

interface SimResult {
  irr: number
  totalReturn: number
  roi: number
  capRate: number
  paybackYears: number
  netPresentValue: number
  monthlyNetIncome: number
  totalCost: number
  equityMultiple: number
}

const initialForm: FormData = {
  market: '', city: '', propertyType: '',
  area: 0, bedrooms: 0,
  purchasePrice: 0, condoFee: 0, iptu: 0,
  rentalIncome: 0, appreciation: 5, financingRate: 10.5,
  downPayment: 20, horizon: 10,
}

export default function NovaSimulacaoPage() {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormData>(initialForm)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SimResult | null>(null)
  const [error, setError] = useState('')

  const set = (key: keyof FormData, val: string | number) =>
    setForm(prev => ({ ...prev, [key]: val }))

  const canAdvance = () => {
    if (step === 0) return form.market && form.city
    if (step === 1) return form.propertyType && form.area > 0 && form.purchasePrice > 0
    if (step === 2) return form.rentalIncome > 0 && form.horizon > 0
    return true
  }

  const submit = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/invest/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro na simulacao')
      setResult(data.result || data)
      setStep(3)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro desconhecido'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const next = () => {
    if (step === 2) {
      submit()
    } else {
      setStep(s => Math.min(s + 1, 3))
    }
  }

  const inputCls = "w-full px-3 py-2.5 rounded-[6px] text-sm placeholder:opacity-40 focus:outline-none"
  const inputStyle: React.CSSProperties = { background: T.surface, border: `1px solid ${T.border}`, color: T.text, fontFamily: T.font.data }
  const labelCls = "block text-xs mb-1.5"
  const labelStyle: React.CSSProperties = { color: T.textMuted }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/backoffice/invest/simulacoes" className="p-2 rounded-lg transition-colors" style={{ border: `1px solid ${T.border}` }}>
          <ArrowLeft className="w-4 h-4" style={{ color: T.textMuted }} />
        </Link>
        <div>
          <h1 className="text-xl font-bold" style={{ color: T.text }}>Nova Simulacao</h1>
          <p className="text-xs mt-0.5" style={{ color: T.textMuted }}>Passo {step + 1} de 4 — {STEPS[step]}</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div
              className="flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-all"
              style={
                i < step
                  ? { background: T.accent, color: '#0B1928' }
                  : i === step
                  ? { border: `2px solid ${T.accent}`, color: T.accent }
                  : { border: `1px solid ${T.border}`, color: T.textDim }
              }
            >
              {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
            </div>
            <span className="text-xs hidden sm:block" style={{ color: i === step ? T.text : T.textDim }}>{s}</span>
            {i < 3 && <div className="flex-1 h-px" style={{ background: i < step ? T.accent : T.border }} />}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="rounded-lg p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold mb-4" style={{ color: T.text }}>Selecione o Mercado</h2>
            <div>
              <label className={labelCls} style={labelStyle}>Mercado</label>
              <select value={form.market} onChange={e => set('market', e.target.value)} className={inputCls} style={inputStyle}>
                <option value="">Selecione...</option>
                <option value="brasil">Brasil</option>
                <option value="eua">EUA (Florida)</option>
                <option value="dubai">Dubai</option>
                <option value="portugal">Portugal</option>
              </select>
            </div>
            <div>
              <label className={labelCls} style={labelStyle}>Cidade</label>
              <input type="text" value={form.city} onChange={e => set('city', e.target.value)} placeholder="Ex: Sao Paulo, Miami, Dubai Marina" className={inputCls} style={inputStyle} />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold mb-4" style={{ color: T.text }}>Dados do Imovel</h2>
            <div>
              <label className={labelCls} style={labelStyle}>Tipo de Imovel</label>
              <select value={form.propertyType} onChange={e => set('propertyType', e.target.value)} className={inputCls} style={inputStyle}>
                <option value="">Selecione...</option>
                <option value="apartamento">Apartamento</option>
                <option value="casa">Casa</option>
                <option value="comercial">Comercial</option>
                <option value="terreno">Terreno</option>
                <option value="studio">Studio</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls} style={labelStyle}>Area (m2)</label>
                <input type="number" value={form.area || ''} onChange={e => set('area', +e.target.value)} placeholder="0" className={inputCls} style={inputStyle} />
              </div>
              <div>
                <label className={labelCls} style={labelStyle}>Quartos</label>
                <input type="number" value={form.bedrooms || ''} onChange={e => set('bedrooms', +e.target.value)} placeholder="0" className={inputCls} style={inputStyle} />
              </div>
            </div>
            <div>
              <label className={labelCls} style={labelStyle}>Preco de Compra (R$)</label>
              <input type="number" value={form.purchasePrice || ''} onChange={e => set('purchasePrice', +e.target.value)} placeholder="0" className={inputCls} style={inputStyle} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls} style={labelStyle}>Condominio Mensal (R$)</label>
                <input type="number" value={form.condoFee || ''} onChange={e => set('condoFee', +e.target.value)} placeholder="0" className={inputCls} style={inputStyle} />
              </div>
              <div>
                <label className={labelCls} style={labelStyle}>IPTU Anual (R$)</label>
                <input type="number" value={form.iptu || ''} onChange={e => set('iptu', +e.target.value)} placeholder="0" className={inputCls} style={inputStyle} />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold mb-4" style={{ color: T.text }}>Cenario Financeiro</h2>
            <div>
              <label className={labelCls} style={labelStyle}>Renda de Aluguel Mensal (R$)</label>
              <input type="number" value={form.rentalIncome || ''} onChange={e => set('rentalIncome', +e.target.value)} placeholder="0" className={inputCls} style={inputStyle} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls} style={labelStyle}>Valorizacao Anual (%)</label>
                <input type="number" value={form.appreciation || ''} onChange={e => set('appreciation', +e.target.value)} placeholder="5" className={inputCls} style={inputStyle} />
              </div>
              <div>
                <label className={labelCls} style={labelStyle}>Horizonte (anos)</label>
                <input type="number" value={form.horizon || ''} onChange={e => set('horizon', +e.target.value)} placeholder="10" className={inputCls} style={inputStyle} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls} style={labelStyle}>Taxa Financiamento (% a.a.)</label>
                <input type="number" value={form.financingRate || ''} onChange={e => set('financingRate', +e.target.value)} placeholder="10.5" step="0.1" className={inputCls} style={inputStyle} />
              </div>
              <div>
                <label className={labelCls} style={labelStyle}>Entrada (%)</label>
                <input type="number" value={form.downPayment || ''} onChange={e => set('downPayment', +e.target.value)} placeholder="20" className={inputCls} style={inputStyle} />
              </div>
            </div>
          </div>
        )}

        {step === 3 && result && (
          <div className="space-y-5">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5" style={{ color: T.accent }} />
              <h2 className="text-lg font-semibold" style={{ color: T.text }}>Resultado da Simulacao</h2>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'TIR (IRR)', value: `${result.irr.toFixed(1)}%`, positive: result.irr >= 0 },
                { label: 'ROI Total', value: `${result.totalReturn.toFixed(1)}%`, positive: result.totalReturn >= 0 },
                { label: 'Cap Rate', value: `${result.capRate.toFixed(1)}%`, positive: true },
                { label: 'Payback', value: `${result.paybackYears.toFixed(1)} anos`, positive: result.paybackYears < form.horizon },
                { label: 'VPL', value: `R$ ${(result.netPresentValue / 1000).toFixed(0)}k`, positive: result.netPresentValue >= 0 },
                { label: 'Renda Liq/mes', value: `R$ ${result.monthlyNetIncome.toLocaleString('pt-BR')}`, positive: result.monthlyNetIncome > 0 },
              ].map(m => (
                <div key={m.label} className="rounded-lg p-3" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                  <div className="text-xs mb-1" style={{ color: T.textMuted }}>{m.label}</div>
                  <div className={`text-lg font-bold flex items-center gap-1 ${m.positive ? 'text-emerald-400' : 'text-red-400'}`} style={{ fontFamily: T.font.data }}>
                    {m.positive && <ArrowUpRight className="w-3.5 h-3.5" />}
                    {m.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Simple bar visualization */}
            <div className="rounded-lg p-4" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
              <div className="text-xs mb-3" style={{ color: T.textMuted }}>Composicao de Retorno</div>
              <div className="space-y-2">
                {[
                  { label: 'Renda Aluguel', pct: 40, color: T.accent },
                  { label: 'Valorizacao', pct: 35, color: '#34d399' },
                  { label: 'Beneficio Fiscal', pct: 15, color: '#60a5fa' },
                  { label: 'Equity Build', pct: 10, color: '#a78bfa' },
                ].map(b => (
                  <div key={b.label} className="flex items-center gap-3">
                    <span className="text-xs w-28" style={{ color: T.textMuted }}>{b.label}</span>
                    <div className="flex-1 h-4 rounded-full overflow-hidden" style={{ background: T.hover }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${b.pct}%`, background: b.color }} />
                    </div>
                    <span className="text-xs w-10 text-right" style={{ color: T.textMuted, fontFamily: T.font.data }}>{b.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 rounded-lg text-sm" style={{ background: T.errorBg, border: '1px solid rgba(239,68,68,0.2)', color: T.error }}>
            {error}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setStep(s => Math.max(s - 1, 0))}
          disabled={step === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm disabled:opacity-30 transition-colors"
          style={{ border: `1px solid ${T.border}`, color: T.textMuted }}
        >
          <ArrowLeft className="w-4 h-4" />
          Anterior
        </button>

        {step < 3 ? (
          <button
            onClick={next}
            disabled={!canAdvance() || loading}
            className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-40"
            style={{ background: T.accent, color: '#0B1928' }}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {step === 2 ? 'Simular' : 'Proximo'}
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => { setStep(0); setResult(null); setForm(initialForm) }}
              className="px-4 py-2 rounded-lg text-sm transition-colors"
              style={{ border: `1px solid ${T.border}`, color: T.textMuted }}
            >
              Nova Simulacao
            </button>
            <Link
              href="/backoffice/invest/simulacoes"
              className="px-4 py-2 rounded-lg text-sm font-medium"
              style={{ background: T.accent, color: '#0B1928' }}
            >
              Ver Todas
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
