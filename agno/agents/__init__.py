"""
Agentes Agno para IMI Inteligência Imobiliária
===============================================
Cada agente é especializado em uma área do backoffice imobiliário.

Importar agentes:
    from agents.lead_agent import create_lead_agent
    from agents.property_agent import create_property_agent
    from agents.market_agent import create_market_agent
    from agents.content_agent import create_content_agent
    from agents.consultant_agent import create_consultant_agent
    from agents.financial_agent import create_financial_agent
"""

from .lead_agent import create_lead_agent
from .property_agent import create_property_agent
from .market_agent import create_market_agent
from .content_agent import create_content_agent
from .consultant_agent import create_consultant_agent
from .financial_agent import create_financial_agent

__all__ = [
    "create_lead_agent",
    "create_property_agent",
    "create_market_agent",
    "create_content_agent",
    "create_consultant_agent",
    "create_financial_agent",
]
