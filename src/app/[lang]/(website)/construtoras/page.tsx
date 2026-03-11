import { createClient } from '@/lib/supabase/server';
import ConstrutorasClient from './ConstrutorasClient';

export const dynamic = 'force-dynamic';

export default async function ConstrutorasPage({ params: { lang } }: { params: { lang: string } }) {
    const supabase = await createClient();

    // Fetch active developers — sem join relacional para evitar erro de schema cache
    const { data: developersData, error } = await supabase
        .from('developers')
        .select('id, name, slug, logo_url, website, city, state, description')
        .eq('is_active', true)
        .order('name', { ascending: true });

    if (error) {
        console.error('Falha ao buscar construtoras na pagina pública:', error.message);
    }

    // Contagem de empreendimentos por construtora — query separada e segura
    const countMap: Record<string, number> = {}
    try {
        const { data: devCounts } = await supabase
            .from('developments')
            .select('developer_id')
            .not('developer_id', 'is', null)
        devCounts?.forEach((d: { developer_id: string }) => {
            if (d.developer_id) countMap[d.developer_id] = (countMap[d.developer_id] || 0) + 1
        })
    } catch (_) { /* silencia se FK não existir */ }

    const developers = (developersData || []).map((dev) => ({
        id: dev.id,
        name: dev.name,
        slug: dev.slug || dev.name.toLowerCase().replace(/\s+/g, '-'),
        logo_url: dev.logo_url,
        website: dev.website,
        city: dev.city,
        state: dev.state,
        description: dev.description,
        development_count: countMap[dev.id] || 0,
    }));

    return (
        <ConstrutorasClient developers={developers} lang={lang || 'pt'} />
    );
}
