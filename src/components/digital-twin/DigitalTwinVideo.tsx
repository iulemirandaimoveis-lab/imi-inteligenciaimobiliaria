'use client';

/**
 * Player de vídeo do Digital Twin (namespace isolado).
 * Click-to-play com miniatura do YouTube quando disponível. Normaliza YouTube/Vimeo.
 */
import { useState } from 'react';
import { Play, Film } from 'lucide-react';
import { normalizeVideoUrl, youTubeThumb } from '@/lib/digital-twin/media-adapter';

interface Props {
  src: string;
  title: string;
}

export default function DigitalTwinVideo({ src, title }: Props) {
  const [playing, setPlaying] = useState(false);
  const embed = normalizeVideoUrl(src);
  const thumb = youTubeThumb(src);

  if (playing) {
    return (
      <div className="aspect-video rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(200,164,74,0.15)' }}>
        <iframe
          src={`${embed}${embed.includes('?') ? '&' : '?'}autoplay=1`}
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title={title}
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      className="relative w-full aspect-video rounded-2xl overflow-hidden group block text-left"
      style={{ border: '1px solid rgba(200,164,74,0.15)' }}
      aria-label={`Reproduzir: ${title}`}
    >
      {thumb ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={thumb} alt={title} className="w-full h-full object-cover" loading="lazy" />
      ) : (
        <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#0B1928,#142840)' }}>
          <Film size={40} style={{ color: 'rgba(200,164,74,0.25)' }} />
        </div>
      )}
      <div className="absolute inset-0" style={{ background: thumb ? 'rgba(5,11,20,0.4)' : 'transparent' }} />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center transition-transform group-hover:scale-110" style={{ background: '#C8A44A', boxShadow: '0 8px 32px rgba(200,164,74,0.45)' }}>
          <Play size={22} style={{ color: '#0B1928', marginLeft: 2 }} fill="#0B1928" />
        </div>
      </div>
      <span className="absolute bottom-3 left-4 right-4 text-xs font-semibold truncate" style={{ color: 'rgba(255,255,255,0.85)' }}>
        {title}
      </span>
    </button>
  );
}
