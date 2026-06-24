/**
 * Adaptador de MÍDIA do Digital Twin (Sprint 1 — FASE 1, correções de mídia).
 *
 * Wrapper SOMENTE LEITURA sobre o registro de `developments` (Supabase). Replica,
 * de forma isolada, a resolução de mídia da produção (fotos JSONB + colunas legadas,
 * dedup de vídeos, tour 360°) e adiciona resiliência: filtra URLs inválidas/vazias
 * para que a homologação nunca renderize mídia quebrada ("uploads inconsistentes").
 *
 * - Funções puras (testáveis em Jest/node).
 * - `loadDigitalTwinMedia` lê o registro via supabaseAdmin (read-only) no servidor.
 */

import type {
  DigitalTwinAmenityMedia,
  DigitalTwinMedia,
  DigitalTwinResolvedTour,
} from '@/types/digital-twin/media';

// ── URL helpers ────────────────────────────────────────────────────────────────

/** Aceita apenas URLs absolutas (http/https) ou raiz-relativas (`/...`). */
export function isRenderableUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const v = value.trim();
  return v.startsWith('http://') || v.startsWith('https://') || v.startsWith('/');
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter(isRenderableUrl) : [];
}

function dedupe(values: string[]): string[] {
  return [...new Set(values)];
}

// ── Vídeo (YouTube/Vimeo) ────────────────────────────────────────────────────

const YT_PATTERNS = [
  /youtube\.com\/watch\?(?:.*&)?v=([a-zA-Z0-9_-]{11})/,
  /youtu\.be\/([a-zA-Z0-9_-]{11})/,
  /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
];

export function getYouTubeId(url: string): string | null {
  for (const re of YT_PATTERNS) {
    const m = url.match(re);
    if (m) return m[1];
  }
  return null;
}

/** Miniatura do YouTube (ou null se não for YouTube). */
export function youTubeThumb(url: string): string | null {
  const id = getYouTubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
}

/** Normaliza qualquer URL de YouTube/Vimeo para forma embutível. */
export function normalizeVideoUrl(url: string): string {
  const yt = getYouTubeId(url);
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt}?rel=0&modestbranding=1`;
  const vimeo = url.match(/(?:vimeo\.com\/)(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return url;
}

/** Dedup de vídeos por ID do YouTube (ou pela própria URL). */
function dedupeVideos(urls: string[]): string[] {
  const seen = new Set<string>();
  return urls.filter((url) => {
    const key = getYouTubeId(url) ?? url;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ── Tour 360° (Kuula/Panoee) ────────────────────────────────────────────────

/**
 * Resolve como exibir o tour. Plataformas 360°/VR abrem melhor em aba dedicada.
 * Para Kuula, desliga auto-fullscreen (`fs=0`) e instruções (`inst=0`) — sem alterar
 * o restante da URL (a URL canônica do tour é IMUTÁVEL, ver ALTO_BELLEVUE_LOCATION).
 */
export function resolveTour(rawUrl: string | null | undefined): DigitalTwinResolvedTour | null {
  if (!isRenderableUrl(rawUrl)) return null;
  let host = '';
  try {
    host = new URL(rawUrl).hostname;
  } catch {
    return { url: rawUrl, external: false, host: '' };
  }
  const external = /(^|\.)tour\.panoee\.net$|(^|\.)kuula\.co$/i.test(host);
  if (!/(^|\.)kuula\.co$/i.test(host)) return { url: rawUrl, external, host };
  try {
    const u = new URL(rawUrl);
    u.searchParams.set('fs', '0');
    u.searchParams.set('inst', '0');
    return { url: u.toString(), external, host };
  } catch {
    return { url: rawUrl, external, host };
  }
}

// ── Áreas comuns ──────────────────────────────────────────────────────────────

interface RawAmenity {
  id?: string;
  title?: string | null;
  photos?: unknown;
  video?: unknown;
  tour360?: unknown;
}

function adaptAmenity(raw: RawAmenity): DigitalTwinAmenityMedia {
  return {
    id: raw.id ?? '',
    title: (raw.title ?? '').trim() || raw.id || 'Área comum',
    photos: asStringArray(raw.photos),
    video: isRenderableUrl(raw.video) ? raw.video : undefined,
    tour360: isRenderableUrl(raw.tour360) ? raw.tour360 : undefined,
  };
}

/** `true` se a área tem qualquer mídia exibível. */
export function hasAmenityMedia(a: DigitalTwinAmenityMedia): boolean {
  return a.photos.length > 0 || Boolean(a.video) || Boolean(a.tour360);
}

// ── Adapter principal ────────────────────────────────────────────────────────

interface RawImagesJson {
  main?: string | null;
  gallery?: unknown;
  videos?: unknown;
}

export interface RawDevelopmentMedia {
  image?: string | null;
  images?: RawImagesJson | null;
  gallery_images?: unknown;
  videos?: unknown;
  video_url?: string | null;
  video_short_url?: string | null;
  virtual_tour_url?: string | null;
  lot_map_amenities?: unknown;
}

/** Função pura: registro de `developments` → modelo de mídia do Digital Twin. */
export function adaptDevelopmentMedia(raw: RawDevelopmentMedia): DigitalTwinMedia {
  const imagesJson = raw.images ?? {};

  // Galeria: JSONB images.gallery + coluna legada gallery_images, deduplicadas.
  const gallery = dedupe([
    ...asStringArray(imagesJson.gallery),
    ...asStringArray(raw.gallery_images),
  ]);

  // Capa: images.main → primeira da galeria → coluna legada image.
  const main =
    (isRenderableUrl(imagesJson.main) && imagesJson.main) ||
    gallery[0] ||
    (isRenderableUrl(raw.image) ? raw.image : undefined) ||
    undefined;

  // Galeria final para exibição: capa primeiro, sem duplicar.
  const photos = dedupe([...(main ? [main] : []), ...gallery]);

  // Vídeos: images.videos (ou coluna videos) + video_url + video_short_url, dedup.
  const baseVideos = asStringArray(imagesJson.videos).length
    ? asStringArray(imagesJson.videos)
    : asStringArray(raw.videos);
  const extra = [raw.video_url, raw.video_short_url].filter(isRenderableUrl);
  const videos = dedupeVideos([...baseVideos, ...extra]);

  const virtualTourUrl = isRenderableUrl(raw.virtual_tour_url) ? raw.virtual_tour_url : undefined;

  const amenities = Array.isArray(raw.lot_map_amenities)
    ? (raw.lot_map_amenities as RawAmenity[]).map(adaptAmenity)
    : [];

  return { main, photos, videos, virtualTourUrl, amenities };
}

/** Loader de servidor — lê a mídia do empreendimento via supabaseAdmin (read-only). */
export async function loadDigitalTwinMedia(developmentId: string): Promise<DigitalTwinMedia> {
  const { supabaseAdmin } = await import('@/lib/supabase/admin');
  const { data } = await supabaseAdmin
    .from('developments')
    .select('image, images, gallery_images, videos, video_url, video_short_url, virtual_tour_url, lot_map_amenities')
    .eq('id', developmentId)
    .maybeSingle();
  return adaptDevelopmentMedia((data ?? {}) as RawDevelopmentMedia);
}
