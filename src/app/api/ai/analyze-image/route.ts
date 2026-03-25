import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { rateLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

const MOONDREAM_API = 'https://api.moondream.ai/v1'
const MOONDREAM_KEY = process.env.MOONDREAM_API_KEY

async function moondreamQuery(imageUrl: string, question: string) {
    if (!MOONDREAM_KEY) return null
    try {
        const res = await fetch(`${MOONDREAM_API}/query`, {
            method: 'POST',
            headers: { 'X-Moondream-Auth': MOONDREAM_KEY, 'Content-Type': 'application/json' },
            body: JSON.stringify({ image_url: imageUrl, question, stream: false }),
        })
        if (!res.ok) return null
        const data = await res.json()
        return data.answer || data.text || null
    } catch { return null }
}

async function moondreamCaption(imageUrl: string, length: 'short' | 'normal' | 'long' = 'normal') {
    if (!MOONDREAM_KEY) return null
    try {
        const res = await fetch(`${MOONDREAM_API}/caption`, {
            method: 'POST',
            headers: { 'X-Moondream-Auth': MOONDREAM_KEY, 'Content-Type': 'application/json' },
            body: JSON.stringify({ image_url: imageUrl, length, stream: false }),
        })
        if (!res.ok) return null
        const data = await res.json()
        return data.caption || null
    } catch { return null }
}

export async function POST(req: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

        const rl = rateLimit(`analyze-image:${user.id}`, 20, 60000)
        if (!rl.success) return NextResponse.json({ error: 'Limite excedido' }, { status: 429 })

        const { image_url, development_id } = await req.json()
        if (!image_url) return NextResponse.json({ error: 'image_url obrigatório' }, { status: 400 })

        // If no Moondream key, return basic analysis
        if (!MOONDREAM_KEY) {
            return NextResponse.json({
                quality_score: null,
                room_type: null,
                caption: null,
                message: 'Moondream API key not configured. Set MOONDREAM_API_KEY in environment.',
            })
        }

        // 1. Quality + room type analysis
        const qualityRaw = await moondreamQuery(image_url,
            'Analyze this real estate photo. Rate quality 0-100 considering lighting, angle, sharpness. What room is this (living_room, bedroom, bathroom, kitchen, balcony, garage, pool, facade, aerial, floor_plan, other)? Any issues? Reply as JSON: {"quality_score": N, "room_type": "...", "issues": []}'
        )

        let quality = { quality_score: 70, room_type: 'other', issues: [] as string[] }
        if (qualityRaw) {
            try {
                const parsed = JSON.parse(qualityRaw.replace(/```json?\n?/g, '').replace(/```/g, '').trim())
                quality = { ...quality, ...parsed }
            } catch {
                // Try to extract score from text
                const scoreMatch = qualityRaw.match(/(\d+)/)
                if (scoreMatch) quality.quality_score = Math.min(100, parseInt(scoreMatch[1]))
            }
        }

        // 2. Auto-caption
        const caption = await moondreamCaption(image_url, 'normal')

        // 3. Condition assessment
        const conditionRaw = await moondreamQuery(image_url,
            'Rate this property condition from 1 (poor/needs renovation) to 5 (excellent/new). Consider walls, floors, fixtures. Reply with just a number.'
        )
        const conditionScore = conditionRaw ? Math.min(5, Math.max(1, parseInt(conditionRaw) || 3)) : 3

        // 4. Save analysis to DB if development_id provided
        if (development_id) {
            await supabaseAdmin.from('property_image_analysis').upsert({
                development_id,
                image_url,
                room_type: quality.room_type,
                quality_score: quality.quality_score,
                condition_score: conditionScore,
                detected_issues: quality.issues,
                auto_caption: caption,
                analysis_model: 'moondream3-preview',
                analyzed_at: new Date().toISOString(),
            }, { onConflict: 'development_id,image_url' }).catch(() => {
                // Table might not exist yet — graceful fallback
            })
        }

        return NextResponse.json({
            quality_score: quality.quality_score,
            room_type: quality.room_type,
            issues: quality.issues,
            condition_score: conditionScore,
            caption,
            model: 'moondream3-preview',
        })
    } catch (error) {
        return NextResponse.json({ error: 'Erro na análise de imagem' }, { status: 500 })
    }
}
