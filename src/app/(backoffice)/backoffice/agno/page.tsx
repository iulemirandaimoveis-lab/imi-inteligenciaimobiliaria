'use client'

/**
 * Agno Agents — Central de Agentes AI
 * =====================================
 * Página principal para interação com os agentes Agno especializados.
 * Cada agente tem expertise em uma área do mercado imobiliário.
 *
 * Framework: Agno (https://docs.agno.com)
 * Serviço: Python FastAPI rodando em AGNO_SERVICE_URL
 */

import { useState } from 'react'
// Renderer simples de markdown sem dependências externas
function SimpleMarkdown({ content }: { content: string }) {
  // Converte markdown básico para HTML seguro
  const html = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code class="bg-black/20 px-1 rounded text-xs font-mono">$1</code>')
    .replace(/```[\w]*\n([\s\S]*?)```/g, '<pre class="bg-black/30 rounded-lg p-3 text-xs font-mono overflow-x-auto my-2 whitespace-pre-wrap"><code>$1</code></pre>')
    .replace(/^### (.+)$/gm, '<h3 class="text-sm font-bold mt-3 mb-1">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-sm font-bold mt-4 mb-1 border-b border-white/10 pb-1">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-base font-bold mt-4 mb-2">$1</h1>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc text-sm">$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 list-decimal text-sm">$2</li>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>')
  return <div dangerouslySetInnerHTML={{ __html: html }} className="text-sm leading-relaxed" />
}

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface AgentConfig {
  id: string
  name: string
  description: string
  icon: string
  placeholder: string
  examplePrompts: string[]
  color: string
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  agentName?: string
  timestamp: Date
}

// ─── Configuração dos agentes ─────────────────────────────────────────────────

const AGENTS: AgentConfig[] = [
  {
    id: 'team',
    name: 'IMI Assistant',
    description: 'Time completo com auto-routing. Ele decide qual especialista usar.',
    icon: '🧠',
    color: '#D4AF37',
    placeholder: 'Pergunte qualquer coisa sobre leads, imóveis, mercado, conteúdo...',
    examplePrompts: [
      'Analise este lead: João, 42 anos, médico, quer apartamento de R$ 1.5M no Meireles',
      'Crie uma descrição para um cobertura de 280m² com vista mar em Fortaleza',
      'Como está o mercado imobiliário de alto padrão em Fortaleza?',
    ],
  },
  {
    id: 'lead-qualifier',
    name: 'Qualificador de Leads',
    description: 'Score, temperatura e próximas ações para cada lead',
    icon: '🎯',
    color: '#10B981',
    placeholder: 'Descreva o lead: nome, profissão, interesse, budget, como chegou...',
    examplePrompts: [
      'Lead: Ana Paula, arquiteta, 38 anos. Veio pelo Instagram. Quer apartamento 3 quartos até R$ 900k no Cocó.',
      'Lead frio: pediu informação há 15 dias, não responde WhatsApp. O que fazer?',
      'Como qualificar um lead que só quer "dar uma olhada nos preços"?',
    ],
  },
  {
    id: 'property-copywriter',
    name: 'Copywriter Imobiliário',
    description: 'Descrições profissionais para portais, redes sociais e email',
    icon: '✍️',
    color: '#6366F1',
    placeholder: 'Descreva o imóvel: tipo, metragem, quartos, localização, diferenciais...',
    examplePrompts: [
      'Apartamento 180m², 4 suítes, 3 vagas, piscina privativa, Meireles. Formato: ZAP Imóveis.',
      'Casa em condomínio fechado, 350m², 5 quartos, piscina, churrasqueira. Para Instagram com hashtags.',
      'Studio 45m², moderno, alto padrão, Aldeota. Legenda WhatsApp curta e impactante.',
    ],
  },
  {
    id: 'market-analyst',
    name: 'Analista de Mercado',
    description: 'Tendências, precificação, relatórios e análise de oportunidades',
    icon: '📊',
    color: '#F59E0B',
    placeholder: 'Qual mercado, região ou dados você quer analisar?',
    examplePrompts: [
      'Como está o mercado de apartamentos de alto padrão no Meireles? Análise de preços e tendências.',
      'Compare o ROI entre comprar para locação por temporada vs. locação anual em Fortaleza.',
      'Relatório executivo para apresentar a um investidor sobre o mercado imobiliário do Ceará em 2026.',
    ],
  },
  {
    id: 'content-strategist',
    name: 'Estrategista de Conteúdo',
    description: 'Posts, Reels, Stories, LinkedIn e email para o mercado imobiliário',
    icon: '📱',
    color: '#EC4899',
    placeholder: 'Que tipo de conteúdo você precisa? Para qual plataforma?',
    examplePrompts: [
      'Carrossel Instagram: 7 dicas para quem vai comprar o primeiro apartamento.',
      'Roteiro Reels 60s: bastidores de uma visita a uma cobertura de R$ 3M.',
      'Post LinkedIn de autoridade: por que o mercado imobiliário de Fortaleza está aquecendo.',
    ],
  },
  {
    id: 'real-estate-consultant',
    name: 'Consultor Imobiliário',
    description: 'Processo de compra/venda, financiamento, FGTS e questões jurídicas',
    icon: '🏠',
    color: '#3B82F6',
    placeholder: 'Qual sua dúvida sobre o processo imobiliário?',
    examplePrompts: [
      'Meu cliente quer usar FGTS para dar entrada. Quais são as regras e limitações?',
      'Quais certidões exigir do vendedor antes de fechar negócio?',
      'Explique a diferença entre escritura e registro de imóvel para um cliente leigo.',
    ],
  },
  {
    id: 'financial-analyst',
    name: 'Analista Financeiro',
    description: 'KPIs, metas, comissões e análise de performance da equipe',
    icon: '💰',
    color: '#8B5CF6',
    placeholder: 'Quais dados financeiros você quer analisar?',
    examplePrompts: [
      'Tivemos 12 vendas em fevereiro, total R$ 8.4M, 5 corretores. Analise a performance.',
      'Como calcular a meta mensal para bater R$ 2M em comissões no trimestre?',
      'Nosso CAC está em R$ 1.800 por lead. É bom? Como melhorar?',
    ],
  },
]

// ─── Componente principal ─────────────────────────────────────────────────────

export default function AgnoPage() {
  const [selectedAgent, setSelectedAgent] = useState<AgentConfig>(AGENTS[0])
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [serviceStatus, setServiceStatus] = useState<'unknown' | 'online' | 'offline'>('unknown')

  // Verifica status do serviço ao trocar de agente
  const checkService = async () => {
    try {
      const res = await fetch('/api/agno', { signal: AbortSignal.timeout(5000) })
      setServiceStatus(res.ok ? 'online' : 'offline')
    } catch {
      setServiceStatus('offline')
    }
  }

  const selectAgent = (agent: AgentConfig) => {
    setSelectedAgent(agent)
    setMessages([])
    setInput('')
    checkService()
  }

  const sendMessage = async (messageText?: string) => {
    const text = messageText || input.trim()
    if (!text || loading) return

    const userMessage: Message = {
      role: 'user',
      content: text,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const endpoint =
        selectedAgent.id === 'team'
          ? '/api/agno/team'
          : `/api/agno/agents?agent_id=${selectedAgent.id}`

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao contatar o agente')
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response,
        agentName: data.agent_name,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
      setServiceStatus('online')
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro desconhecido'
      const errorMessage: Message = {
        role: 'assistant',
        content: `**Erro:** ${errorMsg}\n\n**Para iniciar o Agno service:**\n\`\`\`bash\ncd agno\nuvicorn main:app --reload --port 8001\n\`\`\``,
        agentName: 'Sistema',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
      setServiceStatus('offline')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Sidebar: seleção de agentes */}
      <aside className="w-72 border-r border-[var(--bo-border)] bg-[var(--bo-surface)] flex flex-col shrink-0 overflow-y-auto">
        {/* Header */}
        <div className="p-4 border-b border-[var(--bo-border)]">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">🤖</span>
            <h1 className="font-semibold text-[var(--bo-text)] text-sm">Agno Agents</h1>
            <span
              className={`ml-auto h-2 w-2 rounded-full shrink-0 ${
                serviceStatus === 'online'
                  ? 'bg-green-500'
                  : serviceStatus === 'offline'
                    ? 'bg-red-500'
                    : 'bg-yellow-500'
              }`}
              title={`Serviço ${serviceStatus}`}
            />
          </div>
          <p className="text-xs text-[var(--bo-text-muted)]">
            Agentes AI especializados para imobiliárias
          </p>
        </div>

        {/* Lista de agentes */}
        <nav className="flex-1 p-2 space-y-1">
          {AGENTS.map((agent) => (
            <button
              key={agent.id}
              onClick={() => selectAgent(agent)}
              className={`w-full text-left p-3 rounded-lg transition-all ${
                selectedAgent.id === agent.id
                  ? 'bg-[var(--bo-elevated)] border border-[var(--bo-border-gold)]'
                  : 'hover:bg-[var(--bo-elevated)]'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base">{agent.icon}</span>
                <span className="text-xs font-medium text-[var(--bo-text)]">{agent.name}</span>
              </div>
              <p className="text-xs text-[var(--bo-text-muted)] leading-tight pl-6">
                {agent.description}
              </p>
            </button>
          ))}
        </nav>

        {/* Docs link */}
        <div className="p-4 border-t border-[var(--bo-border)]">
          <a
            href="https://docs.agno.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[var(--bo-text-muted)] hover:text-[var(--bo-text)] flex items-center gap-1"
          >
            📚 docs.agno.com
          </a>
        </div>
      </aside>

      {/* Chat principal */}
      <main className="flex-1 flex flex-col min-w-0 bg-[var(--bo-surface)]">
        {/* Header do agente selecionado */}
        <div className="p-4 border-b border-[var(--bo-border)] flex items-center gap-3">
          <span className="text-2xl">{selectedAgent.icon}</span>
          <div>
            <h2 className="font-semibold text-[var(--bo-text)] text-sm">{selectedAgent.name}</h2>
            <p className="text-xs text-[var(--bo-text-muted)]">{selectedAgent.description}</p>
          </div>
          {messages.length > 0 && (
            <button
              onClick={() => setMessages([])}
              className="ml-auto text-xs text-[var(--bo-text-muted)] hover:text-[var(--bo-text)] px-2 py-1 rounded border border-[var(--bo-border)]"
            >
              Limpar
            </button>
          )}
        </div>

        {/* Área de mensagens */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            // Estado vazio: exemplos de prompts
            <div className="max-w-2xl mx-auto mt-8">
              <div className="text-center mb-8">
                <span className="text-4xl">{selectedAgent.icon}</span>
                <h3 className="mt-3 font-semibold text-[var(--bo-text)]">{selectedAgent.name}</h3>
                <p className="text-sm text-[var(--bo-text-muted)] mt-1">{selectedAgent.description}</p>
              </div>

              <p className="text-xs font-medium text-[var(--bo-text-muted)] mb-3 uppercase tracking-wide">
                Exemplos
              </p>
              <div className="space-y-2">
                {selectedAgent.examplePrompts.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(prompt)}
                    className="w-full text-left p-3 rounded-lg border border-[var(--bo-border)] hover:border-[var(--bo-border-gold)] hover:bg-[var(--bo-elevated)] transition-all text-sm text-[var(--bo-text)]"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-xl p-4 ${
                    msg.role === 'user'
                      ? 'bg-[var(--bo-elevated)] border border-[var(--bo-border-gold)] text-[var(--bo-text)]'
                      : 'bg-[var(--bo-elevated)] border border-[var(--bo-border)] text-[var(--bo-text)]'
                  }`}
                >
                  {msg.role === 'assistant' && msg.agentName && (
                    <p className="text-xs text-[var(--bo-text-muted)] mb-2 font-medium">
                      {selectedAgent.icon} {msg.agentName}
                    </p>
                  )}
                  {msg.role === 'user' ? (
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    <SimpleMarkdown content={msg.content} />
                  )}
                  <p className="text-xs text-[var(--bo-text-muted)] mt-2 text-right">
                    {msg.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))
          )}

          {/* Loading */}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-[var(--bo-elevated)] border border-[var(--bo-border)] rounded-xl p-4">
                <p className="text-xs text-[var(--bo-text-muted)] mb-2">{selectedAgent.icon} {selectedAgent.name}</p>
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-[var(--bo-text-muted)] animate-bounce [animation-delay:0ms]" />
                  <span className="w-2 h-2 rounded-full bg-[var(--bo-text-muted)] animate-bounce [animation-delay:150ms]" />
                  <span className="w-2 h-2 rounded-full bg-[var(--bo-text-muted)] animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input de mensagem */}
        <div className="p-4 border-t border-[var(--bo-border)]">
          <div className="flex gap-2 items-end">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={selectedAgent.placeholder}
              rows={2}
              disabled={loading}
              className="flex-1 resize-none rounded-lg border border-[var(--bo-border)] bg-[var(--bo-elevated)] text-[var(--bo-text)] placeholder-[var(--bo-text-muted)] px-4 py-3 text-sm focus:outline-none focus:border-[var(--bo-border-gold)] disabled:opacity-50 transition-colors"
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className="shrink-0 px-4 py-3 rounded-lg bg-[var(--bo-border-gold)] text-black font-medium text-sm hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
            >
              {loading ? '...' : 'Enviar'}
            </button>
          </div>
          <p className="text-xs text-[var(--bo-text-muted)] mt-2">
            Enter para enviar • Shift+Enter para nova linha
          </p>
        </div>
      </main>
    </div>
  )
}
