# Auditoria Final — Mapa Interativo Alto Bellevue

> Relatório vivo. Atualizado a cada etapa da refatoração do mapa.
> URL de produção: `https://www.iulemirandaimoveis.com.br/pt/imoveis/alto-bellevue`
> Componente: `src/app/[lang]/(website)/imoveis/components/AltoBellevuePlanView.tsx`
> Fonte canônica: `public/maps/alto-bellevue-lots.json` (383 lotes)

---

## 0. Status da auditoria

| Etapa | Estado |
|---|---|
| Diagnóstico técnico (código + geometria) | ✅ concluído |
| Pipeline de validação geométrica (point-in-polygon) | ✅ concluído |
| Áreas comuns clicáveis (bottom sheet) | ✅ concluído |
| Rede de segurança de contenção no renderer | ✅ concluído |
| Zoom/LOD + legibilidade de labels | 🟡 em andamento |
| Fullscreen/app mobile | 🟡 revisão |
| **Reposicionar portaria (coords exatas)** | ⛔ **bloqueado: requer CAD** |
| **Reconstruir Quadra O** | ⛔ **bloqueado: requer CAD** |
| **Recolocar lote B-24 (coords exatas)** | ⛔ **bloqueado: requer CAD** |
| Prints mobile/desktop antes/depois | ⏳ pendente |
| Confirmação de produção | ⏳ pendente |

---

## 1. Arquivos usados (fontes)

| Fonte | Status no repositório |
|---|---|
| `public/maps/alto-bellevue-lots.json` (canônica, 383 lotes + contexto urbano) | ✅ presente |
| `public/data/alto-bellevue-prices.json` (tabela comercial, 384 entradas) | ✅ presente |
| `public/data/alto-bellevue-lots.json` (legado corrompido, 426) | ⚠️ presente, **não usado** |
| **PDF oficial da planta** | ⛔ **ausente** (só print JPG de baixa resolução) |
| **DWG** | ⛔ **ausente** |
| **DXF** | ⛔ **ausente** |

> **Bloqueio de origem-de-verdade:** o briefing exige que o PDF/DWG/DXF sejam a
> fonte de verdade. Esses arquivos **não estão no repositório**. A precisão
> geométrica (portaria, Quadra O, B-24) depende de recebê-los para evitar
> inventar coordenadas. Os itens marcados ⛔ acima ficam pendentes até o anexo.

---

## 2. Divergências detectadas (verificáveis em código)

Medições reproduzíveis via `npm run validate:lots` (point-in-polygon contra o
perímetro oficial de 66 vértices, bbox `x:180–1090, y:125–736`).

| # | Problema | Causa-raiz | Evidência |
|---|---|---|---|
| 1 | **Lote fora do condomínio** | `B-24` (833 m², VENDIDO, R$546.703,84) tem polígono em `x≈1092–1115` — fora do perímetro (maxX=1090). Lote real da tabela comercial, mas geometria importada errada. | `lots outside perimeter: B-24@1104,209` |
| 2 | **Portaria em local errado** | amenity `portaria` em `(600, 773)` — abaixo do perímetro (maxY=736). Flutua no vazio. | `amenities outside: portaria@600,773` |
| 3 | **Área de lazer mal posicionada** | amenity `lazer` em `(600, 411)` — cai sobre via/recuo, sem polígono próprio. | `amenities outside: lazer@600,411` |
| 4 | **Quadra O incompleta** | apenas 3 lotes (O-01, O-02, O-03) na fonte canônica. | `by quadra … O:3` |
| 5 | **Zoom poluído** | LOD existia, mas área+testada+nº+rua podiam empilhar; labels de rua e dimensões competiam. | screenshots mobile |
| 6 | **Áreas comuns não clicáveis** | amenities renderizadas com `pointerEvents:none`, sem painel. | código |
| 7 | Divergência planta × tabela | `D-15` tem preço mas não existe na planta canônica. | `pricedNotInMaps: D-15` |

