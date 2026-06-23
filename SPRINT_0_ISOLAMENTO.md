# SPRINT_0_ISOLAMENTO.md

> **Sprint 0 — Isolamento** do programa _"Alto Bellevue Digital Twin Platform"_.
> Objetivo: criar uma camada de homologação **totalmente isolada** em
> `/[lang]/projetos/alto-bellevue`, atrás de feature flag, **sem qualquer impacto** em
> `/[lang]/imoveis/alto-bellevue` (página comercial).
>
> - **Branch:** `claude/alto-bellevue-digital-twin-o550nd`
> - **Data:** 2026-06-23
> - **Regra-mãe:** ZERO REGRESSÕES · nenhuma feature nova · nenhuma migração.

---

## 1. Resumo

Foi criada uma **camada Digital Twin isolada** sob namespaces próprios, ativada por uma
**feature flag explícita**. Quando a flag está ativa, a rota de homologação é servida
**exclusivamente** por componentes do namespace `digital-twin`. Quando a flag está ausente
ou diferente de `"true"`, a rota mantém **exatamente** o conteúdo legado atual (fallback).

Nenhum componente compartilhado de produção foi alterado. Nenhum contrato de dados de
produção foi modificado. Nenhuma migração foi executada.

---

## 2. Feature flag

```
NEXT_PUBLIC_ALTO_BELLEVUE_DIGITAL_TWIN=true
```

- Lida no **Server Component** da página (`isDigitalTwinEnabled()`), onde `process.env`
  está disponível em runtime.
- A nova experiência **só** renderiza quando o valor é exatamente `"true"` **e** somente na
  rota `/[lang]/projetos/alto-bellevue`.
- Ausente / qualquer outro valor ⇒ comportamento legado (rollback trivial).
- Documentada em `.env.example` com valor padrão `false`.

---

## 3. Arquivos criados

| Arquivo | Papel |
|---------|-------|
| `src/types/digital-twin/index.ts` | Tipos próprios (cópia isolada) — `DigitalTwinLot`, `DigitalTwinModel`, `DigitalTwinStats`, etc. |
| `src/lib/digital-twin/feature-flag.ts` | `isDigitalTwinEnabled()` + nome canônico da flag |
| `src/lib/digital-twin/data-adapter.ts` | Wrapper SOMENTE LEITURA do JSON canônico → tipos do Digital Twin (pura + loader client) |
| `src/data/digital-twin/alto-bellevue.ts` | Metadados do empreendimento (cópia isolada, somente leitura) |
| `src/components/digital-twin/DigitalTwinExperience.tsx` | Orquestrador client-only (loading/erro) |
| `src/components/digital-twin/DigitalTwinHero.tsx` | Hero da homologação (badge "Homologação · Digital Twin") |
| `src/components/digital-twin/DigitalTwinStatsPanel.tsx` | Painel de disponibilidade (totais + por quadra) |
| `src/components/digital-twin/DigitalTwinFoundationNotice.tsx` | Aviso de fundação + roadmap das próximas sprints |
| `src/__tests__/digital-twin/feature-flag.test.ts` | Testes da flag |
| `src/__tests__/digital-twin/data-adapter.test.ts` | Testes do adaptador (sintético + mapa canônico real: 383 lotes) |
| `src/__tests__/digital-twin/isolation.test.ts` | **Regressão:** nenhum import de produção no namespace digital-twin |
| `src/__tests__/digital-twin/production-intact.test.ts` | **Regressão:** produção intacta + flag-gating na homologação |
| `SPRINT_0_ISOLAMENTO.md` | Este documento |

## 4. Arquivos alterados

| Arquivo | Alteração | Risco |
|---------|-----------|-------|
| `src/app/[lang]/(website)/projetos/alto-bellevue/page.tsx` | Import da flag + experiência DT; `if (isDigitalTwinEnabled()) return <DigitalTwinExperience/>` antes do conteúdo legado | Baixo — o caminho legado permanece byte-idêntico |
| `.env.example` | Seção "FEATURE FLAGS" com a nova flag (padrão `false`) | Nenhum |
| `AUDITORIA_ALTO_BELLEVUE.md` | Limpeza de um caractere espúrio no fim do arquivo | Nenhum |

> **Não foram tocados:** `imoveis/[slug]/page.tsx`, `SubdivisionLotMap`,
> `AltoBellevuePlanView`, nenhum componente em `imoveis/components/*`, nenhuma migração,
> nenhum bucket, nenhum contrato de dados.

