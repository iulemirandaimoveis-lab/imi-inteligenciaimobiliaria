# IMI — Regras de Deploy (OBRIGATÓRIO ler antes de qualquer push)

## Projetos Vercel

Existem **2 projetos Vercel** linkados ao mesmo repositório GitHub:

| Projeto | ID | Domínio | Status |
|---------|-----|---------|--------|
| `youthful-fermi` | `prj_nE6k1NpX6Q8uvL8rKcB68Pzp835T` | `youthful-fermi.vercel.app` | ✅ PRODUÇÃO REAL |
| `imi-inteligenciaimobiliaria` | `prj_hFZUe4eprcQYR4AVEX9xnUUQOzxC` | `imi-inteligenciaimobiliaria.vercel.app` | ⚠️ CANCELA DEPLOYS |

## Regra #1: O site de produção é `youthful-fermi`

O domínio `www.iulemirandaimoveis.com.br` aponta para `youthful-fermi`.
O projeto `imi-inteligenciaimobiliaria` existe mas CANCELA todos os deploys automaticamente.

## Regra #2: Worktree branch → main

Estamos trabalhando no worktree `youthful-fermi`. O push é:
```bash
git push origin youthful-fermi:main
```
Isso pusha para a branch `main` do repo, que aciona o deploy no Vercel.

## Regra #3: SEMPRE verificar build local antes de push

```bash
npm run build 2>&1 | tail -20
# Se exit code != 0, NÃO fazer push
```

## Regra #4: SEMPRE verificar deploy após push

```bash
# Via Vercel MCP:
# list_deployments projectId="youthful-fermi" teamId="team_ffkeAKopLLbEJTI8tZqY9Mi6"
# O último deploy deve ter state: "READY"
```

## Regra #5: Se deploy CANCELOU, usar CLI

```bash
npx vercel --prod --yes
```
Isso faz deploy direto sem depender do Git integration.

## Regra #6: `.vercel/project.json` deve apontar para youthful-fermi

```json
{
  "projectId": "prj_nE6k1NpX6Q8uvL8rKcB68Pzp835T",
  "orgId": "team_ffkeAKopLLbEJTI8tZqY9Mi6",
  "projectName": "youthful-fermi"
}
```

## Histórico de problemas

- 24/03/2026: Descoberto que 26 commits dos últimos 3 dias não foram para produção porque o projeto `imi-inteligenciaimobiliaria` cancelava os deploys antes do `youthful-fermi` processar.
- Solução: deploy manual via `npx vercel --prod --yes` + este documento como referência permanente.
