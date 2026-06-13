'use client';

import { useEffect, useState } from 'react';
import { loadAltoBellevueMap } from '@/lib/lots/alto-bellevue';

/**
 * Disponibilidade ao vivo do Alto Bellevue (planilha Google via API route).
 *
 * Hook ÚNICO consumido pelas duas visões do mapa (Planta e Lista) — junto com
 * `resolveLotStatus`, garante que totais e status por lote nunca divirjam entre
 * visualizações. Re-busca a cada 90s e ao focar a aba; falha silenciosa mantém
 * o último estado conhecido (o resolver cai para o JSON canônico / banco).
 */
export function useAbAvailability(enabled: boolean): Record<string, string> {
  const [avail, setAvail] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    const load = () =>
      fetch('/api/developments/alto-bellevue/availability')
        .then((r) => r.json())
        .then((d) => { if (alive && d?.availability) setAvail(d.availability); })
        .catch(() => {});
    load();
    const id = setInterval(load, 90_000); // near-real-time
    const onFocus = () => load();
    window.addEventListener('focus', onFocus);
    return () => { alive = false; clearInterval(id); window.removeEventListener('focus', onFocus); };
  }, [enabled]);

  return avail;
}

/**
 * Statuses do JSON canônico do mapa (`{ "A-01": "DISPONIVEL", … }`).
 * Cacheado em sessionStorage pelo loader — custo ~zero quando a Planta já carregou.
 * Usado pela Lista como fallback intermediário do `resolveLotStatus`.
 */
export function useAbCanonicalStatuses(enabled: boolean): Record<string, string> {
  const [statuses, setStatuses] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    loadAltoBellevueMap()
      .then((d) => {
        if (!alive) return;
        const map: Record<string, string> = {};
        for (const l of d.lots) map[l.id] = l.status;
        setStatuses(map);
      })
      .catch(() => { /* sem JSON → resolver cai para o status do banco */ });
    return () => { alive = false; };
  }, [enabled]);

  return statuses;
}
