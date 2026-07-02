# LEARNINGS — Aprendizados Permanentes

> Lições que economizam horas. Adicione quando algo custar >1h para descobrir.

---

## Infra/Build

- **L-01** O build precisa de `--max-old-space-size=7168`; type-check OOM no Vercel → por isso `ignoreBuildErrors`. O gate de tipos é o CI. Não "consertar" isso removendo a flag sem resolver a memória primeiro.
- **L-02** Jest completo roda em ~12s — não há desculpa para não rodar antes de commit.
- **L-03** `next lint --quiet` está limpo desde 2026-07-02; o `continue-on-error` no CI é vestigial.

## Supabase

- **L-04** PostgREST embed aninhado retorna `null` SILENCIOSO quando RLS/schema-cache falha na tabela juntada. Sintoma: "dados vazios" sem erro. Solução: queries separadas (D-03).
- **L-05** Policy RLS pode estar "morta" por bug de correlação (caso real: `pu.project_id = pu.id`). RLS errada não lança erro — só filtra tudo. Testar policies por papel.
- **L-06** Tipos TS devem ser regenerados após cada migration (`supabase gen types typescript`), senão o erro aparece longe da causa.

## PWA/Cliente

- **L-07** Bug "impossível" no cliente (dados corretos no banco, código correto, produção atualizada) = cache de Service Worker até prova em contrário. Pedir "limpar dados do site" antes de debugar horas.
- **L-08** `skipWaiting: true` não garante atualização imediata em iOS.

## Auditoria/Greps (meta-aprendizados)

- **L-09** Grep negativo por "falta auth" em rotas dá falso-positivo em massa — o padrão do projeto autentica inline. Ler a rota.
- **L-10** Referências a env vars sensíveis em .tsx podem ser texto de UI (checklists de configuração) — verificar contexto antes de reportar vazamento.

## Rate limit / Testes

- **L-13** Adicionar rate limit a uma rota quebra testes que chamam o handler várias vezes: o limiter in-memory acumula por chave (`getClientIP` → `'unknown'` sem header). Solução: `x-forwarded-for` único por teste + um teste dedicado que ESPERA o 429 (vira contrato). Caso real: `auth-login.test.ts` 2026-07-02.
- **L-14** O wrapper `apiHandler` (`src/lib/api-helpers.ts`) já faz auth+RL+audit por padrão — antes de acusar rota "sem auth", verificar se ela usa o wrapper (grep por `apiHandler`).

## Build (Next) vs gates locais

- **L-16** `tsc`/`lint`/`jest` NÃO pegam erros de bundling do `next build` (ex.: pacote com jsdom em Server Component → ENOENT de asset). Ao adicionar dependência server-side não-trivial, rodar `next build` de fato. Pacotes jsdom/canvas/nativos em Server Components → `experimental.serverComponentsExternalPackages` (FX-07/A13).

## Banco vs migrations (crítico)

- **L-15** As migrations versionadas NÃO refletem o estado real do banco (há drift aplicado via dashboard). O caso F-09: as migrations sugeriam RLS desabilitada em `proposals`, mas em produção estava habilitada, com policies diferentes e sem `tenant_id`. **Sempre verificar o estado real via MCP** (`pg_policies`, `pg_class.relrowsecurity`, `information_schema.columns`) antes de escrever/aplicar migration de policy/RLS. Uma migration "óbvia" baseada só no repo teria removido `bo_full_proposals` e referenciado coluna inexistente.

## Produto/UX

- **L-11** Elementos sticky escondem CTAs no mobile (caso real: botão de proposta, PR #342). Todo sticky novo: testar com o conteúdo mais longo.
- **L-12** Estado de carrinho/seleção deve sobreviver à troca de vista (plano↔geo↔satélite): estado no pai do alternador (P9).

---
**Atualizado**: 2026-07-02
