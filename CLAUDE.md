# CLAUDE.md

**Quick-start guide for Claude Code - Complete details in linked docs**

---

## Project Overview

Next.js application for Plataforma de inteligência imobiliária com análise de mercado

**Tech Stack**: Next.js, Supabase, TypeScript, Tailwind CSS, Anthropic SDK

---

## Session Start Protocol ⚡

**MANDATORY** at start of each session:

```bash
# 0. Load persistent memory (~400 tokens) — estado vivo do projeto
✓ .memory/PROJECT_STATE.md             # ⚠️ READ FIRST — saúde, pendências, invariantes
✓ .memory/NEXT_TASK.md                 # Próxima tarefa com contexto pronto
✓ .memory/KNOWN_PATTERNS.md            # Padrões P1-P12 / anti-padrões A1-A10

# 1. Load essential docs (~800 tokens - 2 min read)
✓ .claude/COMMON_MISTAKES.md           # ⚠️ CRITICAL - Read FIRST
✓ .claude/UI_DESIGN_STANDARDS.md       # ⚠️ OBRIGATÓRIO para qualquer UI/front-end
✓ .claude/QUICK_START.md               # Essential commands
✓ .claude/ARCHITECTURE_MAP.md          # File locations
✓ .claude/ALTO_BELLEVUE_LOCATION.md    # ⚠️ NEVER change location/tour URLs
✓ .claude/UI_REGRESSION_POLICY.md     # ⚠️ OBRIGATÓRIO antes de qualquer mudança de UI/layout
```

**At task completion (memory update — OBRIGATÓRIO):**
- Update `.memory/PROJECT_STATE.md` (saúde/pendências) + `.memory/NEXT_TASK.md`
- Append em `.memory/CHANGE_RECEIPT.md`; sobrescrever `.memory/SESSION_MEMORY.md`
- Bug com causa-raiz → `.memory/FAILURES.md` · Lição >1h → `.memory/LEARNINGS.md`
- Decisão arquitetural → `docs/DECISION_LOG.md` + índice `.memory/ARCHITECTURE_DECISIONS.md`

**At task completion:**
- Create completion doc in `.claude/completions/YYYY-MM-DD-task-name.md`
- Use template: `.claude/templates/completion-template.md`
- Move session file to `.claude/sessions/archive/` (if created)
- Update docs as needed (see `.claude/DOCUMENTATION_MAINTENANCE.md`)

**Then load task-specific docs** (~500-1500 tokens):
- See `docs/INDEX.md` for navigation guide

**⚠️ NEVER auto-load:**
- Files in `.claude/completions/` (0 token cost)
- Files in `.claude/sessions/` (0 token cost)
- Files in `docs/archive/` (0 token cost)
- Only load when user explicitly requests

---

## Quick Start Commands

```bash
# Add your common commands here
# npm run dev
# npm test
# npm run build
```

**See**: `.claude/QUICK_START.md` for complete command reference

---

## Documentation Navigation

**📋 Master Index**: `docs/INDEX.md` - Complete navigation with token costs

### Core References
- **Common Mistakes**: `.claude/COMMON_MISTAKES.md` ⚠️ **MANDATORY**
- **Quick Start**: `.claude/QUICK_START.md`
- **Architecture Map**: `.claude/ARCHITECTURE_MAP.md`
- **Maintenance**: `.claude/DOCUMENTATION_MAINTENANCE.md`

### Project Intelligence System (2026-07-02)
- **Estado vivo**: `.memory/PROJECT_STATE.md` · **Fila**: `docs/TODO_MASTER.md`
- **Mapa**: `docs/PROJECT_MAP.md` · **Arquitetura**: `docs/ARCHITECTURE.md` · **APIs**: `docs/API_MAP.md`
- **Auditorias**: `docs/SECURITY_AUDIT.md`, `docs/PERFORMANCE_REPORT.md`, `docs/ACCESSIBILITY_REPORT.md`, `docs/RESPONSIVE_AUDIT.md`
- **Dívida/plano**: `docs/TECH_DEBT.md`, `docs/KNOWN_ISSUES.md`, `docs/REFACTOR_ROADMAP.md`
- **Decisões**: `docs/DECISION_LOG.md` · **Acoplamentos**: `docs/COMPONENT_RELATIONS.md` · **Testes**: `docs/TESTING_STRATEGY.md`

---

---

## SigMap — Localização de Código com IA

**Antes de alterar qualquer código**, use SigMap para localizar os arquivos relevantes:

```bash
# Mapear toda a codebase
npm run ai:map

# Localizar arquivos por pergunta
npm run ai:ask "Where is authentication handled?"
npm run ai:ask "Where are API routes defined?"
npm run ai:ask "Where are database models or schemas defined?"
npm run ai:ask "Where are external integrations handled?"
```

O contexto gerado fica em `.context/query-context.md` — inclua-o na conversa antes de pedir alterações.

**Regras para agentes de IA neste projeto:**
- Sempre explicar **quais arquivos** serão alterados e **por quê** antes de qualquer mudança
- Nunca fazer alterações amplas sem um plano explícito e aprovado
- Preservar a arquitetura existente (App Router, Supabase RLS, server/client split)
- Não alterar autenticação, billing ou banco de dados sem aprovação explícita
- Nunca commitar `.env.local` ou qualquer arquivo com secrets
- Priorizar segurança e testes antes de features

**Guia completo**: `docs/ai-context.md`

---

**Last Updated**: 2026-07-02
**Optimized with**: [Claude Token Optimizer](https://github.com/nadimtuhin/claude-token-optimizer)
