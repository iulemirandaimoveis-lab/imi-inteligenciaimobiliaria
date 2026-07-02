# REFACTOR_ROADMAP — Roteiro de Refatoração

> Princípio: refatoração **incremental**, acoplada a trabalho de feature, com validação antes/depois. Nunca big-bang.
> Cada item: risco / complexidade / ganho / estratégia de rollback.

---

## Fila Priorizada

### R-01 · Decompor páginas monolíticas (contínuo, ALTA)
- **Alvos por ordem**: `AltoBellevuePlanView.tsx` (160KB) → `backoffice/tracking/page.tsx` (104KB) → `imoveis/[id]/editar/page.tsx` (104KB) → `imoveis/explorer/page.tsx` (96KB).
- **Estratégia**: extrair por seção visual (header, filtros, lista, painel) mantendo o estado no pai; um PR por página; screenshot antes/depois (UI_REGRESSION_POLICY).
- Risco: MÉDIO · Complexidade: MÉDIA · Ganho: bundle −30-50% na rota, revisão de PR viável. Rollback: revert do PR (sem migração de dados).

### R-02 · Quick wins de qualidade (1 dia, BAIXO risco)
1. Remover `continue-on-error` do job lint (lint hoje está limpo).
2. `MotionConfig reducedMotion="user"` no provider raiz (A-01).
3. Corrigir F-01 (senha temporária) e o `<img>` sem alt.
4. Remover `jsonwebtoken` e `ua-parser-js` após grep de confirmação.
5. Unificar `X-Frame-Options` (F-03).

### R-03 · Rate limit nas rotas públicas de escrita (2-3h, BAIXO risco)
`contact`, `consultation`, endpoints de lead — `limiters.publicForm(ip)`. Ganho: anti-spam/custo. Rollback: remover a chamada.

### R-04 · Padronizar `getUser()` para autorização (mecânico, BAIXO)
Auditar `grep -rn getSession src/app/api` e trocar onde decide acesso (F-02).

### R-05 · E2E dos 3 fluxos críticos + axe (1-2 dias, MÉDIO ganho alto)
Login IMI → mapa → carrinho → proposta; contato público; login backoffice → dashboard. Rodar no CI com `--project=chromium` para não estourar tempo.

### R-06 · Investigar/remover `mapbox-gl` (meio dia, MÉDIO)
Confirmar que tiles/styles não dependem do runtime mapbox; remover dep + limpar CSP se aplicável.

### R-07 · Lighthouse CI com budget existente (meio dia)
`lighthouse-budget.json` já existe; ligar `lhci` nas 5 rotas-chave (PERFORMANCE_REPORT §Plano).

### R-08 · Consolidação de ícones/animação (contínuo, BAIXA prioridade)
Código novo: lucide + framer only. Migrar heroicons/gsap apenas ao tocar no arquivo.

## Não Fazer (anti-roadmap)

- ❌ Reescrever o sistema de mapas — funciona, tem histórico de calibração fina.
- ❌ Renomear migrations antigas.
- ❌ Trocar SWR por outra lib de estado.
- ❌ Unificar `/backoffice` e `/users` sem decisão de produto (D-07).

## Processo por Item

1. Ler `.memory/PROJECT_STATE.md` + doc do domínio.
2. Declarar arquivos afetados e por quê (regra do CLAUDE.md).
3. Executar com gates: type-check, lint, jest; screenshot para UI.
4. Registrar em DECISION_LOG + atualizar TODO_MASTER + `.memory/CHANGE_RECEIPT.md`.

---
**Última atualização**: 2026-07-02
