# IMI — Agno Agent Service

Serviço de agentes AI especializados para o backoffice da **IMI Inteligência Imobiliária**.

Framework: [Agno](https://docs.agno.com) — Runtime para sistemas multi-agente

---

## Agentes Disponíveis

| ID | Nome | Modelo | Especialidade |
|----|------|--------|---------------|
| `lead-qualifier` | Qualificador de Leads | Claude Sonnet | Score, temperatura, follow-up |
| `property-copywriter` | Copywriter Imobiliário | Claude Sonnet | Descrições para portais e redes |
| `market-analyst` | Analista de Mercado | Claude Sonnet | Relatórios, precificação, tendências |
| `content-strategist` | Estrategista de Conteúdo | Groq Llama 3.3 | Instagram, LinkedIn, WhatsApp |
| `real-estate-consultant` | Consultor Imobiliário | Claude Sonnet | Processo, jurídico, financiamento |
| `financial-analyst` | Analista Financeiro | Claude Sonnet | KPIs, metas, comissões |

---

## Início Rápido (Desenvolvimento)

### 1. Pré-requisitos
- Python 3.12+
- [uv](https://docs.astral.sh/uv/) (recomendado) ou pip

### 2. Ambiente virtual e dependências

```bash
cd agno/

# Com uv (recomendado)
uv venv --python 3.12
source .venv/bin/activate
uv pip install -r requirements.txt

# Com pip
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 3. Variáveis de ambiente
O serviço usa o `.env.local` da raiz do projeto automaticamente.
Variáveis necessárias:
```bash
ANTHROPIC_API_KEY=sk-ant-...   # Obrigatório
GROQ_API_KEY=gsk_...           # Opcional (content agent usa Claude como fallback)
OPENAI_API_KEY=sk-proj-...     # Opcional
```

### 4. Iniciar o serviço
```bash
uvicorn main:app --reload --port 8001
```

Acesse:
- **API**: http://localhost:8001
- **Docs Swagger**: http://localhost:8001/docs
- **ReDoc**: http://localhost:8001/redoc

---

## Endpoints da API

### `GET /health`
Verifica status e chaves configuradas.

### `GET /agents`
Lista todos os agentes com descrições e casos de uso.

### `POST /agents/{agent_id}`
Executa um agente específico.

```json
// Request
{
  "message": "Analise este lead: João Silva, 45 anos, engenheiro...",
  "session_id": "user-123-session-456",
  "context": {
    "lead_name": "João Silva",
    "budget": "R$ 1.200.000",
    "interest": "Apartamento Meireles"
  }
}

// Response
{
  "agent_id": "lead-qualifier",
  "agent_name": "Qualificador de Leads",
  "response": "## Análise do Lead João Silva\n...",
  "session_id": "user-123-session-456"
}
```

### `POST /team`
Roteamento automático — o time decide qual agente usar.

```json
{
  "message": "Preciso de uma descrição para um apartamento de 3 quartos no Meireles"
}
```

---

## Deploy com Docker

```bash
# Build e iniciar
docker compose up -d

# Ver logs
docker compose logs -f agno-service

# Parar
docker compose down
```

---

## Deploy em Produção (Railway)

1. Crie um novo serviço no Railway apontando para a pasta `/agno`
2. Configure as variáveis de ambiente no painel do Railway
3. O Railway detecta o `Dockerfile` automaticamente
4. Configure a URL do serviço no Next.js:
   ```bash
   AGNO_SERVICE_URL=https://seu-servico.railway.app
   ```

---

## Estrutura do Projeto

```
agno/
├── main.py              # FastAPI app com todos os endpoints
├── requirements.txt     # Dependências Python
├── Dockerfile           # Container para produção
├── docker-compose.yml   # Desenvolvimento local
├── agents/
│   ├── __init__.py
│   ├── lead_agent.py        # Qualificação de leads
│   ├── property_agent.py    # Copywriting de imóveis
│   ├── market_agent.py      # Análise de mercado
│   ├── content_agent.py     # Conteúdo para redes sociais
│   ├── consultant_agent.py  # Consultoria imobiliária
│   └── financial_agent.py   # Análise financeira
└── teams/
    ├── __init__.py
    └── imi_team.py          # Time completo com auto-routing
```

---

## Integração com Next.js

O Next.js faz proxy para o Agno service via:
```
/api/agno/* → http://localhost:8001/*  (dev)
/api/agno/* → https://agno.railway.app/* (prod)
```

Rota Next.js: `src/app/api/agno/[...path]/route.ts`

---

## UI Oficial do Agno (Opcional)

O Agno tem um **chat UI open-source em Next.js** que se conecta ao AgentOS:

```bash
npx create-agent-ui@latest
# ou
git clone https://github.com/agno-agi/agent-ui.git
cd agent-ui && pnpm install && pnpm dev
```

- Streaming em tempo real
- Visualização de tool calls e raciocínio
- Suporte multimodal (imagens, áudio)
- Construído com Next.js + Tailwind + shadcn/ui

Quando o AgentOS (Plano Pro) estiver ativo, aponte para `http://localhost:8001`.

---

## Níveis de Complexidade (Agno)

| Nível | Capacidade | Status IMI |
|-------|-----------|------------|
| 1 | Agentes com ferramentas e instruções | ✅ Implementado |
| 2 | Agentes com knowledge base e storage | 🔄 Próximo passo |
| 3 | Agentes com memória e raciocínio | 🔄 Próximo passo |
| 4 | Times que raciocinam e colaboram | ✅ Implementado (team) |
| 5 | Workflows com estado e determinismo | 📋 Planejado |

---

## Pricing do Agno

| Plano | Preço | Inclui |
|-------|-------|--------|
| **Free** | $0 | Framework open-source completo, AgentOS local |
| **Pro** | $150/mês | AgentOS cloud, 1 conexão, 4 seats, monitoramento |
| **Enterprise** | Custom | SSO/RBAC, Slack dedicado, self-hosted |

> O framework Agno é **100% gratuito e open-source**. Você só paga as APIs dos LLMs (Anthropic, Groq, etc.) e opcionalmente o plano Pro do AgentOS para o painel cloud.

---

## Documentação Agno

**Framework:**
- [Introdução](https://docs.agno.com/introduction)
- [Criando Agentes](https://docs.agno.com/agents/building-agents)
- [Times de Agentes](https://docs.agno.com/teams/introduction)
- [Memória e Sessões](https://docs.agno.com/memory/introduction)
- [Base de Conhecimento (RAG)](https://docs.agno.com/knowledge/introduction)
- [Ferramentas (100+ integrações)](https://docs.agno.com/tools/introduction)
- [Workflows](https://docs.agno.com/workflows/introduction)
- [Guardrails](https://docs.agno.com/agents/guardrails)

**Deploy & Integração:**
- [AgentOS](https://docs.agno.com/agentos/introduction)
- [API REST do AgentOS](https://docs.agno.com/agent-os/api)
- [Usando a API](https://docs.agno.com/agent-os/using-the-api)
- [Referência da Classe Agent](https://docs.agno.com/reference/agents/agent)

**Repositórios:**
- [agno-agi/agno](https://github.com/agno-agi/agno) — Framework Python
- [agno-agi/agent-ui](https://github.com/agno-agi/agent-ui) — Chat UI (Next.js)
- [agno-agi/agent-api](https://github.com/agno-agi/agent-api) — FastAPI starter
- [PyPI: agno](https://pypi.org/project/agno/)
- [os.agno.com](https://os.agno.com) — Painel AgentOS
