'use client'

import { DollarSign } from 'lucide-react'
import { T } from '@/app/(backoffice)/lib/theme'

interface PriceRow {
    planta_tipo: string
    preco_tabela?: number
    entrada?: number
    parcelas_mensais?: number
    valor_mensal?: number
    balao?: number
    financiamento?: number
    observacoes?: string
}

interface PricingTableProps {
    tabela: PriceRow[]
}

function fmt(v: number | undefined) {
    if (!v) return '—'
    return `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`
}

export default function PricingTable({ tabela }: PricingTableProps) {
    if (!tabela || tabela.length === 0) {
        return (
            <div className="text-center py-12" style={{ color: T.textMuted }}>
                <DollarSign size={32} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">Nenhuma tabela de preços cadastrada</p>
                <p className="text-xs mt-1">Importe um PDF da construtora para extrair condições de pagamento</p>
            </div>
        )
    }

    return (
        <div className="overflow-x-auto rounded-2xl" style={{ border: `1px solid ${T.border}` }}>
            <table className="w-full text-left">
                <thead>
                    <tr style={{ background: T.elevated }}>
                        {['Planta', 'Preço Tabela', 'Entrada', 'Parcelas', 'Valor/Mês', 'Balão', 'Financiamento'].map(h => (
                            <th
                                key={h}
                                className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap"
                                style={{ color: T.textMuted, borderBottom: `1px solid ${T.border}` }}
                            >
                                {h}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {tabela.map((row, i) => (
                        <tr
                            key={i}
                            className="transition-colors hover:bg-white/[0.02]"
                            style={{ borderBottom: i < tabela.length - 1 ? `1px solid ${T.border}` : 'none' }}
                        >
                            <td className="px-4 py-3">
                                <span className="text-xs font-semibold" style={{ color: T.text }}>{row.planta_tipo}</span>
                            </td>
                            <td className="px-4 py-3">
                                <span className="text-xs font-bold" style={{ color: T.accent }}>{fmt(row.preco_tabela)}</span>
                            </td>
                            <td className="px-4 py-3 text-xs" style={{ color: T.textMuted }}>{fmt(row.entrada)}</td>
                            <td className="px-4 py-3 text-xs" style={{ color: T.textMuted }}>
                                {row.parcelas_mensais ? `${row.parcelas_mensais}x` : '—'}
                            </td>
                            <td className="px-4 py-3 text-xs" style={{ color: T.textMuted }}>{fmt(row.valor_mensal)}</td>
                            <td className="px-4 py-3 text-xs" style={{ color: T.textMuted }}>{fmt(row.balao)}</td>
                            <td className="px-4 py-3 text-xs" style={{ color: T.textMuted }}>{fmt(row.financiamento)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {/* Observations */}
            {tabela.some(r => r.observacoes) && (
                <div className="px-4 py-3" style={{ borderTop: `1px solid ${T.border}`, background: T.elevated }}>
                    <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: T.textMuted }}>Observações</p>
                    {tabela.filter(r => r.observacoes).map((r, i) => (
                        <p key={i} className="text-[11px] leading-relaxed" style={{ color: T.textDim }}>
                            <strong style={{ color: T.text }}>{r.planta_tipo}:</strong> {r.observacoes}
                        </p>
                    ))}
                </div>
            )}
        </div>
    )
}
