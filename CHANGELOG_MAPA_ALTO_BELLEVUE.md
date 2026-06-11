# Changelog — Mapa de Lotes Alto Bellevue

## 2026-06-11 — Fidelidade total aos arquivos oficiais (tabela 01/04/2026 + planta R05)

### Lotes (cadastro × planta)
- **B-24 removido**: lote fantasma — a Quadra B oficial tem 19 lotes (tabela de
  preços, planilha de disponibilidade e banco confirmam). Tinha polígono inventado
  fora do perímetro.
- **10 lotes oficiais reconstruídos no mapa** (estavam `pending`, sem posição válida,
  e não eram desenhados): **D-15, H-02, H-03, H-07, H-23, P-03, P-04, P-05, P-06, P-09**.
  Geometria derivada exclusivamente de vértices CAD compartilhados com lotes vizinhos
  validados + verificação raster contra a planta oficial R05 georreferenciada.
  Erro de fechamento das faixas: P-02→P-07 **+0,0%**, P-08→P-10 −0,3%, H-01→H-04 +1,1%,
  D-15 cravado em 628,74 m² (oficial 628,73).
- **N-09 (ANTENA)**: metragem corrigida 909,58 → **900,80 m²** e preço removido
  (sem preço na tabela oficial; antes exibia R$ 625.791,04 inventado).
- Contagem por quadra agora idêntica à tabela oficial:
  `A:25 B:19 C:13 D:25 E:38 F:27 G:21 H:45 I:16 J:24 K:32 L:24 M:27 N:31 O:3 P:13` = 383.

### Sistema de descontos por parcelamento
- Condições oficiais aplicadas em **382 lotes** e na tabela comercial:
  à vista **−20%** · 12 meses **−15%** · 36 meses **−8%** · 60 meses **−5%** ·
  120 meses **sem desconto**; **entrada = 10% do total com desconto de cada plano**
  (antes: entrada única de 10% do preço cheio e parcelas divergentes da tabela impressa).
- UI: badge de desconto em cada opção de parcelamento, entrada e total por plano,
  nota sobre correção INCC. Valores idênticos à tabela impressa (ex.: A-01 em 12×:
  entrada R$ 19.850,00 + 12 × R$ 14.887,50).

### Áreas comuns (posições da planta oficial)
- **Portaria** (1096.85,183.06) → (1030.5,181.5): estava sobre a faixa da BR, fora
  do perímetro; agora no pórtico/guarita da via de acesso.
- **Coworking · Bloco Adm.** (1092.63,136.56) → (1035,192.5): idem, agora junto à portaria.
- **Área de Lazer/Clube** (651.97,194.64) → (1028.5,145.5): estava sobre a colagem de
  fotos do book (fora do desenho); agora nas edificações do clube dentro da
  Área Recreativa 01 ("A.A 01" na planta, junto às Quadras de Areia).
- Validação `validate:lots`: **0 amenities fora do perímetro** (antes 3).
- Áreas Verdes 01–09 e Recreativas 01–03 conferidas contra os rótulos
  "ÁREA DESTINADA…" da planta R05 — todas corretas.

### Mobile
- Dica "Toque em um lote" some sozinha após 6s (ou na primeira seleção) e foi
  centralizada acima do indicador de zoom — sem sobreposição com controles/labels.
- Rótulos internos dos lotes com **fit-check geométrico** (corda horizontal do
  polígono): área e medidas só aparecem se couberem dentro do lote — sem texto
  vazando sobre vizinhos.
- Marcadores de áreas comuns não-portaria menores e com rótulo apenas em zoom ≥ 2,2
  (o complexo de entrada concentra 4 marcadores oficiais).

### Pipeline
- `scripts/cad/sync-official-data.mjs`: sincronização idempotente com os arquivos
  oficiais (recontagem, reconstrução geométrica com gate de erro >12%, planos de
  pagamento, amenities, stats). `AB_MAP_VERSION` 4 → 5 (cache bust).
- Testes: 8 novos casos (B-24 ausente, contagem oficial por quadra, D-15, N-09,
  fórmula oficial dos planos). `npm run validate:lots` verde: 0 pendentes,
  0 fora do perímetro, tabela × planta sem divergência (exceto N-09, sem preço por natureza).

### Pendências conhecidas
- Polígono D-15: 7 de 10 vértices são CAD exatos; a testada na Alameda dos Lírios
  foi extraída da planta raster (±1,5 un. SVG) com bojo calibrado pela metragem
  oficial — refinável quando o DXF estiver acessível no ambiente.
- Larguras de vias/calçadas/canteiros (cotas executivas) dependem do DXF
  (185 MB no Drive — bloqueado pela política de rede do ambiente).
- A área branca sem destinação entre Oliveiras/Orquídeas/Margaridas é assim
  na planta oficial (remanescente) — o "vazio" no mapa é fiel ao projeto.

## [Anterior] — Reconstrução premium

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

### UX (Tarefa C — parcial)
- Busca de lote por número (`A-12` / `A12` / `12` na quadra ativa) com foco e seleção.
- `focusOn()` centraliza lote/quadra na tela; clique na quadra centraliza nela.

### Drawer (Tarefa D — parcial)
- Confrontações aproximadas (frente, fundos, lateral esq./dir.) derivadas das arestas do
  polígono (só lotes de 4 lados; senão omitidas — não inventa).
- Rua de acesso aproximada pela street label mais próxima do centroide.

### Backoffice (Tarefa E — parcial)
- Visualizador de auditoria (`lot_status_history`) no modal de edição: quem alterou,
  quando, antes→depois e motivo, com nomes dos autores (best-effort via `profiles`).
- Guarda de confirmação ao reverter um lote `VENDIDO`.

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
