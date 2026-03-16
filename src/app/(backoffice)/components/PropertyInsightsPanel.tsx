'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Brain, ChevronDown, ChevronUp, TrendingUp, DollarSign,
    Target, Shield, Users, Loader2, RefreshCw, Sparkles,
    ArrowUp, ArrowDown, Minus, Send,
} from 'lucide-react'
import { T } from '@/app/(backoffice)/lib/theme'

interface PropertyInsights {
    market_position: {
        summary: string
        score: number
        details: string
    }
    price_recommendation: {
        summary: string
        suggested_action: 'manter' | 'aumentar' | 'reduzir'
        details: string
    }
    listing_optimization: {
        score: number
        suggestions: string[]
        details: string
    }
    competitive_analysis: {
        strengths: string[]
        weaknesses: string[]
        opportunity: string
    }
    lead_strategy: {
        summary: string
        priority_actions: string[]
    }
}

interface PropertyInsightsPanelProps {
    developmentId: string
    data: any
}

const CACHE_PREFIX = 'imi_prop_insights_'
const CACHE_TTL = 24 * 60 * 60 * 1000 // 24h

function getCachedInsights(id: string): PropertyInsights | null {
    if (typeof window === 'undefined') return null
    try {
        const raw = localStorage.getItem(`${CACHE_PREFIX}${id}`)
        if (!raw) return null
        const { insights, ts } = JSON.parse(raw)
        if (Date.now() - ts > CACHE_TTL) {
            localStorage.removeItem(`${CACHE_PREFIX}${id}`)
            return null
        }
        return insights
    } catch { return null }
}

function setCachedInsights(id: string, insights: PropertyInsights) {
    try {
        localStorage.setItem(`${CACHE_PREFIX}${id}`, JSON.stringify({ insights, ts: Date.now() }))
    } catch { /* quota exceeded, ignore */ }
}

