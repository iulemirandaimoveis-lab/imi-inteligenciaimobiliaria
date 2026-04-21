'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Lock, ArrowRight } from 'lucide-react'
import Link from 'next/link'

type Tier = 'starter' | 'professional' | 'enterprise'

const TIER_RANK: Record<Tier, number> = {
    starter: 0,
    professional: 1,
    enterprise: 2,
}

interface FeatureGateProps {
    /** Minimum tier required to access this feature */
    tier: Tier
    children: React.ReactNode
    /** Optional label shown in the lock overlay */
    featureName?: string
}

/**
 * FeatureGate — wraps premium features with a subscription lock overlay.
 * Usage:
 *   <FeatureGate tier="professional" featureName="Relatórios Avançados">
 *     <AdvancedReports />
 *   </FeatureGate>
 */
export function FeatureGate({ tier, children, featureName }: FeatureGateProps) {
    const [userTier, setUserTier] = useState<Tier | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const supabase = createClient()
        supabase.auth.getUser().then(({ data: { user } }) => {
            const t = (user?.user_metadata?.subscription_tier as Tier) || 'starter'
            setUserTier(t)
            setLoading(false)
        })
    }, [])

    if (loading) return <>{children}</>

    const userRank = TIER_RANK[userTier ?? 'starter']
    const requiredRank = TIER_RANK[tier]

    // User has access
    if (userRank >= requiredRank) return <>{children}</>

    // Locked — show overlay
    const tierLabel = tier.charAt(0).toUpperCase() + tier.slice(1)

    return (
        <div style={{ position: 'relative', userSelect: 'none' }}>
            {/* Blurred children */}
            <div style={{ filter: 'blur(4px)', opacity: 0.4, pointerEvents: 'none' }} aria-hidden>
                {children}
            </div>

            {/* Lock overlay */}
            <div style={{
                position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
                justifyContent: 'center', zIndex: 10,
                background: 'rgba(0,0,0,0.3)', borderRadius: '12px',
                backdropFilter: 'blur(2px)',
            }}>
                <div style={{
                    background: 'var(--bg-surface, #1a1a1a)',
                    border: '1px solid rgba(200,164,74,.25)',
                    borderRadius: '16px', padding: '20px 24px',
                    textAlign: 'center', maxWidth: '280px',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                }}>
                    <div style={{
                        width: 40, height: 40, borderRadius: '10px',
                        background: 'rgba(200,164,74,.12)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 12px',
                    }}>
                        <Lock size={18} style={{ color: 'var(--accent-400, #b8943a)' }} />
                    </div>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>
                        {featureName || 'Recurso Premium'}
                    </p>
                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '16px', lineHeight: 1.5 }}>
                        Disponível no plano {tierLabel} ou superior.
                    </p>
                    <Link
                        href="/backoffice/billing"
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: '6px',
                            padding: '8px 16px', borderRadius: '10px',
                            background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)',
                            fontSize: '12px', fontWeight: 700, textDecoration: 'none',
                        }}
                    >
                        Ver planos
                        <ArrowRight size={12} />
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default FeatureGate
