"""
IMI Inteligência Imobiliária — Agno Agent Service
===================================================
Serviço FastAPI com agentes AI especializados para o backoffice imobiliário.

Tecnologia: Agno Framework (https://docs.agno.com)
Deploy: FastAPI + Uvicorn (desenvolvimento) / Docker + Railway/AWS (produção)

Endpoints disponíveis:
  GET  /health              — Status do serviço e modelos disponíveis
  GET  /agents              — Lista todos os agentes disponíveis
  POST /agents/{agent_id}   — Executa um agente específico
  POST /team                — Executa o time completo (auto-routing)

Início rápido:
  pip install -r requirements.txt
  uvicorn main:app --reload --port 8001
"""

import os
from contextlib import asynccontextmanager
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Carregar variáveis de ambiente
load_dotenv("../.env.local")
load_dotenv()

# Importar agentes
from agents import (
    create_consultant_agent,
    create_content_agent,
    create_financial_agent,
    create_lead_agent,
    create_market_agent,
    create_property_agent,
)
from teams import create_imi_team

# ─── Definições dos agentes disponíveis ───────────────────────────────────────

AGENT_REGISTRY = {
    "lead-qualifier": {
        "factory": create_lead_agent,
        "name": "Qualificador de Leads",
        "description": "Analisa leads, define score, temperatura e sugere próximas ações",
        "use_cases": ["qualificação de leads", "scoring", "follow-up sugerido", "análise de perfil"],
        "icon": "🎯",
    },
    "property-copywriter": {
        "factory": create_property_agent,
        "name": "Copywriter Imobiliário",
        "description": "Gera descrições profissionais para portais, Instagram, WhatsApp e email",
        "use_cases": ["descrição de imóvel", "texto para portal", "legenda Instagram", "email de apresentação"],
        "icon": "✍️",
    },
    "market-analyst": {
        "factory": create_market_agent,
        "name": "Analista de Mercado",
        "description": "Analisa tendências, compara preços e gera relatórios de mercado",
        "use_cases": ["relatório de mercado", "precificação", "análise de região", "oportunidades"],
        "icon": "📊",
    },
    "content-strategist": {
        "factory": create_content_agent,
        "name": "Estrategista de Conteúdo",
        "description": "Cria conteúdo para Instagram, LinkedIn, WhatsApp e email marketing",
        "use_cases": ["post Instagram", "legenda", "hashtags", "roteiro Reels", "calendário de conteúdo"],
        "icon": "📱",
    },
    "real-estate-consultant": {
        "factory": create_consultant_agent,
        "name": "Consultor Imobiliário",
        "description": "Orienta sobre compra, venda, financiamento e aspectos jurídicos básicos",
        "use_cases": ["dúvidas sobre processo", "financiamento", "documentação", "FGTS", "locação"],
        "icon": "🏠",
    },
    "financial-analyst": {
        "factory": create_financial_agent,
        "name": "Analista Financeiro",
        "description": "Analisa performance financeira, comissões, metas e fluxo de caixa",
        "use_cases": ["análise de metas", "comissões", "relatório financeiro", "KPIs", "projeções"],
        "icon": "💰",
    },
}


# ─── Schemas de Request/Response ──────────────────────────────────────────────

class AgentRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    user_id: Optional[str] = None
    context: Optional[dict] = None  # Dados extras (lead, imóvel, etc.)


class AgentResponse(BaseModel):
    agent_id: str
    agent_name: str
    response: str
    session_id: Optional[str] = None


# ─── App Setup ────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Inicialização e shutdown do serviço."""
    print("🚀 IMI Agno Service iniciado")
    print(f"   Agentes disponíveis: {list(AGENT_REGISTRY.keys())}")
    print(f"   ANTHROPIC_API_KEY: {'✅ configurada' if os.getenv('ANTHROPIC_API_KEY') else '❌ AUSENTE'}")
    print(f"   GROQ_API_KEY: {'✅ configurada' if os.getenv('GROQ_API_KEY') else '⚠️ não configurada (content agent usará Claude)'}")
    yield
    print("👋 IMI Agno Service encerrado")


app = FastAPI(
    title="IMI Agno Agent Service",
    description="Serviço de agentes AI especializados para o backoffice da IMI Inteligência Imobiliária",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — permitir chamadas do Next.js
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://*.vercel.app",
        os.getenv("NEXT_PUBLIC_APP_URL", ""),
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Endpoints ────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    """Verifica status do serviço."""
    return {
        "status": "ok",
        "service": "IMI Agno Agent Service",
        "agents": list(AGENT_REGISTRY.keys()),
        "models": {
            "primary": "claude-sonnet-4-5",
            "fast": "groq/llama-3.3-70b-versatile",
        },
        "api_keys": {
            "anthropic": bool(os.getenv("ANTHROPIC_API_KEY")),
            "groq": bool(os.getenv("GROQ_API_KEY")),
            "openai": bool(os.getenv("OPENAI_API_KEY")),
        },
    }


@app.get("/agents")
async def list_agents():
    """Lista todos os agentes disponíveis com suas capacidades."""
    return {
        "agents": [
            {
                "id": agent_id,
                "name": info["name"],
                "description": info["description"],
                "use_cases": info["use_cases"],
                "icon": info["icon"],
            }
            for agent_id, info in AGENT_REGISTRY.items()
        ]
    }


@app.post("/agents/{agent_id}", response_model=AgentResponse)
async def run_agent(agent_id: str, request: AgentRequest):
    """
    Executa um agente específico.

    Args:
        agent_id: ID do agente (ex: 'lead-qualifier', 'property-copywriter')
        request: Mensagem e contexto opcional

    Returns:
        Resposta do agente em markdown
    """
    if agent_id not in AGENT_REGISTRY:
        raise HTTPException(
            status_code=404,
            detail=f"Agente '{agent_id}' não encontrado. Disponíveis: {list(AGENT_REGISTRY.keys())}",
        )

    agent_info = AGENT_REGISTRY[agent_id]

    # Construir mensagem com contexto adicional
    message = request.message
    if request.context:
        context_str = "\n\n**Dados de contexto:**\n"
        for key, value in request.context.items():
            context_str += f"- **{key}**: {value}\n"
        message = context_str + "\n**Solicitação:**\n" + message

    # Criar e executar agente
    agent = agent_info["factory"]()

    try:
        response = agent.run(message, stream=False)
        response_text = response.content if hasattr(response, "content") else str(response)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao executar agente: {str(e)}",
        )

    return AgentResponse(
        agent_id=agent_id,
        agent_name=agent_info["name"],
        response=response_text,
        session_id=request.session_id,
    )


@app.post("/team", response_model=AgentResponse)
async def run_team(request: AgentRequest):
    """
    Executa o time completo de agentes (auto-routing pelo líder).
    O time decide automaticamente qual agente usar para a tarefa.

    Args:
        request: Mensagem e contexto opcional

    Returns:
        Resposta consolidada do time
    """
    message = request.message
    if request.context:
        context_str = "\n\n**Contexto:**\n"
        for key, value in request.context.items():
            context_str += f"- **{key}**: {value}\n"
        message = context_str + "\n**Solicitação:**\n" + message

    team = create_imi_team()

    try:
        response = team.run(message, stream=False)
        response_text = response.content if hasattr(response, "content") else str(response)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao executar time: {str(e)}",
        )

    return AgentResponse(
        agent_id="imi-team",
        agent_name="Time IMI Inteligência Imobiliária",
        response=response_text,
        session_id=request.session_id,
    )


# ─── Executar localmente ───────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001, reload=True)
