/**
 * Feature flag do Alto Bellevue Digital Twin (Sprint 0 — Isolamento).
 *
 * A nova experiência de homologação só renderiza quando esta flag estiver ativa,
 * e somente na rota `/[lang]/projetos/alto-bellevue`. Quando a flag está ausente
 * ou diferente de "true", a rota mantém EXATAMENTE o comportamento atual (fallback
 * legado) — garantindo zero efeito colateral e rollback trivial.
 *
 * Consumida apenas no servidor (Server Component da página), onde `process.env`
 * está disponível em runtime. NÃO é necessária no cliente.
 */

export const DIGITAL_TWIN_FLAG = 'NEXT_PUBLIC_ALTO_BELLEVUE_DIGITAL_TWIN';

/** `true` somente quando NEXT_PUBLIC_ALTO_BELLEVUE_DIGITAL_TWIN === 'true'. */
export function isDigitalTwinEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ALTO_BELLEVUE_DIGITAL_TWIN === 'true';
}
