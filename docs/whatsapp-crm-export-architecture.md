# IMI Backoffice — Feature de Conexão WhatsApp para Exportação CRM (Mano Imóveis / Flow Leads)

> **Versão:** 1.0  
> **Data:** 27/04/2026  
> **Objetivo:** especificação executável (produto + engenharia + segurança + operação) para implementar uma feature de **conexão WhatsApp + seleção manual + exportação Excel/XML**, sem automação de atendimento.

---

## 1) Resumo executivo (visão C-level)

### 1.1 Problema de negócio
A IMI precisa prestar contas para parceiros (primeiro parceiro: **Mano Imóveis**) com dados de leads originados em WhatsApp, mas o CRM do parceiro (**Flow Leads**) não possui integração nativa com este WhatsApp.

### 1.2 Solução proposta
Criar um módulo no backoffice que permita:
1. Conectar um número de WhatsApp dedicado ao processo de captação/relacionamento.
2. Ingerir contatos e mensagens no banco da IMI com trilha de auditoria.
3. Selecionar contatos manualmente (sem bot, sem agente).
4. Exportar lote em **Excel (.xlsx)** e **XML** para envio ao gestor da imobiliária.

### 1.3 Resultado esperado
- Conciliação operacional entre o que entra no WhatsApp e o que foi lançado manualmente no CRM externo.
- Menos erro operacional e mais governança.
- Base pronta para evolução futura (qualificação automática) sem retrabalho estrutural.

---

## 2) Princípios e limites (não-negociáveis)

1. **Sem automação de conversação** nesta fase.
2. **Sem envio em massa** e sem comportamento de spam.
3. **Módulo isolado** do core para evitar regressões no produto atual.
4. **Idempotência obrigatória** na ingestão (eventos duplicados não podem gerar dados duplicados).
5. **Auditabilidade** de exportações (quem exportou, quando, filtros, arquivo).
6. **LGPD by design** (coleta mínima, controle de acesso, retenção, rastreabilidade).

---

## 3) Decisão técnica principal: canal de integração WhatsApp

### 3.1 Alternativas

| Opção | Custo recorrente | Risco de banimento | Esforço técnico | Recomendação |
|---|---:|---:|---:|---|
| WhatsApp Cloud API (oficial Meta) | Médio (por conversa) | Baixo | Médio | **Recomendado para produção estável** |
| Provedor (360dialog/Twilio/Z-API) | Médio | Baixo/Médio (depende) | Baixo | Bom para acelerar |
| Não oficial (Baileys/wppconnect) | Baixo | Alto | Alto contínuo | Apenas MVP interno controlado |

### 3.2 Recomendação executiva
- **Caminho ideal de produção:** API oficial (Cloud API) ou provedor robusto.
- **Se objetivo imediato for custo zero:** usar engine não oficial **somente atrás de gateway interno**, com plano explícito de migração.
- **Não “copiar” API de terceiros** (risco legal, de operação e manutenção).

---

## 4) Arquitetura alvo (com separação de responsabilidades)

```text
[WA Engine (Cloud API ou Baileys)]
          ↓ eventos/webhooks
[WA Gateway Service]
          ↓ payload normalizado
[Ingestion Service]
          ↓
[PostgreSQL]
          ↓
[Backoffice API + UI]
          ↓
[Export Worker/Service]
          ↓
[Arquivo XLSX/XML + histórico de export]
```

### 4.1 Por que esse desenho
- Troca de motor WhatsApp sem quebrar o backoffice.
- Falhas no gateway não derrubam exportação e CRUD.
- Escalabilidade por componente.

---

## 5) Escopo funcional da feature

### 5.1 Tela A — Conexão WhatsApp
- Botão: **Conectar número**.
- Exibição de QR code (se engine exigir).
- Status em tempo real: `disconnected`, `connecting`, `connected`, `reconnecting`, `error`.
- Ação: desconectar sessão.

