# NEXT_TASK — Próxima Tarefa

> Atualize ao encerrar cada sessão: o que vem a seguir, com contexto suficiente para começar frio.

**Atualizado**: 2026-07-02

## Próxima tarefa recomendada

**T-23 / F-09 (P0, REQUER APROVAÇÃO DO DONO)** — `src/app/api/proposals/respond/route.ts`:
1. Verificar no banco a policy RLS de UPDATE em `proposals` para papel anônimo.
2. Se anônimo consegue UPDATE: exigir token da proposta (mesmo mecanismo de `propostas/[token]/track`) antes de mutar. Alinhar o front público que consome a rota.
3. Teste de contrato: respond sem token → 401/403.

**Alternativa sem aprovação**: T-02b — triar `tracker/qrcode`, `analytics/vitals`, `webhooks/instagram`, `proposals/track`, `propostas/[token]/track` (classificar: público por design / falta RL / falta auth) e aplicar RL onde couber.

## Bloqueios/aguardando

- T-23 muda contrato do front público → aprovação explícita.
- T-03b (`continue-on-error` em security/build no CI) → decisão do dono.
- Aplicação de migrations no banco exige aprovação explícita (regra CLAUDE.md).
- E2E no CI (T-10) depende de decisão: Supabase local vs mocks.

## Contexto que se perde fácil

- O job de CI `typecheck` é o único gate de tipos (build ignora) — nunca desativar.
- Lint passou limpo em 2026-07-02; se T-03 falhar no futuro é regressão nova, não histórico.
