---
name: imi-voice-dna
description: |
  Extrai o DNA de voz/escrita de amostras de texto. Cria Voice Card
  com regras de estilo para manter autenticidade da marca IMI.
  Use quando mencionar: voz da marca, tom de escrita, brand voice,
  estilo de comunicação, DNA de escrita, voice extraction.
---

# Voice DNA — IMI

## Workflow de Extração

### Passo 1: Coleta de Amostras (5-10 textos)
- Posts LinkedIn do Iule Miranda
- Descrições de imóveis do site
- Propostas comerciais
- E-mails de follow-up
- Artigos de blog

### Passo 2: Análise de Padrões
| Dimensão | O que extrair |
|----------|--------------|
| Ritmo | Comprimento médio de frase, variação, cadência |
| Vocabulário | Palavras-chave recorrentes, jargão técnico, termos evitados |
| Estrutura | Como abre parágrafos, como conclui, uso de listas |
| Tom | Formal/informal, analítico/emocional, direto/narrativo |
| Pontuação | Uso de travessão, ponto-e-vírgula, parênteses |
| Recursos | Dados, analogias, perguntas retóricas, citações |

### Passo 3: Voice Card (Saída)
```
VOICE CARD — [Persona]
───────────────────────
TOM: Profissional-analítico com toques de consultoria premium
RITMO: Frases curtas para impacto, longas para análise (mix 60/40)
VOCABULÁRIO CORE: ecossistema, estruturação, inteligência, patrimonial
NUNCA USAR: "imobiliária", superlativos vazios, urgência artificial
ABERTURAS: Dado impactante ou contraste provocativo
FECHAMENTOS: Insight acionável ou pergunta reflexiva
MARCADORES: Travessão para ênfase, números para credibilidade
EMOJI: Zero em contexto profissional
```

## Override Rules (Anti-Polishing)
1. NÃO suavizar afirmações diretas
2. NÃO adicionar qualificadores desnecessários ("talvez", "possivelmente")
3. NÃO substituir termos técnicos por simplificações
4. NÃO uniformizar comprimento de frases
5. MANTER idiossincrasias estilísticas do autor
6. PRESERVAR jargão setorial (NBR, CRECI, cap rate, NOI)

## Personas IMI

### Iule Miranda (Thought Leader)
- Tom: Autoridade técnica + visão estratégica
- Foco: Holdings, tributação, mercado internacional
- Estilo: Dados primeiro, opinião fundamentada depois

### IMI Institucional
- Tom: Ecossistema proptech premium
- Foco: Tecnologia, inovação, certificações
- Estilo: Factual, confiante, sem exagero
