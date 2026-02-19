/**
 * SALVAR EM: src/app/(backoffice)/backoffice/conteudo/novo/page.tsx
 *
 * Editor de conteúdo rico com assistência de IA.
 * Suporta: blog, email, social post, landing page
 * IA integrada para: título, intro, corpo, CTA, hashtags
 */

'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  FileText,
  Sparkles,
  Save,
  Eye,
  ChevronDown,
  Bold,
  Italic,
  Link2,
  List,
  Quote,
  Image,
  Loader2,
  Check,
  Copy,
  RefreshCw,
  ChevronRight,
  Instagram,
  Linkedin,
  Mail,
  Globe,
  Hash,
  AlignLeft,
  Zap,
  ArrowLeft,
  Info,
  Facebook,
} from 'lucide-react'

// ⚠️ NÃO MODIFICAR - Tipos de conteúdo
const TIPOS_CONTEUDO = [
  { id: 'blog', label: 'Artigo Blog', icon: FileText, desc: 'SEO-friendly, 800-2000 palavras', color: 'text-blue-600 bg-blue-50' },
  { id: 'email', label: 'E-mail Marketing', icon: Mail, desc: 'Newsletter, follow-up, prospecção', color: 'text-green-600 bg-green-50' },
  { id: 'instagram', label: 'Post Instagram', icon: Instagram, desc: 'Caption + hashtags, máx. 300 chars', color: 'text-pink-600 bg-pink-50' },
  { id: 'linkedin', label: 'Post LinkedIn', icon: Linkedin, desc: 'Artigo ou post profissional', color: 'text-blue-700 bg-blue-50' },
  { id: 'facebook', label: 'Post Facebook', icon: Facebook, desc: 'Post com engajamento', color: 'text-indigo-600 bg-indigo-50' },
  { id: 'landing', label: 'Landing Page Copy', icon: Globe, desc: 'Hero, benefícios, CTA', color: 'text-accent-600 bg-accent-50' },
]

