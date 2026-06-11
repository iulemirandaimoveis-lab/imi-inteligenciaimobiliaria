# Revisão completa do mapa Alto Bellevue contra os arquivos oficiais

**Data**: 2026-06-11 · **Branch**: `claude/map-subdivision-review-alz8aj`

## Objetivo
Auditar e corrigir o mapa interativo do Alto Bellevue para fidelidade máxima aos
arquivos oficiais: tabela de preços (01/04/2026), planta de parcelamento R05
aprovada e planilha de disponibilidade.

## Fontes oficiais usadas
- **Tabela de preços PDF** (Drive): extraída via texto — preços, áreas, descontos
  e parcelas de todos os 383 lotes.
- **Planta R05** (`public/images/maps/alto-bellevue-plant.jpg`, 3000×2122):
  georreferenciada contra o SVG por transformação afim otimizada (IoU 0,69;
  escalas 2,44/2,40 px/un — quase uniformes).
- **Banco de produção** (`subdivision_lots`): já estava correto (B:19, D:25 com
  D-15, N-09 sem preço) — só os JSONs estáticos estavam defasados.
- DXF/DWG (185 MB/33 MB) e BOOK PDF (680 MB) no Drive: **inacessíveis** no
  ambiente (rede bloqueada p/ drive.google.com; MCP base64 inviável p/ esse porte).

## Correções (detalhes no CHANGELOG_MAPA_ALTO_BELLEVUE.md)
1. B-24 fantasma removido; 10 lotes oficiais reconstruídos (D-15, H-02/03/07/23,
   P-03..06, P-09) com vértices CAD compartilhados + validação raster e de metragem.
2. N-09 (ANTENA): 900,80 m², sem preço.
3. Planos de pagamento oficiais (20/15/8/5/0% + entrada 10% do total c/ desconto)
   nos 2 JSONs e badges de desconto na UI.
4. Amenities reposicionadas (portaria/coworking/lazer estavam fora do perímetro).
5. Mobile: tap-hint auto-hide centralizado, fit-check de rótulos, marcadores menores.

## Validação
- `npm run validate:lots` ✓ (383, 0 dup, 0 inválido, 0 fora do perímetro, 0 pendente)
- `npx jest src/__tests__/lib/lots/` ✓ 31 testes
- `npx tsc --noEmit` ✓ · lint sem novos warnings

## Ferramentas/abordagem reproduzível
- `scripts/cad/sync-official-data.mjs` — sincronização idempotente (com gates).
- Georreferenciamento raster→SVG: otimização de IoU sobre máscara de cor dos lotes.

## Pendências
- Cotas de infraestrutura (larguras de vias/calçadas) exigem o DXF — subir o
  arquivo para o repositório/bucket ou liberar rede para processá-lo.
- Refinar testada oeste do D-15 com o DXF quando disponível.
