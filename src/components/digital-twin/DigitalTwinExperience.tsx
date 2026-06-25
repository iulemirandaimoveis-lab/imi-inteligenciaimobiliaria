'use client';

/**
 * Experiência do Alto Bellevue Digital Twin (namespace isolado de homologação).
 *
 * Orquestrador client-only. Carrega o modelo via adaptador (somente leitura) e
 * compõe os componentes do namespace `digital-twin`. NÃO importa nenhum componente
 * de produção (`imoveis/components`, `components/maps`, etc.) — isolamento total.
 *
 * Sprint 0: fundação. O mapa interativo georreferenciado chega nas próximas sprints.
 */

import { useEffect, useState } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import type { DigitalTwinModel } from '@/types/digital-twin';
import type { DigitalTwinMedia } from '@/types/digital-twin/media';
import { loadDigitalTwinModel } from '@/lib/digital-twin/data-adapter';
import DigitalTwinHero from './DigitalTwinHero';
import DigitalTwinStatsPanel from './DigitalTwinStatsPanel';
import DigitalTwinMediaSection from './DigitalTwinMediaSection';
import DigitalTwinFoundationNotice from './DigitalTwinFoundationNotice';

interface Props {
  lang: string;
  /** Mídia carregada no servidor (somente leitura). Sprint 1 — FASE 1. */
  media?: DigitalTwinMedia;
}

export default function DigitalTwinExperience({ lang, media }: Props) {
  const [model, setModel] = useState<DigitalTwinModel | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    loadDigitalTwinModel(controller.signal)
      .then(setModel)
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Erro ao carregar o modelo.');
      });
    return () => controller.abort();
  }, []);

  return (
    <main className="bg-[#F5F0EA]">
      <DigitalTwinHero lang={lang} stats={model?.stats} />

      {error ? (
        <section className="bg-[#F5F0EA] py-20">
          <div className="max-w-3xl mx-auto px-6 flex items-start gap-3 text-[#8a3b3b]">
            <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold mb-1">Não foi possível carregar a fonte canônica.</p>
              <p className="text-sm text-[#6B6B6B]">{error}</p>
            </div>
          </div>
        </section>
      ) : !model ? (
        <section className="bg-[#F5F0EA] py-24">
          <div className="max-w-3xl mx-auto px-6 flex items-center justify-center gap-3 text-[#948F84]">
            <Loader2 size={18} className="animate-spin" />
            <span className="text-sm">Carregando modelo do Digital Twin…</span>
          </div>
        </section>
      ) : (
        <DigitalTwinStatsPanel model={model} />
      )}

      {media && <DigitalTwinMediaSection media={media} title="Alto Bellevue" />}

      <DigitalTwinFoundationNotice />
    </main>
  );
}
