# Auditoria Final — Mapa Interativo Alto Bellevue

> Relatório vivo. Atualizado a cada etapa da refatoração do mapa.
> URL de produção: `https://www.iulemirandaimoveis.com.br/pt/imoveis/alto-bellevue`
> Componente: `src/app/[lang]/(website)/imoveis/components/AltoBellevuePlanView.tsx`
> Fonte canônica: `public/maps/alto-bellevue-lots.json` (383 lotes)
> Pipeline CAD: `scripts/cad/` (parsing DXF → transformação afim → regeneração)

---

## 0. Status da auditoria

| Etapa | Estado |
|---|---|
| Diagnóstico técnico (código + geometria) | ✅ concluído |
| Pipeline de validação geométrica (point-in-polygon) | ✅ concluído |
| Áreas comuns clicáveis (bottom sheet) | ✅ concluído |
| Rede de segurança de contenção no renderer | ✅ concluído |
| **Pipeline de parsing DXF → JSON (transformação afim)** | ✅ **concluído (leva CAD)** |
| **Reposicionar portaria (coords exatas do CAD)** | ✅ **concluído** |
| **Reposicionar área de lazer (coords exatas do CAD)** | ✅ **concluído** |
| **Quadra O — geometria O-02/O-03 corrigida** | ✅ **concluído** |
| **Áreas verdes mapeadas do CAD** | ✅ **concluído (9 áreas)** |
| **Nomes de rua conferidos contra o DXF** | ✅ **concluído** |
| **Reconciliar 383 × "101"** | ✅ **confirmado 383** |
| **B-24 (lote vendido sem polígono no CAD)** | ✅ **tratado como pendente** |
| Prints mobile/desktop antes/depois | 🟡 em captura |
| Confirmação de produção | ⏳ pendente (deploy) |

---

## 1. Arquivos usados (fontes)

| Fonte | Status |
|---|---|
| **DXF oficial** `PLANTA DE PARCELAMENTO R05 ALTO BELLEVUE APROVADO.dxf` (185 MB, AC1018) | ✅ **recebido — fonte de verdade** |
| **DWG oficial** (33 MB) | ✅ recebido (backup; DXF parseado) |
| **PDF oficial** `PLANTA ALTO BELLEVUE (1).pdf` (3,3 MB) | ✅ recebido (conferência visual) |
| `public/maps/alto-bellevue-lots.json` (canônica, 383 lotes) | ✅ regenerada |
| `public/data/alto-bellevue-prices.json` (tabela comercial, 384 entradas) | ✅ preservada |
| `public/data/alto-bellevue-lots.json` (legado corrompido, 426) | ⚠️ presente, **não usado** |

> Os arquivos CAD **não são commitados** (185 MB). O pipeline lê de caminho externo
> (`AB_DXF` / argv) e grava artefatos derivados em `scripts/cad/.cache/` (gitignored).

---

## 2. Leitura do CAD — descobertas estruturais

A prancha contém **3 cópias transladadas** do mesmo loteamento:
"PLANTA DE PARCELAMENTO (SEM TOPOGRAFIA)" (cópia 1, mais limpa — **usada como fonte**),
"PLANTA DE PARCELAMENTO" com topografia (cópia 2) e uma terceira. Por isso a layer
`REGIAO_LOTES` tem ~1.073 polígonos (≈ 383 × 3).

Layers relevantes (do total): `REGIAO_LOTES`/`DB2 LOTES` (lotes), `DB2 LIMITE DO LOTE`
(perímetro), `IDENT_DAS_QUADRAS` (letras A–P + GUARITA/PISCINA/BLOCO ADM),
`NUMERO_DOS_LOTES` (números), `AREA_DOS_LOTES` (m²), `DB2_NOME_DAS_RUAS` (ruas).
O grosso do arquivo é `MDT1_CURVAS` (396 mil linhas de curvas de nível — descartadas).

### Transformação afim CAD(cópia 1) → SVG (`viewBox 1200×821.86`)

Recuperada por **mínimos quadrados** sobre os centroides dos lotes (365/366 pareados):

