import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase/admin'
import RentalDetailClient from './RentalDetailClient'

export const dynamic = 'force-dynamic'

interface PageProps {
    params: { lang: string; id: string }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { data } = await supabaseAdmin
        .from('rental_properties')
        .select('name, address, daily_rate, monthly_rate, photos')
        .eq('id', params.id)
        .eq('status', 'active')
        .single()

    if (!data) return { title: 'Imóvel não encontrado | IMI' }

    const price = data.daily_rate
        ? `R$ ${data.daily_rate}/dia`
        : data.monthly_rate ? `R$ ${data.monthly_rate}/mês` : ''

    return {
        title: `${data.name} ${price ? `- ${price}` : ''} | IMI`,
        description: `${data.name}${data.address ? ` - ${data.address}` : ''}. Aluguel de temporada e locação.`,
        openGraph: {
            title: data.name,
            description: data.address || 'Imóvel para locação',
            images: data.photos?.[0] ? [{ url: data.photos[0], width: 1200, height: 630 }] : [],
        },
    }
}

export default async function RentalDetailPage({ params }: PageProps) {
    const { data: property } = await supabaseAdmin
        .from('rental_properties')
        .select('*')
        .eq('id', params.id)
        .eq('status', 'active')
        .single()

    if (!property) notFound()

    const today = new Date().toISOString().split('T')[0]
    const { data: bookings } = await supabaseAdmin
        .from('rental_bookings')
        .select('check_in, check_out')
        .eq('property_id', property.id)
        .in('status', ['confirmed', 'checked_in'])
        .gte('check_out', today)

    return (
        <RentalDetailClient
            property={property}
            bookedDates={bookings || []}
            lang={params.lang || 'pt'}
        />
    )
}
