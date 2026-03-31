'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
    Loader2, Download, ChevronDown, Sparkles, TrendingUp, TrendingDown,
    ArrowRight, MinusCircle, Building2,
} from 'lucide-react'
import { toast } from 'sonner'
import { PageIntelHeader } from '@/app/(backoffice)/components/ui/PageIntelHeader'
import { T } from '@/app/(backoffice)/lib/theme'

interface DREData {
    empresa_id?: string
    mes: number
    ano: number
    receita_bruta: number
    deducoes: number
    receita_liquida: number
    custos: number
    lucro_bruto: number
    despesas_operacionais: number
    lucro_operacional: number
    resultado_financeiro: number
    lucro_liquido: number
    narrativa_ia: string
}

const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

const MESES = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

const DRE_LINES: Array<{
    key: keyof DREData
    label: string
    indent: number
    bold?: boolean
    separator?: boolean
    type?: 'subtraction' | 'result'
}> = [
    { key: 'receita_bruta', label: 'Receita Bruta', indent: 0, bold: true },
    { key: 'deducoes', label: '(-) Deduções', indent: 1, type: 'subtraction' },
    { key: 'receita_liquida', label: '= Receita Líquida', indent: 0, bold: true, separator: true },
    { key: 'custos', label: '(-) Custos dos Serviços', indent: 1, type: 'subtraction' },
    { key: 'lucro_bruto', label: '= Lucro Bruto', indent: 0, bold: true, separator: true },
    { key: 'despesas_operacionais', label: '(-) Despesas Operacionais', indent: 1, type: 'subtraction' },
    { key: 'lucro_operacional', label: '= Lucro Operacional', indent: 0, bold: true, separator: true },
    { key: 'resultado_financeiro', label: '(+/-) Resultado Financeiro', indent: 1 },
    { key: 'lucro_liquido', label: '= Lucro Líquido', indent: 0, bold: true, separator: true, type: 'result' },
]