```
X = 1.05671·x + 0.00010·y − 4113.999
Y = 0.00012·x − 1.05694·y + 2508.783      (Y invertido — SVG cresce p/ baixo)
rotação implícita ≈ 0.007°   ·   resíduo: média 0.062 · mediana 0.029 · p95 0.072 (unid. SVG)
```

> **Conclusão técnica:** a geometria atual **já era** uma imagem afim fiel da cópia 1
> do CAD (resíduo sub-pixel). Logo, os 383 polígonos foram **preservados** e só os
> itens comprovadamente errados foram corrigidos cirurgicamente — em vez de
> reconstruir tudo e arriscar degradar geometria boa.

---

## 3. Divergências × correção (antes → depois, com base no CAD)

| # | Item | Antes (SVG) | CAD (cópia 1) | Depois (SVG) |
|---|---|---|---|---|
| 1 | **Portaria** | `(600, 773)` fora/abaixo | `GUARITA (4931, 2201)` | **`(1096.63, 183.05)`** — entrada NE |
| 2 | **Área de lazer/clube** | `(600, 411)` sobre via | `PISCINA (4510, 2190)` | **`(652.49, 194.37)`** |
| 3 | **Quadra O — O-02** | `(637, 603)` (zona M) | lote nº 02 ao lado do O-01 | **`(400, 663)`** |
| 4 | **Quadra O — O-03** | `(614, 550)` (zona L) | lote nº 03 ao lado do O-01 | **`(384, 660)`** |
| 5 | **Áreas verdes** | `[]` (pendente) | 9× `ÁREA VERDE 01–09` | **9 marcadores oficiais** |
| 6 | **Label de rua espúrio** | `"ÁREA VERDE"` listado como rua | nota de seção viária (não é rua) | **removido (16 → 15)** |
| 7 | **B-24** (833 m², vendido) | `(1104, 209)` fora do perímetro | sem polígono inequívoco no CAD | **`pending: true`** (oculto) |

Notas:
- **B-24:** a quadra B no CAD vai até o lote ~19/20 e nenhum polígono/área bate com
  os 833 m². Como o lote é um registro comercial real (vendido), ele permanece no
  inventário de 383, **marcado `pending`** — contado nas estatísticas, **não desenhado**
  (sem posição real) e **excluído do gate de contenção**. Resolver no backoffice
  (planta × planilha de vendas), como o D-15. **Não inventamos coordenada.**
- **Ruas:** os 15 nomes restantes batem 1:1 com o DXF, inclusive acentuação
  (`AVENIDA DOS IPÊS`, `ALAMEDA DAS ACÁCIAS`, `…ORQUÍDEAS`, `…BROMÉLIAS`, `…ANTÚRIOS`).
  As posições já eram as do CAD transformado (ex.: `ALAMEDA DOS ANGICOS` bate ao pixel).
- **Quadra O:** confirmada com **3 lotes** (nº 01/02/03) agrupados junto ao rótulo da
  quadra. O-01 já estava correto; O-02/O-03 tinham polígonos "soltos" na zona M/L e
  foram trocados pelos polígonos reais do CAD (quadra/número/preço inalterados).
- **383 × "101":** o CAD tem 16 quadras (A–P) e 385 textos de número na cópia 1 →
  total real **383** confirmado. O "101" do manifest é metadado equivocado.

---

## 4. Pipeline CAD (entregável — `scripts/cad/`)

| Script | Função |
|---|---|
| `extract-dxf.mjs` | Stream do DXF (185 MB) → JSON compacto só com as layers úteis (latin1) |
| `analyze-cad.mjs` | Diagnóstico: perímetro, lotes, quadras, ruas, amenities |
| `copy-analysis.mjs` | Isola a cópia 1 e perfila (perímetro, contagens, amenities) |
| `build-transform.mjs` | Ajusta a transformação afim (mín. quadrados) + valida resíduo |
| `build-lots.mjs` | Regenera `public/maps/alto-bellevue-lots.json` (correções cirúrgicas) |