### 5.2 Tela B — Contatos/Leads WhatsApp
- Tabela com:
  - Nome (se conhecido)
  - Telefone (E.164)
  - Última mensagem
  - Último contato
  - Origem (`whatsapp`)
  - Checkbox para seleção
- Filtros:
  - período
  - novos contatos
  - não exportados
  - por parceiro (Mano Imóveis)

### 5.3 Tela C — Detalhe do contato
- Timeline somente leitura (inbound/outbound).
- Ações:
  - marcar/desmarcar para exportação
  - vincular parceiro
  - adicionar observação interna

### 5.4 Tela D — Exportações
- Criar exportação com parâmetros:
  - formato: `xlsx | xml`
  - período
  - contatos selecionados
  - parceiro destino
- Histórico de exportações:
  - status (`queued`, `processing`, `done`, `failed`)
  - autor
  - timestamp
  - download

---

## 6) Contratos de API (primeira versão)

## 6.1 WA Gateway API (interna)

### `POST /wa/connect`
Inicia sessão e retorna QR se aplicável.

**Response 200**
```json
{
  "status": "connecting",
  "qrCodeBase64": "data:image/png;base64,..."
}
```

### `GET /wa/status`

**Response 200**
```json
{
  "status": "connected",
  "phone": "+5581999999999",
  "lastHeartbeatAt": "2026-04-27T12:00:00Z"
}
```

### `POST /wa/events/message`
Endpoint interno para encaminhar evento normalizado ao serviço de ingestão.

## 6.2 Ingestion API

### `POST /ingest/whatsapp/messages`

**Request**
```json
{
  "provider": "internal-wa-gateway",
  "externalMessageId": "ABGGFlA5FpafAgo6EhM...",
  "externalChatId": "5581999999999@s.whatsapp.net",
  "phone": "+5581999999999",
  "contactName": "João Silva",
  "direction": "inbound",
  "messageType": "text",
  "messageText": "Tenho interesse no imóvel X",
  "eventTimestamp": "2026-04-27T10:00:00Z"
}
```

**Response 202**
```json
{ "accepted": true }
```

## 6.3 Backoffice API

### `GET /backoffice/whatsapp/contacts`
Lista contatos com paginação e filtros.

### `POST /backoffice/whatsapp/exports`
Cria job de exportação.

### `GET /backoffice/whatsapp/exports/:id`
Consulta status.

### `GET /backoffice/whatsapp/exports/:id/download`
Download de arquivo gerado.

---

## 7) Modelo de dados (PostgreSQL)

```sql
create table whatsapp_connections (
  id uuid primary key,
  instance_key text unique not null,
  status text not null,
  connected_phone text,
  provider text not null,
  last_heartbeat_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table contacts (
  id uuid primary key,
  phone_e164 text unique not null,
  name text,
  source text not null default 'whatsapp',
  first_seen_at timestamptz not null,
  last_seen_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table messages (
  id uuid primary key,
  external_message_id text unique not null,
  contact_id uuid not null references contacts(id),
  direction text not null check (direction in ('inbound','outbound')),
  message_type text not null,
  message_text text,
  event_timestamp timestamptz not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create table partners (
  id uuid primary key,
  name text not null,
  external_crm_name text,
  created_at timestamptz not null default now()
);

create table contact_partner_links (
  id uuid primary key,
  contact_id uuid not null references contacts(id),
  partner_id uuid not null references partners(id),
  linked_by_user_id uuid not null,
  linked_at timestamptz not null default now(),
  unique(contact_id, partner_id)
);

create table exports (
  id uuid primary key,
  partner_id uuid not null references partners(id),
  requested_by_user_id uuid not null,
  format text not null check (format in ('xlsx','xml')),
  status text not null check (status in ('queued','processing','done','failed')),
  filters jsonb not null,
  row_count int,
  file_url text,
  error_message text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table export_items (
  id uuid primary key,
  export_id uuid not null references exports(id),
  contact_id uuid not null references contacts(id),
  unique(export_id, contact_id)
);
```

