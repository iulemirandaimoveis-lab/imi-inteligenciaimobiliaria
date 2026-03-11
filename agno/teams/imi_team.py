"""
Time de Agentes IMI
=====================
Time principal que orquestra todos os agentes especializados.
O team leader decide qual agente usar baseado na tarefa recebida.

Docs: https://docs.agno.com/teams/introduction
"""

from agno.agent import Agent
from agno.models.anthropic import Claude

# Importar todos os agentes
from agents.lead_agent import create_lead_agent
from agents.property_agent import create_property_agent
from agents.market_agent import create_market_agent
from agents.content_agent import create_content_agent
from agents.consultant_agent import create_consultant_agent
from agents.financial_agent import create_financial_agent

# Tentar importar Team (disponível em versões mais recentes)
try:
    from agno.team import Team
    HAS_TEAM = True
except ImportError:
    HAS_TEAM = False


TEAM_LEADER_PROMPT = """Você é o coordenador do time de IA da IMI Inteligência Imobiliária.

Sua função é receber solicitações e direcionar para o agente mais adequado:

- **Qualificador de Leads** → análise de leads, scoring, temperatura, follow-up
- **Copywriter Imobiliário** → descrições de imóveis, textos para portais e marketing
- **Analista de Mercado** → relatórios de mercado, comparativos, tendências, precificação
- **Estrategista de Conteúdo** → posts Instagram/LinkedIn, roteiros, hashtags, calendário
- **Consultor Imobiliário** → dúvidas sobre processo de compra/venda, financiamento, jurídico
- **Analista Financeiro** → análise de performance, comissões, metas, fluxo de caixa

Para cada solicitação:
1. Identifique qual especialista é mais adequado
2. Se precisar de múltiplos especialistas, coordene as respostas
3. Seja transparente sobre qual agente está sendo acionado
4. Consolide respostas quando houver múltiplos agentes envolvidos"""


def create_imi_team():
    """
    Cria o time completo de agentes IMI.

    Retorna um Team (se disponível) ou um Agent coordenador.
    """
    lead_agent = create_lead_agent()
    property_agent = create_property_agent()
    market_agent = create_market_agent()
    content_agent = create_content_agent()
    consultant_agent = create_consultant_agent()
    financial_agent = create_financial_agent()

    if HAS_TEAM:
        return Team(
            name="Time IMI Inteligência Imobiliária",
            mode="route",  # Leader roteia para o agente certo
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
            markdown=True,
        )
    else:
        # Fallback: agente coordenador que tem todos os prompts
        return Agent(
            name="Assistente IMI Completo",
            agent_id="imi-coordinator",
            model=Claude(id="claude-sonnet-4-5"),
            description="Assistente completo da IMI com expertise em leads, imóveis, mercado, conteúdo, consultoria e finanças",
            instructions=TEAM_LEADER_PROMPT,
            markdown=True,
            add_history_to_context=True,
            num_history_runs=5,
        )
