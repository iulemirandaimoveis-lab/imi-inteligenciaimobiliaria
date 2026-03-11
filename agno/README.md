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

## Documentação Agno

- [Introdução](https://docs.agno.com/introduction)
- [Criando Agentes](https://docs.agno.com/agents/building-agents)
- [Times de Agentes](https://docs.agno.com/teams/introduction)
- [Memória e Sessões](https://docs.agno.com/memory/introduction)
- [Base de Conhecimento](https://docs.agno.com/knowledge/introduction)
- [Ferramentas (Tools)](https://docs.agno.com/tools/introduction)
- [Deploy com AgentOS](https://docs.agno.com/agentos/introduction)
- [Referência da API](https://docs.agno.com/reference/agents/agent)
