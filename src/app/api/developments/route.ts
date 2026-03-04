import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logAudit, getRequestMeta } from '@/lib/governance'

export const runtime = 'nodejs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'build-placeholder'

function getSupabase() {
    return createClient(supabaseUrl, supabaseServiceKey)
}

export async function GET(request: NextRequest) {
    try {
        const supabase = getSupabase()
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        // Single development fetch
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

        // List all developments
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

export async function POST(req: Request) {
    try {
        const supabase = getSupabase()
        const body = await req.json()

        const {
            name, type, location, address, developer, developer_id,
            area, bedrooms, bathrooms, parking, floor, features,
            priceMin, priceMax, pricePerSqm, totalUnits, availableUnits, deliveryDate,
            description, city, state, country, slug,
            images, gallery_images, floor_plans, brochure_url, image,
            video_url, video_short_url,
            status_comercial, is_highlighted, featured,
        } = body

        // Basic validation
        if (!name || !type) {
            return NextResponse.json({ error: 'Name and type are required' }, { status: 400 })
        }

        // Auto-generate slug
        const autoSlug = slug || name.toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '')

        const newDev: Record<string, any> = {
            name,
            slug: autoSlug,
            tipo: type,
            property_type: type,
            neighborhood: location,
            address,
            developer: developer || null,
            developer_id: developer_id || null,
            city: city || 'Recife',
            state: state || 'PE',
            country: country || 'Brasil',
            private_area: Number(area) || null,
            bedrooms: Number(bedrooms) || null,
            bathrooms: Number(bathrooms) || null,
            parking_spaces: Number(parking) || null,
            features: Array.isArray(features) ? features : [],
            price_min: Number(priceMin) || null,
            price_max: Number(priceMax) || null,
            price_per_sqm: Number(pricePerSqm) || null,
            units_count: Number(totalUnits) || null,
            available_units: Number(availableUnits) || null,
            delivery_date: deliveryDate ? new Date(deliveryDate).toISOString() : null,
            description: description || null,
            status: 'disponivel',
            status_comercial: status_comercial || 'active',
            is_highlighted: is_highlighted || false,
            featured: featured || false,
            image: image || null,
            images: images || null,
            gallery_images: gallery_images || [],
            floor_plans: floor_plans || [],
            brochure_url: brochure_url || null,
            video_url: video_url || null,
            video_short_url: video_short_url || null,
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

        // Audit log
        const meta = getRequestMeta(req)
        logAudit({
            action: 'create',
            entity_type: 'development',
            entity_id: data.id,
            new_data: { name, type, city: newDev.city },
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
        const body = await request.json()
        const { id, ...updates } = body

        if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

        const supabase = getSupabase()

        // Add updated_at timestamp
        updates.updated_at = new Date().toISOString()

        const { data, error } = await supabase
            .from('developments')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (error) {
            console.error('Supabase Error:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // Audit log
        const meta = getRequestMeta(request)
        logAudit({
            action: 'update',
            entity_type: 'development',
            entity_id: id,
            new_data: updates,
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
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

        const supabase = getSupabase()

        // Soft delete: set status_comercial to 'archived'
        const { data, error } = await supabase
            .from('developments')
            .update({
                status_comercial: 'archived',
                status: 'arquivado',
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .single()

        if (error) {
            console.error('Supabase Error:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // Audit log
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
