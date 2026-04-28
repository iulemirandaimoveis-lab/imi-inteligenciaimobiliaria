import { NextRequest, NextResponse } from 'next/server';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { POI_CONFIG, type POICategory, type ConvenienceData, type POICategoryResult, type POIItem } from '@/types/poi';
import { fetchNearbyPOIs as fetchOSMPOIs, type POI as OSMPOI } from '@/lib/poi-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _supabase: SupabaseClient<any, any, any> | null = null;
function getSupabase() {
    if (!_supabase) {
        _supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
        );
    }
    return _supabase;
}

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

// OSM element type → POICategory (derived from OSM tag values)
const OSM_TYPE_TO_CATEGORY: Partial<Record<string, POICategory>> = {
    hospital: 'hospital',
    pharmacy: 'pharmacy',
    school: 'school',
    university: 'school',
    supermarket: 'supermarket',
    mall: 'shopping_mall',
    restaurant: 'restaurant',
    cafe: 'restaurant',
    park: 'park',
    cinema: 'park',
    bus_station: 'gas_station',
    station: 'gas_station',
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

async function fetchGooglePOIs(
    lat: number,
    lng: number,
    category: string,
    radius: number,
): Promise<POIItem[]> {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
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

function buildFromOSM(
    osmPois: OSMPOI[],
    config: (typeof POI_CONFIG)[string],
): { categoryResults: POICategoryResult[]; scoreInputs: { found: boolean; distance: number; weight: number }[] } {
    const categoryResults: POICategoryResult[] = [];
    const scoreInputs: { found: boolean; distance: number; weight: number }[] = [];

    for (const cat of config) {
        const items: POIItem[] = osmPois
            .filter((poi) => OSM_TYPE_TO_CATEGORY[poi.type] === cat.category)
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 3)
            .map((poi) => ({
                name: poi.name,
                category: cat.category,
                distance_meters: poi.distance,
                place_id: `osm-${poi.id}`,
            }));

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

    return { categoryResults, scoreInputs };
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

    // Check Supabase cache — only serve if score > 0 (avoids serving stale empty results)
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        try {
            const { data: cached } = await getSupabase()
                .from('poi_cache')
                .select('pois')
                .eq('development_id', developmentId)
                .eq('category', imovelType)
                .gt('expires_at', new Date().toISOString())
                .maybeSingle();

            const cachedData = cached?.pois as ConvenienceData | undefined;
            if (cachedData && cachedData.score > 0) {
                return NextResponse.json(cachedData);
            }
        } catch {
            // Cache miss — continue to fetching
        }
    }

    const config = POI_CONFIG[imovelType] ?? POI_CONFIG.residencial;

    // Try Google Places first
    const settled = await Promise.allSettled(
        config.map((cat) => fetchGooglePOIs(lat, lng, cat.category, cat.radius)),
    );

    let categoryResults: POICategoryResult[] = [];
    let scoreInputs: { found: boolean; distance: number; weight: number }[] = [];

    for (let i = 0; i < config.length; i++) {
        const cat = config[i];
        const items: POIItem[] = settled[i].status === 'fulfilled' ? (settled[i] as PromiseFulfilledResult<POIItem[]>).value : [];
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

    let score = calculateScore(scoreInputs);

    // OSM/Overpass fallback — when Google Places returns no usable data
    if (score === 0) {
        try {
            const osmResult = await fetchOSMPOIs(lat, lng, 1500);
            if (osmResult.pois.length > 0) {
                const osm = buildFromOSM(osmResult.pois, config);
                categoryResults = osm.categoryResults;
                scoreInputs = osm.scoreInputs;
                score = calculateScore(osm.scoreInputs);
            }
        } catch {
            // OSM also failed — return empty (POIGrid will hide the section)
        }
    }

    const convenienceData: ConvenienceData = {
        development_id: developmentId,
        score,
        score_label: getScoreLabel(score),
        categories: categoryResults,
        cached_at: new Date().toISOString(),
    };

    // Persist to cache only when we have real data (score > 0)
    if (score > 0 && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        getSupabase()
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
