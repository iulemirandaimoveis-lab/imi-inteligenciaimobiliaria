import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logAudit, getRequestMeta } from '@/lib/governance'

export const runtime = 'nodejs'

async function getAuthenticatedSupabase() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { supabase: null, user: null }
    return { supabase, user }
}

export async function GET(request: NextRequest) {
    try {
        const { supabase, user } = await getAuthenticatedSupabase()
        if (!supabase || !user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (id) {
            const { data, error } = await supabase
                .from('developments')
                .select('*, developers(id, name, slug, logo_url, email, phone)')
                .eq('id', id)
                .single()

            if (error) {
                console.error('Supabase Error:', error)
                return NextResponse.json({ error: error.message }, { status: 500 })
            }
            if (!data) {
                return NextResponse.json({ error: 'Empreendimento não encontrado' }, { status: 404 })
            }
            return NextResponse.json(data)
        }

        const { data, error } = await supabase
            .from('developments')
            .select('*, developers(id, name, slug, logo_url)')
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Supabase Error:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }
        return NextResponse.json(data)
    } catch (error: any) {
        console.error('Error fetching developments:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

/**
 * Normalize field names from camelCase (form) to snake_case (DB).
 * Handles both naming conventions so forms can send either format.
 */
function normalizeFields(body: Record<string, any>): Record<string, any> {
    const result: Record<string, any> = {}

    // Direct mappings — camelCase form field → snake_case DB column
    const fieldMap: Record<string, string> = {
        priceMin: 'price_min',
        priceMax: 'price_max',
        pricePerSqm: 'price_per_sqm',
        totalUnits: 'units_count',
        availableUnits: 'available_units',
        deliveryDate: 'delivery_date',
        parking: 'parking_spaces',
        location: 'neighborhood',
        videoUrl: 'video_url',
        videoShort: 'video_short_url',
        floor: 'floor_count',
        // 'area' does not exist in DB — map to area_from (DB has area_from + area_to)
        area: 'area_from',
        areaFrom: 'area_from',
        areaTo: 'area_to',
    }

    for (const [key, value] of Object.entries(body)) {
        // Skip internal keys
        if (key === 'id') continue

        // Map camelCase to snake_case if mapping exists
        const dbKey = fieldMap[key] || key
        result[dbKey] = value
    }

    // Numeric conversions
    const numericFields = [
        'price_min', 'price_max', 'price_per_sqm',
        'units_count', 'available_units', 'bedrooms', 'bathrooms',
        'parking_spaces', 'private_area', 'floor_count',
        'total_units', 'area_from', 'area_to', 'total_area',
    ]
    for (const f of numericFields) {
        if (result[f] !== undefined && result[f] !== null && result[f] !== '') {
            result[f] = Number(result[f]) || null
        } else if (result[f] === '') {
            result[f] = null
        }
    }

    // Sync dual price columns (price_min/price_max ↔ price_from/price_to)
    if (result.price_min !== undefined) result.price_from = result.price_min
    if (result.price_max !== undefined) result.price_to = result.price_max

    // Sync area: if only area_from set (from single 'area' form field), mirror to area_to
    if (result.area_from !== undefined && result.area_from !== null && result.area_to === undefined) {
        result.area_to = result.area_from
    }

    // Sync dual status columns with proper value mapping
    // status_commercial (EN): draft, published, campaign, private, sold
    // status_comercial (PT): rascunho, publicado, campanha, privado
    const enToPt: Record<string, string> = { draft: 'rascunho', published: 'publicado', campaign: 'campanha', private: 'privado', sold: 'privado' }
    const ptToEn: Record<string, string> = { rascunho: 'draft', publicado: 'published', campanha: 'campaign', privado: 'private' }

    if (result.status_commercial !== undefined && result.status_comercial === undefined) {
        result.status_comercial = enToPt[result.status_commercial] || 'rascunho'
    }
    if (result.status_comercial !== undefined && result.status_commercial === undefined) {
        result.status_commercial = ptToEn[result.status_comercial] || 'draft'
    }

    // Type normalization — form sends 'Apartamento', DB constraints expect lowercase
    // tipo (PT): apartamento, casa, flat, lote, comercial, resort
    // type (EN): apartment, house, penthouse, studio, land, commercial, resort
    // property_type: apartment, house, commercial, land, mixed
    const typeToTipo: Record<string, string> = {
        'Apartamento': 'apartamento', 'Casa': 'casa', 'Cobertura': 'apartamento',
        'Studio': 'apartamento', 'Loft': 'flat', 'Terreno': 'lote',
        'Comercial': 'comercial', 'Flat': 'flat', 'Penthouse': 'apartamento',
        'Villa': 'casa', 'Empreendimento': 'apartamento',
    }
    const typeToEn: Record<string, string> = {
        'Apartamento': 'apartment', 'Casa': 'house', 'Cobertura': 'penthouse',
        'Studio': 'studio', 'Loft': 'studio', 'Terreno': 'land',
        'Comercial': 'commercial', 'Flat': 'apartment', 'Penthouse': 'penthouse',
        'Villa': 'house', 'Empreendimento': 'apartment',
    }
    const typeToPropType: Record<string, string> = {
        'Apartamento': 'apartment', 'Casa': 'house', 'Cobertura': 'apartment',
        'Studio': 'apartment', 'Loft': 'apartment', 'Terreno': 'land',
        'Comercial': 'commercial', 'Flat': 'apartment', 'Penthouse': 'apartment',
        'Villa': 'house', 'Empreendimento': 'mixed',
    }

    if (result.type && typeToTipo[result.type]) {
        // Form sends capitalized Portuguese, normalize to constraint values
        const formType = result.type
        result.tipo = typeToTipo[formType]
        result.type = typeToEn[formType]
        result.property_type = typeToPropType[formType]
    } else if (result.tipo && !typeToTipo[result.tipo]) {
        // Already lowercase, ensure type/property_type are set
        // (editar form sends tipo directly)
    }

    // Date handling
    if (result.delivery_date && typeof result.delivery_date === 'string' && !result.delivery_date.includes('T')) {
        result.delivery_date = new Date(result.delivery_date).toISOString()
    }

    // Array defaults
    if (result.features !== undefined && !Array.isArray(result.features)) {
        result.features = []
    }
    if (result.gallery_images !== undefined && !Array.isArray(result.gallery_images)) {
        result.gallery_images = []
    }
    if (result.floor_plans !== undefined && !Array.isArray(result.floor_plans)) {
        result.floor_plans = []
    }

    return result
}

export async function POST(req: Request) {
    try {
        const { supabase, user } = await getAuthenticatedSupabase()
        if (!supabase || !user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const body = await req.json()

        if (!body.name || !body.type) {
            return NextResponse.json({ error: 'Nome e tipo são obrigatórios' }, { status: 400 })
        }

        // Auto-generate slug
        const slug = body.slug || body.name.toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '')

        const normalized = normalizeFields(body)

        const newDev: Record<string, any> = {
            ...normalized,
            slug,
            city: normalized.city || 'Recife',
            state: normalized.state || 'PE',
            country: normalized.country || 'Brasil',
            status: normalized.status || 'disponivel',
            // Ensure status columns have valid defaults (respecting check constraints)
            status_comercial: normalized.status_comercial || 'rascunho',
            status_commercial: normalized.status_commercial || 'draft',
            is_highlighted: normalized.is_highlighted || false,
            featured: normalized.featured || false,
            created_by: user.id,
        }

        // Remove undefined/undeclared fields that could cause Supabase errors
        for (const key of Object.keys(newDev)) {
            if (newDev[key] === undefined) delete newDev[key]
        }

        const { data, error } = await supabase
            .from('developments')
            .insert(newDev)
            .select()
            .single()

        if (error) {
            console.error('Supabase Error:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        const meta = getRequestMeta(req)
        logAudit({
            action: 'create',
            entity_type: 'development',
            entity_id: data.id,
            new_data: { name: body.name, type: body.type, city: newDev.city },
            ...meta,
        })

        return NextResponse.json(data)
    } catch (error: any) {
        console.error('Error creating development:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function PUT(request: Request) {
    try {
        const { supabase, user } = await getAuthenticatedSupabase()
        if (!supabase || !user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const body = await request.json()
        const { id } = body

        if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

        const normalized = normalizeFields(body)

        // Ensure type fields stay in sync
        if (normalized.type || normalized.tipo || normalized.property_type) {
            const typeVal = normalized.type || normalized.tipo || normalized.property_type
            normalized.tipo = typeVal
            normalized.property_type = typeVal
        }

        normalized.updated_at = new Date().toISOString()
        normalized.updated_by = user.id

        // Remove undefined fields
        for (const key of Object.keys(normalized)) {
            if (normalized[key] === undefined) delete normalized[key]
        }

        const { data, error } = await supabase
            .from('developments')
            .update(normalized)
            .eq('id', id)
            .select()
            .single()

        if (error) {
            console.error('Supabase Error:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        const meta = getRequestMeta(request)
        logAudit({
            action: 'update',
            entity_type: 'development',
            entity_id: id,
            new_data: normalized,
            ...meta,
        })

        return NextResponse.json(data)
    } catch (error: any) {
        console.error('Error updating development:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function DELETE(request: Request) {
    try {
        const { supabase, user } = await getAuthenticatedSupabase()
        if (!supabase || !user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

        // Soft delete: archive in both status columns
        const { data, error } = await supabase
            .from('developments')
            .update({
                status_comercial: 'archived',
                status_commercial: 'archived',
                status: 'arquivado',
                updated_at: new Date().toISOString(),
                updated_by: user.id,
            })
            .eq('id', id)
            .select()
            .single()

        if (error) {
            console.error('Supabase Error:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        const meta = getRequestMeta(request)
        logAudit({
            action: 'delete',
            entity_type: 'development',
            entity_id: id,
            old_data: { name: data.name },
            ...meta,
        })

        return NextResponse.json({ success: true, data })
    } catch (error: any) {
        console.error('Error deleting development:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
