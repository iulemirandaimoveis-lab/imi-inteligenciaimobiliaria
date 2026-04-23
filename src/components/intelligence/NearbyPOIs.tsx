'use client'

import { useEffect, useState } from 'react'
import { MapPin, GraduationCap, Heart, ShoppingBag, Bus, UtensilsCrossed, TreePine, Shield } from 'lucide-react'

interface POI {
    id: number
    category: string
    name: string
    distance: number
}

interface CategoryScore {
    category: string
    score: number
    count: number
    nearest: number | null
}

interface POIResult {
    pois: POI[]
    scores: CategoryScore[]
    overall_score: number
}

interface NearbyPOIsProps {
    lat?: number | null
    lng?: number | null
    address?: string
}

const NAVY = '#0B1928'
const GOLD = '#C8A44A'
const MUTED = '#948F84'
const LIGHT_BG = '#F8F6F2'

const CATEGORY_META: Record<string, { label: string; icon: typeof MapPin; color: string }> = {
    health:     { label: 'Saúde',      icon: Heart,            color: '#EF4444' },
    education:  { label: 'Educação',   icon: GraduationCap,    color: '#3B82F6' },
    transport:  { label: 'Transporte', icon: Bus,              color: '#8B5CF6' },
    shopping:   { label: 'Comércio',   icon: ShoppingBag,      color: '#F59E0B' },
    food:       { label: 'Alimentação',icon: UtensilsCrossed,  color: '#EC4899' },
    leisure:    { label: 'Lazer',      icon: TreePine,         color: '#10B981' },
    safety:     { label: 'Segurança',  icon: Shield,           color: '#6366F1' },
}

function formatDistance(m: number): string {
    return m >= 1000 ? `${(m / 1000).toFixed(1)}km` : `${m}m`
}

export default function NearbyPOIs({ lat, lng, address }: NearbyPOIsProps) {
    const [data, setData] = useState<POIResult | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const hasCoords = lat && lng && !(lat === -8.0476 && lng === -34.877)

        if (!hasCoords && !address) {
            setLoading(false)
            return
        }

        const params = hasCoords
            ? `lat=${lat}&lng=${lng}`
            : `address=${encodeURIComponent(address!)}`

        fetch(`/api/intelligence/pois?${params}`)
            .then(r => r.ok ? r.json() : null)
            .then(d => setData(d))
            .catch(() => {})
            .finally(() => setLoading(false))
    }, [lat, lng, address])

    if (loading) {
        return (
            <div style={{ background: 'white', borderRadius: 20, padding: 24, border: '1px solid rgba(0,0,0,0.06)' }}>
                <div style={{ height: 16, width: '40%', background: '#E8E5DF', borderRadius: 6, marginBottom: 16 }} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
                    {[1,2,3,4,5,6].map(i => <div key={i} style={{ height: 60, background: '#F3F1ED', borderRadius: 12 }} />)}
                </div>
            </div>
        )
    }

    if (!data || data.pois.length === 0) return null

    const categories = data.scores.filter(s => s.count > 0).sort((a, b) => b.score - a.score)

    return (
        <div style={{
            background: 'white', borderRadius: 20,
            border: '1px solid rgba(0,0,0,0.06)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
            overflow: 'hidden',
        }}>
            {/* Header */}
            <div style={{
                background: NAVY, color: 'white',
                padding: '16px 20px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
                <div>
                    <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: GOLD, marginBottom: 4 }}>
                        O que há na região
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 800 }}>
                        Score de Localização: {data.overall_score}/100
                    </div>
                </div>
                <div style={{
                    width: 44, height: 44, borderRadius: '50%',
                    background: `conic-gradient(${GOLD} ${data.overall_score * 3.6}deg, rgba(255,255,255,0.1) 0deg)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <div style={{
                        width: 34, height: 34, borderRadius: '50%', background: NAVY,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 13, fontWeight: 800, color: 'white',
                    }}>
                        {data.overall_score}
                    </div>
                </div>
            </div>

            <div style={{ padding: '16px 20px' }}>
                {/* Category scores */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8, marginBottom: 16 }}>
                    {categories.map(cat => {
                        const meta = CATEGORY_META[cat.category]
                        if (!meta) return null
                        const Icon = meta.icon
                        return (
                            <div key={cat.category} style={{
                                background: LIGHT_BG, borderRadius: 12, padding: '10px 12px',
                                display: 'flex', alignItems: 'center', gap: 10,
                            }}>
                                <div style={{
                                    width: 32, height: 32, borderRadius: 8,
                                    background: `${meta.color}15`, display: 'flex',
                                    alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <Icon size={16} style={{ color: meta.color }} />
                                </div>
                                <div>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: NAVY }}>{meta.label}</div>
                                    <div style={{ fontSize: 10, color: MUTED }}>
                                        {cat.count} local{cat.count !== 1 ? 'is' : ''}
                                        {cat.nearest != null && ` · ${formatDistance(cat.nearest)}`}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Top POIs list */}
                <div style={{ fontSize: 11, fontWeight: 700, color: NAVY, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                    Mais próximos
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {data.pois.sort((a, b) => a.distance - b.distance).slice(0, 8).map(poi => {
                        const meta = CATEGORY_META[poi.category]
                        return (
                            <div key={poi.id} style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                                padding: '6px 0', borderBottom: '1px solid rgba(0,0,0,0.03)',
                            }}>
                                <MapPin size={12} style={{ color: meta?.color || MUTED, flexShrink: 0 }} />
                                <span style={{ fontSize: 12, color: NAVY, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {poi.name}
                                </span>
                                <span style={{ fontSize: 11, color: MUTED, fontWeight: 600, flexShrink: 0 }}>
                                    {formatDistance(poi.distance)}
                                </span>
                            </div>
                        )
                    })}
                </div>
            </div>

            <div style={{ borderTop: '1px solid rgba(0,0,0,0.04)', padding: '8px 20px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 9, color: MUTED, letterSpacing: '0.05em', textTransform: 'uppercase' }}>IMI Inteligência Imobiliária</span>
                <span style={{ fontSize: 9, color: 'rgba(0,0,0,0.2)' }}>Fonte: OpenStreetMap</span>
            </div>
        </div>
    )
}
