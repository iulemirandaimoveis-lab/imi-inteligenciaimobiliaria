---
name: refactor-safe
description: Use para refatorar código preservando comportamento externo.
---

# Safe Refactor Skill

## Objetivo

Melhorar:
- legibilidade
- organização
- manutenção

Sem alterar:
- comportamento
- contratos
- APIs
- schemas

---

## Processo

1. Mapear impacto
2. Refatorar incrementalmente
3. Validar compatibilidade
4. Executar testes

---

## Regras

- Não mudar comportamento esperado.
- Não misturar refactor com feature.
- Evitar mudanças massivas.
- Priorizar segurança.

---

## Validar

- testes
- lint
- typecheck
- regressões
