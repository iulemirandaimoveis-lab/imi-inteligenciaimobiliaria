'use client'

import { useState, useCallback } from 'react'
import type { SubsidyResult } from '@/lib/intelligence/subsidy-engine'
import type { StrategyResult } from '@/lib/intelligence/acquisition-strategy'

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3 | 4
type Profession = 'civilian' | 'police' | 'firefighter' | 'guard' | 'military'
type MaritalStatus = 'single' | 'married' | 'couple_unmarried' | 'divorced' | 'widowed'
type Scenario = 'single_buyer' | 'couple_unmarried' | 'married' | 'mixed_income'

interface FormState {
  income: number
  profession: Profession
  marital_status: MaritalStatus
  has_property: boolean
  fgts_balance: number
  location: string
  property_value: number
  service_time_years: number
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PROFESSIONS: { value: Profession; label: string }[] = [
  { value: 'civilian', label: 'Trabalhador CLT / Autônomo' },
  { value: 'police', label: 'Policial Civil ou Militar' },
  { value: 'firefighter', label: 'Bombeiro' },
  { value: 'guard', label: 'Agente de Segurança Pública' },
  { value: 'military', label: 'Militar das Forças Armadas' },
]

const MARITAL: { value: MaritalStatus; label: string }[] = [
  { value: 'single', label: 'Solteiro(a)' },
  { value: 'married', label: 'Casado(a)' },
  { value: 'couple_unmarried', label: 'União Estável' },
  { value: 'divorced', label: 'Divorciado(a)' },
  { value: 'widowed', label: 'Viúvo(a)' },
]

const LOCATIONS = ['Recife', 'João Pessoa', 'Natal', 'Fortaleza', 'Salvador', 'São Paulo']

const DEFAULT_FORM: FormState = {
  income: 4000,
  profession: 'civilian',
  marital_status: 'single',
  has_property: false,
  fgts_balance: 10000,
  location: 'Recife',
  property_value: 250000,
  service_time_years: 0,
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const R$ = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)

// Compact: R$ 250k / R$ 1,2M — avoids overflow in tight grids
const Rk = (v: number): string => {
  if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1).replace('.', ',')}M`
  if (v >= 1_000) return `R$ ${Math.round(v / 1_000)}k`
  return R$(v)
}

const pct = (v: number) => `${v.toFixed(0)}%`

function SliderField({
  label, value, min, max, step, format, onChange,
}: { label: string; value: number; min: number; max: number; step: number; format: (v: number) => string; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="flex justify-between items-baseline mb-2">
        <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#94A0B2]">{label}</span>
        <span className="text-base font-bold text-white font-mono">{format(value)}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-[3px] rounded-full appearance-none cursor-pointer"
        style={{ accentColor: '#C8A44A', background: `linear-gradient(to right, #C8A44A ${((value - min) / (max - min)) * 100}%, #142840 0%)` }}
      />
      <div className="flex justify-between mt-1">
        <span className="text-[9px] text-[#8496AC]">{format(min)}</span>
        <span className="text-[9px] text-[#8496AC]">{format(max)}</span>
      </div>
    </div>
  )
}

