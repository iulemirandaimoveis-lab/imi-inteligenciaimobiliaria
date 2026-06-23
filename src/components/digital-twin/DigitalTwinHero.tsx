/**
 * Hero do Alto Bellevue Digital Twin (namespace isolado de homologação).
 * Componente presentacional — não importa nada da produção.
 */
import Link from 'next/link';
import { ArrowLeft, FlaskConical } from 'lucide-react';
import type { DigitalTwinStats } from '@/types/digital-twin';

interface Props {
  lang: string;
  stats?: DigitalTwinStats | null;
}

export default function DigitalTwinHero({ lang, stats }: Props) {
  const items = [
    { n: stats ? String(stats.total) : '—', label: 'Lotes' },
    { n: stats ? String(stats.disponiveis) : '—', label: 'Disponíveis' },
    { n: '16', label: 'Quadras' },
  ];

  return (
    <section
      className="relative overflow-hidden bg-[#0B1928] text-white"
      style={{ minHeight: '70svh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
    >
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)', backgroundSize: '40px 40px' }}
      />
      <div
        className="absolute inset-0 opacity-15"
        style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 40%, #1A3A5C 0%, transparent 70%)' }}
      />
      <div
        className="absolute bottom-0 left-[10%] right-[10%] h-px opacity-30"
        style={{ background: 'linear-gradient(90deg, transparent, #C8A44A, transparent)' }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-6 sm:px-10 lg:px-16 py-20 lg:py-28">
        <Link
          href={`/${lang}/projetos`}
          className="inline-flex items-center gap-2 text-white/40 text-xs font-medium hover:text-white/70 transition-colors mb-10 uppercase tracking-widest"
        >
          <ArrowLeft size={13} />
          Projetos
        </Link>

        <div
          className="inline-flex items-center gap-2 mb-6 px-3 py-1.5 rounded-full"
          style={{ background: 'rgba(200,164,74,0.12)', border: '1px solid rgba(200,164,74,0.35)' }}
        >
          <FlaskConical size={13} style={{ color: '#C8A44A' }} />
          <span className="text-[#C8A44A] text-[10px] font-bold uppercase tracking-[0.25em]">
            Homologação · Digital Twin
          </span>
        </div>

        <h1
          className="font-bold leading-[1.08] mb-2"
          style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(2.6rem, 7vw, 5.5rem)' }}
        >
          Alto
        </h1>
        <h1
          className="font-bold leading-[1.08] mb-8"
          style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(2.6rem, 7vw, 5.5rem)', fontStyle: 'italic', color: '#D4C4A0' }}
        >
          Bellevue
        </h1>

        <p className="text-white/50 text-lg font-light max-w-xl leading-relaxed mb-12">
          Plataforma Digital Twin imobiliária — ambiente de homologação isolado.
        </p>

        <div className="grid grid-cols-3 gap-0 max-w-md">
          {items.map((stat, i) => (
            <div key={stat.label} className={`py-5 ${i < 2 ? 'pr-6 border-r border-white/10' : ''} ${i > 0 ? 'pl-6' : ''}`}>
              <p className="text-3xl font-bold text-white mb-1" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                {stat.n}
              </p>
              <p className="text-white/40 text-xs uppercase tracking-widest">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
