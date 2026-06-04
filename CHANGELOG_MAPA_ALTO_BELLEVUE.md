# Changelog — Mapa de Lotes Alto Bellevue

## [Não publicado] — Reconstrução premium

### Confiabilidade (causa raiz corrigida)
- **Fonte de dados canônica:** planta premium migrada de `public/data/alto-bellevue-lots.json`
  (426 entradas, 10 duplicados, 176 polígonos inválidos) para
  `public/maps/alto-bellevue-lots.json` (**383 lotes**, geometria limpa, contexto urbano).
  Resolve o "lote faltando em cada quadra".
- **Fallback estático clicável:** em falha de carregamento, exibe a planta estática
  (`alto-bellevue-plant.jpg`) com CTA — o mapa nunca mais fica em branco.
- **Loader resiliente:** `src/lib/lots/alto-bellevue.ts` com cache de sessão (offline-first),
  timeout explícito (8s), retry com backoff e **validação antes de renderizar**.

### Planta (GIS)
- Migração para o viewBox canônico (1200×821.86) com fundo técnico vetorial (sem foto).
- Render de **ruas (194), perímetro, linha da BR, nomes de ruas (19), portaria/entrada e
  amenities**, com labels adaptativos por nível de zoom.
- Toggle de camada técnica × comercial.

### Dados / validação
- `scripts/validate-lots.mjs` + `npm run validate:lots`: relatório de consistência
  (total/quadra, duplicados, polígonos inválidos, divergência planta×tabela).
- Itens sem fonte oficial marcados `pendente` (áreas verdes, preço `B-24`, `D-15`).

### Testes
- `src/__tests__/lib/lots/alto-bellevue.test.ts` (14 testes): geometria, validação e
  integridade da fonte canônica.

### Documentação
- `AUDITORIA_MAPA_ALTO_BELLEVUE.md`, `VALIDACAO_LOTES_ALTO_BELLEVUE.md`,
  `MAPA_LOTES_DATA_MODEL.md`, `MAPA_LOTES_UX_SPEC.md`,
  `MAPA_LOTES_BACKOFFICE_SPEC.md`, `MAPA_LOTES_TEST_PLAN.md`.

### Próximos passos
- Drawer enriquecido (laterais/fundos, saldo, comparar, gerar PDF, fluxo do corretor).
- Backoffice: UI de reserva com expiração + visualizador de auditoria.
- E2E (Playwright): render, drawer, filtros, fallback, mobile, zoom/pan.
