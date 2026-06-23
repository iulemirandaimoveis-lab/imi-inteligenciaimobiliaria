/**
 * Painel de disponibilidade do Digital Twin (namespace isolado).
 * Lê o modelo adaptado (somente leitura) e mostra os totais por status e por quadra.
 * Componente presentacional — não importa nada da produção.
 */
import type { DigitalTwinModel } from '@/types/digital-twin';

interface Props {
  model: DigitalTwinModel;
}

const STATUS_COLORS: Record<string, string> = {
  DISPONIVEL: '#16A34A',
  NEGOCIACAO: '#D97706',
  VENDIDO: '#DC2626',
  RESERVADO: '#8B5CF6',
  PROPRIETARIO: '#2563EB',
};

export default function DigitalTwinStatsPanel({ model }: Props) {
  const { stats, lots } = model;

  const cards = [
    { label: 'Total', value: stats.total, color: '#0B1928' },
    { label: 'Disponíveis', value: stats.disponiveis, color: STATUS_COLORS.DISPONIVEL },
    { label: 'Em negociação', value: stats.negociacao, color: STATUS_COLORS.NEGOCIACAO },
    { label: 'Vendidos', value: stats.vendidos, color: STATUS_COLORS.VENDIDO },
  ];

  // Disponibilidade por quadra (computada a partir do modelo adaptado).
  const byQuadra = new Map<string, { total: number; disp: number }>();
  for (const lot of lots) {
    const entry = byQuadra.get(lot.quadra) ?? { total: 0, disp: 0 };
    entry.total++;
    if (lot.status === 'DISPONIVEL') entry.disp++;
    byQuadra.set(lot.quadra, entry);
  }
  const quadras = [...byQuadra.entries()].sort((a, b) => a[0].localeCompare(b[0]));

  return (
    <section className="bg-[#F5F0EA] py-14 lg:py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-[#C8A44A] text-xs font-bold uppercase tracking-[0.3em] mb-3">Disponibilidade</p>
        <h2
          className="text-2xl lg:text-3xl font-bold text-[#0B1928] leading-tight mb-8"
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          Panorama do loteamento
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {cards.map((card) => (
            <div key={card.label} className="p-5 rounded-2xl border border-[#E8E1D6] bg-white">
              <p className="text-3xl font-bold mb-1" style={{ color: card.color, fontFamily: "'Playfair Display', Georgia, serif" }}>
                {card.value}
              </p>
              <p className="text-xs uppercase tracking-widest text-[#948F84]">{card.label}</p>
            </div>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 gap-x-8 gap-y-3">
          {quadras.map(([quadra, info]) => {
            const pct = info.total > 0 ? Math.round((info.disp / info.total) * 100) : 0;
            return (
              <div key={quadra} className="flex items-center gap-3">
                <span className="text-xs font-bold text-[#0B1928] w-16 flex-shrink-0">Quadra {quadra}</span>
                <div className="flex-1 h-2 rounded-full bg-[#E8E1D6] overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#16A34A,#22C55E)' }} />
                </div>
                <span className="text-[11px] text-[#948F84] w-24 text-right flex-shrink-0">
                  {info.disp}/{info.total} disp.
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
