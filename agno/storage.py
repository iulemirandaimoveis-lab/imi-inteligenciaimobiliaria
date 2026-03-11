"""
Configuração centralizada de storage para agentes Agno
=======================================================
Usa SQLite em desenvolvimento e PostgreSQL em produção.
Mantém histórico de sessões, memória e runs de cada agente.

Docs: https://docs.agno.com/storage/agent/sqlite
"""

import os
from pathlib import Path

# Diretório de dados (criado automaticamente)
DATA_DIR = Path(__file__).parent / "data"
DATA_DIR.mkdir(exist_ok=True)

SQLITE_DB = str(DATA_DIR / "imi_sessions.db")


def get_agent_storage(table_name: str):
    """
    Retorna storage SQLite para persistência de sessões do agente.
    Em produção, troca para PostgreSQL via DATABASE_URL.

    Args:
        table_name: Nome da tabela de sessões (ex: 'lead_sessions')

    Returns:
        SqliteAgentStorage ou None se indisponível
    """
    database_url = os.getenv("DATABASE_URL")

    # Produção: PostgreSQL (Supabase / Railway)
    if database_url:
        try:
            from agno.storage.agent.postgres import PostgresAgentStorage
            return PostgresAgentStorage(table_name=table_name, db_url=database_url)
        except (ImportError, Exception) as e:
            print(f"⚠️ PostgreSQL storage indisponível ({e}), usando SQLite")

    # Desenvolvimento: SQLite local
    try:
        from agno.storage.agent.sqlite import SqliteAgentStorage
        return SqliteAgentStorage(table_name=table_name, db_file=SQLITE_DB)
    except (ImportError, Exception) as e:
        print(f"⚠️ SQLite storage indisponível ({e}), sem persistência")
        return None
