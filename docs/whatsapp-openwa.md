# Notificações WhatsApp via OpenWA

Integração de notificações do IMI Console com o gateway **OpenWA**
(github.com/rmyndharis/OpenWA).

> ⚠️ **Aviso importante**: o OpenWA envia mensagens via automação **NÃO oficial**
> do WhatsApp Web (`whatsapp-web.js`/`baileys`). Isso **viola os Termos de Serviço
> da Meta** e o número usado **pode ser banido** a qualquer momento. Use um número
> dedicado e aceite esse risco. A alternativa compatível é a WhatsApp Cloud API oficial.

## Arquitetura

O OpenWA é um **serviço separado** (Docker/NestJS) — não é um pacote do app.
O IMI Console apenas **chama a API HTTP** do gateway:

```
IMI Console (Next.js)  ──HTTP──>  OpenWA gateway (Docker)  ──>  WhatsApp Web
   src/lib/notifications/whatsapp.ts        porta 2785
```

## 1. Subir o gateway OpenWA

```bash
git clone https://github.com/rmyndharis/OpenWA
cd OpenWA
docker compose up -d        # sobe na porta 2785 por padrão
```

Depois, abra o painel do gateway, crie uma **sessão** e **escaneie o QR Code**
com o WhatsApp do número que enviará as notificações. Gere uma **API Key**.

## 2. Configurar o app

Defina as variáveis de ambiente (Vercel → Project Settings → Environment Variables):

| Variável | Exemplo | Descrição |
|---|---|---|
| `OPENWA_BASE_URL` | `https://wa.seudominio.com` | URL pública do gateway |
| `OPENWA_API_KEY` | `sk_...` | Header `X-API-Key` |
| `OPENWA_SESSION` | `default` | Id da sessão/instância |
| `OPENWA_DEFAULT_DDI` | `55` | DDI p/ números sem código de país |

Se `OPENWA_BASE_URL`/`OPENWA_API_KEY` ficarem vazias, as notificações viram
**no-op** (não quebram nada).

## 3. O que dispara notificação

| Evento | Quem recebe | Origem |
|---|---|---|
| Proposta **enviada** | Responsável do produto (owner/manager do projeto) | `POST /api/users/proposals` |
| Proposta **aprovada/rejeitada** | Corretor que criou a proposta | `PATCH /api/users/proposals/[id]` |

Os telefones vêm de `imi.users.phone`. Cadastre os números na gestão de usuários.

## Como funciona o envio

`src/lib/notifications/whatsapp.ts`:
- `toChatId(phone, ddi)` → normaliza para `<digits>@c.us`.
- `POST {BASE_URL}/api/sessions/{SESSION}/messages/send-text` com `{ chatId, text }`.
- Best-effort, timeout de 8s, nunca lança no caminho da request.

`src/lib/notifications/proposal-notifications.ts` resolve destinatários e compõe
as mensagens (PT-BR).
