"""
Time de Agentes IMI
=====================
Time principal que orquestra todos os agentes especializados.
O team leader decide automaticamente qual agente(s) usar baseado na tarefa.

Docs: https://docs.agno.com/teams/introduction
"""

from agno.agent import Agent
from agno.models.anthropic import Claude

from agents.lead_agent import create_lead_agent
from agents.property_agent import create_property_agent
from agents.market_agent import create_market_agent
from agents.content_agent import create_content_agent
from agents.consultant_agent import create_consultant_agent
from agents.financial_agent import create_financial_agent
from storage import get_agent_storage

try:
    from agno.team import Team
    HAS_TEAM = True
except ImportError:
    HAS_TEAM = False


TEAM_LEADER_PROMPT = """Você é o Coordenador do Time de IA da IMI Inteligência Imobiliária.

## Sua Missão
Identificar a melhor especialização para cada solicitação e coordenar respostas integradas.

## Mapeamento de Especialistas

| Solicitação | Especialista |
|------------|-------------|
| Qualificar lead, scoring, temperatura, follow-up | **Qualificador de Leads** |
| Escrever descrição de imóvel, texto para portal/rede social | **Copywriter Imobiliário** |
| Análise de mercado, precificação, tendências, ROI, comparativo | **Analista de Mercado** |
| Post Instagram/LinkedIn, Reels, carrossel, WhatsApp, email marketing | **Estrategista de Conteúdo** |
| Dúvida sobre compra/venda, financiamento, FGTS, documentação, lei | **Consultor Imobiliário** |
| KPIs, metas, comissões, performance financeira, projeções | **Analista Financeiro** |

## Como Agir

### Para solicitações simples:
→ Acione **um especialista** diretamente

### Para solicitações complexas (ex: "analisar lead E criar texto para o imóvel que ele pediu"):
→ Acione **múltiplos especialistas** em sequência
→ Consolide as respostas em formato coerente
→ Informe qual especialista respondeu cada parte

### Quando a solicitação for ambígua:
→ Faça **uma pergunta curta** para esclarecer antes de acionar o especialista

## Transparência
Sempre indique qual especialista está sendo acionado:
> "Direcionando para o **Analista de Mercado**..."
> "Esta solicitação envolve **Qualificador de Leads** + **Copywriter**..."

## Tom
Profissional, direto e objetivo. Você é o "maestro" do time — coordena, não executa."""


def create_imi_team(session_id: str | None = None):
    """
    Cria o time completo de agentes IMI com persistência de sessão.

    Retorna um Team (modo route) se disponível, ou um Agent coordenador.
    """
    lead_agent = create_lead_agent(session_id=session_id)
    property_agent = create_property_agent(session_id=session_id)
    market_agent = create_market_agent(session_id=session_id)
    content_agent = create_content_agent(session_id=session_id)
    consultant_agent = create_consultant_agent(session_id=session_id)
    financial_agent = create_financial_agent(session_id=session_id)

    if HAS_TEAM:
        return Team(
            name="Time IMI Inteligência Imobiliária",
            mode="route",
            model=Claude(id="claude-sonnet-4-5"),
            members=[
                lead_agent,
                property_agent,
                market_agent,
                content_agent,
                consultant_agent,
                financial_agent,
            ],
            instructions=TEAM_LEADER_PROMPT,
            storage=get_agent_storage("team_sessions"),
            add_history_to_context=True,
            num_history_runs=10,
            markdown=True,
        )

    # Fallback: agente coordenador único com todos os domínios
    return Agent(
        name="Assistente IMI Completo",
        agent_id="imi-coordinator",
        session_id=session_id,
        model=Claude(id="claude-sonnet-4-5"),
        description="Assistente completo da IMI: leads, imóveis, mercado, conteúdo, consultoria e finanças",
        instructions=TEAM_LEADER_PROMPT,
        storage=get_agent_storage("team_sessions"),
        add_history_to_context=True,
        num_history_runs=10,
        markdown=True,
        add_datetime_to_context=True,
    )
