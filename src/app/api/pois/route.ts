import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { POI_CONFIG, type POICategory, type ConvenienceData, type POICategoryResult, type POIItem } from '@/types/poi';

export const runtime = 'nodejs';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// Google Places type mapping
const GOOGLE_TYPE_MAP: Record<string, string> = {
    supermarket: 'supermarket',
    restaurant: 'restaurant',
    hospital: 'hospital',
    pharmacy: 'pharmacy',
    gas_station: 'gas_station',
    shopping_mall: 'shopping_mall',
    park: 'park',
    beach: 'natural_feature',
    gym: 'gym',
    school: 'school',
    bank: 'bank',
    airport: 'airport',
};

function calculateScore(
    results: { found: boolean; distance: number; weight: number }[],
): number {
    let totalWeight = 0;
    let earnedPoints = 0;
    for (const r of results) {
        totalWeight += r.weight;
        if (r.found) {
            const penalty = Math.min(r.distance / 5000, 1);
            earnedPoints += r.weight * (1 - penalty * 0.5);
        }
    }
    return totalWeight > 0 ? Math.round((earnedPoints / totalWeight) * 100) : 0;
}

function getScoreLabel(score: number): ConvenienceData['score_label'] {
    if (score >= 85) return 'Excelente';
    if (score >= 70) return 'Ótimo';
    if (score >= 55) return 'Bom';
    if (score >= 40) return 'Regular';
    return 'Limitado';
}

async function fetchNearbyPOIs(
    lat: number,
    lng: number,
    category: string,
    radius: number,
): Promise<POIItem[]> {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) return [];

    const googleType = GOOGLE_TYPE_MAP[category] || category;
    const params = new URLSearchParams({
        location: `${lat},${lng}`,
        radius: String(radius),
        type: googleType,
        key: apiKey,
        language: 'pt-BR',
    });

    try {
        const res = await fetch(
            `https://maps.googleapis.com/maps/api/place/nearbysearch/json?${params}`,
            { next: { revalidate: 604800 } },
        );
        if (!res.ok) return [];
        const data = await res.json();
        if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') return [];

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (data.results || []).slice(0, 3).map((place: any) => {
            const dlat = (place.geometry.location.lat - lat) * 111000;
            const dlng =
                (place.geometry.location.lng - lng) *
                111000 *
                Math.cos((lat * Math.PI) / 180);
            const distance = Math.round(Math.sqrt(dlat * dlat + dlng * dlng));
            return {
                name: place.name,
                category: category as POICategory,
                distance_meters: distance,
                rating: place.rating,
                address: place.vicinity,
                place_id: place.place_id,
            } satisfies POIItem;
        });
    } catch {
        return [];
    }
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get('lat') || '');
    const lng = parseFloat(searchParams.get('lng') || '');
    const developmentId = searchParams.get('id') || '';
    const imovelType = (searchParams.get('type') || 'residencial') as keyof typeof POI_CONFIG;

    if (isNaN(lat) || isNaN(lng) || !developmentId) {
        return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 });
    }
    if (lat === 0 && lng === 0) {
        return NextResponse.json({ error: 'Coordenadas inválidas' }, { status: 400 });
    }

    // Check Supabase cache (only if service role key is available)
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        try {
            const { data: cached } = await supabase
                .from('poi_cache')
                .select('pois')
                .eq('development_id', developmentId)
                .eq('category', imovelType)
                .gt('expires_at', new Date().toISOString())
                .maybeSingle();

            if (cached?.pois) {
                return NextResponse.json(cached.pois as ConvenienceData);
            }
        } catch {
            // Cache miss — continue to Google Places
        }
    }

    const config = POI_CONFIG[imovelType] ?? POI_CONFIG.residencial;

    // Fetch all POI categories in parallel
    const settled = await Promise.allSettled(
        config.map((cat) => fetchNearbyPOIs(lat, lng, cat.category, cat.radius)),
    );

    const categoryResults: POICategoryResult[] = [];
    const scoreInputs: { found: boolean; distance: number; weight: number }[] = [];

    for (let i = 0; i < config.length; i++) {
        const cat = config[i];
        const items: POIItem[] = settled[i].status === 'fulfilled' ? settled[i].value : [];
        const nearest = items.length > 0 ? Math.min(...items.map((p) => p.distance_meters)) : 0;

        categoryResults.push({
            category: cat.category,
            label: cat.label,
            icon: cat.icon,
            color: cat.color,
            items,
            nearest_distance_meters: nearest,
        });

        scoreInputs.push({
            found: items.length > 0,
            distance: nearest || 9999,
            weight: cat.weight,
        });
    }

    const score = calculateScore(scoreInputs);
    const convenienceData: ConvenienceData = {
        development_id: developmentId,
        score,
        score_label: getScoreLabel(score),
        categories: categoryResults,
        cached_at: new Date().toISOString(),
    };

    // Persist to cache (best-effort)
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        supabase
            .from('poi_cache')
            .upsert({
                development_id: developmentId,
                category: imovelType,
                pois: convenienceData,
                convenience_score: score,
                cached_at: new Date().toISOString(),
                expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            })
            .then(({ error }) => {
                if (error) console.warn('[POI cache] upsert failed:', error.message);
            });
    }

    return NextResponse.json(convenienceData);
}
