export const dynamic = 'force-dynamic'
// GET /api/challenges — List active challenges with participants
// POST /api/challenges — Create a new challenge
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { data: challenges, error: challengesErr } = await supabase
            .from('challenges')
            .select('*, challenge_participants(*)')
            .eq('is_active', true)
            .order('created_at', { ascending: false })

        if (challengesErr) {
            console.error('[challenges] fetch error:', challengesErr.message)
            return NextResponse.json({ error: 'Failed to fetch challenges' }, { status: 500 })
        }

        return NextResponse.json(challenges || [])
    } catch (err: unknown) {
        console.error('[challenges] GET unexpected error:', err)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const {
            title,
            description,
            challenge_type,
            metric,
            target_value,
            start_date,
            end_date,
            scope,
            team_id,
            prize_description,
            prize_value,
        } = body

        if (!title || !challenge_type || !metric || !target_value || !start_date || !end_date) {
            return NextResponse.json(
                { error: 'Missing required fields: title, challenge_type, metric, target_value, start_date, end_date' },
                { status: 400 }
            )
        }

        const { data: challenge, error: insertErr } = await supabase
            .from('challenges')
            .insert({
                title,
                description: description || null,
                challenge_type,
                metric,
                target_value,
                start_date,
                end_date,
                scope: scope || 'individual',
                team_id: team_id || null,
                prize_description: prize_description || null,
                prize_value: prize_value || null,
                is_active: true,
                created_by: user.id,
            })
            .select()
            .single()

        if (insertErr) {
            console.error('[challenges] insert error:', insertErr.message)
            return NextResponse.json({ error: 'Failed to create challenge' }, { status: 500 })
        }

        return NextResponse.json(challenge, { status: 201 })
    } catch (err: unknown) {
        console.error('[challenges] POST unexpected error:', err)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