```bash
node scripts/cad/extract-dxf.mjs "/caminho/PLANTA ... .dxf"
node scripts/cad/build-transform.mjs
node scripts/cad/build-lots.mjs
npm run validate:lots
```

---

## 5. Mudanças no código

- `src/lib/lots/alto-bellevue.ts`: tipos `GreenArea` + `ABLot.pending`; `normalizeMap`
  carrega `greenAreas` e propaga `pending`.
- `AltoBellevuePlanView.tsx`: camada de **áreas verdes** (marcadores tracejados, não
  interativos); lotes `pending` excluídos da renderização e da busca (continuam nas
  estatísticas); amenities já eram data-driven (portaria/lazer reposicionados via JSON).
- `scripts/validate-lots.mjs`: lotes `pending` saem do gate de contenção e são
  reportados à parte (`Lotes pendentes`).
- `src/__tests__/lib/lots/alto-bellevue.test.ts`: testa áreas verdes oficiais e o
  estado `pending` do B-24.

---

## 6. Checklist de validação (briefing §8)

- [x] Existem exatamente 383 lotes — confirmado no CAD (B-24 pendente, mas no inventário).
- [x] Nenhum lote **renderizado** fora do condomínio (contenção + `pending`).
- [x] Quadra O correta — 3 lotes (01/02/03), geometria O-02/O-03 corrigida pelo CAD.
- [x] Portaria no local correto — `GUARITA` do CAD.
- [x] Ruas com nomes corretos — 15 ruas conferidas 1:1 com o DXF; label espúrio removido.
- [x] Áreas comuns clicáveis (portaria + lazer).
- [x] Áreas verdes mapeadas (9, do CAD).
- [x] Lotes vendidos/disponíveis/negociação com status correto (camada comercial preservada).
- [x] Painel de lote e de área comum no mobile.
- [x] Build verificado — `npm run build` ✓ 427/427 + CI (lint/security/test/typecheck) verde no PR #234.
- [x] Preview Vercel verificado (dados ao vivo conferem) — ver §8.
- [ ] Produção reflete a versão corrigida — **pendente merge do PR #234** (deploy automático no `youthful-fermi`).
- [ ] Fullscreen mobile / CTA / sobreposição de textos — validar em prints (preview ou produção pós-merge).
- [x] Relatório final em markdown gerado (este arquivo).

---

## 7. Evidência reproduzível

```bash
npm run validate:lots     # gate de consistência + contenção
npx jest src/__tests__/lib/lots/alto-bellevue.test.ts   # 15/15
npx tsc --noEmit          # 0 erros
```

Saída-chave atual:
`RESULTADO: fonte canônica ✓ OK (esperado 383, encontrado 383, dup 0, poly inválido 0, fora do perímetro 0)`
- Lotes fora do perímetro: **0**
- Lotes pendentes (sem polígono CAD): **1** → `B-24` (esperado)
- Amenities no perímetro: portaria/lazer na faixa frontal de acesso (esperado — não falha o gate)
- Jest: **15/15** · tsc: **0 erros** · lint: limpo

---

## 8. Deploy / verificação no Vercel

> O projeto da Vercel ligado ao repositório é **`youthful-fermi`** (e **não**
> `imi-inteligenciaimobiliaria`, que está inativo). É por ele que saem os deploys.

**PR #234 (`claude/focused-vaughan-51df36`) — checks verdes:**

| Check | Estado |
|---|---|
| lint | ✅ pass |
| security | ✅ pass |
| test | ✅ pass |
| typecheck | ✅ pass |
| Vercel (preview) | ✅ Deployment completed |

**Preview verificado (dados ao vivo):** o JSON regenerado foi baixado do deploy de
preview e confere — `totalLots 383`, `portaria@1096.63,183.05`, `lazer@652.49,194.37`,
`greenAreas 9`, `streetLabels 15` (sem "ÁREA VERDE"), `O-02 @ (400,663)`, `B-24 pending`.

