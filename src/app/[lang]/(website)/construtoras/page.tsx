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
        console.error('Falha ao buscar construtoras na pagina pública:', error.message);
    }

    // Mapear os dados para focar no contrato Frontend esperado
    const developers = (developersData || []).map((dev) => ({
        id: dev.id,
        name: dev.name,
        slug: dev.slug || dev.name.toLowerCase().replace(/\s+/g, '-'),
        logo_url: dev.logo_url,
        website: dev.website,
        city: dev.city,
        state: dev.state,
        description: dev.description,
        development_count: Array.isArray(dev.developments) ? dev.developments.length : 0,
    }));

    return (
        <ConstrutorasClient developers={developers} lang={lang || 'pt'} />
    );
}
