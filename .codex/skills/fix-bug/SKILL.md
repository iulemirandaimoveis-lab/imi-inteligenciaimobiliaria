---
name: fix-bug
description: Use para diagnosticar e corrigir bugs sem gerar regressões.
---

# Fix Bug Skill

## Processo

1. Identificar causa raiz
2. Validar impacto
3. Corrigir origem do problema
4. Evitar correção paliativa
5. Adicionar teste de regressão quando possível
6. Validar solução

---

## Regras

- Não mascarar erro.
- Não adicionar workaround desnecessário.
- Não alterar comportamento fora do escopo.
- Não introduzir efeitos colaterais.
- Priorizar simplicidade.

---

## Validar

- testes
- lint
- typecheck
- regressões
- edge cases
