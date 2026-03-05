import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logAudit, getRequestMeta } from '@/lib/governance'

export async function GET(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json([], { status: 200 });
        }

        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 250)
        const offset = (page - 1) * limit

        const { data: leads, error, count } = await supabase
            .from('leads')
            .select('id, name, email, phone, source, status, score, ai_score, interest_type, interest_location, created_at, updated_at, budget_min, budget_max, utm_source', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            console.error('Error fetching leads:', error);
            // Return empty array instead of error — frontend expects array
            return NextResponse.json([], { status: 200 });
        }

        // Map to the format the frontend expects
        const formatted = (leads || []).map((l: any) => ({
            id: l.id,
            name: l.name || 'Sem nome',
            email: l.email || '',
            phone: l.phone || '',
            score: l.score || l.ai_score || 50,
            status: mapStatus(l.status),
            source: l.source || l.utm_source || 'Site',
            interest: l.interest_type || '-',
            city: l.interest_location || '',
            budget: formatBudget(l.budget_min, l.budget_max),
            created_at: l.created_at || new Date().toISOString(),
            updated_at: l.updated_at || l.created_at || new Date().toISOString(),
        }));

        return NextResponse.json({
            data: formatted,
            pagination: {
                page,
                limit,
                total: count || 0,
                pages: Math.ceil((count || 0) / limit),
            },
        });
    } catch (error) {
        console.error('Error in GET /api/leads:', error);
        return NextResponse.json([], { status: 200 });
    }
}

function mapStatus(status: string | null): string {
    if (!status) return 'warm';
    const s = status.toLowerCase();
    if (['hot', 'quente', 'qualified'].includes(s)) return 'hot';
    if (['cold', 'frio', 'lost', 'inactive'].includes(s)) return 'cold';
    return 'warm';
}

function formatBudget(min: number | null, max: number | null): string {
    if (!min && !max) return 'N/A';
    const fmt = (v: number) => {
        if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
        if (v >= 1000) return `${Math.round(v / 1000)}k`;
        return String(v);
    };
    if (min && max) return `${fmt(min)}–${fmt(max)}`;
    if (min) return `A partir de ${fmt(min)}`;
    if (max) return `Até ${fmt(max)}`;
    return 'N/A';
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const supabase = await createClient()
        const { data: { session } } = await supabase.auth.getSession()

        const { data: lead, error } = await supabase
            .from('leads')
            .insert({
                name: body.name,
                email: body.email,
                phone: body.phone,
                source: body.source || body.origem || 'website',
                status: body.status || 'new',
                ai_score: body.ai_score || 0,
                ai_priority: body.ai_priority || 'medium',
                development_id: body.development_id || null,
                interest_type: body.interest_type || body.interesse || null,
                interest_location: body.interest_location || body.localizacao || null,
                budget_min: body.budget_min != null ? body.budget_min : null,
                budget_max: body.budget_max != null && body.budget_max < 999999999 ? body.budget_max : null,
                notes: body.notes || null,
            })
            .select()
            .single()

        if (error) {
            console.error('Error creating lead:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // Audit log
        const meta = getRequestMeta(request)
        logAudit({
            user_id: session?.user?.id,
            action: 'create',
            entity_type: 'lead',
            entity_id: lead.id,
            new_data: { name: body.name, email: body.email, source: body.source },
            ...meta,
        })

        // Non-blocking auto-score calculation
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
        fetch(`${baseUrl}/api/ai/auto-score`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lead_id: lead.id }),
        }).catch(() => {}) // Fire-and-forget

        return NextResponse.json({ success: true, lead })
    } catch (error) {
        console.error('Error in POST /api/leads:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
