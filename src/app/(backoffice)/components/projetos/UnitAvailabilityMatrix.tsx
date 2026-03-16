'use client'

import { useState, useMemo } from 'react'
import { Layers } from 'lucide-react'
import { T } from '@/app/(backoffice)/lib/theme'

interface Unit {
    id: string
    torre: string | null
    andar: number | null
    numero: string
    planta_tipo: string | null
    area_privativa: number | null
    preco: number | null
    status: string
    reservado_por: string | null
}

interface UnitAvailabilityMatrixProps {
    unidades: Unit[]
    onUnitClick?: (unit: Unit) => void
}

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
    disponivel: { bg: 'rgba(74,222,128,0.2)', text: 'var(--bo-success)', label: 'Disponível' },
    reservado:  { bg: 'rgba(168,85,247,0.2)', text: '#a855f7', label: 'Reservado' },
    vendido:    { bg: 'rgba(234,179,8,0.2)', text: '#eab308', label: 'Vendido' },
    bloqueado:  { bg: 'rgba(156,163,175,0.2)', text: '#9ca3af', label: 'Bloqueado' },
}

export default function UnitAvailabilityMatrix({ unidades, onUnitClick }: UnitAvailabilityMatrixProps) {
    const [selectedTorre, setSelectedTorre] = useState<string | null>(null)

    const torres = useMemo(() => {
        const set = new Set(unidades.map(u => u.torre || 'Única'))
        return Array.from(set).sort()
    }, [unidades])

    const activeTorre = selectedTorre || torres[0] || 'Única'

    const { andares, unitsByAndarNumero } = useMemo(() => {
        const filtered = unidades.filter(u => (u.torre || 'Única') === activeTorre)
        const andarSet = new Set(filtered.map(u => u.andar ?? 0))
        const andaresSorted = Array.from(andarSet).sort((a, b) => b - a) // top floor first

        const map = new Map<string, Unit>()
        filtered.forEach(u => map.set(`${u.andar ?? 0}-${u.numero}`, u))

        return { andares: andaresSorted, unitsByAndarNumero: map }
    }, [unidades, activeTorre])

    // Determine columns (unique numeros per andar)
    const columns = useMemo(() => {
        const filtered = unidades.filter(u => (u.torre || 'Única') === activeTorre)
        const nums = new Set<string>()
        filtered.forEach(u => nums.add(u.numero))
        return Array.from(nums).sort((a, b) => {
            const na = parseInt(a), nb = parseInt(b)
            if (!isNaN(na) && !isNaN(nb)) return na - nb
            return a.localeCompare(b)
        })
    }, [unidades, activeTorre])

    // Summary counts
    const summary = useMemo(() => {
        const counts = { disponivel: 0, reservado: 0, vendido: 0, bloqueado: 0 }
        unidades.forEach(u => {
            const s = u.status as keyof typeof counts
            if (s in counts) counts[s]++
        })
        return counts
    }, [unidades])

    if (!unidades || unidades.length === 0) {
        return (
            <div className="text-center py-12" style={{ color: T.textMuted }}>
                <Layers size={32} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">Nenhuma unidade cadastrada</p>
                <p className="text-xs mt-1">Importe um PDF da construtora para gerar unidades automaticamente</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Summary bar */}
            <div className="flex items-center gap-4 flex-wrap">
                {Object.entries(STATUS_COLORS).map(([key, cfg]) => {
                    const count = summary[key as keyof typeof summary] || 0
                    if (count === 0) return null
                    return (
                        <div key={key} className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded" style={{ background: cfg.bg, border: `1px solid ${cfg.text}` }} />
                            <span className="text-xs" style={{ color: T.textMuted }}>
                                {cfg.label}: <strong style={{ color: T.text }}>{count}</strong>
                            </span>
                        </div>
                    )
                })}
            </div>

            {/* Torre selector */}
            {torres.length > 1 && (
                <div className="flex items-center gap-2">
                    {torres.map(t => (
                        <button
                            key={t}
                            onClick={() => setSelectedTorre(t)}
                            className="px-4 py-2 rounded-lg text-xs font-bold transition-all"
                            style={{
                                background: activeTorre === t ? T.accent : T.elevated,
                                color: activeTorre === t ? '#fff' : T.textMuted,
                                border: `1px solid ${activeTorre === t ? T.accent : T.border}`,
                            }}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            )}

            {/* Matrix grid */}
            <div className="overflow-x-auto rounded-2xl" style={{ border: `1px solid ${T.border}` }}>
                <table className="w-full">
                    <thead>
                        <tr style={{ background: T.elevated }}>
                            <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-left"
                                style={{ color: T.textMuted, borderBottom: `1px solid ${T.border}` }}>
                                Andar
                            </th>
                            {columns.map(col => (
                                <th key={col} className="px-2 py-2 text-[10px] font-bold uppercase tracking-wider text-center"
                                    style={{ color: T.textMuted, borderBottom: `1px solid ${T.border}` }}>
                                    {col}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {andares.map(andar => (
                            <tr key={andar}>
                                <td className="px-3 py-1.5 text-xs font-bold" style={{ color: T.text, borderRight: `1px solid ${T.border}` }}>
                                    {andar}º
                                </td>
                                {columns.map(col => {
                                    const unit = unitsByAndarNumero.get(`${andar}-${col}`)
                                    if (!unit) return <td key={col} className="px-2 py-1.5" />
                                    const cfg = STATUS_COLORS[unit.status] || STATUS_COLORS.disponivel
                                    return (
                                        <td key={col} className="px-1 py-1">
                                            <button
                                                onClick={() => onUnitClick?.(unit)}
                                                className="w-full rounded-lg px-2 py-1.5 text-center transition-all hover:brightness-110 cursor-pointer"
                                                style={{ background: cfg.bg }}
                                                title={`${unit.numero} — ${cfg.label}${unit.preco ? ` — R$ ${unit.preco.toLocaleString('pt-BR')}` : ''}`}
                                            >
                                                <span className="text-[10px] font-bold" style={{ color: cfg.text }}>
                                                    {unit.numero}
                                                </span>
                                            </button>
                                        </td>
                                    )
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
