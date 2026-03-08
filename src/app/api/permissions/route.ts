import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/permissions              → all permissions
// GET /api/permissions?role=admin   → all for role
// GET /api/permissions?role=agent&module=leads&action=create → specific check
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

        const { searchParams } = new URL(request.url)
        const role = searchParams.get('role')
        const moduleName = searchParams.get('module')
        const action = searchParams.get('action')

        if (!role) {
            // Return all permissions grouped by role
            const { data, error } = await supabase
                .from('role_permissions')
                .select('*')
                .order('role')
                .order('module')

            if (error) return NextResponse.json({ error: error.message }, { status: 500 })
            return NextResponse.json(data || [])
        }

        if (moduleName && action) {
            // Check specific permission
            const { data } = await supabase
                .from('role_permissions')
                .select('allowed')
                .eq('role', role)
                .eq('module', moduleName)
                .eq('action', action)
                .single()

            return NextResponse.json({ allowed: data?.allowed ?? false })
        }

        // Return all permissions for a role
        const { data, error } = await supabase
            .from('role_permissions')
            .select('*')
            .eq('role', role)
            .order('module')

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json(data || [])

    } catch (err: unknown) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

// POST /api/permissions — create a permission (upsert if already exists)
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

        const body = await request.json()
        const { role, module: moduleName, action, allowed } = body

        if (!role || !moduleName || !action || typeof allowed !== 'boolean') {
            return NextResponse.json({ error: 'role, module, action, allowed required' }, { status: 400 })
        }

        const { data, error } = await supabase
            .from('role_permissions')
            .upsert({ role, module: moduleName, action, allowed }, { onConflict: 'role,module,action' })
            .select()
            .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json(data, { status: 201 })

    } catch (err: unknown) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

// PUT /api/permissions — update a permission (upsert)
export async function PUT(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

        const body = await request.json()
        const { role, module: moduleName, action, allowed } = body

        if (!role || !moduleName || !action || typeof allowed !== 'boolean') {
            return NextResponse.json({ error: 'role, module, action, allowed required' }, { status: 400 })
        }

        const { data, error } = await supabase
            .from('role_permissions')
            .upsert({ role, module: moduleName, action, allowed }, { onConflict: 'role,module,action' })
            .select()
            .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json(data)

    } catch (err: unknown) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

// DELETE /api/permissions?role=xxx&module=yyy&action=zzz  → remove permission
// DELETE /api/permissions?id=xxx                           → remove by id
export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')
        const role = searchParams.get('role')
        const moduleName = searchParams.get('module')
        const action = searchParams.get('action')

        if (id) {
            const { error } = await supabase
                .from('role_permissions')
                .delete()
                .eq('id', id)

            if (error) return NextResponse.json({ error: error.message }, { status: 500 })
            return NextResponse.json({ success: true })
        }

        if (role && moduleName && action) {
            const { error } = await supabase
                .from('role_permissions')
                .delete()
                .eq('role', role)
                .eq('module', moduleName)
                .eq('action', action)

            if (error) return NextResponse.json({ error: error.message }, { status: 500 })
            return NextResponse.json({ success: true })
        }

        return NextResponse.json({ error: 'id OR (role + module + action) required' }, { status: 400 })

    } catch (err: unknown) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
