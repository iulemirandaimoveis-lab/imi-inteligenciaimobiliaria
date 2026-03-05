import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/playbooks            → list all playbooks
// GET /api/playbooks?id=xxx     → single playbook
// GET /api/playbooks?niche=xxx  → filter by niche
// GET /api/playbooks?active=true → filter by active status
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')
        const niche = searchParams.get('niche')
        const active = searchParams.get('active')

        if (id) {
            const { data, error } = await supabase
                .from('niche_playbooks')
                .select('*')
                .eq('id', id)
                .single()

            if (error) return NextResponse.json({ error: error.message }, { status: 500 })
            return NextResponse.json(data)
        }

        let query = supabase
            .from('niche_playbooks')
            .select('*')
            .order('updated_at', { ascending: false })

        if (niche) query = query.eq('niche', niche)
        if (active !== null && active !== undefined) {
            query = query.eq('is_active', active === 'true')
        }

        const { data, error } = await query
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ data: data || [] })
    } catch (err: unknown) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

// POST /api/playbooks → create playbook
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const body = await request.json()

        if (!body.name) return NextResponse.json({ error: 'name obrigatório' }, { status: 400 })
        if (!body.niche) return NextResponse.json({ error: 'niche obrigatório' }, { status: 400 })

        // Auto-generate slug from name if not provided
        const slug = body.slug ||
            body.name.toLowerCase()
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                .replace(/\s+/g, '-')
                .replace(/[^a-z0-9-]/g, '')

        const { data, error } = await supabase
            .from('niche_playbooks')
            .insert({
                name: body.name,
                niche: body.niche,
                slug,
                default_language: body.default_language || null,
                typical_audiences: body.typical_audiences || null,
                legal_restrictions: body.legal_restrictions || null,
                campaign_templates: body.campaign_templates || null,
                content_guidelines: body.content_guidelines || null,
                crm_scripts: body.crm_scripts || null,
                whatsapp_templates: body.whatsapp_templates || null,
                email_templates: body.email_templates || null,
                is_active: true,
                version: 1,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .select()
            .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ data }, { status: 201 })
    } catch (err: unknown) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

// PATCH /api/playbooks → update playbook fields
export async function PATCH(request: NextRequest) {
    try {
        const supabase = await createClient()
        const body = await request.json()
        const { id, ...updates } = body

        if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

        updates.updated_at = new Date().toISOString()

        const { data, error } = await supabase
            .from('niche_playbooks')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ data })
    } catch (err: unknown) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

// DELETE /api/playbooks?id=xxx → soft delete (is_active = false)
export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

        const { data, error } = await supabase
            .from('niche_playbooks')
            .update({ is_active: false, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ success: true, data })
    } catch (err: unknown) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