### 7.1 Índices críticos
- `messages(external_message_id)` UNIQUE (idempotência)
- `messages(contact_id, event_timestamp desc)`
- `contacts(last_seen_at desc)`
- `exports(created_at desc)`

---

## 8) Fluxos críticos (passo a passo)

### 8.1 Fluxo de conexão
1. Usuário clica em “Conectar WhatsApp”.
2. Backoffice chama `POST /wa/connect`.
3. Gateway retorna QR.
4. Usuário lê QR.
5. Gateway atualiza estado para `connected`.
6. UI passa a permitir ingestão/exportação.

### 8.2 Fluxo de ingestão
1. Engine recebe mensagem.
2. Gateway normaliza payload.
3. Gateway chama `POST /ingest/whatsapp/messages` com assinatura interna.
4. Ingestion valida schema.
5. Ingestion upsert de contato.
6. Ingestion insere mensagem por `external_message_id` (idempotência).
7. Em duplicidade: responde 202 sem erro fatal.

### 8.3 Fluxo de exportação
1. Usuário seleciona contatos/filtros e formato.
2. API cria registro `exports` com status `queued`.
3. Worker processa em background.
4. Gera arquivo (xlsx/xml), salva em storage privado.
5. Atualiza `exports.status = done` e `file_url`.
6. Usuário faz download.

---

## 9) Regras de validação e normalização

### 9.1 Normalização de telefone
- Remover caracteres não numéricos.
- Converter para E.164 (`+55...`).
- Rejeitar se inválido.

### 9.2 Mensagens
- Suportar inicialmente: `text`.
- Outros tipos armazenar como `message_type=unsupported` + payload cru.

### 9.3 Idempotência
- Chave principal: `external_message_id`.
- Se não houver ID confiável no provider, construir hash determinístico do evento (fallback).

### 9.4 Timezone
- Persistir tudo em UTC.
- Renderizar no front com timezone do usuário/logado.

---

## 10) Segurança, LGPD e governança

1. **RBAC obrigatório**:
   - `admin`: tudo
   - `manager`: listar, selecionar, exportar
   - `operator`: listar e selecionar (sem export)
2. **Segregação de permissões** para exportar PII.
3. **Criptografia**:
   - em trânsito: HTTPS/TLS
   - em repouso: storage e backup com criptografia
4. **Auditoria**:
   - quem exportou
   - quais filtros
   - quantos leads
5. **Retenção**:
   - política de retenção por período (ex.: 12/24 meses)
6. **Direitos LGPD**:
   - suportar anonimização/remoção quando exigido.

---

## 11) Observabilidade e SRE mínimo

### 11.1 Logs estruturados
Campos mínimos:
- `service`
- `event`
- `requestId`
- `userId` (quando houver)
- `contactId`/`externalMessageId` (quando houver)
- `level`
- `timestamp`

### 11.2 Métricas
- `wa_connection_status`
- `ingestion_events_total`
- `ingestion_duplicates_total`
- `ingestion_failures_total`
- `exports_total`
- `exports_failed_total`
- `export_duration_seconds`

### 11.3 Alertas
- taxa de falha de ingestão > 5% em 5 min
- gateway desconectado > 10 min
- export failed > 3 consecutivos

---

## 12) Estratégia de testes (sem quebrar sistema atual)

## 12.1 Unitários
- normalização de telefone
- parsing de mensagem
- validação de schema
- serialização XML/XLSX

## 12.2 Integração
- webhook → ingestão → banco
- export job → arquivo final
- RBAC por perfil

## 12.3 E2E
1. Conectar WhatsApp (mock/provider sandbox)
2. Ingerir 10 mensagens
3. Selecionar 5 contatos
4. Exportar XLSX e XML
5. Validar conteúdo e download

## 12.4 Testes de robustez
- duplicidade do mesmo evento (2x/3x)
- payload malformado
- indisponibilidade temporária do gateway
- timeout no storage

