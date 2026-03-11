'use client'

/**
 * Agno Agents — Central de IA Imobiliária
 * =========================================
 * Chat com streaming SSE em tempo real, histórico persistente por sessão,
 * contexto estruturado para leads, copy de respostas e auto-scroll.
 *
 * Framework: Agno (https://docs.agno.com)
 */

import { useCallback, useEffect, useRef, useState } from 'react'

// ─── Markdown renderer ────────────────────────────────────────────────────────

function SimpleMarkdown({ content }: { content: string }) {
  const html = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/```[\w]*\n([\s\S]*?)```/g, '<pre class="bg-black/30 rounded-lg p-3 text-xs font-mono overflow-x-auto my-2 whitespace-pre-wrap border border-white/10"><code>$1</code></pre>')
    .replace(/`([^`]+)`/g, '<code class="bg-black/20 px-1 rounded text-xs font-mono">$1</code>')
    .replace(/^### (.+)$/gm, '<h3 class="text-sm font-bold mt-4 mb-1">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-sm font-bold mt-5 mb-2 border-b border-white/10 pb-1">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-base font-bold mt-4 mb-2">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc text-sm my-0.5">$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 list-decimal text-sm my-0.5">$2</li>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>')
  return <div dangerouslySetInnerHTML={{ __html: html }} className="text-sm leading-relaxed" />
}

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface AgentConfig {
  id: string
  name: string
  description: string
  icon: string
  placeholder: string
  color: string
  examplePrompts: string[]
  contextFields?: { key: string; label: string; placeholder: string }[]
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  agentName?: string
  timestamp: Date
  isStreaming?: boolean
}

// ─── Config dos agentes ───────────────────────────────────────────────────────

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
      'Crie uma descrição para uma cobertura de 280m² com vista mar em Fortaleza',
      'Como está o mercado imobiliário de alto padrão em Fortaleza em 2026?',
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
      'Lead: Ana Paula, arquiteta, 38 anos. Veio pelo Instagram. Quer apto 3 quartos até R$ 900k no Cocó.',
      'Lead frio: pediu informação há 15 dias, não responde WhatsApp. O que fazer?',
      'Como qualificar um lead que só quer "dar uma olhada nos preços"?',
    ],
    contextFields: [
      { key: 'nome', label: 'Nome', placeholder: 'João Silva' },
      { key: 'profissao', label: 'Profissão', placeholder: 'Médico, Empresário...' },
      { key: 'budget', label: 'Budget', placeholder: 'R$ 800.000' },
      { key: 'canal', label: 'Canal de origem', placeholder: 'Instagram, ZAP, indicação...' },
      { key: 'interesse', label: 'Interesse', placeholder: 'Apto 3 quartos, Meireles' },
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
    contextFields: [
      { key: 'tipo', label: 'Tipo', placeholder: 'Apartamento, Casa, Studio...' },
      { key: 'metragem', label: 'Metragem', placeholder: '180m²' },
      { key: 'quartos', label: 'Quartos/Suítes', placeholder: '4 suítes' },
      { key: 'bairro', label: 'Bairro', placeholder: 'Meireles, Cocó...' },
      { key: 'formato', label: 'Formato', placeholder: 'ZAP, Instagram, WhatsApp...' },
    ],
  },
  {
    id: 'market-analyst',
    name: 'Analista de Mercado',
    description: 'Tendências, precificação e relatórios com dados em tempo real',
    icon: '📊',
    color: '#F59E0B',
    placeholder: 'Qual mercado, região ou dado você quer analisar?',
    examplePrompts: [
      'Relatório do mercado de alto padrão no Meireles: preços, tendências e oportunidades.',
      'Compare o ROI: locação temporada vs. locação anual em Fortaleza.',
      'Análise para investidor: mercado imobiliário do Ceará em 2026.',
    ],
  },
  {
    id: 'content-strategist',
    name: 'Estrategista de Conteúdo',
    description: 'Posts, Reels, carrosséis e email para o mercado imobiliário',
    icon: '📱',
    color: '#EC4899',
    placeholder: 'Que tipo de conteúdo? Para qual plataforma?',
    examplePrompts: [
      'Carrossel Instagram: 7 dicas para quem vai comprar o primeiro apartamento.',
      'Roteiro Reels 60s: bastidores de uma visita a uma cobertura de R$ 3M.',
      'Post LinkedIn de autoridade: por que o mercado de Fortaleza está aquecendo.',
    ],
    contextFields: [
      { key: 'plataforma', label: 'Plataforma', placeholder: 'Instagram, LinkedIn, WhatsApp...' },
      { key: 'formato', label: 'Formato', placeholder: 'Reels, Carrossel, Stories...' },
      { key: 'objetivo', label: 'Objetivo', placeholder: 'Gerar leads, autoridade...' },
    ],
  },
  {
    id: 'real-estate-consultant',
    name: 'Consultor Imobiliário',
    description: 'Processo de compra/venda, financiamento, FGTS e aspectos jurídicos',
    icon: '🏠',
    color: '#3B82F6',
    placeholder: 'Qual sua dúvida sobre o processo imobiliário?',
    examplePrompts: [
      'Meu cliente quer usar FGTS para dar entrada. Quais são as regras e limitações?',
      'Quais certidões exigir do vendedor antes de fechar negócio?',
      'Explique a diferença entre escritura e registro para um cliente leigo.',
    ],
  },
  {
    id: 'financial-analyst',
    name: 'Analista Financeiro',
    description: 'KPIs, metas, comissões e análise de performance com cálculos',
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateId() {
  return Math.random().toString(36).slice(2, 11)
}

function getOrCreateSessionId(agentId: string): string {
  if (typeof window === 'undefined') return generateId()
  const key = `agno_session_${agentId}`
  let id = localStorage.getItem(key)
  if (!id) {
    id = `${agentId}-${Date.now()}-${generateId()}`
    localStorage.setItem(key, id)
  }
  return id
}

function resetSession(agentId: string): string {
  const newId = `${agentId}-${Date.now()}-${generateId()}`
  localStorage.setItem(`agno_session_${agentId}`, newId)
  return newId
}

// ─── CopyButton ───────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }}
      className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-[var(--bo-text-muted)] hover:text-[var(--bo-text)] px-2 py-1 rounded border border-[var(--bo-border)]"
    >
      {copied ? '✓ Copiado' : 'Copiar'}
    </button>
  )
}

// ─── ContextForm ──────────────────────────────────────────────────────────────

function ContextForm({
  fields,
  values,
  onChange,
}: {
  fields: { key: string; label: string; placeholder: string }[]
  values: Record<string, string>
  onChange: (k: string, v: string) => void
}) {
  return (
    <div className="border border-[var(--bo-border)] rounded-lg p-3 mb-3 bg-[var(--bo-elevated)]">
      <p className="text-xs font-medium text-[var(--bo-text-muted)] mb-2">
        📋 Contexto estruturado{' '}
        {Object.values(values).some(Boolean) && <span className="text-green-400">(preenchido)</span>}
      </p>
      <div className="grid grid-cols-2 gap-2">
        {fields.map((f) => (
          <div key={f.key}>
            <label className="text-xs text-[var(--bo-text-muted)] block mb-0.5">{f.label}</label>
            <input
              type="text"
              value={values[f.key] || ''}
              onChange={(e) => onChange(f.key, e.target.value)}
              placeholder={f.placeholder}
              className="w-full text-xs rounded border border-[var(--bo-border)] bg-[var(--bo-surface)] text-[var(--bo-text)] placeholder-[var(--bo-text-muted)] px-2 py-1.5 focus:outline-none focus:border-[var(--bo-border-gold)]"
            />
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function AgnoPage() {
  const [selectedAgent, setSelectedAgent] = useState<AgentConfig>(AGENTS[0])
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [serviceStatus, setServiceStatus] = useState<'unknown' | 'online' | 'offline'>('unknown')
  const [sessionId, setSessionId] = useState('')
  const [context, setContext] = useState<Record<string, string>>({})
  const [showContext, setShowContext] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    setSessionId(getOrCreateSessionId(selectedAgent.id))
  }, [selectedAgent.id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const checkService = useCallback(async () => {
    try {
      const res = await fetch('/api/agno', { signal: AbortSignal.timeout(5000) })
      setServiceStatus(res.ok ? 'online' : 'offline')
    } catch {
      setServiceStatus('offline')
    }
  }, [])

  useEffect(() => { checkService() }, [checkService])

  const selectAgent = (agent: AgentConfig) => {
    abortRef.current?.abort()
    setSelectedAgent(agent)
    setMessages([])
    setInput('')
    setContext({})
    setShowContext(false)
    setSessionId(getOrCreateSessionId(agent.id))
  }

  const clearSession = () => {
    abortRef.current?.abort()
    setMessages([])
    setContext({})
    setSessionId(resetSession(selectedAgent.id))
  }

  const sendMessage = async (messageText?: string) => {
    const text = (messageText || input).trim()
    if (!text || loading) return

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    const userMsg: Message = { id: generateId(), role: 'user', content: text, timestamp: new Date() }
    const aId = generateId()
    const assistantMsg: Message = {
      id: aId,
      role: 'assistant',
      content: '',
      agentName: selectedAgent.name,
      timestamp: new Date(),
      isStreaming: true,
    }

    setMessages((prev) => [...prev, userMsg, assistantMsg])
    setInput('')
    setLoading(true)

    const contextPayload = Object.fromEntries(Object.entries(context).filter(([, v]) => v))
    const hasContext = Object.keys(contextPayload).length > 0

    try {
      const res = await fetch(`/api/agno/stream?agent_id=${selectedAgent.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          session_id: sessionId,
          ...(hasContext && { context: contextPayload }),
        }),
        signal: controller.signal,
      })

      if (!res.body) throw new Error('Sem body na resposta')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let fullContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const raw = line.slice(6).trim()
          if (raw === '[DONE]') break

          try {
            const chunk = JSON.parse(raw) as { content?: string; done?: boolean; error?: string }

            if (chunk.error) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === aId ? { ...m, content: `**Erro:** ${chunk.error}`, isStreaming: false } : m
                )
              )
              setServiceStatus('offline')
              break
            }

            if (chunk.content) {
              // Detectar se chunk é acumulado ou incremental
              if (chunk.content.startsWith(fullContent) && chunk.content.length > fullContent.length) {
                const delta = chunk.content.slice(fullContent.length)
                fullContent = chunk.content
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === aId ? { ...m, content: fullContent, isStreaming: !chunk.done } : m
                  )
                )
                if (delta) { /* delta já adicionado acima */ }
              } else {
                fullContent += chunk.content
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === aId ? { ...m, content: fullContent, isStreaming: !chunk.done } : m
                  )
                )
              }
            }

            if (chunk.done) break
          } catch {
            // chunk malformado, ignora
          }
        }
      }

      setMessages((prev) => prev.map((m) => (m.id === aId ? { ...m, isStreaming: false } : m)))
      setServiceStatus('online')
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      const msg = err instanceof Error ? err.message : 'Erro desconhecido'
      setMessages((prev) =>
        prev.map((m) =>
          m.id === aId
            ? {
                ...m,
                content: `**Erro de conexão:** ${msg}\n\n\`\`\`bash\ncd agno\nuvicorn main:app --reload --port 8001\n\`\`\``,
                isStreaming: false,
              }
            : m
        )
      )
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

  const statusColor = { online: 'bg-green-500', offline: 'bg-red-500', unknown: 'bg-yellow-500' }[serviceStatus]
  const statusLabel = { online: 'online', offline: 'offline', unknown: 'verificando...' }[serviceStatus]

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-[var(--bo-bg)]">

      {/* Sidebar */}
      <aside className="w-72 border-r border-[var(--bo-border)] bg-[var(--bo-surface)] flex flex-col shrink-0 overflow-y-auto">
        <div className="p-4 border-b border-[var(--bo-border)]">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">🤖</span>
            <h1 className="font-semibold text-[var(--bo-text)] text-sm">Agno Agents</h1>
            <button onClick={checkService} className="ml-auto flex items-center gap-1.5" title={`Serviço ${statusLabel}`}>
              <span className={`block h-2.5 w-2.5 rounded-full ${statusColor} transition-colors`} />
              <span className="text-xs text-[var(--bo-text-muted)]">{statusLabel}</span>
            </button>
          </div>
          <p className="text-xs text-[var(--bo-text-muted)]">IA especializada para imobiliárias</p>
        </div>

        <nav className="flex-1 p-2 space-y-1">
          {AGENTS.map((agent) => (
            <button
              key={agent.id}
              onClick={() => selectAgent(agent)}
              className={`w-full text-left p-3 rounded-lg transition-all ${
                selectedAgent.id === agent.id
                  ? 'bg-[var(--bo-elevated)] border border-[var(--bo-border-gold)]'
                  : 'hover:bg-[var(--bo-elevated)] border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-base shrink-0">{agent.icon}</span>
                <span className="text-xs font-medium text-[var(--bo-text)] truncate">{agent.name}</span>
              </div>
              <p className="text-xs text-[var(--bo-text-muted)] leading-tight pl-6 line-clamp-2">
                {agent.description}
              </p>
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-[var(--bo-border)]">
          {sessionId && (
            <p className="text-xs text-[var(--bo-text-muted)] truncate mb-2" title={sessionId}>
              Sessão: {sessionId.slice(-12)}
            </p>
          )}
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

      {/* Chat */}
      <main className="flex-1 flex flex-col min-w-0">

        {/* Header */}
        <div className="p-4 border-b border-[var(--bo-border)] bg-[var(--bo-surface)] flex items-center gap-3 shrink-0">
          <span className="text-2xl shrink-0">{selectedAgent.icon}</span>
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold text-[var(--bo-text)] text-sm">{selectedAgent.name}</h2>
            <p className="text-xs text-[var(--bo-text-muted)] truncate">{selectedAgent.description}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {selectedAgent.contextFields && (
              <button
                onClick={() => setShowContext((v) => !v)}
                className={`text-xs px-2 py-1 rounded border transition-colors ${
                  showContext
                    ? 'border-[var(--bo-border-gold)] text-[var(--bo-text)]'
                    : 'border-[var(--bo-border)] text-[var(--bo-text-muted)] hover:text-[var(--bo-text)]'
                }`}
              >
                📋 Contexto
              </button>
            )}
            {messages.length > 0 && (
              <button
                onClick={clearSession}
                className="text-xs text-[var(--bo-text-muted)] hover:text-[var(--bo-text)] px-2 py-1 rounded border border-[var(--bo-border)] transition-colors"
              >
                Nova sessão
              </button>
            )}
          </div>
        </div>

        {/* Mensagens */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[var(--bo-bg)]">
          {messages.length === 0 ? (
            <div className="max-w-2xl mx-auto mt-8">
              <div className="text-center mb-8">
                <span className="text-5xl">{selectedAgent.icon}</span>
                <h3 className="mt-3 font-semibold text-[var(--bo-text)] text-lg">{selectedAgent.name}</h3>
                <p className="text-sm text-[var(--bo-text-muted)] mt-1 max-w-md mx-auto">
                  {selectedAgent.description}
                </p>
                {serviceStatus === 'offline' && (
                  <div className="mt-4 p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-xs text-red-400 text-left">
                    <strong>Agno service offline.</strong>
                    <br />
                    <code>cd agno && uvicorn main:app --reload --port 8001</code>
                  </div>
                )}
              </div>
              <p className="text-xs font-medium text-[var(--bo-text-muted)] mb-3 uppercase tracking-widest">
                Exemplos para começar
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
            messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-xl p-4 group ${
                    msg.role === 'user'
                      ? 'bg-[var(--bo-elevated)] border border-[var(--bo-border-gold)]'
                      : 'bg-[var(--bo-surface)] border border-[var(--bo-border)]'
                  }`}
                >
                  {msg.role === 'assistant' && msg.agentName && (
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-[var(--bo-text-muted)] font-medium flex items-center gap-1">
                        {selectedAgent.icon} {msg.agentName}
                        {msg.isStreaming && (
                          <span className="ml-1 inline-flex gap-0.5">
                            <span className="w-1 h-1 rounded-full bg-[var(--bo-text-muted)] animate-bounce [animation-delay:0ms]" />
                            <span className="w-1 h-1 rounded-full bg-[var(--bo-text-muted)] animate-bounce [animation-delay:150ms]" />
                            <span className="w-1 h-1 rounded-full bg-[var(--bo-text-muted)] animate-bounce [animation-delay:300ms]" />
                          </span>
                        )}
                      </p>
                      {!msg.isStreaming && msg.content && <CopyButton text={msg.content} />}
                    </div>
                  )}

                  {msg.role === 'user' ? (
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  ) : msg.content ? (
                    <SimpleMarkdown content={msg.content} />
                  ) : (
                    <div className="flex gap-1 py-1">
                      <span className="w-2 h-2 rounded-full bg-[var(--bo-text-muted)] animate-bounce [animation-delay:0ms]" />
                      <span className="w-2 h-2 rounded-full bg-[var(--bo-text-muted)] animate-bounce [animation-delay:150ms]" />
                      <span className="w-2 h-2 rounded-full bg-[var(--bo-text-muted)] animate-bounce [animation-delay:300ms]" />
                    </div>
                  )}

                  <p className="text-xs text-[var(--bo-text-muted)] mt-2 text-right opacity-60">
                    {msg.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-[var(--bo-border)] bg-[var(--bo-surface)] shrink-0">
          {showContext && selectedAgent.contextFields && (
            <ContextForm
              fields={selectedAgent.contextFields}
              values={context}
              onChange={(k, v) => setContext((prev) => ({ ...prev, [k]: v }))}
            />
          )}
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
            <div className="flex flex-col gap-1.5 shrink-0">
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                className="px-5 py-2.5 rounded-lg bg-[var(--bo-border-gold)] text-black font-semibold text-sm hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
              >
                {loading ? '...' : 'Enviar'}
              </button>
              {loading && (
                <button
                  onClick={() => {
                    abortRef.current?.abort()
                    setLoading(false)
                    setMessages((prev) =>
                      prev.map((m) => (m.isStreaming ? { ...m, isStreaming: false } : m))
                    )
                  }}
                  className="px-3 py-1 rounded-lg border border-[var(--bo-border)] text-[var(--bo-text-muted)] text-xs hover:text-[var(--bo-text)] transition-colors"
                >
                  Parar
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-[var(--bo-text-muted)]">
              Enter para enviar · Shift+Enter para nova linha
            </p>
            {input.length > 200 && (
              <p className="text-xs text-[var(--bo-text-muted)]">{input.length}/10.000</p>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
