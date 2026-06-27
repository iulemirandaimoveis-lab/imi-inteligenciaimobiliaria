# Auditoria CTO — Plataforma IMI (/users + Mapas)

**Data:** 2026-06-27
**Escopo:** App `/users`, mapas Alto Bellevue & Jazz Boulevard, vista realista em `/projetos`, triagem de PRs.

---

## 1. Diagnóstico do "mapa não aparece" no /users

Investigação ponta a ponta (código + banco + deploy):

| Camada | Estado | Conclusão |
|---|---|---|
| Código `/users/map` (commit `0a36ddd`) | Resolve config por slug, JSON existe, âncora existe | ✅ correto |
| Banco `imi.projects` | 1 projeto: `alto-bellevue` (slug correto) | ✅ correto |
| Vínculos `imi.project_users` | 11 usuários → Alto Bellevue (id válido) | ✅ correto |
| Papéis (`BROKER`, `TEAM_MANAGER`, etc.) | Todos têm `projects.read` + `availability.read` | ✅ correto |
| Deploy de produção (`youthful-fermi`) | `target=production`, READY, commit `0a36ddd` (#329) | ✅ no ar |

**Com código + dados atuais, o estado vazio "Mapa ainda não disponível para _este empreendimento_" é tecnicamente irreproduzível.** O texto em negrito do print é o _fallback_ `active?.name ?? 'este empreendimento'` → significa `projects = []` no cliente.

**Causa mais provável:** cache do **PWA/Service Worker** servindo uma versão antiga da página (há histórico documentado disso no #320 — `/pt/users/*` por cache de SW). O `next-pwa` está com `skipWaiting:true`, então normalmente se auto-corrige após um reload, mas pode persistir em alguns dispositivos.

### Correções aplicadas (defesa em profundidade)
1. **`getImiSession` robusto** (`src/lib/imi-auth/server.ts`): troca o `select` aninhado (`project_users → projects`) por **duas leituras simples** (ids → linhas). O embed do PostgREST retorna `null` silenciosamente quando o relacionamento sai do schema cache ou uma RLS tropeça na tabela juntada — exatamente o sintoma de "projects vazio". Super/Backoffice enxergam o portfólio completo; demais papéis ficam escopados aos seus vínculos.
2. **Bug de RLS corrigido** (`supabase/migrations/20260627_imi_projects_rls_member_fix.sql`): a policy `projects_read` correlacionava o EXISTS na coluna errada (`pu.project_id = pu.id`, auto-referência sempre falsa) — o _fallback_ por **membro de projeto** estava morto. Reescrita para `pu.project_id = projects.id`. ⚠️ **Requer aprovação para aplicar no banco** (regra do CLAUDE.md). Amplia acesso de leitura a membros legítimos; não remove nenhum acesso atual.

> **Ação recomendada para o cliente:** ao validar, forçar atualização do PWA (fechar todas as abas / "Limpar dados do site" / reinstalar o app). Avaliar adicionar versionamento explícito do SW num próximo sprint.

---

## 2. Mapas no /users — Alto Bellevue & Jazz Boulevard

- **Alto Bellevue:** já espelhado (Lotes + Satélite). Reforçado pelo item 1.
- **Jazz Boulevard:** estava **ausente** no /users (não existe em `imi.projects`, não tem âncora de satélite, não estava no viewer). É **vertical** (torres/unidades), não loteamento.

### Entregue
- `/users/map` agora lista **Alto Bellevue + Jazz Boulevard** no seletor.
- Jazz renderiza seu **mapa de disponibilidade próprio** (torre/andar/unidade, modelos flat/studio/comercial) reusando o `JazzBoulevardViewer` canônico do site — **fonte única de dados**, sem duplicação.
- Quando o cliente enviar a coordenada/Plus Code do Jazz, adiciona-se a âncora e a vista de satélite entra automaticamente (mesma mecânica do Alto Bellevue).

---

## 3. Vista realista no /projetos/alto-bellevue (NÃO no /imóveis)

Decisão do cliente: **múltiplas vistas interativas**, cliente escolhe. Migrar para `/imóveis` só após 100% aprovado.

### Entregue (Sprint 1)
- Novo **alternador de vistas** em `/projetos/alto-bellevue`: **Plano de lotes** (vetorial, padrão — sem regressão) ↔ **Satélite** (imagem aérea real Esri, navegável, render-like).
- Componente genérico `src/components/maps/AerialSatelliteMap.tsx` (sem dependência de tema).

### Próximo (Sprint 2) — overlay georreferenciado
Os lotes são polígonos em espaço SVG (`viewBox 0 0 1200 821.86`), **não** geográfico. Para "lotes clicáveis sobre o satélite" (render BIM) é preciso uma transformação afim SVG→lat/lng a partir de ≥3 pontos de controle (`scripts/cad/geo/`). Plano:
1. Coletar 3–4 pontos de controle (cantos do terreno no satélite ↔ coordenadas SVG).
2. `npm run geo:solve` → `control-points.json` + matriz afim.
3. Camada de vista **"Satélite + Lotes"** (MapLibre com polígonos GeoJSON projetados), somando-se a "Plano" e "Satélite".

---

## 4. Triagem dos 31 PRs abertos (visão CTO)

> Recomendação. Nenhum merge/close sem o seu OK explícito (regra do CLAUDE.md).

**Provavelmente OBSOLETOS / superados** (features já entregues em `main` por outra via, ou muito antigos):
- #310 `validate:map` — verificar se já coberto por `validate:lots`.
- #284 hotfix `setPointerCapture` iOS — verificar se o mapa atual já não usa o trecho.
- #174, #137, #121, #104, #101, #98, #94, #91, #86, #80, #75, #73, #62, #54, #48, #47, #46, #35, #34, #31, #28, #1 — PRs antigos de UI/analytics/ícones/about; alto risco de conflito com `main`. Revisar 1 a 1 para fechar.

**Candidatos a CONCLUIR (valor real, alinhados ao roadmap):**
- #69 / #68 / #65 / #55 — **Jazz Boulevard** (LP, simulador, listagem, scrollytelling). Consolidar o melhor num PR único e mesclar.
- #143 — analytics dashboard + geo tracking server-side.
- #273 — bloquear `/construtoras` (segurança/produto).

**Plano:** abrir um PR-guarda-chuva "Jazz Boulevard consolidado", mesclar #273, e fechar em lote os obsoletos com comentário explicativo.

---

## 5. Roadmap de Sprints

| Sprint | Entrega | Status |
|---|---|---|
| **1** | Robustez `getImiSession`; fix RLS (migration); **Jazz no /users**; **vista Satélite no /projetos**; auditoria | ✅ este PR |
| **2** | Overlay georreferenciado (lotes sobre satélite); âncora do Jazz quando o cliente enviar; versionamento do SW/PWA | ⏳ |
| **3** | Triagem executiva dos 31 PRs (consolidar Jazz, mesclar úteis, fechar obsoletos) | ⏳ |
| **4** | Polimento iOS/HIG do /users (transições, haptics-like, skeletons, empty states) — paridade total mobile | ⏳ |
| **5** | Migração da vista aprovada de `/projetos` → `/imóveis` | ⏳ (após aprovação) |

---

## Verificação (Sprint 1)
- `npx tsc --noEmit` → **0 erros** (arquivos de produção).
- `/users/map`: seletor mostra Alto Bellevue (Lotes/Satélite) + Jazz Boulevard (torres/unidades).
- `/projetos/alto-bellevue`: alternador Plano ↔ Satélite.
- Migration RLS: revisar e aplicar com aprovação (`mcp Supabase apply_migration` ou via dashboard).