### 12.5 Critérios de aceitação (QA)
- 0 duplicação de mensagem por `external_message_id`
- 100% dos exports auditáveis
- export de 5.000 contatos em tempo aceitável (ex.: < 60s assíncrono)

---

## 13) Plano de rollout sem risco

### Fase 0 — Design e contrato
- Definir OpenAPI
- Aprovar esquema de banco
- Aprovar RBAC

### Fase 1 — Backend base
- Gateway + Ingestion + tabelas + logs
- sem UI pública para usuários finais

### Fase 2 — UI interna
- telas de conexão/listagem/seleção
- feature flag ligada apenas para perfis internos

### Fase 3 — Export
- worker + storage + download seguro
- homologação com Mano Imóveis

### Fase 4 — Go-live controlado
- 1 parceiro
- monitoramento diário
- playbook de incidentes

---

## 14) Open source recomendável (com objetivo de reduzir risco)

- **Engine WA (não oficial)**: Baileys (apenas se decisão consciente de risco)
- **Backend**: NestJS ou Fastify/Express + TypeScript
- **Validação**: Zod
- **Banco**: PostgreSQL + Prisma/Drizzle/TypeORM
- **Fila**: BullMQ + Redis
- **Excel**: SheetJS (`xlsx`)
- **XML**: `xmlbuilder2`
- **Logs**: Pino
- **Métricas**: prom-client + Prometheus/Grafana

> Observação: para produção estável e compliance, priorizar **API oficial da Meta** quando houver tração.

---

## 15) Riscos e mitigação

1. **Banimento de número (não oficial)**  
   Mitigação: baixo volume, sem automação agressiva, plano de migração para oficial.
2. **Mudanças de protocolo WhatsApp**  
   Mitigação: gateway isolado e versionado.
3. **Vazamento de dados sensíveis**  
   Mitigação: RBAC, auditoria, storage privado, políticas de retenção.
4. **Acoplamento com o core**  
   Mitigação: módulo isolado + testes de regressão.

---

## 16) Definition of Done (DoD)

- [ ] APIs implementadas e documentadas em OpenAPI.
- [ ] Banco migrado com índices e constraints.
- [ ] Ingestão idempotente validada por testes.
- [ ] UI de seleção manual publicada sob feature flag.
- [ ] Export XLSX/XML funcional com auditoria.
- [ ] RBAC aplicado nas rotas e interface.
- [ ] Observabilidade ativa (logs+métricas+alertas).
- [ ] Homologação com 1 parceiro concluída.

---

## 17) Backlog sugerido (Jira-ready)

1. **WA-001**: Criar WA Gateway e estado de conexão.
2. **WA-002**: Endpoint de ingestão com validação Zod.
3. **WA-003**: Modelagem SQL + migrations.
4. **WA-004**: Tela de contatos com filtros e seleção.
5. **WA-005**: Tela de detalhe (timeline readonly).
6. **WA-006**: Worker de exportação XLSX.
7. **WA-007**: Worker de exportação XML.
8. **WA-008**: RBAC para ações de export.
9. **WA-009**: Auditoria de exportações.
10. **WA-010**: Testes E2E e smoke em staging.

---

## 18) Próximos passos imediatos (ordem de execução)

1. Aprovar este documento com produto + engenharia + jurídico/compliance.
2. Decidir motor inicial (oficial x não oficial) com ciência de risco.
3. Fechar contrato OpenAPI v1.
4. Criar branch técnica e implementar Fase 1.
5. Homologar export com arquivo real da Mano Imóveis.

---

## 19) Nota sobre “subagentes/equipe C-level”

Para este material, a abordagem foi estruturada por lentes de decisão:
- **CEO/Negócio:** valor, parceria, risco de operação.
- **CTO/Arquitetura:** isolamento, idempotência, evolução.
- **CISO/Compliance:** LGPD, RBAC, auditoria.
- **COO/Operação:** fluxo manual confiável e prestação de contas.
- **CFO/Custos:** começar enxuto e evitar retrabalho.