// ⚠️ NÃO MODIFICAR - Templates por tipo
const TEMPLATES: Record<string, { titulo: string; corpo: string }> = {
  blog: {
    titulo: 'Investir em Imóveis em Boa Viagem: O Guia Definitivo para 2026',
    corpo: `## Por que Boa Viagem se mantém como o melhor bairro para investimento imobiliário?

Localizado na Zona Sul do Recife, o bairro de Boa Viagem combina infraestrutura consolidada com uma das maiores demandas de aluguel da cidade. Com orla de 8 km e acesso facilitado aos principais centros corporativos, o metro quadrado valoriza consistentemente acima da média municipal.

### Dados de Mercado 2025–2026

- Valorização média: **18,4% ao ano** (últimos 3 anos)
- Ticket médio: R$ 8.200/m² (padrão premium)
- Vacância: 3,2% (menor da cidade)
- Yield médio de locação: **0,7% a.m.** sobre valor de avaliação

### Os 3 Perfis de Investidores que Mais se Beneficiam

**1. Patrimônio Familiar**
Famílias que buscam preservar e multiplicar capital imobiliário com gestão profissionalizada...`,
  },
  email: {
    titulo: 'Uma Oportunidade que Poucos Conhecem no Mercado de Recife',
    corpo: `Prezado(a) [Nome],

Há uma janela de oportunidade no mercado imobiliário de Recife que está se fechando nos próximos 90 dias.

Com base na análise do nosso time de inteligência, identificamos 3 ativos em fase pré-lançamento nos bairros Pina e Piedade que apresentam potencial de valorização superior a 25% em 24 meses.

Por que agora?
→ Fase pré-lançamento: preço de tabela 15-22% abaixo do mercado
→ Construtoras consolidadas: Moura Dubeux, Queiroz Galvão
→ IPTU e condomínio ainda inexistentes

Gostaria de agendar uma conversa de 20 minutos para apresentar os detalhes?

Atenciosamente,
Equipe IMI — Inteligência Imobiliária`,
  },
  instagram: {
    titulo: 'Boa Viagem: Além da Praia',
    corpo: `A orla mais valorizada de Recife não é apenas beleza — é performance financeira.

📊 +18% de valorização em 2025
🏢 Demanda corporativa crescente
🌊 8km de orla, infraestrutura consolidada

Se você está considerando investimento imobiliário em Pernambuco, o dado que muda tudo está no link da bio.

#BoaViagem #InvestimentoImobiliário #RecifePremium #IMI #MercadoImobiliário #InteligênciaImobiliária`,
  },
  linkedin: {
    titulo: 'Por que os family offices estão de olho no mercado de Recife',
    corpo: `Depois de 3 anos analisando dados de transações no Recife, um padrão ficou evidente.

Os imóveis premium na Zona Sul (Boa Viagem, Pina, Candeias) estão apresentando rendimento superior a ativos equivalentes em São Paulo e Rio — com menor volatilidade.

Os números:
• Valorização média 2022–2025: 18,4% a.a.
• Yield de locação: 7,5–9,2% a.a.
• Liquidez crescente (transações +31% em 2025)

A combinação de demanda regional sólida, infraestrutura em expansão e base de preços ainda competitiva cria uma janela que gestores patrimoniais atentos já estão aproveitando.

Esse é o repositório de dados que a IMI Atlantis compila para ajudar investidores institucionais a tomar decisões com base em evidência, não em intuição.

→ Qual é sua perspectiva sobre mercados imobiliários regionais em 2026?`,
  },
  landing: {
    titulo: 'Inteligência Imobiliária para Decisões que Valem Milhões',
    corpo: `### Headline
Invista com dados, não com achismos.

### Subtítulo
A IMI Atlantis reúne análise de mercado, avaliações NBR 14653 e inteligência patrimonial para investidores institucionais no mercado imobiliário de Pernambuco.

### Benefícios
• **Precisão avaliatória** — laudos baseados em metodologia NBR 14653
• **Inteligência de mercado** — dados proprietários de 5.000+ transações
• **Acesso institucional** — atendimento exclusivo para patrimônio acima de R$ 5M

### CTA Principal
Solicitar apresentação exclusiva →`,
  },
  facebook: {
    titulo: 'Você sabia que Recife tem um dos melhores retornos de locação do Brasil?',
    corpo: `Os números falam por si:

✅ Yield de locação: até 9,2% ao ano
✅ Valorização acima de 18% em 2025
✅ Demanda crescente em Boa Viagem e Pina

Enquanto muitos investidores ainda olham apenas para São Paulo e Rio, Recife está entregando resultados consistentes com menor risco.

A IMI Atlantis tem as análises e os imóveis certos para o seu perfil.

📲 Fale com um especialista: (81) 99900-0000`,
  },
}

// ⚠️ NÃO MODIFICAR - Sugestões de IA inline
const AI_SUGGESTIONS = [
  { id: 'titulo', label: 'Gerar Título', task: 'roteiro' },
  { id: 'intro', label: 'Gerar Introdução', task: 'roteiro' },
  { id: 'corpo', label: 'Expandir Conteúdo', task: 'roteiro' },
  { id: 'cta', label: 'Gerar CTA', task: 'roteiro' },
  { id: 'hashtags', label: 'Gerar Hashtags', task: 'hashtags' },
  { id: 'email_subject', label: 'Gerar Subject Lines', task: 'email' },
]

interface AIPanel {
  open: boolean
  loading: boolean
  task: string
  result: string
  field: string
}

