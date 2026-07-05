# Completion: Supreme Vision — funil proprietário completo em produção

**Data**: 2026-07-04/05 · **Sessão**: imi-intelligence-platform (7 PRs merged)

## Entregas (todas em produção, deploy READY verificado)
#346 plano · #347 triagem débito · #349 fix @deprecated · #352 Descoberta por Intenção ·
#354 lotes por perfil · #356 motor híbrido (dados reais) · #359 deep-link ?lote= ·
#361 Match de Cliente no console.

## Funil vivo
Intenção em linguagem natural → ranking nacional (36 bairros reais sobrepondo estimativa,
badge/dots de proveniência) → top lotes reais por perfil → painel do lote aberto no
explorador → simulador/visita/WhatsApp. No console: corretor descreve o cliente → chips →
perfil → top-5 com teto de preço → deep-link em nova aba.

## Padrões que ficam
- Verificação visual sem credenciais: env stub + Playwright (esperar hidratação antes de
  interagir no dev mode). Pegou 3 bugs invisíveis a testes.
- Motor de intenção reutilizável: src/lib/intelligence/intent-engine.ts (D-14).
- Ciclo produção: CI 6/6 → merge squash → deploy READY confirmado no Vercel (DEPLOY_RULES).

## Próximos (fila)
Curar linhas na neighborhood_intelligence (dado, não código) · itens 1.2/1.3/1.6 (refactors
UI-visíveis) · georef fino (aguarda ≥3 GCPs do dono em scripts/cad/geo/control-points.json).
