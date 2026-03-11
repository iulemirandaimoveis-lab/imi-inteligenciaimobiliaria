"""
Agente de Qualificação de Leads
================================
Analisa leads recebidos, define temperatura (quente/morno/frio),
prioridade e sugere próximas ações para o corretor.

Docs: https://docs.agno.com/agents/introduction
"""

from agno.agent import Agent
from agno.models.anthropic import Claude
from agno.models.groq import Groq

LEAD_SYSTEM_PROMPT = """Você é um especialista em qualificação de leads imobiliários com 15 anos de experiência.

Sua função é analisar leads recebidos e fornecer:
1. **Score de qualificação** (0-100)
2. **Temperatura**: Quente (>70), Morno (40-70), Frio (<40)
3. **Prioridade**: Alta, Média, Baixa
4. **Análise de intenção de compra**
5. **Perfil financeiro estimado** (baseado nas informações disponíveis)
6. **Próximas ações recomendadas** (3 ações específicas e práticas)
7. **Melhor horário/canal para contato**
8. **Imóveis compatíveis** (tipo, faixa de preço, localização)

Seja objetivo, prático e focado em conversão. Use linguagem profissional mas acessível.
Sempre baseie sua análise nos dados fornecidos — nunca invente informações."""


def create_lead_agent() -> Agent:
    """Cria o agente de qualificação de leads."""
    return Agent(
        name="Qualificador de Leads IMI",
        agent_id="lead-qualifier",
        model=Claude(id="claude-sonnet-4-5"),
        description="Especialista em qualificação e análise de leads imobiliários",
        instructions=LEAD_SYSTEM_PROMPT,
        markdown=True,
        add_datetime_to_context=True,
        # Fallback para Groq (mais rápido e barato)
        # model=Groq(id="llama-3.3-70b-versatile"),
    )
