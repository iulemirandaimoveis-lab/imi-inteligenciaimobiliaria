'use client'

import { useEffect, useState, useRef } from 'react'

// ─── Types ──────────────────────────────────────────────────────────────────

interface NeighborhoodBubble {
    id: string
    neighborhood: string
    median_price_sqm: number | null
    inventory_count: number | null
}

interface PriceHeatmapProps {
    neighborhoods: NeighborhoodBubble[]
    cityAvgPrice: number | null
    loading?: boolean
}

// ─── Constants ──────────────────────────────────────────────────────────────

const NAVY = '#0B1928'
const GOLD = '#C8A44A'

function getPriceColor(price: number | null, avg: number | null): string {
    if (price == null || avg == null) return '#334E68'
    const ratio = price / avg
    if (ratio < 0.85) return '#10B981'   // opportunity — green
    if (ratio <= 1.15) return GOLD       // at avg — gold
    return '#EF4444'                     // premium — red
}

function getPriceBg(price: number | null, avg: number | null): string {
    if (price == null || avg == null) return 'rgba(51,78,104,0.15)'
    const ratio = price / avg
    if (ratio < 0.85) return 'rgba(16,185,129,0.12)'
    if (ratio <= 1.15) return 'rgba(200,164,74,0.12)'
    return 'rgba(239,68,68,0.12)'
}

function getPriceLabel(price: number | null, avg: number | null): string {
    if (price == null || avg == null) return ''
    const ratio = price / avg
    if (ratio < 0.85) return 'Oportunidade'
    if (ratio <= 1.15) return 'Na Média'
    return 'Premium'
}

function getBubbleSize(inventory: number | null, maxInventory: number): number {
    if (inventory == null || maxInventory === 0) return 100
    const minSize = 80
    const maxSize = 160
    return minSize + ((inventory / maxInventory) * (maxSize - minSize))
}

function formatPrice(v: number | null): string {
    if (v == null) return '--'
    if (v >= 1000) {
        return `${(v / 1000).toFixed(1)}k`
    }
    return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(v)
}

// ─── Skeleton ───────────────────────────────────────────────────────────────

