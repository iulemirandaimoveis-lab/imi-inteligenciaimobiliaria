/**
 * Metadados do empreendimento para o Digital Twin (namespace isolado).
 *
 * CÓPIA ISOLADA dos valores usados em produção — intencionalmente duplicada para
 * que a homologação não dependa de constantes da página comercial. Apenas leitura.
 * Nenhum destes valores altera contratos de dados de produção.
 */

export const ALTO_BELLEVUE_DT = {
  developmentId: 'ab7d1fc1-f069-4e3b-a515-8e1204c11247',
  name: 'Alto Bellevue',
  whatsapp: '5581986141487',
  city: 'Garanhuns',
  state: 'PE',
  /** Fonte canônica de geometria (somente leitura — mesma do mapa atual). */
  canonicalMapPath: '/maps/alto-bellevue-lots.json',
  expectedTotalLots: 383,
} as const;