export default function BPODREPage() {
    const now = new Date()
    const [mes, setMes] = useState(now.getMonth() + 1)
    const [ano, setAno] = useState(now.getFullYear())
    const [dre, setDre] = useState<DREData | null>(null)
    const [loading, setLoading] = useState(false)
    const [empresaId, setEmpresaId] = useState<string | null>(null)
    const [empresas, setEmpresas] = useState<Array<{ id: string; nome: string }>>([])

    // Load empresas on mount
    useEffect(() => {
        fetch('/api/bpo/empresas')
            .then(r => r.ok ? r.json() : [])
            .then(d => {
                const list = Array.isArray(d) ? d : d?.data ?? []
                setEmpresas(list)
                if (list.length > 0 && !empresaId) setEmpresaId(list[0].id)
            })
            .catch(() => {})
    }, [])

    const fetchDRE = async () => {
        if (!empresaId) {
            // Demo mode: show empty DRE structure
            setDre({
                mes, ano,
                receita_bruta: 0, deducoes: 0, receita_liquida: 0,
                custos: 0, lucro_bruto: 0, despesas_operacionais: 0,
                lucro_operacional: 0, resultado_financeiro: 0, lucro_liquido: 0,
                narrativa_ia: 'Selecione uma empresa para gerar o DRE com análise IA.',
            })
            return
        }

        setLoading(true)
        try {
            const res = await fetch(`/api/bpo/dre?empresa_id=${empresaId}&mes=${mes}&ano=${ano}`)
            if (res.ok) {
                const json = await res.json()
                setDre(json.data)
            } else {
                toast.error('Erro ao gerar DRE')
            }
        } catch {
            toast.error('Erro de conexão')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchDRE() }, [mes, ano, empresaId])

    const getValueColor = (value: number, type?: string) => {
        if (type === 'subtraction') return T.error
        if (type === 'result') return value >= 0 ? T.success : T.error
        if (value > 0) return T.success
        if (value < 0) return T.error
        return T.textMuted
    }

    const getValueIcon = (value: number, type?: string) => {
        if (type === 'subtraction') return <MinusCircle size={12} />
        if (value > 0) return <TrendingUp size={12} />
        if (value < 0) return <TrendingDown size={12} />
        return null
    }

    return (
        <div style={{ padding: '24px', maxWidth: 1000, margin: '0 auto' }}>
            <PageIntelHeader
                moduleLabel="BPO . FINANCEIRO"
                title="DRE — Demonstração do Resultado"
                subtitle={`${MESES[mes - 1]} ${ano}`}
                breadcrumbs={[
                    { label: 'Backoffice', href: '/backoffice' },
                    { label: 'BPO Financeiro', href: '/backoffice/bpo' },
                    { label: 'DRE' },
                ]}
                actions={
                    <button
                        onClick={() => toast.info('Exportação PDF — em desenvolvimento')}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '8px 14px', borderRadius: 3,
                            background: T.surfaceAlt, border: `1px solid ${T.border}`,
                            color: T.text, fontSize: 13, fontWeight: 500, cursor: 'pointer',
                        }}
                    >
                        <Download size={14} />
                        Exportar PDF
                    </button>
                }
            />

            {/* Empresa + Month/Year Selector */}
            <div style={{
                display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center',
            }}>
                {/* Empresa selector */}
                <div style={{ position: 'relative' }}>
                    <Building2 size={14} style={{
                        position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                        color: T.gold, pointerEvents: 'none',
                    }} />
                    <select
                        value={empresaId || ''}
                        onChange={e => setEmpresaId(e.target.value || null)}
                        style={{
                            appearance: 'none', padding: '10px 36px 10px 34px',
                            borderRadius: 8, background: T.surface,
                            border: `1px solid ${empresaId ? T.gold : T.border}`, color: T.text,
                            fontSize: 14, fontFamily: 'var(--font-sans)',
                            cursor: 'pointer', minWidth: 200,
                        }}
                    >
                        <option value="">Selecionar empresa...</option>
                        {empresas.map(e => (
                            <option key={e.id} value={e.id}>{e.nome}</option>
                        ))}
                    </select>
                    <ChevronDown size={14} style={{
                        position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                        color: T.textMuted, pointerEvents: 'none',
                    }} />
                </div>

                <div style={{ width: 1, height: 28, background: T.border }} />

                <div style={{ position: 'relative' }}>
                    <select
                        value={mes}
                        onChange={e => setMes(Number(e.target.value))}
                        style={{
                            appearance: 'none', padding: '10px 36px 10px 14px',
                            borderRadius: 8, background: T.surface,
                            border: `1px solid ${T.border}`, color: T.text,
                            fontSize: 14, fontFamily: 'var(--font-sans)',
                            cursor: 'pointer', minWidth: 160,
                        }}
                    >
                        {MESES.map((m, i) => (
                            <option key={i} value={i + 1}>{m}</option>
                        ))}
                    </select>
                    <ChevronDown size={14} style={{
                        position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                        color: T.textMuted, pointerEvents: 'none',
                    }} />
                </div>

                <div style={{ position: 'relative' }}>
                    <select
                        value={ano}
                        onChange={e => setAno(Number(e.target.value))}
                        style={{
                            appearance: 'none', padding: '10px 36px 10px 14px',
                            borderRadius: 8, background: T.surface,
                            border: `1px solid ${T.border}`, color: T.text,
                            fontSize: 14, fontFamily: 'var(--font-sans)',
                            cursor: 'pointer', minWidth: 100,
                        }}
                    >
                        {[2024, 2025, 2026].map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                    <ChevronDown size={14} style={{
                        position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                        color: T.textMuted, pointerEvents: 'none',
                    }} />
                </div>
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
                    <Loader2 size={28} className="animate-spin" style={{ color: T.accent }} />
                </div>
            ) : dre ? (
                <>
                    {/* DRE Table */}
                    <div style={{
                        background: T.surface,
                        border: `1px solid ${T.border}`,
                        borderRadius: 10,
                        overflow: 'hidden',
                        marginBottom: 24,
                    }}>
                        <div style={{
                            padding: '16px 24px',
                            borderBottom: `1px solid ${T.borderLight}`,
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        }}>
                            <h3 style={{ fontSize: 15, fontWeight: 600, color: T.text }}>
                                Demonstração do Resultado do Exercício
                            </h3>
                            <span style={{
                                fontSize: 12, color: T.textMuted, fontFamily: 'var(--font-mono)',
                            }}>
                                {MESES[mes - 1]}/{ano}
                            </span>
                        </div>

                        {DRE_LINES.map((line, i) => {
                            const value = Number(dre[line.key] || 0)
                            return (
                                <motion.div
                                    key={line.key}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.04 }}
                                >
                                    {line.separator && (
                                        <div style={{
                                            height: 1,
                                            background: line.type === 'result'
                                                ? T.borderGold
                                                : T.borderLight,
                                            margin: '0 24px',
                                        }} />
                                    )}
                                    <div style={{
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        padding: `${line.bold ? 14 : 10}px 24px`,
                                        paddingLeft: 24 + line.indent * 20,
                                        background: line.type === 'result'
                                            ? T.accentBg
                                            : line.bold ? 'rgba(255,255,255,0.02)' : 'transparent',
                                    }}>
                                        <span style={{
                                            fontSize: line.bold ? 14 : 13,
                                            fontWeight: line.bold ? 600 : 400,
                                            color: line.bold ? T.text : T.textMuted,
                                            fontFamily: 'var(--font-sans)',
                                        }}>
                                            {line.label}
                                        </span>
                                        <div style={{
                                            display: 'flex', alignItems: 'center', gap: 6,
                                        }}>
                                            <span style={{ color: getValueColor(value, line.type), opacity: 0.7 }}>
                                                {getValueIcon(value, line.type)}
                                            </span>
                                            <span style={{
                                                fontSize: line.bold ? 16 : 14,
                                                fontWeight: line.bold ? 700 : 500,
                                                fontFamily: 'var(--font-mono)',
                                                color: getValueColor(value, line.type),
                                                letterSpacing: '-0.01em',
                                            }}>
                                                {formatCurrency(value)}
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>
                            )
                        })}
                    </div>

                    {/* AI Narrative */}
                    {dre.narrativa_ia && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            style={{
                                background: T.surface,
                                border: `1px solid ${T.border}`,
                                borderRadius: 10,
                                padding: '20px 24px',
                            }}
                        >
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12,
                            }}>
                                <Sparkles size={16} style={{ color: T.accent }} />
                                <h3 style={{ fontSize: 14, fontWeight: 600, color: T.accent }}>
                                    Análise IA
                                </h3>
                            </div>
                            <p style={{
                                fontSize: 14, lineHeight: 1.7, color: T.text,
                                fontFamily: 'var(--font-sans)',
                            }}>
                                {dre.narrativa_ia}
                            </p>
                        </motion.div>
                    )}
                </>
            ) : (
                <div style={{ padding: 60, textAlign: 'center', color: T.textMuted }}>
                    Selecione uma empresa para gerar o DRE
                </div>
            )}
        </div>
    )
}