function SelectField({ label, value, options, onChange }: {
  label: string; value: string
  options: { value: string; label: string }[]
  onChange: (v: string) => void
}) {
  return (
    <div>
      <label className="block text-[11px] font-bold uppercase tracking-[0.14em] text-[#94A0B2] mb-2">{label}</label>
      <select
        value={value} onChange={e => onChange(e.target.value)}
        className="w-full bg-[#0F2035] border border-[rgba(200,164,74,0.4)] text-white text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-[rgba(255,255,255,0.06)] transition-colors cursor-pointer"
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

function ToggleField({ label, sublabel, value, onChange }: {
  label: string; sublabel: string; value: boolean; onChange: (v: boolean) => void
}) {
  return (
    <button
      type="button" onClick={() => onChange(!value)}
      className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all duration-200 text-left ${value ? 'bg-[rgba(200,164,74,0.08)] border-[rgba(200,164,74,0.25)]' : 'bg-[#0F2035] border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.12)]'}`}
    >
      <div>
        <div className="text-sm font-semibold text-white">{label}</div>
        <div className="text-[11px] text-[#8496AC] mt-0.5">{sublabel}</div>
      </div>
      <div className={`w-10 h-5 rounded-full transition-colors flex items-center px-0.5 shrink-0 ml-4 ${value ? 'bg-[#C8A44A]' : 'bg-[#1A3250]'}`}>
        <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${value ? 'translate-x-5' : 'translate-x-0'}`} />
      </div>
    </button>
  )
}

function StepDot({ n, current }: { n: Step; current: Step }) {
  const done = current > n
  const active = current === n
  return (
    <div className="flex items-center gap-2">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-300 ${done ? 'bg-[#C8A44A] text-[#060D16]' : active ? 'bg-[#C8A44A] text-[#060D16]' : 'bg-[#0F2035] text-[#8496AC] border border-[rgba(255,255,255,0.06)]'}`}>
        {done ? '✓' : n}
      </div>
    </div>
  )
}

function FeasibilityBadge({ f }: { f: 'viable' | 'marginal' | 'inviable' }) {
  const map = { viable: ['Viável', '#4ADE80', 'rgba(74,222,128,0.1)'], marginal: ['Atenção', '#FBBF24', 'rgba(251,191,36,0.1)'], inviable: ['Inviável', '#F87171', 'rgba(248,113,113,0.1)'] }
  const [label, color, bg] = map[f]
  return <span className="text-[11px] font-bold uppercase tracking-[0.14em] px-2.5 py-1 rounded-full" style={{ color, background: bg }}>{label}</span>
}

function EligibilityRow({ flag, eligible, reason }: { flag: string; eligible: boolean; reason?: string }) {
  return (
    <div className={`flex items-start gap-3 p-3.5 rounded-xl border transition-colors ${eligible ? 'bg-[rgba(74,222,128,0.04)] border-[rgba(74,222,128,0.15)]' : 'bg-[#060D16] border-[rgba(255,255,255,0.04)]'}`}>
      <div className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[9px] font-bold ${eligible ? 'bg-[rgba(74,222,128,0.2)] text-[#4ADE80]' : 'bg-[#0F2035] text-[#8496AC]'}`}>
        {eligible ? '✓' : '×'}
      </div>
      <div className="min-w-0">
        <div className={`text-xs font-semibold leading-tight ${eligible ? 'text-white' : 'text-[#8496AC]'}`}>{flag}</div>
        {reason && <div className="text-[10px] text-[#8496AC] mt-0.5 leading-snug">{reason}</div>}
      </div>
    </div>
  )
}

// ─── Step panels ──────────────────────────────────────────────────────────────

function Step1({ form, set }: { form: FormState; set: (p: Partial<FormState>) => void }) {
  const isSecurityProfession = ['police', 'firefighter', 'guard', 'military'].includes(form.profession)
  return (
    <div className="space-y-6">
      <SliderField label="Renda Bruta Mensal" value={form.income} min={1000} max={20000} step={200}
        format={R$} onChange={v => set({ income: v })} />
      <SelectField label="Profissão" value={form.profession}
        options={PROFESSIONS} onChange={v => set({ profession: v as Profession })} />
      <SelectField label="Estado Civil" value={form.marital_status}
        options={MARITAL} onChange={v => set({ marital_status: v as MaritalStatus })} />
      <ToggleField label="Já possuo imóvel registrado no CPF" sublabel="Afeta elegibilidade ao subsídio MCMV"
        value={form.has_property} onChange={v => set({ has_property: v })} />
      {isSecurityProfession && (
        <SliderField label="Tempo de Serviço (anos)" value={form.service_time_years} min={0} max={30} step={1}
          format={v => `${v} ano${v !== 1 ? 's' : ''}`} onChange={v => set({ service_time_years: v })} />
      )}
    </div>
  )
}

function Step2({ form, set }: { form: FormState; set: (p: Partial<FormState>) => void }) {
  return (
    <div className="space-y-6">
      <SelectField label="Cidade" value={form.location}
        options={LOCATIONS.map(l => ({ value: l, label: l }))} onChange={v => set({ location: v })} />
      <SliderField label="Valor do Imóvel" value={form.property_value} min={80000} max={1500000} step={10000}
        format={R$} onChange={v => set({ property_value: v })} />
      <SliderField label="Saldo FGTS" value={form.fgts_balance} min={0} max={200000} step={1000}
        format={R$} onChange={v => set({ fgts_balance: v })} />
      <div className="p-4 rounded-xl bg-[rgba(200,164,74,0.06)] border border-[rgba(200,164,74,0.15)]">
        <p className="text-[11px] text-[#94A0B2] leading-relaxed">
          O FGTS pode ser utilizado como entrada em financiamentos habitacionais, reduzindo o valor financiado e as parcelas mensais.
        </p>
      </div>
    </div>
  )
}

