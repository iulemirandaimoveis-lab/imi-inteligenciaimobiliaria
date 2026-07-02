# DEPENDENCY_GRAPH — Grafo de Dependências Internas

> Direções permitidas de import entre camadas. Violações = dívida imediata.
> Complementa `docs/DEPENDENCIES.md` (pacotes npm) e `docs/COMPONENT_RELATIONS.md` (acoplamentos).

---

## Camadas (de baixo para cima)

```
packages/@imi/*  (motor CAD/geo/domínio — NÃO importa de src/)
      ▲
src/types, src/config, src/utils        (folhas — não importam de cima)
      ▲
src/lib/*        (núcleo: supabase, rate-limit, imi-auth, ai, intelligence…)
      ▲
src/services/*   (integrações externas: brazil-apis, locations…)
      ▲
src/hooks/*  ·  src/features/*  ·  src/components/*
      ▲
src/app/*        (rotas — topo; ninguém importa de src/app)
```

## Regras

1. **`src/app` é topo absoluto** — nenhum módulo fora de `app/` importa de `app/`. (Exceção histórica: componentes de página em `app/[lang]/(website)/imoveis/components/` são reutilizados entre rotas do próprio `app/` — aceito.)
2. **`packages/@imi/*` são independentes** — qualquer import de `src/` dentro deles quebra o isolamento do motor CAD. Verificação: `grep -rn "from '@/" packages/`.
3. **`src/lib` não importa de `src/components`/`src/features`** — lógica não conhece UI.
4. **Client/server boundary**: módulos com `'use client'` nunca importam `src/lib/supabase/admin.ts` nem `src/lib/imi-auth/server.ts` (que é `server-only`).
5. **Wrappers primeiro**: rotas novas usam `apiHandler` (`src/lib/api-helpers.ts`) em vez de re-implementar auth/RL.

## Pontos de alto fan-in (mexer = testar amplo)

| Módulo | Consumidores (aprox.) |
|---|---|
| `src/lib/supabase/*` | todo acesso a dados |
| `src/lib/rate-limit.ts` | rotas públicas + AI + apiHandler |
| `src/lib/api-helpers.ts` (apiHandler) | dezenas de rotas (avaliacoes, pix, plantao, frota, developments, financeiro…) |
| `src/components/ui/*` | os 3 mundos de UI |
| `sonner` (GlobalToaster no layout raiz) | 140 arquivos |
| `src/lib/imi-auth/server.ts` | todo o console /users |

## Verificações periódicas (rodar por sprint)

```bash
# packages não importam de src
grep -rn "from '@/" packages/ && echo "VIOLAÇÃO" || echo OK
# admin client nunca em client components
grep -rln "supabase/admin" $(grep -rl "'use client'" src --include="*.tsx" --include="*.ts") 2>/dev/null || echo OK
# imports circulares (aproximação): madge quando disponível
# npx madge --circular --extensions ts,tsx src/
```

Estado 2026-07-02: as três verificações acima passam (varredura manual).

---
**Última atualização**: 2026-07-02