export default function NovoConteudoPage() {
  const router = useRouter()
  const [tipo, setTipo] = useState('blog')
  const [titulo, setTitulo] = useState('')
  const [corpo, setCorpo] = useState('')
  const [contexto, setContexto] = useState('')
  const [salvo, setSalvo] = useState(false)
  const [preview, setPreview] = useState(false)
  const [aiPanel, setAiPanel] = useState<AIPanel>({
    open: false,
    loading: false,
    task: '',
    result: '',
    field: '',
  })
  const [charCount, setCharCount] = useState(0)

  const tipoAtual = TIPOS_CONTEUDO.find(t => t.id === tipo) || TIPOS_CONTEUDO[0]
  const TipoIcon = tipoAtual.icon

  const usarTemplate = () => {
    const tpl = TEMPLATES[tipo]
    if (tpl) {
      setTitulo(tpl.titulo)
      setCorpo(tpl.corpo)
      setCharCount(tpl.corpo.length)
    }
  }

  const handleCorpoChange = (v: string) => {
    setCorpo(v)
    setCharCount(v.length)
  }

  // ── Chamada AI Router ─────────────────────────────────────────────────────
  const gerarComIA = async (task: string, field: string, extraPrompt?: string) => {
    setAiPanel(p => ({ ...p, open: true, loading: true, task, field, result: '' }))

    const promptBase =
      field === 'titulo'
        ? `Gere 5 títulos alternativos para um conteúdo do tipo "${tipo}" sobre: ${titulo || contexto || 'mercado imobiliário premium de Recife'}`
        : field === 'hashtags'
          ? `Gere 25 hashtags para um post de ${tipo} sobre: ${titulo || contexto || 'imóveis premium Recife'}`
          : field === 'email_subject'
            ? `Gere 5 subject lines para email marketing sobre: ${titulo || contexto}`
            : `Gere ${field} para um conteúdo de ${tipo} sobre: "${titulo || contexto}"\n\nContexto adicional: ${contexto}`

    try {
      const res = await fetch('/api/ai/router', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_type: task,
          prompt: extraPrompt || promptBase,
          platform: tipo as any,
          context: `Empresa: IMI — Inteligência Imobiliária, Recife/PE. Tom: institucional, sofisticado.`,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setAiPanel(p => ({ ...p, loading: false, result: data.result }))
      } else throw new Error(data.error)
    } catch {
      setAiPanel(p => ({
        ...p,
        loading: false,
        result:
          'API não disponível. Configure as variáveis de ambiente:\n- ANTHROPIC_API_KEY\n- OPENAI_API_KEY\n- GOOGLE_AI_API_KEY',
      }))
    }
  }

  const aplicarSugestao = (texto: string) => {
    if (aiPanel.field === 'titulo') {
      setTitulo(texto.split('\n')[0].replace(/^[0-9\.\-\*]+\s*/, '').replace(/^"/, '').replace(/"$/, ''))
    } else if (aiPanel.field === 'hashtags' || aiPanel.field === 'cta' || aiPanel.field === 'intro' || aiPanel.field === 'corpo') {
      setCorpo(prev => prev + '\n\n' + texto)
      setCharCount(corpo.length + texto.length + 2)
    }
    setAiPanel(p => ({ ...p, open: false }))
  }

  const salvarConteudo = async () => {
    setSalvo(true)
    setTimeout(() => {
      router.push('/backoffice/conteudos')
    }, 1500)
  }

  const formatShortDate = () => {
    return new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft size={18} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Novo Conteúdo</h1>
            <p className="text-sm text-gray-600 mt-0.5">
              Editor com assistência de IA
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPreview(!preview)}
            className="flex items-center gap-2 h-10 px-4 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200"
          >
            <Eye size={16} />
            {preview ? 'Editar' : 'Preview'}
          </button>
          <button
            onClick={salvarConteudo}
            disabled={!titulo || !corpo || salvo}
            className="flex items-center gap-2 h-10 px-5 bg-accent-600 text-white rounded-xl text-sm font-medium hover:bg-accent-700 disabled:opacity-50"
          >
            {salvo ? <Check size={16} /> : <Save size={16} />}
            {salvo ? 'Salvo!' : 'Salvar Rascunho'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Painel esquerdo: configuração ──────────────────────────────── */}
        <div className="lg:col-span-1 space-y-4">
          {/* Tipo de conteúdo */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">
              Tipo de Conteúdo
            </label>
            <div className="space-y-2">
              {TIPOS_CONTEUDO.map(t => {
                const Icon = t.icon
                return (
                  <button
                    key={t.id}
                    onClick={() => setTipo(t.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${tipo === t.id
                        ? 'bg-accent-50 border border-accent-200'
                        : 'hover:bg-gray-50 border border-transparent'
                      }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${t.color}`}>
                      <Icon size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{t.label}</p>
                      <p className="text-xs text-gray-500">{t.desc}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Contexto para IA */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Contexto para IA
            </label>
            <textarea
              value={contexto}
              onChange={e => setContexto(e.target.value)}
              placeholder="Ex: Post sobre Reserva Atlantis, público investidor, foco em retorno sobre capital..."
              className="w-full h-20 px-3 py-2 text-sm border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-accent-500 resize-none"
            />
            <p className="text-xs text-gray-400 mt-1">Quanto mais contexto, melhor o resultado da IA</p>
          </div>

          {/* Ações IA */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Assistente IA
              </label>
              <Sparkles size={14} className="text-accent-500" />
            </div>
            <div className="space-y-2">
              {AI_SUGGESTIONS.filter(s => {
                if (tipo === 'instagram' || tipo === 'facebook') return ['titulo', 'corpo', 'hashtags'].includes(s.id)
                if (tipo === 'email') return ['titulo', 'intro', 'corpo', 'cta', 'email_subject'].includes(s.id)
                return true
              }).map(sugestao => (
                <button
                  key={sugestao.id}
                  onClick={() => gerarComIA(sugestao.task, sugestao.id)}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-accent-50 text-sm text-gray-700 hover:text-accent-700 transition-colors group"
                >
                  <span>{sugestao.label}</span>
                  <Zap size={14} className="text-gray-300 group-hover:text-accent-500" />
                </button>
              ))}
              <button
                onClick={usarTemplate}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-50 text-sm text-gray-500 transition-colors"
              >
                <span>Usar Template</span>
                <FileText size={14} className="text-gray-300" />
              </button>
            </div>
          </div>

          {/* Metadata */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">
              Informações
            </label>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Tipo</span>
                <span className="font-medium text-gray-900">{tipoAtual.label}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Caracteres</span>
                <span className={`font-medium ${tipo === 'instagram' && charCount > 300
                    ? 'text-red-600'
                    : 'text-gray-900'
                  }`}>
                  {charCount.toLocaleString('pt-BR')}
                  {tipo === 'instagram' && <span className="text-gray-400"> / 300</span>}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Criado em</span>
                <span className="text-gray-900">{formatShortDate()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Status</span>
                <span className="px-2 py-0.5 bg-orange-50 text-orange-700 rounded-lg text-xs font-medium">
                  Rascunho
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Painel principal: editor ────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">
          {!preview ? (
            <>
              {/* Campo título */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <div className="flex items-center gap-2 mb-3">
                  <TipoIcon size={16} className={tipoAtual.color.split(' ')[0]} />
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    {tipo === 'email' ? 'Subject Line / Assunto' : tipo === 'instagram' ? 'Título interno (não publicado)' : 'Título'}
                  </label>
                </div>
                <input
                  value={titulo}
                  onChange={e => setTitulo(e.target.value)}
                  placeholder={
                    tipo === 'email'
                      ? 'Ex: Uma oportunidade que poucos conhecem...'
                      : tipo === 'instagram'
                        ? 'Ex: Post Boa Viagem — Fevereiro 2026'
                        : 'Digite o título do conteúdo...'
                  }
                  className="w-full h-12 px-4 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                />
              </div>

              {/* Barra de formatação (decorativa — editor plain text) */}
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="flex items-center gap-1 px-4 py-2 border-b border-gray-100 flex-wrap">
                  {[Bold, Italic, Link2, List, Quote, Image].map((Icon, i) => (
                    <button
                      key={i}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                      title="Formatação"
                    >
                      <Icon size={14} />
                    </button>
                  ))}
                  <div className="w-px h-5 bg-gray-200 mx-1" />
                  <div className="flex items-center gap-1 ml-auto">
                    <Info size={12} className="text-gray-400" />
                    <span className="text-xs text-gray-400">Markdown suportado</span>
                  </div>
                </div>

                {/* Área de edição */}
                <textarea
                  value={corpo}
                  onChange={e => handleCorpoChange(e.target.value)}
                  placeholder={
                    tipo === 'instagram'
                      ? 'Escreva a legenda aqui...\n\nUse quebras de linha para separar parágrafos.\n\n#hashtag1 #hashtag2'
                      : tipo === 'email'
                        ? 'Prezado(a) [Nome],\n\nEscreva o corpo do email aqui...'
                        : '## Introdução\n\nComece a escrever aqui...\n\n### Subtítulo\n\nConteúdo...'
                  }
                  className="w-full h-96 px-6 py-4 text-sm text-gray-900 focus:outline-none resize-none leading-relaxed font-mono"
                />

                {/* Rodapé do editor */}
                <div className="flex items-center justify-between px-4 py-2 border-t border-gray-50 bg-gray-50">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">
                      {corpo.split(/\s+/).filter(Boolean).length} palavras
                    </span>
                    <span className="text-xs text-gray-300">·</span>
                    <span className="text-xs text-gray-400">
                      {charCount} caracteres
                    </span>
                    {tipo === 'instagram' && charCount > 300 && (
                      <>
                        <span className="text-xs text-gray-300">·</span>
                        <span className="text-xs text-red-600 font-medium">
                          {charCount - 300} caracteres acima do limite Instagram
                        </span>
                      </>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">Salvo automaticamente</span>
                </div>
              </div>
            </>
          ) : (
            /* ── Preview ────────────────────────────────────────────────── */
            <div className="bg-white rounded-2xl border border-gray-100 p-8">
              <div className="flex items-center gap-2 mb-4">
                <span className={`px-3 py-1 rounded-lg text-xs font-medium ${tipoAtual.color}`}>
                  {tipoAtual.label}
                </span>
                <span className="text-xs text-gray-400">{formatShortDate()}</span>
              </div>
              {titulo && (
                <h1 className="text-2xl font-bold text-gray-900 mb-4">{titulo}</h1>
              )}
              {corpo ? (
                <div className="prose prose-sm max-w-none">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed font-sans">
                    {corpo}
                  </pre>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <AlignLeft size={40} className="mx-auto mb-3 opacity-30" />
                  <p>Nenhum conteúdo para visualizar ainda</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Painel IA (drawer lateral simulado) ────────────────────────────── */}
      {aiPanel.open && (
        <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl w-full max-w-lg">
            {/* Header do painel */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-accent-600" />
                <span className="font-medium text-gray-900">Assistente IA</span>
              </div>
              <button
                onClick={() => setAiPanel(p => ({ ...p, open: false }))}
                className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-500"
              >
                ×
              </button>
            </div>

            {/* Conteúdo */}
            <div className="p-4">
              {aiPanel.loading ? (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <Loader2 size={32} className="animate-spin text-accent-500" />
                  <p className="text-sm text-gray-600">Gerando com IA...</p>
                  <p className="text-xs text-gray-400">Claude Sonnet</p>
                </div>
              ) : aiPanel.result ? (
                <>
                  <div className="bg-gray-50 rounded-xl p-4 mb-4 max-h-60 overflow-y-auto">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed font-sans">
                      {aiPanel.result}
                    </pre>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => aplicarSugestao(aiPanel.result)}
                      className="flex items-center gap-2 h-10 px-4 bg-accent-600 text-white rounded-xl text-sm font-medium hover:bg-accent-700 flex-1 justify-center"
                    >
                      <Check size={16} />
                      Aplicar ao Conteúdo
                    </button>
                    <button
                      onClick={() => navigator.clipboard.writeText(aiPanel.result)}
                      className="flex items-center gap-2 h-10 px-3 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200"
                    >
                      <Copy size={14} />
                      Copiar
                    </button>
                    <button
                      onClick={() => gerarComIA(aiPanel.task, aiPanel.field)}
                      className="flex items-center gap-2 h-10 px-3 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200"
                    >
                      <RefreshCw size={14} />
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
