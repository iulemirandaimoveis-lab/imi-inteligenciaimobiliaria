/**
 * Aviso de fundação do Digital Twin (namespace isolado).
 * Deixa explícito que este é o ambiente de homologação isolado (Sprint 0) e
 * lista o que será construído nas próximas sprints — sem tocar na produção.
 */
import { Layers, MapPin, Sparkles } from 'lucide-react';

const NEXT_SPRINTS = [
  { icon: MapPin, title: 'Georreferenciamento (Sprint 2)', desc: 'GeoJSON real (lat/lng) a partir de DWG/DXF/PDF — coincidência com a implantação.' },
  { icon: Layers, title: 'Motor de camadas (Sprint 4)', desc: 'Satélite, topografia, infraestrutura, modo noturno e disponibilidade.' },
  { icon: Sparkles, title: 'Visual premium (Sprint 4)', desc: 'Terreno, vegetação, sombras e profundidade — nível Graff Estate.' },
];

export default function DigitalTwinFoundationNotice() {
  return (
    <section className="bg-white py-16 lg:py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10 max-w-2xl">
          <p className="text-[#C8A44A] text-xs font-bold uppercase tracking-[0.3em] mb-3">Sprint 0 · Fundação Isolada</p>
          <h2
            className="text-2xl lg:text-3xl font-bold text-[#0B1928] leading-tight mb-3"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Ambiente de homologação do Digital Twin
          </h2>
          <p className="text-sm text-[#6B6B6B] leading-relaxed">
            Esta experiência é renderizada exclusivamente por componentes do namespace{' '}
            <code className="px-1.5 py-0.5 rounded bg-[#F0EDE5] text-[#0B1928] text-xs">digital-twin</code>, atrás de feature
            flag, sem nenhum impacto na página comercial <strong>/imoveis/alto-bellevue</strong>. As próximas sprints
            evoluem aqui, com promoção controlada e rollback imediato.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {NEXT_SPRINTS.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.title} className="p-6 rounded-2xl border border-[#F0EBE3] bg-[#FDFAF7]">
                <div className="w-10 h-10 rounded-xl bg-[#F0EBE3] flex items-center justify-center mb-4">
                  <Icon size={18} className="text-[#334E68]" />
                </div>
                <h3 className="font-bold text-base text-[#0B1928] mb-2" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                  {s.title}
                </h3>
                <p className="text-sm text-[#6B6B6B] leading-relaxed">{s.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
