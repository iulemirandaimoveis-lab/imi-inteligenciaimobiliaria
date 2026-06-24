/**
 * Tipos de mídia do Digital Twin (namespace isolado de homologação).
 *
 * Modelo próprio — não depende dos tipos de produção (`Development`). Representa a
 * mídia de um empreendimento (fotos, vídeos, tour 360°) e das áreas comuns, já
 * normalizada e segura para render (URLs válidas, sem entradas vazias).
 */

export interface DigitalTwinAmenityMedia {
  id: string;
  title: string;
  photos: string[];
  video?: string;
  tour360?: string;
}

export interface DigitalTwinMedia {
  /** Imagem principal (capa). */
  main?: string;
  /** Galeria completa (inclui a capa, deduplicada). */
  photos: string[];
  /** Vídeos (YouTube/Vimeo/URLs), deduplicados. */
  videos: string[];
  /** Tour virtual 360° (ex.: Kuula). */
  virtualTourUrl?: string;
  /** Mídia por área comum. */
  amenities: DigitalTwinAmenityMedia[];
}

/** Tour resolvido: como deve ser exibido (externo vs. iframe). */
export interface DigitalTwinResolvedTour {
  url: string;
  /** Plataformas 360°/VR (Kuula, Panoee) funcionam melhor em aba dedicada. */
  external: boolean;
  host: string;
}
