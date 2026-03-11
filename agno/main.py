"""
IMI Inteligência Imobiliária — Agno Agent Service
===================================================
Serviço FastAPI com agentes AI especializados para o backoffice imobiliário.

Tecnologia: Agno Framework (https://docs.agno.com)
Deploy: FastAPI + Uvicorn (desenvolvimento) / Docker + Railway/AWS (produção)

Endpoints:
  GET  /health                        — Status e modelos disponíveis
  GET  /agents                        — Lista agentes disponíveis
  POST /agents/{agent_id}             — Executa agente (resposta completa)
  POST /agents/{agent_id}/stream      — Executa agente com streaming SSE
  POST /team                          — Time completo (auto-routing)
  POST /team/stream                   — Time completo com streaming SSE
  GET  /sessions/{session_id}         — Histórico de uma sessão

Início rápido:
  pip install -r requirements.txt
  uvicorn main:app --reload --port 8001
"""

import asyncio
import json
import os
import threading
import queue as _queue
from contextlib import asynccontextmanager
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
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

# ─── Registro de agentes ──────────────────────────────────────────────────────

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
        "description": "Analisa tendências, compara preços e gera relatórios de mercado com dados reais",
        "use_cases": ["relatório de mercado", "precificação", "análise de região", "ROI de investimento"],
        "icon": "📊",
    },
    "content-strategist": {
        "factory": create_content_agent,
        "name": "Estrategista de Conteúdo",
        "description": "Cria conteúdo para Instagram, LinkedIn, WhatsApp e email marketing",
        "use_cases": ["post Instagram", "roteiro Reels", "carrossel", "email marketing", "calendário de conteúdo"],
        "icon": "📱",
    },
    "real-estate-consultant": {
        "factory": create_consultant_agent,
        "name": "Consultor Imobiliário",
        "description": "Orienta sobre compra, venda, financiamento, FGTS e aspectos jurídicos",
        "use_cases": ["processo de compra", "financiamento", "FGTS", "documentação", "locação"],
        "icon": "🏠",
    },
    "financial-analyst": {
        "factory": create_financial_agent,
        "name": "Analista Financeiro",
        "description": "Analisa performance, comissões, metas, KPIs e projeta cenários financeiros",
        "use_cases": ["análise de metas", "comissões", "relatório financeiro", "KPIs", "projeções"],
        "icon": "💰",
    },
}


# ─── Schemas ──────────────────────────────────────────────────────────────────

class AgentRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    user_id: Optional[str] = None
    context: Optional[dict] = None


class AgentResponse(BaseModel):
    agent_id: str
    agent_name: str
    response: str
    session_id: Optional[str] = None


# ─── App Setup ────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 IMI Agno Service iniciado")
    print(f"   Agentes: {list(AGENT_REGISTRY.keys())}")
    print(f"   ANTHROPIC: {'✅' if os.getenv('ANTHROPIC_API_KEY') else '❌ AUSENTE'}")
    print(f"   GROQ: {'✅' if os.getenv('GROQ_API_KEY') else '⚠️ não configurada'}")
    print(f"   DATABASE_URL: {'✅ PostgreSQL' if os.getenv('DATABASE_URL') else '📂 SQLite local'}")
    yield
    print("👋 IMI Agno Service encerrado")


app = FastAPI(
    title="IMI Agno Agent Service",
    description="Agentes AI especializados para o backoffice da IMI Inteligência Imobiliária",
    version="2.0.0",
    lifespan=lifespan,
)

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


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _build_message(request: AgentRequest) -> str:
    """Constrói a mensagem com contexto estruturado injetado."""
    message = request.message
    if request.context:
        ctx = "\n\n**Dados de contexto:**\n"
        for key, value in request.context.items():
            if value:
                ctx += f"- **{key}**: {value}\n"
        message = ctx + "\n**Solicitação:**\n" + message
    return message


def _extract_content(response) -> str:
    """Extrai o texto de um RunResponse do Agno."""
    if response is None:
        return ""
    if hasattr(response, "content") and response.content:
        return response.content
    return str(response)


def _run_agent_sync(agent, message: str, stream: bool = False):
    """Executa o agente de forma síncrona (chamado em thread pool)."""
    return agent.run(message, stream=stream)


# ─── Streaming ────────────────────────────────────────────────────────────────

async def _stream_agent_response(agent, message: str):
    """
    Gerador assíncrono que executa o agente em thread e faz streaming SSE.
    Formato: data: {"content": "..."}\n\n  |  data: [DONE]\n\n
    """
    q: _queue.Queue = _queue.Queue()
    loop = asyncio.get_event_loop()

    def run_in_thread():
        try:
            for chunk in agent.run(message, stream=True):
                loop.call_soon_threadsafe(q.put_nowait, chunk)
            loop.call_soon_threadsafe(q.put_nowait, None)  # sentinel de fim
        except Exception as e:
            loop.call_soon_threadsafe(q.put_nowait, e)

    thread = threading.Thread(target=run_in_thread, daemon=True)
    thread.start()

    accumulated = ""
    while True:
        try:
            chunk = q.get_nowait()
        except _queue.Empty:
            await asyncio.sleep(0.01)
            continue

        # Fim do stream
        if chunk is None:
            if accumulated:
                yield f"data: {json.dumps({'content': accumulated, 'done': True})}\n\n"
            else:
                yield f"data: {json.dumps({'done': True})}\n\n"
            break

        # Erro
        if isinstance(chunk, Exception):
            yield f"data: {json.dumps({'error': str(chunk), 'done': True})}\n\n"
            break

        # Conteúdo parcial
        content = ""
        if hasattr(chunk, "content") and chunk.content:
            content = chunk.content
        elif isinstance(chunk, str):
            content = chunk

        if content:
            # Detectar se o chunk é incremental ou acumulado
            if len(content) > len(accumulated) and content.startswith(accumulated):
                # Agno retorna acumulado — extrair apenas o delta
                delta = content[len(accumulated):]
                accumulated = content
                if delta:
                    yield f"data: {json.dumps({'content': delta, 'done': False})}\n\n"
            else:
                # Chunk incremental puro
                accumulated += content
                yield f"data: {json.dumps({'content': content, 'done': False})}\n\n"


