// POST /api/ai/auto-score — Automatic lead scoring (rule-based, non-blocking)
// Called after lead INSERT/UPDATE. Calculates score 0-100 and persists to leads.ai_score
// Scoring model:
//   Source quality   (0–25): organic/direct > email > paid > referral
//   Data completeness(0–25): email + phone + budget + interest = max
//   Engagement       (0–25): pages visited, time on site (from page_views/sessions)
//   Budget fit       (0–25): budget vs median development price
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

// Source quality weights
const SOURCE_SCORES: Record<string, number> = {
    organic: 25,
    direct: 22,
    email: 20,
    referral: 18,
    google: 16,
    facebook: 14,
    instagram: 14,
    paid: 12,
    whatsapp: 10,
    other: 5,
}

function scoreSource(source?: string | null, utmMedium?: string | null): number {
    if (!source) return 10
    const s = source.toLowerCase()
    if (utmMedium?.toLowerCase() === 'cpc' || utmMedium?.toLowerCase() === 'paid') return SOURCE_SCORES.paid
    return SOURCE_SCORES[s] || SOURCE_SCORES.other
}

function scoreCompleteness(lead: Record<string, unknown>): number {
    let score = 0
    if (lead.email) score += 7
    if (lead.phone) score += 7
    if (lead.capital || lead.budget_min || lead.budget_max) score += 6
    if (lead.interest_type || lead.development_id) score += 5
    return Math.min(score, 25)
}

function scoreEngagement(pageViews: number, sessionDuration: number): number {
    // page views: 0-3 pages → low, 4-8 → medium, 9+ → high
    const pvScore = Math.min(pageViews * 2, 15)
    // session duration in seconds: 0-30s → 0, 30-120s → 5, 120s+ → 10
    const durScore = sessionDuration > 120 ? 10 : sessionDuration > 30 ? 5 : 0
    return Math.min(pvScore + durScore, 25)
}

function scoreBudget(budget: number | null, medianPrice: number): number {
    if (!budget || !medianPrice) return 10 // neutral
    const ratio = budget / medianPrice
    if (ratio >= 0.8 && ratio <= 1.5) return 25  // ideal range
    if (ratio >= 0.5 && ratio < 0.8) return 18   // slightly low
    if (ratio > 1.5) return 22                    // high budget — still good
    return 8                                       // too low
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { lead_id } = body

        if (!lead_id) {
            return NextResponse.json({ error: 'lead_id required' }, { status: 400 })
        }

        // Fetch lead data
        const { data: lead, error: leadErr } = await supabaseAdmin
            .from('leads')
            .select('*')
            .eq('id', lead_id)
            .single()

        if (leadErr || !lead) {
            return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
        }

        // Fetch development prices and optionally engagement data via email match
        const [{ data: devs }, { data: sessions }] = await Promise.all([
            supabaseAdmin
                .from('developments')
                .select('price_min, price_max')
                .eq('status_commercial', 'published')
                .limit(100),
            // Find sessions linked to this lead
            supabaseAdmin
                .from('tracking_sessions')
                .select('total_duration, page_count')
                .eq('lead_id', lead_id)
                .order('started_at', { ascending: false })
                .limit(5),
        ])

        // Calculate median development price
        const prices = (devs || [])
            .filter((d: Record<string, unknown>) => d.price_min && (d.price_min as number) > 0)
            .map((d: Record<string, unknown>) => d.price_min as number)
        const medianPrice = prices.length > 0
            ? prices.sort((a, b) => a - b)[Math.floor(prices.length / 2)]
            : 0

        // Session stats (best session)
        const bestSession = (sessions || []).reduce(
            (best: Record<string, number> | null, s: Record<string, unknown>) => {
                const dur = (s.total_duration as number) || 0
                return !best || dur > (best.total_duration || 0) ? s as Record<string, number> : best
            },
            null
        )
        const totalPageViews = bestSession?.page_count || 0
        const totalDuration = bestSession?.total_duration || 0

        // Lead budget — use capital (primary) or budget_min
        const budget = lead.capital || lead.budget_min || null

        // Calculate component scores
        const srcScore = scoreSource(lead.source, lead.utm_medium)
        const completenessScore = scoreCompleteness(lead as Record<string, unknown>)
        const engagementScore = scoreEngagement(totalPageViews, totalDuration)
        const budgetScore = scoreBudget(budget ? Number(budget) : null, medianPrice)

        const totalScore = srcScore + completenessScore + engagementScore + budgetScore

        // Grade label
        const grade =
            totalScore >= 80 ? 'A' :
            totalScore >= 60 ? 'B' :
            totalScore >= 40 ? 'C' : 'D'

        // Persist score back to lead
        await supabaseAdmin
            .from('leads')
            .update({
                ai_score: totalScore,
                updated_at: new Date().toISOString(),
            })
            .eq('id', lead_id)

        return NextResponse.json({
            lead_id,
            score: totalScore,
            grade,
            breakdown: {
                source: srcScore,
                completeness: completenessScore,
                engagement: engagementScore,
                budget: budgetScore,
            },
        })
    } catch (err: unknown) {
        console.error('Auto-score error:', err)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
