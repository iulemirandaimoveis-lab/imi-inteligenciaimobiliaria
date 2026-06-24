# Sprint 1 (FASE 1): camada de mídia resiliente do Alto Bellevue Digital Twin

**Data:** 2026-06-24
**Programa:** Alto Bellevue Digital Twin Platform (homologação → produção)
**Branch:** `claude/alto-bellevue-digital-twin-o550nd` · **PR:** #312
**Rota (homologação):** `/[lang]/projetos/alto-bellevue` (atrás da flag `NEXT_PUBLIC_ALTO_BELLEVUE_DIGITAL_TWIN`)
**Produção:** `/[lang]/imoveis/alto-bellevue` — **intacta** (zero regressões)

## Contexto
FASE 0 (auditoria) e Sprint 0 (isolamento) já estão na `main` (PR #308). Esta sprint
implementa a **FASE 1 — correções críticas de mídia** dentro do namespace isolado
`digital-twin`, com a página comercial inalterada.

## Diagnóstico (dados reais do Supabase, registro `alto-bellevue`)
- **Fotos:** 16 imagens, URLs absolutas no host Supabase (que está no allowlist do
  `next/image`) → **saudáveis**. "Fotos não exibidas" não era bug de dados.
- **Vídeos:** 0 no banco → lacuna de **conteúdo**, não defeito.
- **Tour 360°:** Kuula presente (URL imutável).
- **Áreas comuns:** 5 amenities, todas sem mídia → lacuna de conteúdo.

## O que foi entregue
- **`lib/digital-twin/media-adapter.ts`** (SOMENTE LEITURA): resolve fotos (galeria
  JSONB + colunas legadas, dedup, capa), vídeos (YouTube/Vimeo normalizados, dedup por
  ID) e tour 360° (Kuula externo com `fs=0/inst=0`, **coleção canônica preservada**).
  Resiliente a "uploads inconsistentes": filtra URLs inválidas/vazias. Loader server-side
  via `supabaseAdmin` (prova o sync backoffice→frontend).
- **Componentes** (`components/digital-twin/`): `DigitalTwinGallery` (`<img>` + `onError`
  que **oculta imagens quebradas**, lightbox com teclado), `DigitalTwinVideo`
  (click-to-play), `DigitalTwinTour`, `DigitalTwinMediaSection` (estados vazios explícitos).
- **Tipos** (`types/digital-twin/media.ts`).

## Correção de review (Codex, P2)
O contrato do backoffice (`map-amenities`) aceita `videos[]` (plural) nas áreas comuns
além do legado `video` singular. O adaptador lia só o singular → uma área com apenas
`videos[]` seria filtrada como "sem mídia". Corrigido: `DigitalTwinAmenityMedia.videos:
string[]` (mescla `videos[]` + `video`, dedup por ID); `hasAmenityMedia` checa o array;
a seção renderiza todos os vídeos.

## Verificação
- `jest src/__tests__/digital-twin`: **24/24** verdes (flag, adaptador de dados,
  adaptador de mídia, isolamento, produção intacta).
- `tsc --noEmit`: **0 erros** (projeto inteiro).
- `next lint`: **0 warnings/errors**.
- `next build`: **OK** (rota gerada; flag off → conteúdo legado preservado).
- **Preview Vercel:** Ready (deploy da branch compila e roda).

## Garantias de isolamento (mecânicas)
- `isolation.test.ts`: nenhum import de produção (`imoveis/components`, `components/maps`,
  `lib/lots/`, `hooks/use-ab`) dentro do namespace `digital-twin`.
- `production-intact.test.ts`: `imoveis/[slug]` segue usando os componentes atuais.

## Rollback
`NEXT_PUBLIC_ALTO_BELLEVUE_DIGITAL_TWIN=false` + redeploy → homologação volta ao legado.
`git revert` do(s) commit(s) remove a camada inteira sem efeito em produção.

## Próximo (gated — requer aprovação)
**Sprint 2 — FASE 2/3 (georreferenciamento):** depende dos arquivos-fonte oficiais
(DWG/DXF/PDF) e/ou pontos de controle no Google Earth. Sem eles, a "tolerância zero" da
FASE 3 não é atingível — não deve ser iniciada com geometria aproximada.
