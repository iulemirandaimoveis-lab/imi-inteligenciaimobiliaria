import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'build-placeholder'
)

// GET /api/permissions?role=admin  → returns all permissions for role
// GET /api/permissions?role=agent&module=leads&action=create → checks specific
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const role = searchParams.get('role')
        const module = searchParams.get('module')
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

        if (module && action) {
            // Check specific permission
            const { data } = await supabase
                .from('role_permissions')
                .select('allowed')
                .eq('role', role)
                .eq('module', module)
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

    } catch (err: any) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

// PUT /api/permissions — update a permission
export async function PUT(request: Request) {
    try {
        const body = await request.json()
        const { role, module, action, allowed } = body

        if (!role || !module || !action || typeof allowed !== 'boolean') {
            return NextResponse.json({ error: 'role, module, action, allowed required' }, { status: 400 })
        }

        const { data, error } = await supabase
            .from('role_permissions')
            .upsert({
                role,
                module,
                action,
                allowed,
            }, { onConflict: 'role,module,action' })
            .select()
            .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json(data)

    } catch (err: any) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