# ─── Endpoints ────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    """Status do serviço."""
    return {
        "status": "ok",
        "service": "IMI Agno Agent Service",
        "version": "2.0.0",
        "agents": list(AGENT_REGISTRY.keys()),
        "features": ["streaming", "session_persistence", "tools", "history"],
        "models": {
            "primary": "claude-sonnet-4-5",
            "fast": "groq/llama-3.3-70b-versatile",
        },
        "storage": "postgresql" if os.getenv("DATABASE_URL") else "sqlite",
        "api_keys": {
            "anthropic": bool(os.getenv("ANTHROPIC_API_KEY")),
            "groq": bool(os.getenv("GROQ_API_KEY")),
            "openai": bool(os.getenv("OPENAI_API_KEY")),
        },
    }


@app.get("/agents")
async def list_agents():
    """Lista todos os agentes com capacidades."""
    return {
        "agents": [
            {
                "id": aid,
                "name": info["name"],
                "description": info["description"],
                "use_cases": info["use_cases"],
                "icon": info["icon"],
            }
            for aid, info in AGENT_REGISTRY.items()
        ]
    }


@app.post("/agents/{agent_id}", response_model=AgentResponse)
async def run_agent(agent_id: str, request: AgentRequest):
    """
    Executa um agente e retorna a resposta completa (sem streaming).
    Use /agents/{agent_id}/stream para streaming SSE.
    """
    if agent_id not in AGENT_REGISTRY:
        raise HTTPException(
            status_code=404,
            detail=f"Agente '{agent_id}' não encontrado. Disponíveis: {list(AGENT_REGISTRY.keys())}",
        )

    info = AGENT_REGISTRY[agent_id]
    message = _build_message(request)

    # Cria agente com session_id para persistência
    agent = info["factory"](session_id=request.session_id)

    try:
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None, lambda: agent.run(message, stream=False)
        )
        response_text = _extract_content(response)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao executar agente: {str(e)}")

    return AgentResponse(
        agent_id=agent_id,
        agent_name=info["name"],
        response=response_text,
        session_id=request.session_id,
    )


@app.post("/agents/{agent_id}/stream")
async def stream_agent(agent_id: str, request: AgentRequest):
    """
    Executa um agente com streaming SSE (Server-Sent Events).

    Formato de resposta:
      data: {"content": "texto parcial", "done": false}
      data: {"content": "último chunk", "done": true}
      data: {"error": "mensagem", "done": true}  (em caso de erro)
    """
    if agent_id not in AGENT_REGISTRY:
        raise HTTPException(
            status_code=404,
            detail=f"Agente '{agent_id}' não encontrado. Disponíveis: {list(AGENT_REGISTRY.keys())}",
        )

    info = AGENT_REGISTRY[agent_id]
    message = _build_message(request)
    agent = info["factory"](session_id=request.session_id)

    return StreamingResponse(
        _stream_agent_response(agent, message),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@app.post("/team", response_model=AgentResponse)
async def run_team(request: AgentRequest):
    """
    Time completo com auto-routing (sem streaming).
    O time decide automaticamente qual especialista usar.
    """
    message = _build_message(request)
    team = create_imi_team(session_id=request.session_id)

    try:
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None, lambda: team.run(message, stream=False)
        )
        response_text = _extract_content(response)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao executar time: {str(e)}")

    return AgentResponse(
        agent_id="imi-team",
        agent_name="Time IMI Inteligência Imobiliária",
        response=response_text,
        session_id=request.session_id,
    )


@app.post("/team/stream")
async def stream_team(request: AgentRequest):
    """
    Time completo com streaming SSE.
    """
    message = _build_message(request)
    team = create_imi_team(session_id=request.session_id)

    return StreamingResponse(
        _stream_agent_response(team, message),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@app.get("/sessions/{session_id}")
async def get_session(session_id: str, agent_id: str = "lead-qualifier"):
    """
    Recupera o histórico de uma sessão específica.

    Args:
        session_id: ID da sessão
        agent_id: ID do agente (para buscar na tabela correta)
    """
    if agent_id not in AGENT_REGISTRY:
        raise HTTPException(status_code=404, detail=f"Agente '{agent_id}' não encontrado")

    info = AGENT_REGISTRY[agent_id]
    agent = info["factory"](session_id=session_id)

    try:
        # Agno carrega o histórico ao criar o agente com session_id
        history = []
        if hasattr(agent, "memory") and agent.memory:
            runs = getattr(agent.memory, "runs", [])
            for run in runs:
                if hasattr(run, "messages"):
                    for msg in run.messages:
                        history.append({
                            "role": getattr(msg, "role", "unknown"),
                            "content": getattr(msg, "content", ""),
                        })
        return {"session_id": session_id, "agent_id": agent_id, "history": history}
    except Exception as e:
        return {"session_id": session_id, "agent_id": agent_id, "history": [], "note": str(e)}


# ─── Executar localmente ───────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001, reload=True)
