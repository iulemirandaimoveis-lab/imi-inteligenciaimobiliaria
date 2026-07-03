# Completion: IMI Supreme Vision — Fase 1 (Auditoria de Descoberta)

**Data**: 2026-07-02 (re-verificação: 2026-07-03)
**Branch**: `claude/imi-intelligence-platform-l1t53q`

## O que foi feito
- Verificado que o prompt "IMI Supreme Vision Execution Mode" nunca havia sido executado
  (branch designado idêntico ao main, sem PR, sem menções em commits/completions).
- Executada a Fase 1 (descoberta): varredura do repositório mapeando ~230 rotas de API,
  engines de inteligência, sistemas ocultos/desligados, dados sintéticos e fragmentações.
- Produzido `docs/imi-supreme-vision.md` — inventário completo + plano de execução em 4 fases
  com alvos por arquivo (conforme regra do CLAUDE.md de plano explícito antes de mudanças amplas).
- Re-verificação profunda antes de tocar código: 3 achados corrigidos no documento (abaixo).

## Achados principais (após re-verificação de 2026-07-03)
- Dois engines de mapa em paralelo: MapLibre é o padrão, mas `PropertyMap.tsx` carrega
  `mapbox-gl` via import dinâmico quando há token — consolidação é decisão da Fase 2.
  (Correção: a auditoria inicial o marcou erroneamente como dependência morta.)
- Cópias paralelas divergentes e AMBAS vivas: `src/modules/imoveis/*` (site público) vs
  `src/components/backoffice/imoveis/*` (backoffice) — unificar exige extrair núcleo comum.
- Digital Twin do Alto Bellevue pronto atrás da flag `NEXT_PUBLIC_ALTO_BELLEVUE_DIGITAL_TWIN`.
- Página `/inteligencia` usa tabela estática hardcoded como "mercado Brasil" — mas o
  `DataSourceBadge` já rotula a origem ("Estimativa IMI"); a lacuna é fonte de dados real.
- 662 marcadores TODO/FIXME em `src/`.
- CADAM (geração paramétrica CAD) funcional mas invisível na navegação.

## Próximos passos
- Itens 1.2 (unificação domínio imóveis) e 1.3 (MediaUploaders) em PRs dedicados com
  UI_REGRESSION_POLICY; 1.4 (triagem de TODOs) incremental.
- Fases 2–4 (Map Intelligence Layer, experiências proprietárias, capacidades de mercado)
  detalhadas no documento estratégico.