Distribuição por quadra (canônica):
`A:25 B:20 C:13 D:24 E:38 F:27 G:21 H:45 I:16 J:24 K:32 L:24 M:27 N:31 O:3 P:13`
→ total **383** ✓.

---

## 3. Correções realizadas (esta entrega)

### 3.1 Pipeline de validação geométrica — `scripts/validate-lots.mjs`
- Adicionado teste **point-in-polygon** de contenção no perímetro oficial.
- Reporta lotes fora do perímetro, amenities fora e entrada fora (esperada).
- O gate (`exit 1`) agora também falha quando há **qualquer lote fora do
  perímetro** — regressão fica barrada automaticamente.

### 3.2 Áreas comuns clicáveis — `AltoBellevuePlanView.tsx`
- Amenities viram alvo de toque confortável (hit-area mín. ~22px) e abrem um
  **bottom sheet** premium: título, subtítulo, descrição, função, localização e
  CTAs **"Ver no mapa"** (centraliza + aproxima) e **"Falar com especialista"**
  (WhatsApp contextual).
- Conteúdo **data-driven** (`AMENITY_INFO`), com fallback para novos ids — quando
  o CAD trouxer piscina/igreja/coworking/etc., basta adicioná-los em `amenities`.

### 3.3 Rede de segurança de contenção (renderer)
- O mapa **nunca desenha** um lote cujo polígono e centroide caiam totalmente
  fora do perímetro (ex.: B-24). Remove o bug visual sem inventar coordenadas; o
  lote volta a aparecer automaticamente quando reposicionado corretamente.

---

## 4. Pendências (requerem CAD oficial)

1. **Portaria** — extrair posição real do PDF/DWG/DXF e gravar em `amenities`.
2. **Quadra O** — comparar com o CAD; confirmar nº de lotes, numeração, metragens,
   testada/profundidade, orientação e origem; corrigir geometria.
3. **B-24** — recolocar nas coordenadas reais dentro do perímetro (lote vendido,
   833 m²) ou confirmar a quadra/numeração corretas.
4. **Área de lazer e demais equipamentos** — polígonos próprios a partir do CAD.
5. **Nomes de ruas** — conferir os 16 labels contra o DXF (camada de textos) e
   alinhar grafia/eixo/curvatura.
6. **D-15** — resolver divergência planta × tabela comercial no backoffice.

---

## 5. Checklist de validação (briefing §8)

- [ ] Existem exatamente 383 lotes — *383 na fonte; B-24 fora do perímetro pendente de CAD.*
- [x] Nenhum lote **renderizado** fora do condomínio (rede de contenção).
- [ ] Quadra O correta — *requer CAD.*
- [ ] Portaria no local correto — *requer CAD.*
- [ ] Ruas com nomes corretos — *requer conferência no DXF.*
- [x] Áreas comuns clicáveis.
- [ ] Fullscreen mobile como app — *em revisão.*
- [x] Zoom com hierarquia (LOD baixo/médio/alto) — *base ok, refinamento em curso.*
- [x] Lotes vendidos/disponíveis/negociação com status correto.
- [ ] CTA WhatsApp não cobre interação crítica — *a validar em prints.*
- [x] Painel de lote funciona no mobile.
- [x] Painel de área comum funciona no mobile.
- [ ] Sem sobreposição grave de textos — *refinamento de LOD em curso.*
- [ ] Produção reflete a versão corrigida — *pendente deploy.*
- [ ] Cache/CDN/build verificados — *pendente.*
- [x] Relatório final em markdown gerado (este arquivo).

---

## 6. Evidência reproduzível

```bash
npm run validate:lots     # relatório de consistência + contenção no perímetro
npx jest src/__tests__/lib/lots/alto-bellevue.test.ts   # 14/14 testes
```

Saída-chave atual:
`fonte canônica ✗ COM PROBLEMAS (esperado 383, encontrado 383, dup 0, poly inválido 0, fora do perímetro 1)`
→ o único bloqueio é **B-24 fora do perímetro**, que será resolvido com o CAD.
