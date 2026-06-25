'use client';

/**
 * Seção de mídia do Digital Twin (namespace isolado) — Sprint 1 / FASE 1.
 * Compõe galeria (fotos), vídeos, áreas comuns e tour 360°, com estados vazios
 * explícitos (sem mídia quebrada). Lê do modelo já normalizado pelo media-adapter.
 */
import type { DigitalTwinMedia } from '@/types/digital-twin/media';
import { hasAmenityMedia } from '@/lib/digital-twin/media-adapter';
import DigitalTwinGallery from './DigitalTwinGallery';
import DigitalTwinVideo from './DigitalTwinVideo';
import DigitalTwinTour from './DigitalTwinTour';

interface Props {
  media: DigitalTwinMedia;
  title: string;
}

function SectionTitle({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="w-1 h-6 rounded-full" style={{ background: '#C8A44A' }} />
      <h2 className="text-xl font-bold text-[#0B1928]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
        {label}
      </h2>
    </div>
  );
}

export default function DigitalTwinMediaSection({ media, title }: Props) {
  const amenitiesWithMedia = media.amenities.filter(hasAmenityMedia);

  return (
    <section className="bg-white py-16 lg:py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        <p className="text-[#C8A44A] text-xs font-bold uppercase tracking-[0.3em]">Mídia · Sprint 1</p>

        {/* Galeria */}
        <div>
          <SectionTitle label="Galeria" />
          <DigitalTwinGallery photos={media.photos} title={title} />
        </div>

        {/* Vídeos */}
        {media.videos.length > 0 && (
          <div>
            <SectionTitle label="Vídeos" />
            <div className="space-y-4">
              {media.videos.map((v, i) => (
                <DigitalTwinVideo key={v} src={v} title={`${title} — Vídeo ${i + 1}`} />
              ))}
            </div>
          </div>
        )}

        {/* Áreas comuns */}
        {amenitiesWithMedia.length > 0 && (
          <div>
            <SectionTitle label="Áreas Comuns" />
            <div className="space-y-10">
              {amenitiesWithMedia.map((a) => (
                <div key={a.id}>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-0.5 h-4 rounded-full" style={{ background: '#C8A44A' }} />
                    <h3 className="text-base font-bold text-[#0B1928]">{a.title}</h3>
                  </div>
                  {a.photos.length > 0 && <DigitalTwinGallery photos={a.photos} title={a.title} />}
                  {a.videos.map((v, i) => (
                    <div key={v} className="mt-4">
                      <DigitalTwinVideo src={v} title={a.videos.length > 1 ? `${a.title} — Vídeo ${i + 1}` : a.title} />
                    </div>
                  ))}
                  {a.tour360 && (
                    <div className="mt-4">
                      <DigitalTwinTour url={a.tour360} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tour Virtual 360° */}
        {media.virtualTourUrl && (
          <div>
            <SectionTitle label="Tour Virtual 360°" />
            <DigitalTwinTour url={media.virtualTourUrl} />
          </div>
        )}
      </div>
    </section>
  );
}
