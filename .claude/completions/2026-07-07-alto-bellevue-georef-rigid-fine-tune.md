# Alto Bellevue — Ajuste fino de georreferenciamento (rigid transform)

**Data**: 2026-07-07
**Branch**: `claude/subdivision-georeference-adjust-dsg28i`

## Pedido
Ajuste fino de georreferenciamento do overlay do loteamento sobre o satélite
(componente `AltoBellevueGeoMap`, aba "Satélite + Lotes"). **Sem** redesenhar,
redimensionar ou deformar nada — apenas transformação **rígida** (rotação +
translação), escala inalterada.

## Mudança
Arquivo único: `src/lib/lots/alto-bellevue-geojson.ts` → `AB_CALIBRATION_DEFAULT`
(fonte única de verdade que posiciona lotes, ruas, áreas verdes, equipamentos e
rótulos de rua via `svgToGeo`).

| Param | Antes | Depois | Efeito |
|---|---|---|---|
| `rotationDeg` | -7.19 | **-6.19** | +1° horário em torno do centro |
| `scale` | 1.342 | 1.342 | **inalterado** |
| `dLng` | -0.00114 | **-0.00119** | ~6 px / ~5-6 m para oeste (esquerda) |
| `dLat` | 0.00043 | **0.000445** | ~2 px / ~1.7 m para o norte (cima) |

Conversão px→grau na latitude −8.875°: ~1 m ≈ 0.0000091° lng / 0.0000181° lat;
no enquadramento mobile ~0.8-1.0 m/px.

## Referências de alinhamento usadas
Margens da BR-423, trevo inferior direito, via principal de entrada, limite oeste
(borda da vegetação) e curvas das vias internas.

## Garantias
- Corpo rígido único → geometria de cada lote/rua/área/equipamento preservada 1:1.
- Rótulos de rua acompanham (leem `_calibration.rotationDeg` em `streetLabelsToGeoJSON`).
- Ajustável ao vivo pela equipe via overlay `?calibrar=1` (persiste em localStorage).

## Verificação
- `tsc`: sem novos erros nas linhas editadas (erros de `GeoJSON`/`process`/`zod`
  no repo são pré-existentes — deps não instaladas neste ambiente).
- Sem testes referenciando as constantes de calibração; mudança puramente numérica.