function Step3({ result, form, onStrategy }: { result: SubsidyResult; form: FormState; onStrategy: () => void }) {
  const commitmentPct = Math.min(100, (result.monthly_payment / form.income) * 100)
  const eligiblePrograms = result.programs.filter(p => p.eligible)
  const ineligiblePrograms = result.programs.filter(p => !p.eligible)

  return (
    <div className="space-y-6">
      {/* Hero subsidy number */}
      <div className="rounded-2xl bg-[#0B1928] border border-[rgba(200,164,74,0.18)] p-6">
        <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#94A0B2] mb-1">Subsídio Estimado</div>
        <div className="text-4xl font-bold text-[#C8A44A] font-mono tracking-tight">
          {result.estimated_subsidy > 0 ? R$(result.estimated_subsidy) : 'Sem subsídio'}
        </div>
        {result.estimated_subsidy > 0 && (
          <div className="text-[11px] text-[#8496AC] mt-1">desconto direto no valor do imóvel</div>
        )}
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Valor Financiado', value: R$(result.financing_amount) },
          { label: 'Parcela Estimada', value: R$(result.monthly_payment) },
          { label: 'Entrada Necessária', value: R$(result.down_payment_required) },
          { label: 'Comprometimento', value: pct(commitmentPct) },
        ].map(({ label, value }) => (
          <div key={label} className="bg-[#060D16] rounded-xl p-4 border border-[rgba(255,255,255,0.04)]">
            <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8496AC] mb-1">{label}</div>
            <div className="text-base font-bold text-white font-mono">{value}</div>
          </div>
        ))}
      </div>

      {/* Commitment bar */}
      <div>
        <div className="flex justify-between text-[10px] text-[#8496AC] mb-1.5">
          <span>Comprometimento de renda</span>
          <div className="flex items-center gap-2">
            <FeasibilityBadge f={result.feasibility} />
          </div>
        </div>
        <div className="h-1.5 rounded-full bg-[#0F2035] overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, commitmentPct)}%`, background: commitmentPct <= 30 ? '#4ADE80' : commitmentPct <= 40 ? '#FBBF24' : '#F87171' }} />
        </div>
        <div className="text-[9px] text-[#8496AC] mt-1">Limite recomendado: 30% da renda</div>
      </div>

      {/* Programs */}
      {eligiblePrograms.length > 0 && (
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#94A0B2] mb-2">Programas Elegíveis</div>
          <div className="space-y-2">
            {eligiblePrograms.map(p => (
              <EligibilityRow key={p.name} flag={p.name} eligible={true} />
            ))}
          </div>
        </div>
      )}
      {ineligiblePrograms.length > 0 && (
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#94A0B2] mb-2">Outros Programas</div>
          <div className="space-y-2">
            {ineligiblePrograms.map(p => (
              <EligibilityRow key={p.name} flag={p.name} eligible={false} reason={p.reason} />
            ))}
          </div>
        </div>
      )}

      <button onClick={onStrategy}
        className="w-full h-12 rounded-xl bg-[#0F2035] border border-[rgba(200,164,74,0.18)] text-[#C8A44A] text-sm font-bold uppercase tracking-[0.14em] hover:bg-[rgba(200,164,74,0.08)] transition-colors">
        Ver Estratégia de Aquisição
      </button>
    </div>
  )
}