function HeatmapSkeleton() {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
                <div
                    key={i}
                    className="flex flex-col items-center justify-center rounded-2xl border border-white/[0.05] bg-[#0B1928]/50 animate-pulse"
                    style={{ height: 120 }}
                >
                    <div className="w-16 h-16 rounded-full bg-white/[0.05]" />
                    <div className="w-20 h-3 mt-3 rounded bg-white/[0.05]" />
                </div>
            ))}
        </div>
    )
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function PriceHeatmap({ neighborhoods, cityAvgPrice, loading }: PriceHeatmapProps) {
    const [visible, setVisible] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!containerRef.current) return
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setVisible(true)
                    observer.disconnect()
                }
            },
            { threshold: 0.1 }
        )
        observer.observe(containerRef.current)
        return () => observer.disconnect()
    }, [])

    if (loading) {
        return (
            <section className="py-12 md:py-16" ref={containerRef}>
                <div className="container-custom">
                    <SectionHeader />
                    <HeatmapSkeleton />
                </div>
            </section>
        )
    }

    if (!neighborhoods || neighborhoods.length === 0) {
        return (
            <section className="py-12 md:py-16" ref={containerRef}>
                <div className="container-custom">
                    <SectionHeader />
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-12 h-12 rounded-2xl bg-[#0B1928] border border-white/[0.06] flex items-center justify-center mb-4">
                            <span className="text-2xl text-[#334E68]">&#x2205;</span>
                        </div>
                        <p className="text-[#556170] text-sm font-light max-w-sm">
                            Nenhum dado de preços disponível para exibir no mapa. Selecione outra cidade ou aguarde a atualização dos dados.
                        </p>
                    </div>
                </div>
            </section>
        )
    }

    const maxInventory = Math.max(
        ...neighborhoods.map(n => n.inventory_count ?? 0)
    )

    const sorted = [...neighborhoods].sort((a, b) => {
        const pa = a.median_price_sqm ?? 0
        const pb = b.median_price_sqm ?? 0
        return pb - pa
    })

    return (
        <section className="py-12 md:py-16" ref={containerRef}>
            <div className="container-custom">
                <SectionHeader />

                {/* Legend */}
                <div className="flex flex-wrap items-center gap-4 sm:gap-6 mb-8">
                    <LegendItem color="#10B981" label="Abaixo da média (oportunidade)" />
                    <LegendItem color={GOLD} label="Na média da cidade" />
                    <LegendItem color="#EF4444" label="Acima da média (premium)" />
                    <span className="text-[10px] text-[#556170] ml-auto hidden sm:block">
                        Tamanho = estoque disponível
                    </span>
                </div>

                {/* Bubble Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {sorted.map((n, i) => {
                        const color = getPriceColor(n.median_price_sqm, cityAvgPrice)
                        const bgColor = getPriceBg(n.median_price_sqm, cityAvgPrice)
                        const label = getPriceLabel(n.median_price_sqm, cityAvgPrice)
                        const size = getBubbleSize(n.inventory_count, maxInventory)

                        return (
                            <div
                                key={n.id}
                                className="flex flex-col items-center justify-center rounded-2xl border border-white/[0.05] hover:border-white/[0.12] transition-all duration-300 cursor-default group"
                                style={{
                                    background: bgColor,
                                    padding: '20px 12px',
                                    opacity: visible ? 1 : 0,
                                    transform: visible ? 'translateY(0)' : 'translateY(16px)',
                                    transition: `opacity 0.5s ease ${i * 60}ms, transform 0.5s ease ${i * 60}ms, border-color 0.3s`,
                                }}
                            >
                                {/* Bubble */}
                                <div
                                    className="rounded-full flex flex-col items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300"
                                    style={{
                                        width: size,
                                        height: size,
                                        background: `radial-gradient(circle at 35% 35%, ${color}33, ${color}11)`,
                                        border: `2px solid ${color}55`,
                                    }}
                                >
                                    <span
                                        className="text-lg sm:text-xl font-bold leading-none"
                                        style={{ color }}
                                    >
                                        {formatPrice(n.median_price_sqm)}
                                    </span>
                                    <span className="text-[9px] text-[#556170] mt-0.5">R$/m²</span>
                                </div>

                                {/* Name */}
                                <div className="mt-3 text-center w-full px-2 min-w-0">
                                    <div className="text-xs sm:text-sm font-semibold text-white leading-tight truncate">
                                        {n.neighborhood}
                                    </div>
                                    {label && (
                                        <span
                                            className="inline-block mt-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                                            style={{
                                                color,
                                                background: `${color}15`,
                                                border: `1px solid ${color}30`,
                                            }}
                                        >
                                            {label}
                                        </span>
                                    )}
                                </div>

                                {/* Inventory */}
                                {n.inventory_count != null && (
                                    <span className="text-[10px] text-[#556170] mt-1.5">
                                        {n.inventory_count} imóveis
                                    </span>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function SectionHeader() {
    return (
        <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-px bg-[#334E68]" />
                <span className="text-[#C8A44A] font-bold uppercase tracking-[0.25em] text-[11px]">
                    Mapa de Precos
                </span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
                Comparativo Visual de <span className="text-[#C8A44A] italic">Preços por Bairro</span>
            </h2>
            <p className="text-[#7A8FA6] text-sm mt-2 max-w-xl font-light">
                Cada bolha representa um bairro. O tamanho reflete o estoque e a cor indica a faixa de preço
                em relação à média da cidade.
            </p>
        </div>
    )
}

function LegendItem({ color, label }: { color: string; label: string }) {
    return (
        <div className="flex items-center gap-2">
            <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ background: color }}
            />
            <span className="text-[11px] text-[#9CA3AF]">{label}</span>
        </div>
    )
}
