import { createClient } from '@/lib/supabase/server';
import ConstrutorasClient from './ConstrutorasClient';
export const dynamic = 'force-dynamic';
export default async function ConstrutorasPage({ params: { lang } }: { params: { lang: string } }) {
    const supabase = await createClient();
    // Fetch active developers with their developments count
    const { data: developersData, error } = await supabase
        .from('developers')
        .select(`
            id,
            name,
            slug,
            logo_url,
            website,
            city,
            state,
            description,
            developments (count),
            is_active
        `)
        .eq('is_active', true)
        .order('name', { ascending: true });
    if (error) {
        console.error('[Construtoras] Fetch error:', error.message)
    }
    // Mapear os dados para focar no contrato Frontend esperado
    const developers = (developersData || []).map((dev) => {
        // Supabase count aggregation returns [{count: N}], not an array of items
        let devCount = 0
        if (Array.isArray(dev.developments) && dev.developments.length > 0) {
            const first = dev.developments[0] as { count?: number }
            devCount = first?.count ?? dev.developments.length
        }
        return {
            id: dev.id,
            name: dev.name ?? 'Construtora',
            slug: dev.slug || (dev.name ?? 'construtora').toLowerCase().replace(/\s+/g, '-'),
            logo_url: dev.logo_url,
            website: dev.website,
            city: dev.city,
            state: dev.state,
            description: dev.description,
            development_count: devCount,
        }
    });
    return (
        <ConstrutorasClient developers={developers} lang={lang || 'pt'} />
    );
}