function Step4({ strategy, form, lang }: { strategy: StrategyResult; form: FormState; lang: string }) {
  const maxPrice = Math.round(form.property_value * 1.05)
  const imovelUrl = `/${lang}/imoveis?max_price=${maxPrice}&location=${encodeURIComponent(form.location)}`

  return (
    <div className="space-y-6">
      {/* Total subsidy hero */}
      <div className="rounded-2xl bg-[#0B1928] border border-[rgba(200,164,74,0.18)] p-6">
        <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#94A0B2] mb-1">Subsídio Total Otimizado</div>
        <div className="text-4xl font-bold text-[#C8A44A] font-mono">{R$(strategy.total_subsidy)}</div>
        <div className="text-[11px] text-[#8496AC] mt-1">patrimônio projetado em 12 meses: {R$(strategy.total_equity_12m)}</div>
      </div>

      {/* Sequence */}
      <div className="bg-[#060D16] rounded-xl border border-[rgba(255,255,255,0.04)] p-4">
        <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#94A0B2] mb-2">Sequência Recomendada</div>
        <p className="text-xs text-[#94A0B2] leading-relaxed">{strategy.recommended_sequence}</p>
      </div>

      {/* Acquisition steps */}
      <div className="space-y-3">
        {strategy.steps.map((step) => (
          <div key={step.step} className="relative pl-8">
            <div className="absolute left-0 top-4 flex flex-col items-center">
              <div className="w-5 h-5 rounded-full bg-[#C8A44A] text-[#060D16] flex items-center justify-center text-[9px] font-bold shrink-0">{step.step}</div>
              {step.step < strategy.steps.length && <div className="w-px flex-1 bg-[rgba(200,164,74,0.2)] mt-1 h-full min-h-[24px]" />}
            </div>
            <div className="bg-[#0B1928] rounded-xl border border-[rgba(255,255,255,0.05)] p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="text-sm font-bold text-white leading-tight">{step.buyer_label}</div>
                {step.month_offset > 0 && (
                  <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#C8A44A] bg-[rgba(200,164,74,0.1)] px-2 py-0.5 rounded-full shrink-0">
                    +{step.month_offset}m
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-2 mb-3">
                {[
                  { l: 'Imóvel', v: Rk(step.property_value) },
                  { l: 'Subsídio', v: Rk(step.subsidy) },
                  { l: 'Parcela/mês', v: Rk(step.monthly_payment) },
                ].map(({ l, v }) => (
                  <div key={l} className="min-w-0">
                    <div className="text-[9px] text-[#8496AC] uppercase tracking-wider">{l}</div>
                    <div className="text-xs font-bold text-white font-mono whitespace-nowrap">{v}</div>
                  </div>
                ))}
              </div>
              {step.notes.length > 0 && (
                <ul className="space-y-0.5">
                  {step.notes.map((note, i) => (
                    <li key={i} className="text-[10px] text-[#8496AC] flex gap-1.5 leading-snug">
                      <span className="text-[#C8A44A] shrink-0 mt-px">—</span>
                      {note}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Tips */}
      {strategy.subsidy_maximization_tips.length > 0 && (
        <div className="rounded-xl bg-[rgba(200,164,74,0.06)] border border-[rgba(200,164,74,0.15)] p-4 space-y-2">
          <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#C8A44A] mb-1">Maximização de Subsídio</div>
          {strategy.subsidy_maximization_tips.slice(0, 4).map((tip, i) => (
            <div key={i} className="flex gap-2 text-[11px] text-[#94A0B2] leading-snug">
              <span className="text-[#C8A44A] shrink-0">—</span>
              {tip}
            </div>
          ))}
        </div>
      )}

      {/* CTA */}
      <a href={imovelUrl}
        className="flex items-center justify-between w-full h-14 px-6 rounded-xl bg-[#C8A44A] text-[#060D16] font-bold text-sm uppercase tracking-[0.14em] hover:bg-[#D4B86A] transition-colors">
        <span>Ver Imóveis Compatíveis</span>
        <span className="text-lg">→</span>
      </a>

      <a href={`https://wa.me/5581986141487?text=${encodeURIComponent(`Olá! Fiz a simulação no site e quero entender melhor meu cenário. Renda: ${R$(form.income)}, Imóvel: ${R$(form.property_value)}, Subsídio estimado: ${R$(strategy.total_subsidy)}`)}`}
        target="_blank" rel="noopener noreferrer"
        className="flex items-center justify-center w-full h-12 rounded-xl bg-[#0F2035] border border-[rgba(200,164,74,0.25)] text-white text-sm font-semibold hover:border-[rgba(255,255,255,0.06)] transition-colors">
        Falar com Especialista
      </a>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SubsidySimulator({ lang }: { lang: string }) {
  const [step, setStep] = useState<Step>(1)
  const [form, setFormRaw] = useState<FormState>(DEFAULT_FORM)
  const [simResult, setSimResult] = useState<SubsidyResult | null>(null)
  const [stratResult, setStratResult] = useState<StrategyResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = useCallback((patch: Partial<FormState>) => setFormRaw(f => ({ ...f, ...patch })), [])

  const runSimulation = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/intelligence/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'single',
          buyer_a: { ...form, service_time_years: form.service_time_years || undefined },
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erro na simulação')
      setSimResult(json.result as SubsidyResult)
      setStep(3)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro inesperado')
    } finally {
      setLoading(false)
    }
  }, [form])

  const runStrategy = useCallback(async () => {
    setLoading(true)
    setError(null)
    const scenario: Scenario =
      form.marital_status === 'married' ? 'married'
        : form.marital_status === 'couple_unmarried' ? 'couple_unmarried'
          : 'single_buyer'
    try {
      const res = await fetch('/api/intelligence/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'strategy',
          scenario,
          buyer_a: { ...form, service_time_years: form.service_time_years || undefined },
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erro na estratégia')
      setStratResult(json.result as StrategyResult)
      setStep(4)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro inesperado')
    } finally {
      setLoading(false)
    }
  }, [form])

  const STEP_LABELS = ['Perfil', 'Imóvel', 'Resultado', 'Estratégia']

  return (
    <div className="bg-[#060D16] rounded-2xl border border-[rgba(255,255,255,0.06)] overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-6 pb-5 border-b border-[rgba(255,255,255,0.05)]">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-px bg-[#334E68]" />
          <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#C8A44A]">Simulador</span>
        </div>
        <h2 className="font-display text-xl font-bold text-white">Motor de Aquisição</h2>
        <p className="text-[12px] text-[#8496AC] mt-1">Descubra seu subsídio e estruture sua compra em minutos</p>

        {/* Step indicators */}
        <div className="flex items-center mt-4 gap-0">
          {([1, 2, 3, 4] as Step[]).map((n, i) => (
            <div key={n} className="flex items-center">
              <div className="flex items-center gap-1">
                <StepDot n={n} current={step} />
                <span className={`hidden sm:block text-[10px] font-semibold transition-colors ${step === n ? 'text-[#C8A44A]' : step > n ? 'text-[#4ADE80]' : 'text-[#8496AC]'}`}>
                  {STEP_LABELS[i]}
                </span>
              </div>
              {i < 3 && <div className="w-3 sm:w-5 h-px bg-[rgba(255,255,255,0.06)] mx-1" />}
            </div>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="p-6">
        {step === 1 && <Step1 form={form} set={set} />}
        {step === 2 && <Step2 form={form} set={set} />}
        {step === 3 && simResult && <Step3 result={simResult} form={form} onStrategy={runStrategy} />}
        {step === 4 && stratResult && <Step4 strategy={stratResult} form={form} lang={lang} />}

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-[rgba(248,113,113,0.08)] border border-[rgba(248,113,113,0.2)] text-[#F87171] text-xs">
            {error}
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 mt-6">
          {step > 1 && step < 3 && (
            <button onClick={() => setStep((step - 1) as Step)}
              className="flex-1 h-11 rounded-xl bg-[#0F2035] border border-[rgba(255,255,255,0.06)] text-[#94A0B2] text-sm font-semibold hover:text-white transition-colors">
              Voltar
            </button>
          )}
          {step === 1 && (
            <button onClick={() => setStep(2)}
              className="flex-1 h-11 rounded-xl bg-[#C8A44A] text-[#060D16] text-sm font-bold uppercase tracking-[0.1em] hover:bg-[#D4B86A] transition-colors">
              Continuar
            </button>
          )}
          {step === 2 && (
            <button onClick={runSimulation} disabled={loading}
              className="flex-1 h-11 rounded-xl bg-[#C8A44A] text-[#060D16] text-sm font-bold uppercase tracking-[0.1em] hover:bg-[#D4B86A] transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
              {loading ? 'Calculando...' : 'Simular'}
            </button>
          )}
          {step === 3 && loading && (
            <div className="flex-1 h-11 rounded-xl bg-[#0F2035] flex items-center justify-center text-sm text-[#94A0B2]">
              Montando estratégia...
            </div>
          )}
          {step === 4 && (
            <button onClick={() => { setStep(1); setSimResult(null); setStratResult(null) }}
              className="flex-1 h-11 rounded-xl bg-[#0F2035] border border-[rgba(255,255,255,0.06)] text-[#94A0B2] text-sm font-semibold hover:text-white transition-colors">
              Nova Simulação
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