function ScoreBar({ score, label }: { score: number; label: string }) {
    const pct = (score / 10) * 100
    const color = score >= 7 ? 'var(--bo-success)' : score >= 5 ? 'var(--bo-warning)' : 'var(--bo-error)'
    return (
        <div>
            <div className="flex justify-between mb-1">
                <span className="text-[10px] font-semibold" style={{ color: T.textMuted }}>{label}</span>
                <span className="text-[10px] font-bold" style={{ color }}>{score}/10</span>
            </div>
            <div className="h-1.5 rounded-full" style={{ background: T.elevated }}>
                <motion.div
                    className="h-full rounded-full"
                    style={{ background: color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                />
            </div>
        </div>
    )
}

const ActionIcon = ({ action }: { action: string }) => {
    if (action === 'aumentar') return <ArrowUp size={12} style={{ color: 'var(--bo-success)' }} />
    if (action === 'reduzir') return <ArrowDown size={12} style={{ color: 'var(--bo-error)' }} />
    return <Minus size={12} style={{ color: 'var(--bo-warning)' }} />
}

const actionLabel: Record<string, string> = {
    aumentar: 'Aumentar Preço',
    reduzir: 'Reduzir Preço',
    manter: 'Manter Preço',
}

export default function PropertyInsightsPanel({ developmentId, data }: PropertyInsightsPanelProps) {
    const [expanded, setExpanded] = useState(false)
    const [loading, setLoading] = useState(false)
    const [insights, setInsights] = useState<PropertyInsights | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [question, setQuestion] = useState('')
    const [answer, setAnswer] = useState('')
    const [askLoading, setAskLoading] = useState(false)

    const fetchInsights = useCallback(async (force = false) => {
        if (!force) {
            const cached = getCachedInsights(developmentId)
            if (cached) { setInsights(cached); return }
        }

        setLoading(true)
        setError(null)
        try {
            const res = await fetch('/api/ai/property-insights', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ property_id: developmentId }),
            })
            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || 'Erro ao gerar insights')
            }
            const { insights: ins } = await res.json()
            setInsights(ins)
            setCachedInsights(developmentId, ins)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }, [developmentId])

    const handleExpand = () => {
        if (!expanded && !insights && !loading) {
            fetchInsights()
        }
        setExpanded(prev => !prev)
    }

    const handleAsk = async () => {
        if (!question.trim() || askLoading) return
        setAskLoading(true)
        setAnswer('')
        try {
            const res = await fetch('/api/ai/property-insights', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    property_id: developmentId,
                    question: question.trim(),
                }),
            })
            if (!res.ok) throw new Error('Erro')
            const data = await res.json()
            // For Q&A, the insights will contain the answer in market_position.details
            setAnswer(data.insights?.market_position?.details || data.insights?.lead_strategy?.summary || 'Sem resposta disponível.')
        } catch {
            setAnswer('Erro ao processar pergunta. Tente novamente.')
        } finally {
            setAskLoading(false)
        }
    }

    return (
        <div
            className="rounded-2xl overflow-hidden transition-all"
            style={{
                background: T.surface,
                border: `1px solid ${insights ? 'rgba(59,130,246,0.3)' : T.border}`,
                boxShadow: insights ? '0 0 20px rgba(59,130,246,0.08)' : 'none',
            }}
        >
            {/* Toggle Header */}
            <button
                onClick={handleExpand}
                className="w-full flex items-center justify-between p-4 text-left transition-colors hover:bg-white/[0.02]"
            >
                <div className="flex items-center gap-2.5">
                    <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ background: 'rgba(59,130,246,0.15)' }}
                    >
                        <Brain size={14} style={{ color: T.accent }} className={loading ? 'animate-pulse' : ''} />
                    </div>
                    <div>
                        <p className="text-xs font-bold" style={{ color: T.text }}>Inteligência IA</p>
                        <p className="text-[10px]" style={{ color: T.textMuted }}>
                            {insights ? 'Insights gerados' : 'Clique para analisar'}
                        </p>
                    </div>
                </div>
                {expanded ? (
                    <ChevronUp size={14} style={{ color: T.textMuted }} />
                ) : (
                    <ChevronDown size={14} style={{ color: T.textMuted }} />
                )}
            </button>

            {/* Expandable Content */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                    >
                        <div className="px-4 pb-4 space-y-4" style={{ borderTop: `1px solid ${T.border}` }}>
                            {/* Loading */}
                            {loading && (
                                <div className="flex flex-col items-center py-8 gap-3">
                                    <Loader2 size={24} className="animate-spin" style={{ color: T.accent }} />
                                    <p className="text-xs" style={{ color: T.textMuted }}>Analisando imóvel com IA...</p>
                                </div>
                            )}

                            {/* Error */}
                            {error && !loading && (
                                <div className="text-center py-6">
                                    <p className="text-xs mb-3" style={{ color: 'var(--bo-error)' }}>{error}</p>
                                    <button
                                        onClick={() => fetchInsights(true)}
                                        className="text-xs font-semibold flex items-center gap-1.5 mx-auto px-4 py-2 rounded-lg"
                                        style={{ color: T.accent, background: T.elevated }}
                                    >
                                        <RefreshCw size={12} /> Tentar novamente
                                    </button>
                                </div>
                            )}

                            {/* Insights Content */}
                            {insights && !loading && (
                                <>
                                    {/* Scores */}
                                    <div className="pt-3 space-y-3">
                                        <ScoreBar score={insights.market_position.score} label="Posição de Mercado" />
                                        <ScoreBar score={insights.listing_optimization.score} label="Qualidade do Anúncio" />
                                    </div>

                                    {/* Market Position */}
                                    <div className="rounded-xl p-3" style={{ background: T.elevated }}>
                                        <div className="flex items-center gap-1.5 mb-2">
                                            <TrendingUp size={11} style={{ color: T.accent }} />
                                            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: T.accent }}>
                                                Posição de Mercado
                                            </span>
                                        </div>
                                        <p className="text-xs font-semibold mb-1" style={{ color: T.text }}>
                                            {insights.market_position.summary}
                                        </p>
                                        <p className="text-[11px] leading-relaxed" style={{ color: T.textMuted }}>
                                            {insights.market_position.details}
                                        </p>
                                    </div>

                                    {/* Price Recommendation */}
                                    <div className="rounded-xl p-3" style={{ background: T.elevated }}>
                                        <div className="flex items-center gap-1.5 mb-2">
                                            <DollarSign size={11} style={{ color: 'var(--bo-warning)' }} />
                                            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--bo-warning)' }}>
                                                Recomendação de Preço
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <ActionIcon action={insights.price_recommendation.suggested_action} />
                                            <span className="text-xs font-bold" style={{ color: T.text }}>
                                                {actionLabel[insights.price_recommendation.suggested_action] || 'Manter'}
                                            </span>
                                        </div>
                                        <p className="text-[11px] leading-relaxed" style={{ color: T.textMuted }}>
                                            {insights.price_recommendation.details}
                                        </p>
                                    </div>

                                    {/* Listing Optimization */}
                                    <div className="rounded-xl p-3" style={{ background: T.elevated }}>
                                        <div className="flex items-center gap-1.5 mb-2">
                                            <Target size={11} style={{ color: 'var(--bo-success)' }} />
                                            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--bo-success)' }}>
                                                Otimização do Anúncio
                                            </span>
                                        </div>
                                        <ul className="space-y-1.5">
                                            {insights.listing_optimization.suggestions.map((s, i) => (
                                                <li key={i} className="flex items-start gap-2 text-[11px]" style={{ color: T.textMuted }}>
                                                    <Sparkles size={10} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--bo-success)' }} />
                                                    {s}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Competitive Analysis */}
                                    <div className="rounded-xl p-3" style={{ background: T.elevated }}>
                                        <div className="flex items-center gap-1.5 mb-2">
                                            <Shield size={11} style={{ color: 'var(--bo-info, #60a5fa)' }} />
                                            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--bo-info, #60a5fa)' }}>
                                                Análise Competitiva
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 mb-2">
                                            <div>
                                                <p className="text-[9px] font-bold uppercase mb-1" style={{ color: 'var(--bo-success)' }}>Pontos Fortes</p>
                                                {insights.competitive_analysis.strengths.map((s, i) => (
                                                    <p key={i} className="text-[10px] mb-0.5" style={{ color: T.textMuted }}>+ {s}</p>
                                                ))}
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-bold uppercase mb-1" style={{ color: 'var(--bo-error)' }}>Pontos Fracos</p>
                                                {insights.competitive_analysis.weaknesses.map((s, i) => (
                                                    <p key={i} className="text-[10px] mb-0.5" style={{ color: T.textMuted }}>- {s}</p>
                                                ))}
                                            </div>
                                        </div>
                                        <p className="text-[10px] mt-1 px-2 py-1.5 rounded-lg" style={{ background: 'rgba(59,130,246,0.08)', color: T.accent }}>
                                            💡 {insights.competitive_analysis.opportunity}
                                        </p>
                                    </div>

                                    {/* Lead Strategy */}
                                    <div className="rounded-xl p-3" style={{ background: T.elevated }}>
                                        <div className="flex items-center gap-1.5 mb-2">
                                            <Users size={11} style={{ color: 'var(--bo-accent)' }} />
                                            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: T.accent }}>
                                                Estratégia de Leads
                                            </span>
                                        </div>
                                        <p className="text-[11px] mb-2" style={{ color: T.textMuted }}>
                                            {insights.lead_strategy.summary}
                                        </p>
                                        <div className="space-y-1">
                                            {insights.lead_strategy.priority_actions.map((a, i) => (
                                                <div key={i} className="flex items-center gap-2 text-[11px]" style={{ color: T.text }}>
                                                    <span className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold flex-shrink-0"
                                                        style={{ background: T.accent, color: '#fff' }}>{i + 1}</span>
                                                    {a}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Refresh button */}
                                    <button
                                        onClick={() => fetchInsights(true)}
                                        className="w-full h-8 rounded-lg text-[10px] font-semibold flex items-center justify-center gap-1.5 transition-colors hover:bg-white/5"
                                        style={{ color: T.textMuted, border: `1px solid ${T.border}` }}
                                    >
                                        <RefreshCw size={10} /> Atualizar Insights
                                    </button>
                                </>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
