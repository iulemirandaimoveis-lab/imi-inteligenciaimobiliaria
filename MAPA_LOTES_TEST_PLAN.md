# Plano de Testes — Mapa de Lotes Alto Bellevue

## 1. Camadas de teste

| Camada | Ferramenta | Local |
|---|---|---|
| Dados/lógica | Jest | `src/__tests__/lib/lots/alto-bellevue.test.ts` |
| Validação de fonte | Node | `scripts/validate-lots.mjs` (`npm run validate:lots`) |
| Componente | Jest + Testing Library | `src/__tests__/components/` (a expandir) |
| E2E | Playwright | `e2e/` (a expandir) |

## 2. Cobertura atual (Jest — 14 testes ✓)

- `parsePoints`, `polygonArea`, `isValidPolygon` (geometria);
- `validateLots`: aceita 383 consistentes, detecta duplicados e polígonos inválidos;
- **fonte canônica**: 383 lotes exatos, 0 duplicados, 0 inválidos, status normalizado,
  contexto urbano presente, `greenAreas` marcado `pendente`.

## 3. Casos a cobrir (do brief)

| Caso | Tipo | Status |
|---|---|---|
| Consistência do total (383) | Jest | ✓ |
| Lote faltante | Jest | ✓ |
| Lote duplicado | Jest | ✓ |
| Polígono inválido/quebrado | Jest | ✓ |
| Status divergente/normalização | Jest | ✓ |
| Renderização do mapa | E2E | a fazer |
| Abertura do drawer | E2E | a fazer |
| Filtros (status/quadra) | E2E | a fazer |
| Busca por lote | E2E | a fazer |
| Fallback de erro (planta estática) | E2E (mock fetch 500) | a fazer |
| Mobile viewport | Playwright (device) | a fazer |
| Zoom / pan / pinch | E2E | a fazer |
| Mudança de status / reserva | Jest API + E2E | a fazer |

## 4. Critérios de aceite

1. `npm run validate:lots` → exit 0 (383, 0 dup, 0 inválido).
2. `npm test` verde.
3. `npm run build` sem erros.
4. Mapa nunca em branco (fallback estático cobre erro/sem-dados).
5. Drawer mostra dados técnicos + comerciais.
