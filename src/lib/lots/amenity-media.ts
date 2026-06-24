/**
 * amenity-media.ts — Resolução pura da mídia/conteúdo editorial de uma área comum.
 *
 * Extraído de AltoBellevuePlanView para ser testável sem React (mesmo padrão de
 * alto-bellevue.ts). Encapsula a regra de merge entre o conteúdo do backoffice
 * (developments.lot_map_amenities) e os defaults editoriais da UI.
 *
 * Precedência de campos: backoffice/JSON  →  default editorial por id  →
 * default por prefixo (ex.: "recreativa-01" → "recreativa")  →  fallback genérico.
 *
 * Ver fix #306 (vídeos enviados) — `videos[]` é carregado aqui ponta a ponta.
 */

export interface AmenityInfo {
  title: string;
  subtitle: string;
  description: string;
  fn: string;
  photos?: string[];
  /** Vídeo embed (YouTube/Vimeo). */
  video?: string;
  /** Vídeos enviados (uploads MP4) — developments.lot_map_amenities.videos. */
  videos?: string[];
  tour360?: string;
  /** Lista de equipamentos da área (ex.: piscina, academia, capela) — do PDF aprovado. */
  features?: string[];
}

/** Override vindo do dado (JSON `amenities[]` — editável pelo backoffice). */
export type AmenityOverride = Partial<AmenityInfo> & { id: string; label: string };

/** Remove o sufixo numérico de um id (ex.: "recreativa-01" → "recreativa"). */
export const amenityPrefix = (id: string): string => id.replace(/-\d+$/, '');

/**
 * Resolve o conteúdo final de uma área comum.
 * @param a       área (já com override do backoffice mesclado, se houver) — precisa de id/label.
 * @param table   tabela de defaults editoriais por id/prefixo.
 */
export function resolveAmenityInfo(
  a: AmenityOverride,
  table: Record<string, AmenityInfo>,
): AmenityInfo {
  // id exato → prefixo → fallback genérico (nunca inventa: usa o label da área).
  const base: AmenityInfo =
    table[a.id] ??
    table[amenityPrefix(a.id)] ?? {
      title: a.label,
      subtitle: 'Área comum',
      description: 'Área de uso comum do empreendimento.',
      fn: 'Área comum',
    };
  // Campos vindos do backoffice/JSON têm prioridade; senão usa o default editorial.
  return {
    title: a.title ?? base.title,
    subtitle: a.subtitle ?? base.subtitle,
    description: a.description ?? base.description,
    fn: a.fn ?? base.fn,
    photos: a.photos ?? base.photos,
    video: a.video ?? base.video,
    videos: a.videos ?? base.videos,
    tour360: a.tour360 ?? base.tour360,
    features: a.features ?? base.features,
  };
}
