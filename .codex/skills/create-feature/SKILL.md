---
name: create-feature
description: Use para implementar novas funcionalidades de forma incremental, segura e compatível com a arquitetura existente.
---

# Create Feature Skill

## Objetivo

Implementar funcionalidades:
- pequenas
- incrementais
- previsíveis
- seguras
- compatíveis
- sustentáveis

---

## Processo

1. Entender requisito
2. Identificar impacto
3. Mapear arquivos afetados
4. Planejar implementação mínima
5. Implementar incrementalmente
6. Validar compatibilidade
7. Executar validações
8. Resumir mudanças

---

## Regras

- Não alterar arquitetura sem necessidade.
- Não adicionar dependências sem justificativa.
- Não quebrar compatibilidade.
- Não alterar contratos públicos.
- Não misturar refactor com feature.
- Não criar abstrações prematuras.
- Reutilizar padrões existentes.
- Minimizar mudanças.

---

## Validar

- lint
- testes
- imports
- tipagem
- dead code
- regressões
