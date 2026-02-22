import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function GET() {
    try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey)
        const { data, error } = await supabase
            .from('developments')
            .select('*')
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
        const supabase = createClient(supabaseUrl, supabaseServiceKey)
        const body = await req.json()

        const {
            name, type, location, address, developer,
            area, bedrooms, bathrooms, parking, floor, features,
            priceMin, priceMax, pricePerSqm, totalUnits, availableUnits, deliveryDate
        } = body

        // Some basic validation
        if (!name || !type) {
            return NextResponse.json({ error: 'Name and type are required' }, { status: 400 })
        }

        const newDev = {
            name,
            type: type,
            neighborhood: location,
            address,
            developer,
            private_area: Number(area) || null,
            bedrooms: Number(bedrooms) || null,
            bathrooms: Number(bathrooms) || null,
            parking_spaces: Number(parking) || null,
            features: Array.isArray(features) ? features : [],
            price_min: Number(priceMin) || null,
            price_max: Number(priceMax) || null,
            price_per_sqm: Number(pricePerSqm) || null,
            total_units: Number(totalUnits) || null,
            available_units: Number(availableUnits) || null,
            delivery_date: deliveryDate ? new Date(deliveryDate).toISOString() : null,
            status: 'disponivel',
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

        return NextResponse.json(data)
    } catch (error: any) {
        console.error('Error creating development:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