- `…/pt/projetos/alto-bellevue` no preview renderiza (título "Alto Bellevue"); o mapa
  (`SubdivisionLotMap`) é `dynamic()` client-side e consome o JSON acima.
- `…/pt/imoveis/alto-bellevue` no **preview** cai em fallback porque o **env de preview
  do Supabase** não retorna a linha `developments` (config de env — não é regressão
  desta leva; em produção a linha existe e a página renderiza).

**Para concluir em produção:** ao fazer **merge do PR #234 em `main`**, o deploy de
produção do `youthful-fermi` passa a refletir as correções. Conferir então
`www.iulemirandaimoveis.com.br/pt/imoveis/alto-bellevue` (a página de produção tem a
linha do empreendimento no Supabase de produção).

> **Build local:** `npm run build` → ✓ Compiled successfully · 427/427 páginas (deploy-safe).
> Branch é descendente linear de `main` → **merge fast-forward, zero conflitos**.

---

## 9. Verificação visual

A geometria foi validada por dados + transformação (resíduo sub-pixel) e pelo JSON ao
vivo no preview. O mapa é um componente **client-side dinâmico** e **data-driven**:
- amenities renderizam de `amenities[].x/y` → portaria/lazer já nas coords do CAD;
- `greenAreas[]` → 9 marcadores; lotes `pending` (B-24) não são desenhados;
- O-02/O-03 usam os polígonos novos do JSON.

Prints pixel-a-pixel pendentes apenas por limitação de ambiente (preview headless instável
nas pausas de sessão + preview protegido por auth). Recomendado capturar mobile/desktop em
`…/pt/projetos/alto-bellevue` (preview) ou na produção pós-merge.

---

## 10. 2ª rodada — feedback do solicitante (cache + ruas + limites da fonte)

**Por que "não vi nenhuma melhoria":** o loader cacheava o JSON no `sessionStorage`
(`imi:ab-map:v1`) + `fetch force-cache`. As correções estavam no ar (produção conferida),
mas navegadores antigos repetiam o cache. **Fix:** `AB_MAP_VERSION` versiona a chave do
cache **e** a URL (`?v=`), invalidando sessionStorage + HTTP/CDN. Bump ao mudar o JSON.

**Ruas dentro do lote:** removida a renderização do nome de rua **dentro** do polígono do
lote em zoom alto (ficava só nos eixos de rua, acima dos lotes, e no card). Atende
"o nome das ruas não precisa aparecer dentro do lote".

**Limite de fonte de dados (importante):** este DXF é, na prática, **lotes vetoriais
limpos (`REGIAO_LOTES`) + um underlay do PDF** (`PDF_Solid Fills`, ~24 mil hachuras).
Consequências verificadas:
- **Quadras:** `DB2 QUADRAS` só tem polígono fechado para **11/16** quadras e não
  particiona os lotes (137 lotes ficam fora de qualquer polígono). Logo não dá para
  derivar a quadra de cada lote com confiabilidade só deste DXF.
- **Áreas verdes/recreativas:** **não têm** polígono fechado próprio no DXF (são cor do
  underlay). Só existem como rótulos + a cor do PDF.
- **~29/383 lotes** estão com polígono trocado pela extração antiga (outliers que
  "vazam" para outra quadra ao filtrar). Corrigir cada um exige a quadra/numeração
  corretas — que não estão limpas neste DXF.

**Para a precisão total que casa 100% com o PDF, é preciso UMA das opções:**
1. **DXF/DWG com camadas limpas:** cada quadra como polígono fechado (layer por quadra),
   cada área verde/recreativa como polígono fechado, e/ou cada lote com atributo de quadra.
2. **Digitalização guiada pelo PDF:** traçar quadras/áreas a partir do PDF aprovado
   (trabalhoso e manual, mas confiável) — o PDF é a fonte visual de verdade.

Sem (1) ou (2), reescrever a malha de quadras = adivinhar = mais erro. Por isso esta
rodada entrega o que é **confiável** (cache + ruas) e deixa a malha de quadras/áreas
explicitamente para a fonte adequada.
