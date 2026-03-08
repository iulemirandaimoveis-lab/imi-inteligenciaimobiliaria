import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

        const { data, error } = await supabase
            .from('team_members')
            .select('*')
            .neq('status', 'inactive')
            .order('name', { ascending: true })

        if (error) throw error
        return NextResponse.json({ data: data || [] })
    } catch (err: any) {
        console.error('GET /api/equipe:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

        const body = await request.json()
        const { name, email, phone, role, status } = body

        if (!name?.trim() || !email?.trim()) {
            return NextResponse.json({ error: 'name e email são obrigatórios' }, { status: 400 })
        }

        const { data, error } = await supabase
            .from('team_members')
            .insert({
                name: name.trim(),
                email: email.trim().toLowerCase(),
                phone: phone?.trim() || null,
                role: role || 'agent',
                status: status || 'active',
                joined_at: new Date().toISOString(),
                total_leads: 0,
                total_sales: 0,
                total_revenue: 0,
            })
            .select()
            .single()

        if (error) throw error
        return NextResponse.json(data, { status: 201 })
    } catch (err: any) {
        console.error('POST /api/equipe:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

export async function PATCH(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

        const body = await request.json()
        const { id, name, email, phone, role, status } = body

        if (!id) {
            return NextResponse.json({ error: 'id é obrigatório' }, { status: 400 })
        }

        const updates: Record<string, any> = { updated_at: new Date().toISOString() }
        if (name !== undefined) updates.name = name.trim()
        if (email !== undefined) updates.email = email.trim().toLowerCase()
        if (phone !== undefined) updates.phone = phone?.trim() || null
        if (role !== undefined) updates.role = role
        if (status !== undefined) updates.status = status

        const { data, error } = await supabase
            .from('team_members')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return NextResponse.json(data)
    } catch (err: any) {
        console.error('PATCH /api/equipe:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

export async function DELETE(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json({ error: 'id é obrigatório' }, { status: 400 })
        }

        const { error } = await supabase
            .from('team_members')
            .update({ status: 'inactive', updated_at: new Date().toISOString() })
            .eq('id', id)

        if (error) throw error
        return NextResponse.json({ success: true })
    } catch (err: any) {
        console.error('DELETE /api/equipe:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
