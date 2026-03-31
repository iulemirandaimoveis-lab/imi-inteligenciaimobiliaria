import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
export async function GET() {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        const { data, error } = await supabase
            .from('brokers')
            .select('*')
            .neq('status', 'inactive')
            .order('name', { ascending: true })
        if (error) throw error
        return NextResponse.json({ data: data || [] }, {
            headers: { 'Cache-Control': 'private, s-maxage=60, stale-while-revalidate=300' },
        })
    } catch (err) {
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal Server Error' }, { status: 500 })
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

        const cleanEmail = email.trim().toLowerCase()

        // Check if broker already exists
        const { data: existingBroker } = await supabaseAdmin
            .from('brokers')
            .select('id')
            .eq('email', cleanEmail)
            .maybeSingle()
        if (existingBroker) {
            return NextResponse.json({ error: 'Já existe um membro com este email' }, { status: 409 })
        }

        // Generate temp password
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
        let tempPw = ''
        for (let i = 0; i < 12; i++) tempPw += chars.charAt(Math.floor(Math.random() * chars.length))

        // Create auth user
        const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
            email: cleanEmail,
            password: tempPw,
            email_confirm: true,
            user_metadata: { full_name: name.trim(), must_change_password: true },
        })
        if (authErr) {
            return NextResponse.json({ error: authErr.message }, { status: 400 })
        }
        const userId = authData.user.id

        // Create broker record
        const { data, error } = await supabaseAdmin
            .from('brokers')
            .insert({
                user_id: userId,
                name: name.trim(),
                email: cleanEmail,
                phone: phone?.trim() || null,
                role: role || 'broker',
                status: status || 'active',
                permissions: ['dashboard', 'imoveis', 'leads', 'agenda', 'avaliacoes', 'financeiro', 'contratos'],
                created_by: user.id,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .select()
            .single()
        if (error) {
            // Rollback auth user
            await supabaseAdmin.auth.admin.deleteUser(userId)
            throw error
        }

        // Sync to profiles
        await supabaseAdmin.from('profiles').upsert({
            id: userId, email: cleanEmail, name: name.trim(),
            role: role === 'broker_manager' ? 'admin' : 'corretor',
            created_at: new Date().toISOString(),
        }, { onConflict: 'id' })

        return NextResponse.json({ ...data, temp_password: tempPw }, { status: 201 })
    } catch (err) {
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal Server Error' }, { status: 500 })
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
        const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
        if (name !== undefined) updates.name = name.trim()
        if (email !== undefined) updates.email = email.trim().toLowerCase()
        if (phone !== undefined) updates.phone = phone?.trim() || null
        if (role !== undefined) updates.role = role
        if (status !== undefined) updates.status = status
        const { data, error } = await supabase
            .from('brokers')
            .update(updates)
            .eq('id', id)
            .select()
            .single()
        if (error) throw error
        return NextResponse.json(data)
    } catch (err) {
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal Server Error' }, { status: 500 })
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

        // Fetch broker to get user_id before deleting
        const { data: broker } = await supabaseAdmin
            .from('brokers')
            .select('user_id')
            .eq('id', id)
            .maybeSingle()

        // Prevent self-deletion
        if (broker?.user_id === user.id) {
            return NextResponse.json({ error: 'Não é possível excluir o próprio usuário' }, { status: 400 })
        }

        // Delete broker record
        const { error } = await supabaseAdmin
            .from('brokers')
            .delete()
            .eq('id', id)
        if (error) throw error

        // Delete profile record
        if (broker?.user_id) {
            await supabaseAdmin.from('profiles').delete().eq('id', broker.user_id)
            // Delete auth user
            await supabaseAdmin.auth.admin.deleteUser(broker.user_id)
        }

        return NextResponse.json({ success: true })
    } catch (err) {
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal Server Error' }, { status: 500 })
    }
}
