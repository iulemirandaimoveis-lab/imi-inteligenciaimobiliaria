# ADR-004: Multi-LLM Architecture

## Status
Accepted

## Context
IMI uses AI for multiple features:
- Lead qualification and scoring
- Property valuation assistance
- Content generation (social posts, ebooks)
- Ads analysis and optimization
- Natural language queries on market data

Different models excel at different tasks, and costs vary significantly.

## Decision
Support **multiple LLM providers** with per-task routing:
- **Anthropic Claude** (`src/lib/ai/claude.ts`): Primary for complex reasoning — lead qualification, appraisals, content creation
- **Google Gemini** (`src/lib/ai/gemini.ts`): Alternative for vision tasks and cost-sensitive operations
- **OpenAI** (via env config): Backward compatibility and embeddings
- **Groq** (via env config): Fast inference for latency-sensitive tasks

Configuration via environment variables allows runtime provider switching.

## Consequences
- **Positive**: No single-vendor lock-in for AI capabilities
- **Positive**: Cost optimization — route cheap tasks to cheaper models
- **Positive**: Resilience — fallback to alternative if primary is down
- **Negative**: Prompt engineering per provider (different formats)
- **Negative**: More API keys to manage

## Alternatives Considered
- **Single provider (OpenAI only)**: Simpler but vendor locked
- **Self-hosted LLMs**: Not viable for startup — too expensive to run
- **LangChain abstraction**: Adds complexity without clear benefit at current scale
