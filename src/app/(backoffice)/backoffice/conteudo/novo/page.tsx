// ============================================
// BLOCO 3 — SCRIPT 4: EDITOR DE CONTEÚDO
// ⚠️ COPIAR EXATAMENTE — NÃO MODIFICAR
// ============================================

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
import { toast } from 'sonner'
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
  Info,
  Facebook,
  Clock,
  X,
} from 'lucide-react'
import { T } from '@/app/(backoffice)/lib/theme'
import { PageIntelHeader } from '@/app/(backoffice)/components/ui'

// ⚠️ NÃO MODIFICAR - Tipos de conteúdo
const TIPOS_CONTEUDO = [
  { id: 'blog',      label: 'Artigo Blog',       icon: FileText,  desc: 'SEO-friendly, 800-2000 palavras',     color: '#3B82F6', bg: 'rgba(59,130,246,0.12)'  },
  { id: 'email',     label: 'E-mail Marketing',  icon: Mail,      desc: 'Newsletter, follow-up, prospecção',   color: 'var(--bo-success)', bg: 'rgba(74,222,128,0.12)'  },
  { id: 'instagram', label: 'Post Instagram',    icon: Instagram, desc: 'Caption + hashtags, máx. 300 chars',  color: '#F472B6', bg: 'rgba(244,114,182,0.12)' },
  { id: 'linkedin',  label: 'Post LinkedIn',     icon: Linkedin,  desc: 'Artigo ou post profissional',         color: '#60A5FA', bg: 'rgba(96,165,250,0.12)'  },
  { id: 'facebook',  label: 'Post Facebook',     icon: Facebook,  desc: 'Post com engajamento',                color: '#818CF8', bg: 'rgba(129,140,248,0.12)' },
  { id: 'landing',   label: 'Landing Page Copy', icon: Globe,     desc: 'Hero, benefícios, CTA',              color: 'var(--bo-warning)', bg: 'rgba(251,191,36,0.12)'  },
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

Esse é o repositório de dados que a IMI compila para ajudar investidores institucionais a tomar decisões com base em evidência, não em intuição.

→ Qual é sua perspectiva sobre mercados imobiliários regionais em 2026?`,
  },
  landing: {
    titulo: 'Inteligência Imobiliária para Decisões que Valem Milhões',
    corpo: `### Headline
Invista com dados, não com achismos.

### Subtítulo
A IMI reúne análise de mercado, avaliações NBR 14653 e inteligência patrimonial para investidores institucionais no mercado imobiliário de Pernambuco.

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

A IMI tem as análises e os imóveis certos para o seu perfil.

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
  const TipoIcon = tipoAtual.icon as React.ElementType

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
    if (!titulo.trim()) {
      toast.error('Adicione um título antes de salvar')
      return
    }
    setSalvo(true)
    try {
      const res = await fetch('/api/conteudos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: titulo.trim(),
          tipo,
          canal: tipo,
          status: 'rascunho',
          conteudo: corpo,
          tags: [],
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erro ao salvar')
      }
      toast.success('Conteúdo salvo com sucesso!')
      setTimeout(() => router.push('/backoffice/conteudos'), 800)
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar conteúdo')
      setSalvo(false)
    }
  }

  const formatShortDate = () => {
    return new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  return (
    <div className="space-y-6" style={{ color: T.text }}>
      <PageIntelHeader
        moduleLabel="CONTEÚDO"
        title="Novo Conteúdo"
        subtitle="Editor inteligente com assistência de IA"
        breadcrumbs={[
          { label: 'Conteúdo', href: '/backoffice/conteudo' },
          { label: 'Novo' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPreview(!preview)}
              className="flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-bold transition-colors flex-shrink-0"
              style={{ background: T.elevated, color: T.text }}
            >
              <Eye size={16} />
              {preview ? 'Editor' : 'Preview'}
            </button>
            <button
              onClick={salvarConteudo}
              disabled={!titulo || !corpo || salvo}
              className="flex items-center gap-2 h-10 px-5 text-white rounded-xl text-sm font-bold hover:brightness-110 disabled:opacity-50 transition-all flex-shrink-0"
              style={{ background: T.accent }}
            >
              {salvo ? <Check size={16} /> : <Save size={16} />}
              {salvo ? 'Salvo!' : 'Salvar'}
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Painel esquerdo: configuração ──────────────────────────────── */}
        <div className="lg:col-span-1 space-y-6">
          {/* Tipo de conteúdo */}
          <div className="rounded-2xl p-5" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
            <label className="block text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: T.textMuted }}>
              Canal de Publicação
            </label>
            <div className="space-y-2">
              {TIPOS_CONTEUDO.map(t => {
                const Icon = t.icon as React.ElementType
                const isActive = tipo === t.id
                return (
                  <button
                    key={t.id}
                    onClick={() => setTipo(t.id)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: '14px',
                      padding: '12px 14px', borderRadius: '16px', textAlign: 'left',
                      cursor: 'pointer', transition: 'all 0.15s', border: 'none',
                      background: isActive ? `${t.bg}` : 'transparent',
                      outline: isActive ? `1px solid ${t.color}40` : '1px solid transparent',
                    }}
                  >
                    <div style={{ width: '38px', height: '38px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: t.bg, color: t.color }}>
                      <Icon size={19} />
                    </div>
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: 700, color: T.text, lineHeight: 1.3 }}>{t.label}</p>
                      <p style={{ fontSize: '10px', fontWeight: 500, color: T.textMuted, marginTop: '2px' }}>{t.desc}</p>
                    </div>
                    {isActive && (
                      <div style={{ marginLeft: 'auto', width: '8px', height: '8px', borderRadius: '50%', background: t.color, flexShrink: 0 }} />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Contexto para IA */}
          <div className="rounded-2xl p-5" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
            <label className="block text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: T.textMuted }}>
              Objetivo & Contexto
            </label>
            <textarea
              value={contexto}
              onChange={e => setContexto(e.target.value)}
              placeholder="Ex: Lançamento Reserva Imperial, foco em investidores, destacar valorização de 18% a.a. em Boa Viagem..."
              className="w-full h-28 px-4 py-3 text-sm rounded-2xl focus:ring-2 focus:ring-[#334E68] focus:border-transparent transition-all resize-none font-medium"
              style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }}
            />
            <div className="flex items-center gap-2 mt-2 px-1">
              <Info size={12} style={{ color: T.accent }} />
              <p className="text-[10px] font-medium italic" style={{ color: T.textMuted }}>Dados ricos geram roteiros melhores pela IA.</p>
            </div>
          </div>

          {/* Assistente IA */}
          <div className="rounded-2xl p-5 shadow-lg" style={{ background: `linear-gradient(135deg, ${T.accent}18, ${T.card})`, border: `1px solid ${T.borderGold}` }}>
            <div className="flex items-center justify-between mb-4">
              <label className="text-[10px] font-bold uppercase tracking-widest" style={{ color: T.textMuted }}>
                Multi-Model Assistant
              </label>
              <Sparkles size={16} style={{ color: T.accent }} className="animate-pulse" />
            </div>
            <div className="space-y-1.5 font-medium">
              {AI_SUGGESTIONS.filter(s => {
                if (tipo === 'instagram' || tipo === 'facebook') return ['titulo', 'corpo', 'hashtags'].includes(s.id)
                if (tipo === 'email') return ['titulo', 'intro', 'corpo', 'cta', 'email_subject'].includes(s.id)
                return true
              }).map(sugestao => (
                <button
                  key={sugestao.id}
                  onClick={() => gerarComIA(sugestao.task, sugestao.id)}
                  className="w-full flex items-center justify-between p-3 rounded-xl text-xs transition-all group hover:brightness-105"
                  style={{ color: T.text }}
                >
                  <span>{sugestao.label}</span>
                  <Zap size={14} style={{ color: T.accent }} className="opacity-40 group-hover:opacity-100 transition-all" />
                </button>
              ))}
              <div className="pt-2 mt-2" style={{ borderTop: `1px solid ${T.border}` }}>
                <button
                  onClick={usarTemplate}
                  className="w-full flex items-center justify-between p-3 rounded-xl text-xs transition-all font-bold hover:brightness-105"
                  style={{ color: T.textMuted }}
                >
                  <span>Preencher Template</span>
                  <FileText size={14} className="opacity-50" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Painel principal: editor ────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">
          {!preview ? (
            <>
              {/* Campo título */}
              <div className="rounded-2xl p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                <div className="flex items-center gap-2 mb-4">
                  <div style={{ width: '32px', height: '32px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: tipoAtual.bg, color: tipoAtual.color }}>
                    <TipoIcon size={16} />
                  </div>
                  <label className="text-[10px] font-bold uppercase tracking-widest" style={{ color: T.textMuted }}>
                    {tipo === 'email' ? 'Subject Line do E-mail' : 'Título de Referência'}
                  </label>
                </div>
                <input
                  value={titulo}
                  onChange={e => setTitulo(e.target.value)}
                  placeholder={
                    tipo === 'email'
                      ? 'Ex: Oportunidade: Reserva Imperial com 18% de valorização...'
                      : 'Ex: Guia definitivo para investir em Boa Viagem'
                  }
                  className="w-full h-12 px-5 rounded-2xl text-base font-bold focus:ring-2 focus:ring-[#334E68] focus:border-transparent transition-all"
                  style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }}
                />
              </div>

              {/* Editor central */}
              <div className="rounded-2xl overflow-hidden" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                <div className="flex items-center gap-1 px-5 py-3 flex-wrap" style={{ borderBottom: `1px solid ${T.border}`, background: T.elevated }}>
                  <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                    {[Bold, Italic, Link2, List, Quote, Image].map((Icon, i) => (
                      <button
                        key={i}
                        className="w-9 h-9 flex items-center justify-center rounded-lg transition-all font-bold"
                        style={{ color: T.textMuted }}
                        title="Formatação"
                      >
                        <Icon size={16} />
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 ml-auto">
                    <Hash size={14} style={{ color: T.border }} />
                    <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: T.textMuted }}>Markdown Ativo</span>
                  </div>
                </div>

                {/* Área de texto */}
                <textarea
                  value={corpo}
                  onChange={e => handleCorpoChange(e.target.value)}
                  placeholder={
                    tipo === 'instagram'
                      ? 'Escreva sua legenda luxuosa aqui...\n\nUse quebras de linha e emojis estrategicamente.\n\n#BoaViagem #IMIAntlantis'
                      : 'Comece a estruturar seu conteúdo estratégico...'
                  }
                  className="w-full h-[500px] px-8 py-6 text-sm focus:outline-none resize-none leading-relaxed font-sans"
                  style={{ background: T.surface, color: T.text, scrollbarWidth: 'thin' } as React.CSSProperties}
                />

                {/* Status bar */}
                <div className="flex items-center justify-between px-6 py-3" style={{ borderTop: `1px solid ${T.border}`, background: T.elevated }}>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: T.textMuted }}>Palavras:</span>
                      <span className="text-xs font-bold" style={{ color: T.text }}>{corpo.split(/\s+/).filter(Boolean).length}</span>
                    </div>
                    <div className="h-4 w-px" style={{ background: T.border }} />
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: T.textMuted }}>Caractéres:</span>
                      <span className={`text-xs font-bold ${tipo === 'instagram' && charCount > 300
                        ? 'text-red-600'
                        : ''
                        }`}
                        style={!(tipo === 'instagram' && charCount > 300) ? { color: T.text } : {}}
                      >
                        {charCount.toLocaleString('pt-BR')}
                        {tipo === 'instagram' && <span style={{ color: T.textMuted }}> / 300</span>}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest" style={{ color: T.accent }}>
                    <div className="w-2 h-2 bg-[var(--bo-accent)] rounded-full animate-pulse" />
                    Backup Automático Ativo
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* ── Preview Mode ───────────────────────────────────────────── */
            <div className="rounded-2xl p-10 min-h-[600px] relative overflow-hidden" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <LogoIMI className="w-32" />
              </div>

              <div className="flex items-center gap-3 mb-8">
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: tipoAtual.bg, color: tipoAtual.color }}>
                  <TipoIcon size={20} />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest block" style={{ color: T.textMuted }}>Prévia do Canal</span>
                  <span className="text-sm font-bold" style={{ color: T.text }}>{tipoAtual.label}</span>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <Clock size={14} style={{ color: T.textMuted }} />
                  <span className="text-xs font-bold" style={{ color: T.textMuted }}>{formatShortDate()}</span>
                </div>
              </div>

              {titulo && (
                <h1 className="text-3xl font-bold mb-8 leading-tight tracking-tight border-l-4 border-[#334E68] pl-6" style={{ color: T.text }}>
                  {titulo}
                </h1>
              )}

              {corpo ? (
                <div className="prose prose-sm max-w-none">
                  <div className="text-base whitespace-pre-wrap leading-relaxed font-sans space-y-4" style={{ color: T.text }}>
                    {corpo}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20" style={{ color: T.border }}>
                  <AlignLeft size={64} className="mb-4 opacity-10" />
                  <p className="font-bold uppercase tracking-widest text-sm">Sem conteúdo para exibir</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Modal Assistente IA ───────────────────────────────────────────── */}
      {aiPanel.open && (
        <div className="fixed inset-0 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="rounded-3xl border shadow-2xl w-full max-w-xl overflow-hidden scale-in-center" style={{ background: T.surface, borderColor: T.border }}>
            {/* Header */}
            <div className="flex items-center justify-between p-6" style={{ background: T.elevated, borderBottom: `1px solid ${T.border}` }}>
              <div className="flex items-center gap-3">
                <Sparkles size={20} className="animate-pulse" />
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest block leading-none mb-1" style={{ color: T.textMuted }}>Cérebro Artificial</span>
                  <span className="text-base font-bold" style={{ color: T.text }}>Assistente Stratégico IMI</span>
                </div>
              </div>
              <button
                onClick={() => setAiPanel(p => ({ ...p, open: false }))}
                className="w-10 h-10 flex items-center justify-center rounded-2xl transition-colors text-2xl leading-none"
                style={{ color: T.textDim }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Content Area */}
            <div className="p-8">
              {aiPanel.loading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-5">
                  <div className="relative">
                    <Loader2 size={48} className="animate-spin text-[var(--bo-accent)]" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full" style={{ background: T.accent }} />
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="font-bold uppercase tracking-widest text-xs" style={{ color: T.text }}>Consultando Modelos...</p>
                    <p className="text-[10px] font-medium mt-1" style={{ color: T.textMuted }}>Orquestrando Claude Sonnet & Gemini Pro</p>
                  </div>
                </div>
              ) : aiPanel.result ? (
                <div className="space-y-6">
                  <div className="rounded-2xl p-6 max-h-[350px] overflow-y-auto scrollbar-thin" style={{ background: T.elevated, border: `1px solid ${T.border}` }}>
                    <pre className="text-sm whitespace-pre-wrap leading-relaxed font-sans font-medium" style={{ color: T.text }}>
                      {aiPanel.result}
                    </pre>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-3 font-bold">
                    <button
                      onClick={() => aplicarSugestao(aiPanel.result)}
                      className="flex items-center gap-2 h-12 px-6 text-white rounded-2xl text-sm hover:brightness-110 w-full sm:flex-1 justify-center shadow-lg transition-all"
                      style={{ background: T.accent }}
                    >
                      <Check size={18} />
                      Aplicar no Texto
                    </button>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => navigator.clipboard.writeText(aiPanel.result)}
                        className="flex items-center gap-2 h-12 px-4 rounded-2xl text-sm flex-1 sm:flex-none justify-center transition-colors"
                        style={{ background: T.elevated, color: T.text }}
                        title="Copiar para área de transferência"
                      >
                        <Copy size={18} />
                      </button>
                      <button
                        onClick={() => gerarComIA(aiPanel.task, aiPanel.field)}
                        className="flex items-center gap-2 h-12 px-4 rounded-2xl text-sm flex-1 sm:flex-none justify-center transition-colors"
                        style={{ background: T.elevated, color: T.text }}
                        title="Regerar resposta"
                      >
                        <RefreshCw size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function LogoIMI({ className }: { className?: string }) {
  return (
    <div className={className}>
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="100" rx="20" fill="currentColor" fillOpacity="0.1" />
        <path d="M30 30H40V70H30V30Z" fill="currentColor" />
        <path d="M45 30H55V70H45V30Z" fill="currentColor" />
        <path d="M60 30H70V70H60V30Z" fill="currentColor" />
      </svg>
    </div>
  )
}