---

## 5. Como validar

```bash
# Testes do Digital Twin (15 testes — flag, adaptador, isolamento, produção intacta)
npx jest --forceExit --maxWorkers=2 src/__tests__/digital-twin

# Verificações obrigatórias
npm run type-check      # tsc --noEmit  → 0 erros
npm run lint            # next lint     → sem warnings/errors
npm run build           # next build    → sucesso; rota /[lang]/projetos/alto-bellevue gerada
```

Resultado obtido nesta entrega:
- ✅ Jest: **15/15** passam.
- ✅ `type-check`: **0 erros** (projeto inteiro).
- ✅ `lint`: **sem warnings/errors**.
- ✅ `build`: **sucesso** (flag off → homologação prerenderiza o conteúdo legado).

### Validação funcional manual
- Flag **off** (padrão): `/pt/projetos/alto-bellevue` mostra a página legada (hero + mapa atual).
- Flag **on**: `/pt/projetos/alto-bellevue` mostra a experiência Digital Twin (namespace isolado).
- `/pt/imoveis/alto-bellevue`: **inalterada** em qualquer cenário de flag.

---

## 6. Garantias de isolamento (testes de regressão)

- `isolation.test.ts`: varre todos os arquivos do namespace `digital-twin` e garante que
  **nenhum import** referencia `imoveis/components`, `components/maps`,
  `projetos/miguel-marques`, `lib/lots/` ou `hooks/use-ab` (engines/dados de produção).
- `production-intact.test.ts`: garante que `imoveis/[slug]/page.tsx` ainda usa
  `DevelopmentHero`, `DevelopmentGallery`, `SubdivisionLotMap`, `DevelopmentLocation` e o
  caminho `slug === 'alto-bellevue'`, e que **não** referencia o namespace digital-twin.

---

## 7. Riscos residuais

| Risco | Severidade | Observação |
|-------|-----------|------------|
| Flag `NEXT_PUBLIC_*` é inlinada no build | Baixa | Trocar a flag exige **rebuild/redeploy** (não é toggle em runtime). Aceitável para homologação. |
| Adaptador lê a mesma fonte canônica de produção (`public/maps/...json`) | Baixa | **Somente leitura.** Não modifica o arquivo nem o contrato. |
| Fallback legado ainda usa `SubdivisionLotMap` (produção) | Nenhuma | É o comportamento atual preservado; só ativo quando a flag está off. |
| Experiência DT é client-only (`ssr: false`) | Baixa | Hero renderiza imediato; dados carregam no cliente. Sprint posterior pode adicionar SSR. |

---

## 8. Como desativar (rollback)

**Rollback imediato, sem deploy de código:**
```
NEXT_PUBLIC_ALTO_BELLEVUE_DIGITAL_TWIN=false   # (ou remover a variável) + rebuild/redeploy
```
A rota volta instantaneamente ao conteúdo legado. A página comercial nunca foi afetada.

**Rollback total de código (se necessário):**
```bash
git revert <commit-sha-da-sprint-0>
```
Remove a ramificação da flag na página e a camada digital-twin. Como nada de produção foi
alterado, o revert é limpo e sem efeitos colaterais.

---

## 9. Plano de rollback (resumo)

1. **Nível 1 (segundos):** setar a flag para `false` e redeploy → homologação volta ao legado.
2. **Nível 2 (minutos):** `git revert` do commit da Sprint 0 → remove a camada digital-twin.
3. **Verificação:** `/pt/imoveis/alto-bellevue` deve estar idêntico em todos os níveis
   (garantido por `production-intact.test.ts`).

---

## 10. Critérios de conclusão (todos atendidos)

- [x] Produção continua intacta (testes de regressão + nada alterado em `imoveis/*`)
- [x] Homologação isolada (namespace próprio + flag)
- [x] Nenhum componente crítico compartilhado alterado
- [x] Rollback simples (flag + revert documentados)
- [x] Documentação (`SPRINT_0_ISOLAMENTO.md`)
- [x] Testes mínimos de regressão (15 testes verdes)
- [x] `type-check`, `lint`, `build` verdes

> **Aguardando aprovação da Sprint 0** antes de iniciar Sprint 1 (mídia), georreferenciamento,
> visual premium ou qualquer evolução "Graff Estate level".
