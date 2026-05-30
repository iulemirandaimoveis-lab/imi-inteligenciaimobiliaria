# SigMap — Contexto de IA para o Projeto IMI

Guia de uso do SigMap como ferramenta auxiliar de navegação de código para agentes de IA (Claude, Cursor, Copilot).

---

## O que é SigMap

SigMap analisa a codebase localmente, extrai assinaturas de símbolos (componentes, funções, hooks, tipos) e gera um mapa compacto da base de código. Isso reduz o custo de tokens em ~99% ao fornecer contexto cirúrgico em vez do código completo.

**Ele não envia código para serviços externos** — processa localmente e grava em `.github/copilot-instructions.md` e `.context/`.

---

## Quando usar SigMap antes de pedir alterações ao Claude

Use `npm run ai:ask` **antes** de qualquer pedido que envolva:

- Alterar lógica de autenticação ou permissões
- Adicionar ou modificar rotas de API
- Alterar modelos de dados / schema Supabase
- Integrar novos serviços externos
- Alterar fluxo de onboarding ou CRM
- Refatorar módulos que você não conhece bem

O contexto gerado em `.context/query-context.md` deve ser incluído na conversa com o agente de IA.

---

## Comandos

```bash
# Mapear toda a codebase (gera .github/copilot-instructions.md)
npm run ai:map

# Localizar arquivos relevantes para uma pergunta específica
npm run ai:ask "Where is authentication handled?"
npm run ai:ask "Where are API routes defined?"
npm run ai:ask "Where are database models or schemas defined?"
npm run ai:ask "Where are external integrations handled?"
npm run ai:ask "Where should I modify the user onboarding flow?"
npm run ai:ask "Which files are related to API authentication?"
npm run ai:ask "Where is WhatsApp integration implemented?"
npm run ai:ask "Where are AI prompts and Anthropic calls defined?"
npm run ai:ask "Where is billing or payment logic handled?"
npm run ai:ask "Where are Supabase RLS policies applied in code?"
```

O contexto gerado é salvo em `.context/query-context.md` e pode ser colado diretamente no chat do Claude.

---

## Módulos críticos do projeto IMI

| Módulo | Localização |
|---|---|
| Autenticação | `src/lib/supabase/`, `src/middleware.ts`, `src/app/api/auth/` |
| Rotas de API | `src/app/api/` |
| Clientes Supabase | `src/lib/supabase/client.ts` (browser), `src/lib/supabase/server.ts` (server) |
| Integração IA (Anthropic) | `src/lib/ai/`, `src/app/api/claude/` |
| WhatsApp | `src/lib/whatsapp/` |
| E-mail | `src/lib/email/` |
| Geolocalização | `src/lib/geo/` |
| Avaliação de imóveis | `src/lib/valuation/`, `src/features/avaliacoes/` |
| Pagamentos | `src/lib/abacate-pay/` ou equivalente em `src/app/api/` |
| Schemas e tipos | `src/types/`, `supabase/migrations/` |

---

## Perguntas úteis por tarefa

### Antes de alterar autenticação
```
npm run ai:ask "Which files handle session, JWT, or Supabase auth?"
```

### Antes de adicionar endpoint de API
```
npm run ai:ask "Where are API routes defined and what middleware is applied?"
```

### Antes de alterar schema do banco
```
npm run ai:ask "Where are database models or schemas defined?"
```

### Antes de modificar integração com IA
```
npm run ai:ask "Where are AI prompts and Anthropic calls defined?"
```

### Antes de alterar onboarding
```
npm run ai:ask "Where should I modify the user onboarding flow?"
```

---

## Avisos de segurança

> **Nunca inclua** nas perguntas ao SigMap ou ao agente de IA:
> - Chaves de API, tokens ou secrets
> - Dados pessoais de usuários (CPF, email, telefone reais)
> - Credenciais de banco de dados
> - Conteúdo do `.env.local`

O arquivo `.github/copilot-instructions.md` gerado pelo SigMap contém apenas assinaturas de código (nomes de funções, componentes, hooks) — **não contém valores de variáveis de ambiente nem dados sensíveis**.

---

## Workflow recomendado com Claude Code

1. Abra o terminal na raiz do projeto
2. Execute `npm run ai:ask "sua pergunta aqui"` para localizar os arquivos relevantes
3. Leia o arquivo `.context/query-context.md` gerado
4. Inclua o conteúdo do contexto na sua conversa com o Claude
5. Peça a alteração informando exatamente **quais arquivos** devem ser modificados

Isso reduz hallucinations e garante que o agente trabalhe nos arquivos corretos.

---

**Última atualização**: 2026-05-30
