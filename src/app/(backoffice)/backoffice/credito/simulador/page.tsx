'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
    ArrowLeft, Calculator, DollarSign, TrendingUp,
    Home, Percent, Save, Building2,
} from 'lucide-react'
import { toast } from 'sonner'
import { T } from '@/app/(backoffice)/lib/theme'
import { PageIntelHeader } from '@/app/(backoffice)/components/ui/PageIntelHeader'

const bancos = [
    { id: 1, name: 'Caixa Econômica Federal', rate: 9.5 },
    { id: 2, name: 'Banco do Brasil',          rate: 8.9 },
    { id: 3, name: 'Itaú',                     rate: 9.8 },
    { id: 4, name: 'Santander',                rate: 8.7 },
    { id: 5, name: 'Bradesco',                 rate: 9.6 },
]

interface AmortizationRow {
    month: number
    payment: number
    principal: number
    interest: number
    balance: number
}

export default function SimuladorCreditoPage() {
    const router = useRouter()

    const [propertyValue, setPropertyValue] = useState(580000)
    const [downPayment, setDownPayment] = useState(116000)
    const [term, setTerm] = useState(360)
    const [interestRate, setInterestRate] = useState(9.5)
    const [system, setSystem] = useState<'sac' | 'price'>('price')
    const [selectedBank, setSelectedBank] = useState(bancos[0])

    const [financedAmount, setFinancedAmount] = useState(0)
    const [monthlyPayment, setMonthlyPayment] = useState(0)
    const [totalPayment, setTotalPayment] = useState(0)
    const [totalInterest, setTotalInterest] = useState(0)
    const [ltv, setLtv] = useState(0)
    const [amortization, setAmortization] = useState<AmortizationRow[]>([])

    useEffect(() => { calculate() }, [propertyValue, downPayment, term, interestRate, system])

    const calculate = () => {
        const financed = propertyValue - downPayment
        setFinancedAmount(financed)
        setLtv((financed / propertyValue) * 100)
        const monthlyRate = interestRate / 100 / 12
        let payment = 0, total = 0
        const schedule: AmortizationRow[] = []
        if (system === 'price') {
            payment = financed * (monthlyRate * Math.pow(1 + monthlyRate, term)) / (Math.pow(1 + monthlyRate, term) - 1)
            let balance = financed
            for (let i = 1; i <= term; i++) {
                const interestPayment = balance * monthlyRate
                const principalPayment = payment - interestPayment
                balance -= principalPayment
                schedule.push({ month: i, payment, principal: principalPayment, interest: interestPayment, balance: Math.max(0, balance) })
            }
            total = payment * term
        } else {
            const principalPayment = financed / term
            let balance = financed
            for (let i = 1; i <= term; i++) {
                const interestPayment = balance * monthlyRate
                payment = principalPayment + interestPayment
                balance -= principalPayment
                schedule.push({ month: i, payment, principal: principalPayment, interest: interestPayment, balance: Math.max(0, balance) })
                total += payment
            }
            payment = schedule[0].payment
        }
        setMonthlyPayment(payment)
        setTotalPayment(total)
        setTotalInterest(total - financed)
        setAmortization(schedule)
    }

    const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(v)
    const fmtPct = (v: number) => `${v.toFixed(2)}%`
    const downPaymentPercent = (downPayment / propertyValue) * 100

    const inputStyle: React.CSSProperties = {
        background: T.elevated,
        border: `1px solid ${T.border}`,
        color: T.text,
        width: '100%',
        height: '44px',
        borderRadius: '12px',
        padding: '0 14px 0 36px',
        fontSize: '14px',
        outline: 'none',
    }
    const inputStyleNoIcon: React.CSSProperties = { ...inputStyle, padding: '0 14px' }

    return (
        <div className="space-y-6">
            {/* Header */}
            <PageIntelHeader
                moduleLabel="CRÉDITO · SIMULADOR"
                title="Simulador de Crédito"
                subtitle="Calcule financiamento imobiliário com amortização PRICE ou SAC em tempo real"
                actions={
                    <button
                        onClick={() => { toast.success('Simulação salva com sucesso!'); router.push('/backoffice/credito') }}
                        className="flex items-center gap-2 px-5 rounded-2xl text-sm font-bold text-white transition-all hover:opacity-90"
                        style={{ height: '44px', background: T.accent, boxShadow: '0 4px 14px rgba(37,99,235,0.22)', border: 'none' }}
                    >
                        <Save size={16} /> Salvar Simulação
                    </button>
                }
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* LEFT: Form */}
                <div className="lg:col-span-1">
                    <div className="sticky top-6 space-y-5 rounded-2xl p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                        <h2 className="text-base font-bold" style={{ color: T.text }}>Dados da Simulação</h2>

                        {/* Valor do Imóvel */}
                        <div>
                            <label className="block text-xs font-semibold mb-1.5" style={{ color: T.textMuted }}>Valor do Imóvel</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium" style={{ color: T.textMuted }}>R$</span>
                                <input type="number" value={propertyValue} onChange={e => setPropertyValue(Number(e.target.value))} style={inputStyle} />
                            </div>
                        </div>

                        {/* Entrada */}
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="text-xs font-semibold" style={{ color: T.textMuted }}>Entrada</label>
                                <span className="text-xs font-bold" style={{ color: T.accent }}>{downPaymentPercent.toFixed(1)}%</span>
                            </div>
                            <div className="relative mb-3">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium" style={{ color: T.textMuted }}>R$</span>
                                <input type="number" value={downPayment} onChange={e => setDownPayment(Number(e.target.value))} style={inputStyle} />
                            </div>
                            <input type="range" min="0" max={propertyValue} step="1000" value={downPayment}
                                onChange={e => setDownPayment(Number(e.target.value))}
                                className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                                style={{ accentColor: T.accent }} />
                        </div>

                        {/* Prazo */}
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="text-xs font-semibold" style={{ color: T.textMuted }}>Prazo</label>
                                <span className="text-xs font-bold" style={{ color: T.text }}>{term} meses ({(term / 12).toFixed(0)} anos)</span>
                            </div>
                            <input type="range" min="12" max="420" step="12" value={term}
                                onChange={e => setTerm(Number(e.target.value))}
                                className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                                style={{ accentColor: T.accent }} />
                            <div className="flex justify-between mt-1" style={{ color: T.textMuted }}>
                                {['1a', '10', '20', '30', '35a'].map(l => <span key={l} className="text-[10px]">{l}</span>)}
                            </div>
                        </div>

                        {/* Taxa */}
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="text-xs font-semibold" style={{ color: T.textMuted }}>Taxa de Juros (a.a.)</label>
                                <span className="text-xs font-bold" style={{ color: '#A78BFA' }}>{fmtPct(interestRate)}</span>
                            </div>
                            <input type="range" min="7" max="12" step="0.1" value={interestRate}
                                onChange={e => setInterestRate(Number(e.target.value))}
                                className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                                style={{ accentColor: '#A78BFA' }} />
                            <div className="flex justify-between mt-1" style={{ color: T.textMuted }}>
                                {['7%', '9.5%', '12%'].map(l => <span key={l} className="text-[10px]">{l}</span>)}
                            </div>
                        </div>

                        {/* Sistema */}
                        <div>
                            <label className="block text-xs font-semibold mb-2" style={{ color: T.textMuted }}>Sistema de Amortização</label>
                            <div className="grid grid-cols-2 gap-2">
                                {(['price', 'sac'] as const).map(s => (
                                    <button key={s} onClick={() => setSystem(s)}
                                        className="h-11 rounded-xl font-semibold text-sm transition-all uppercase"
                                        style={{
                                            background: system === s ? T.accent : T.elevated,
                                            border: `1px solid ${system === s ? T.accent : T.border}`,
                                            color: system === s ? '#fff' : T.textMuted,
                                        }}>
                                        {s}
                                    </button>
                                ))}
                            </div>
                            <p className="text-xs mt-2" style={{ color: T.textMuted }}>
                                {system === 'price' ? 'Parcelas fixas durante todo o período' : 'Parcelas decrescentes, amortização constante'}
                            </p>
                        </div>

                        {/* Banco */}
                        <div>
                            <label className="block text-xs font-semibold mb-2" style={{ color: T.textMuted }}>Banco</label>
                            <select value={selectedBank.id}
                                onChange={e => {
                                    const bank = bancos.find(b => b.id === Number(e.target.value))
                                    if (bank) { setSelectedBank(bank); setInterestRate(bank.rate) }
                                }}
                                style={inputStyleNoIcon}>
                                {bancos.map(b => <option key={b.id} value={b.id}>{b.name} — {b.rate}% a.a.</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {/* RIGHT: Results */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Resumo */}
                    <div className="rounded-2xl p-8 text-white" style={{ background: 'linear-gradient(135deg, #1E3A5F, #0B1929)', border: '1px solid rgba(59,130,246,0.2)' }}>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {[
                                { l: 'Parcela Mensal', v: fmt(monthlyPayment), large: true },
                                { l: 'Valor Financiado', v: fmt(financedAmount) },
                                { l: 'Total a Pagar', v: fmt(totalPayment) },
                                { l: 'Total Juros', v: fmt(totalInterest) },
                            ].map(item => (
                                <div key={item.l}>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1">{item.l}</p>
                                    <p className={`font-black ${item.large ? 'text-4xl' : 'text-2xl'}`} style={{ fontVariantNumeric: 'tabular-nums' }}>{item.v}</p>
                                    {item.large && system === 'sac' && <p className="text-xs text-white/40 mt-1">Primeira parcela</p>}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Indicadores */}
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            {
                                label: 'LTV (Loan-to-Value)', value: `${ltv.toFixed(1)}%`,
                                icon: Percent,
                                color: ltv <= 70 ? '#4ADE80' : ltv <= 80 ? '#FCD34D' : '#F87171',
                                bg: ltv <= 70 ? 'rgba(74,222,128,0.1)' : ltv <= 80 ? 'rgba(252,211,77,0.1)' : 'rgba(248,113,113,0.1)',
                                note: ltv <= 70 ? '✓ Excelente — Aprovação facilitada' : ltv <= 80 ? '⚠ Bom — Dentro do limite' : '✗ Alto — Pode exigir garantias',
                            },
                            {
                                label: 'Entrada', value: `${downPaymentPercent.toFixed(1)}%`,
                                icon: TrendingUp,
                                color: '#60A5FA', bg: 'rgba(96,165,250,0.1)',
                                note: `${fmt(downPayment)} de entrada`,
                            },
                        ].map(item => {
                            const Icon = item.icon
                            return (
                                <div key={item.label} className="rounded-xl p-5" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: item.bg }}>
                                            <Icon size={18} style={{ color: item.color }} />
                                        </div>
                                        <div>
                                            <p className="text-xs" style={{ color: T.textMuted }}>{item.label}</p>
                                            <p className="text-xl font-bold" style={{ color: item.color }}>{item.value}</p>
                                        </div>
                                    </div>
                                    <p className="text-xs" style={{ color: T.textMuted }}>{item.note}</p>
                                </div>
                            )
                        })}
                    </div>

                    {/* Tabela de Amortização */}
                    <div className="rounded-2xl overflow-hidden" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                        <div className="p-5 border-b" style={{ borderColor: T.border }}>
                            <h3 className="text-base font-bold" style={{ color: T.text }}>Tabela de Amortização</h3>
                            <p className="text-xs mt-0.5" style={{ color: T.textMuted }}>Primeiras 12 e últimas 12 parcelas</p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead style={{ background: T.elevated }}>
                                    <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                                        {['Mês', 'Parcela', 'Amortização', 'Juros', 'Saldo'].map(h => (
                                            <th key={h} className={`px-5 py-3 text-[10px] font-bold uppercase tracking-wider ${h !== 'Mês' ? 'text-right' : 'text-left'}`}
                                                style={{ color: T.textMuted }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {[...amortization.slice(0, 12), ...(amortization.length > 24 ? [null] : []), ...amortization.slice(-12)].map((row, i) => {
                                        if (row === null) return (
                                            <tr key="sep" style={{ background: T.elevated }}>
                                                <td colSpan={5} className="px-5 py-2 text-center text-xs" style={{ color: T.textMuted }}>
                                                    ... {amortization.length - 24} parcelas intermediárias ...
                                                </td>
                                            </tr>
                                        )
                                        return (
                                            <tr key={row.month} style={{ borderTop: `1px solid ${T.border}` }} className="transition-colors hover:opacity-80">
                                                <td className="px-5 py-3 text-sm font-medium" style={{ color: T.text, fontVariantNumeric: 'tabular-nums' }}>{row.month}</td>
                                                <td className="px-5 py-3 text-sm text-right font-semibold" style={{ color: T.text, fontVariantNumeric: 'tabular-nums' }}>{fmt(row.payment)}</td>
                                                <td className="px-5 py-3 text-sm text-right" style={{ color: '#4ADE80', fontVariantNumeric: 'tabular-nums' }}>{fmt(row.principal)}</td>
                                                <td className="px-5 py-3 text-sm text-right" style={{ color: '#F87171', fontVariantNumeric: 'tabular-nums' }}>{fmt(row.interest)}</td>
                                                <td className="px-5 py-3 text-sm text-right" style={{ color: T.textMuted, fontVariantNumeric: 'tabular-nums' }}>{fmt(row.balance)}</td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Comparativo Bancos */}
                    <div className="rounded-2xl p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                        <h3 className="text-base font-bold mb-4" style={{ color: T.text }}>Comparativo de Bancos</h3>
                        <div className="space-y-3">
                            {bancos.map(bank => {
                                const mr = bank.rate / 100 / 12
                                const pmt = financedAmount * (mr * Math.pow(1 + mr, term)) / (Math.pow(1 + mr, term) - 1)
                                const total = pmt * term
                                const selected = selectedBank.id === bank.id
                                return (
                                    <div key={bank.id}
                                        className="p-4 rounded-xl border-2 transition-all cursor-pointer"
                                        style={{
                                            border: selected ? `2px solid ${T.accent}` : `1px solid ${T.border}`,
                                            background: selected ? 'rgba(72,101,129,0.1)' : T.elevated,
                                        }}
                                        onClick={() => { setSelectedBank(bank); setInterestRate(bank.rate) }}>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-semibold text-sm" style={{ color: T.text }}>{bank.name}</p>
                                                <p className="text-xs mt-0.5" style={{ color: T.textMuted }}>Taxa: {bank.rate}% a.a.</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-base font-bold" style={{ color: T.text }}>{fmt(pmt)}</p>
                                                <p className="text-xs" style={{ color: T.textMuted }}>Total: {fmt(total)}</p>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
