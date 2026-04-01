import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { apiHandler, ApiContext } from '@/lib/api-helpers'
import { logAudit, getRequestMeta } from '@/lib/governance'
import { geocodeAddress } from '@/lib/geocode'

export const runtime = 'nodejs'

/**
 * Normalize field names from camelCase (form) to snake_case (DB).
 * Handles both naming conventions so forms can send either format.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeFields(body: Record<string, any>): Record<string, any> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: Record<string, any> = {}
    // Direct mappings — camelCase form field -> snake_case DB column
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
        // state_uf from edit form maps to 'state' in DB
        state_uf: 'state',
        stateUf: 'state',
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
    // Sync dual price columns (price_min/price_max <-> price_from/price_to)
    if (result.price_min !== undefined) result.price_from = result.price_min
    if (result.price_max !== undefined) result.price_to = result.price_max
    // Sync area: if only area_from set (from single 'area' form field), mirror to area_to
    if (result.area_from !== undefined && result.area_from !== null && result.area_to === undefined) {
        result.area_to = result.area_from
    }
    // Sync private_area <-> area_from (edit form sends private_area, detail page reads area_from)
    if (result.private_area !== undefined && result.private_area !== null && result.area_from === undefined) {
        result.area_from = result.private_area
    }
    if (result.area_from !== undefined && result.area_from !== null && result.private_area === undefined) {
        result.private_area = result.area_from
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

// ─── Zod schemas ────────────────────────────────────────────────────────────
const developmentPostSchema = z.object({
    name: z.string().min(1, 'Nome é obrigatório'),
    type: z.string().min(1, 'Tipo é obrigatório'),
}).passthrough()

const developmentPutSchema = z.object({
    id: z.string().uuid('ID inválido'),
}).passthrough()

const developmentPatchSchema = z.object({
    id: z.string().uuid('ID inválido'),
    status: z.string().min(1, 'Status é obrigatório'),
})

// ─── GET /api/developments ──────────────────────────────────────────────────
export const GET = apiHandler(null, async (request: NextRequest, _body: unknown, ctx: ApiContext) => {
    const { supabase } = ctx
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (id) {
        const { data, error } = await supabase
            .from('developments')
            .select('*')
            .eq('id', id)
            .single()
        if (error) {
            return NextResponse.json({ error: 'Erro ao buscar empreendimento' }, { status: 500 })
        }
        if (!data) {
            return NextResponse.json({ error: 'Empreendimento não encontrado' }, { status: 404 })
        }
        return NextResponse.json(data, {
            headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
        })
    }
    // Paginated list
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 250)
    const offset = (page - 1) * limit
    const { data, error, count } = await supabase
        .from('developments')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)
    if (error) {
        return NextResponse.json({ error: 'Erro ao buscar empreendimentos' }, { status: 500 })
    }
    return NextResponse.json({
        data: data || [],
        pagination: {
            page,
            limit,
            total: count || 0,
            pages: Math.ceil((count || 0) / limit),
        },
    }, {
        headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
    })
}, { auth: true })

// ─── POST /api/developments ─────────────────────────────────────────────────
export const POST = apiHandler(developmentPostSchema, async (req: NextRequest, body: z.infer<typeof developmentPostSchema>, ctx: ApiContext) => {
    const { supabase, user } = ctx
    // Auto-generate slug
    const slug = (body as any).slug || body.name.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
    const normalized = normalizeFields(body)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        created_by: user!.id,
    }
    // Auto-assign broker_id if not provided — find broker record for this user
    if (!newDev.broker_id) {
        const { data: broker } = await supabase
            .from('brokers')
            .select('id')
            .eq('user_id', user!.id)
            .maybeSingle()
        if (broker) newDev.broker_id = broker.id
    }
    // Sync images JSONB from flat fields (ensures slug page & getMainImage work)
    if (newDev.gallery_images || newDev.image) {
        const gallery = Array.isArray(newDev.gallery_images) ? newDev.gallery_images : []
        newDev.images = {
            main: newDev.image || gallery[0] || '',
            gallery,
            floorPlans: Array.isArray(newDev.floor_plans) ? newDev.floor_plans : [],
            videos: newDev.video_url ? [newDev.video_url] : [],
        }
    }
    // Remove undefined/undeclared fields that could cause Supabase errors
    for (const key of Object.keys(newDev)) {
        if (newDev[key] === undefined) delete newDev[key]
    }
    // Auto-geocode if address exists but lat/lng missing
    if (!newDev.lat && (newDev.address || newDev.neighborhood || newDev.city)) {
        const geo = await geocodeAddress(newDev.address, newDev.neighborhood, newDev.city, newDev.state, newDev.country)
        if (geo) {
            newDev.lat = geo.lat
            newDev.lng = geo.lng
        }
    }
    const { data, error } = await supabase
        .from('developments')
        .insert(newDev)
        .select()
        .single()
    if (error) {
        console.error('[API] developments.create error:', error)
        return NextResponse.json({ error: 'Erro ao criar empreendimento' }, { status: 500 })
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
}, { auth: true, auditAction: 'development.create' })

// ─── PUT /api/developments ──────────────────────────────────────────────────
export const PUT = apiHandler(developmentPutSchema, async (request: NextRequest, body: z.infer<typeof developmentPutSchema>, ctx: ApiContext) => {
    const { supabase, user } = ctx
    const { id } = body
    if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })
    const normalized = normalizeFields(body)
    // Ensure type fields stay in sync (only if normalizeFields didn't already handle it)
    if (normalized.type && !normalized.tipo) {
        const enToPt: Record<string, string> = {
            apartment: 'apartamento', house: 'casa', penthouse: 'apartamento',
            studio: 'apartamento', land: 'lote', commercial: 'comercial',
            resort: 'resort', flat: 'flat',
        }
        const enToPropType: Record<string, string> = {
            apartment: 'apartment', house: 'house', penthouse: 'apartment',
            studio: 'apartment', land: 'land', commercial: 'commercial',
            resort: 'mixed', flat: 'apartment',
        }
        normalized.tipo = enToPt[normalized.type] || normalized.type
        normalized.property_type = enToPropType[normalized.type] || normalized.type
    } else if (normalized.tipo && !normalized.type) {
        const ptToEn: Record<string, string> = {
            apartamento: 'apartment', casa: 'house', flat: 'apartment',
            lote: 'land', comercial: 'commercial', resort: 'resort',
        }
        normalized.type = ptToEn[normalized.tipo] || normalized.tipo
        normalized.property_type = ptToEn[normalized.tipo] || 'mixed'
    }
    normalized.updated_at = new Date().toISOString()
    normalized.updated_by = user!.id
    // Sync images JSONB from flat fields on update too
    if (normalized.gallery_images || normalized.image) {
        const gallery = Array.isArray(normalized.gallery_images) ? normalized.gallery_images : []
        normalized.images = {
            main: normalized.image || gallery[0] || '',
            gallery,
            floorPlans: Array.isArray(normalized.floor_plans) ? normalized.floor_plans : [],
            videos: normalized.video_url ? [normalized.video_url] : [],
        }
    }
    // Remove undefined fields
    for (const key of Object.keys(normalized)) {
        if (normalized[key] === undefined) delete normalized[key]
    }
    // Auto-geocode on update if address/neighborhood changed but lat/lng not provided
    if (!normalized.lat && (normalized.address || normalized.neighborhood || normalized.city)) {
        const geo = await geocodeAddress(normalized.address, normalized.neighborhood, normalized.city, normalized.state, normalized.country)
        if (geo) {
            normalized.lat = geo.lat
            normalized.lng = geo.lng
        }
    }
    const { data, error } = await supabase
        .from('developments')
        .update(normalized)
        .eq('id', id)
        .select()
        .single()
    if (error) {
        console.error('[API] developments.update error:', error)
        return NextResponse.json({ error: 'Erro ao atualizar empreendimento' }, { status: 500 })
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
}, { auth: true, auditAction: 'development.update' })

// ─── PATCH /api/developments ────────────────────────────────────────────────
export const PATCH = apiHandler(developmentPatchSchema, async (request: NextRequest, body: z.infer<typeof developmentPatchSchema>, ctx: ApiContext) => {
    const { supabase, user } = ctx
    const { id, status } = body
    // Map frontend status -> dual DB columns
    const statusMap: Record<string, { comercial: string; commercial: string; appStatus: string }> = {
        disponivel:    { comercial: 'publicado',  commercial: 'published', appStatus: 'disponivel' },
        vendido:       { comercial: 'privado',    commercial: 'sold',      appStatus: 'vendido' },
        reservado:     { comercial: 'publicado',  commercial: 'published', appStatus: 'reservado' },
        em_negociacao: { comercial: 'publicado',  commercial: 'published', appStatus: 'em_negociacao' },
        lancamento:    { comercial: 'publicado',  commercial: 'published', appStatus: 'lancamento' },
        arquivado:     { comercial: 'privado',    commercial: 'private',   appStatus: 'arquivado' },
    }
    const mapped = statusMap[status]
    if (!mapped) {
        return NextResponse.json({ error: `Status inválido: ${status}` }, { status: 400 })
    }
    const updateData = {
        status: mapped.appStatus,
        status_comercial: mapped.comercial,
        status_commercial: mapped.commercial,
        updated_at: new Date().toISOString(),
        updated_by: user!.id,
    }
    const { data, error } = await supabase
        .from('developments')
        .update(updateData)
        .eq('id', id)
        .select('id, name, status, status_comercial, status_commercial')
        .single()
    if (error) {
        console.error('[API] developments.status_change error:', error)
        return NextResponse.json({ error: 'Erro ao alterar status' }, { status: 500 })
    }
    const meta = getRequestMeta(request)
    logAudit({
        action: 'status_change',
        entity_type: 'development',
        entity_id: id,
        new_data: { requested_status: status, ...updateData },
        ...meta,
    })
    return NextResponse.json({ success: true, data })
}, { auth: true, auditAction: 'development.status_change' })

// ─── DELETE /api/developments ───────────────────────────────────────────────
export const DELETE = apiHandler(null, async (request: NextRequest, _body: unknown, ctx: ApiContext) => {
    const { supabase, user } = ctx
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })
    // Soft delete: set to private (constraint-safe)
    const { data, error } = await supabase
        .from('developments')
        .update({
            status_comercial: 'privado',
            status_commercial: 'private',
            updated_at: new Date().toISOString(),
            updated_by: user!.id,
        })
        .eq('id', id)
        .select()
        .single()
    if (error) {
        console.error('[API] developments.delete error:', error)
        return NextResponse.json({ error: 'Erro ao excluir empreendimento' }, { status: 500 })
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
}, { auth: true, auditAction: 'development.delete' })
