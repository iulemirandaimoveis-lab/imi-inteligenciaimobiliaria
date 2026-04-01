'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Scale, BookOpen, Upload, Send, Trash2, Search, Sparkles, FileText, ChevronRight, RotateCcw, Brain, CheckCircle2, XCircle, Loader2, Info, Calculator, DollarSign, TrendingUp, Building2 } from 'lucide-react'
import DOMPurify from 'isomorphic-dompurify'

// ── Design tokens — imported from centralized theme ───────────────────────────
import { T } from '@/app/(backoffice)/lib/theme'

// ── Types ─────────────────────────────────────────────────────────────────────
interface KBPage {
  id: string
  source_file: string
  page_title: string
  normas_citadas: string[]
  created_at: string
  avaliacoes_kb_topics: [{ count: number }]
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

type Tab = 'consultar' | 'base' | 'processar' | 'calculadora'

const CATEGORIES = [
  { value: 'all',         label: 'Todas',       color: 'var(--accent-400)' },
  { value: 'metodologia', label: 'Metodologia', color: 'var(--info)' },
  { value: 'norma',       label: 'Normas NBR',  color: 'var(--platinum-400)' },
  { value: 'definicao',   label: 'Definições',  color: 'var(--success)' },
  { value: 'calculo',     label: 'Cálculos',    color: '#F87171' },
  { value: 'exemplo',     label: 'Exemplos',    color: '#FBBF24' },
  { value: 'formulario',  label: 'Formulários', color: '#FB923C' },
]

const QUICK_QUESTIONS = [
  { q: 'Qual a estrutura mínima de um PTAM?',                     Icon: FileText  },
  { q: 'Como fazer homogeneização de amostras?',                  Icon: Scale     },
  { q: 'Graus de fundamentação NBR 14653-2 explicados',           Icon: BookOpen  },
  { q: 'Como calcular o valor unitário padrão?',                  Icon: Sparkles  },
  { q: 'Diferença entre método comparativo direto e indireto?',   Icon: Scale     },
  { q: 'Documentos necessários para avaliação de imóvel urbano?', Icon: FileText  },
]

// ── Root ──────────────────────────────────────────────────────────────────────
export default function MotorAvaliacoesPage() {
  const [tab, setTab] = useState<Tab>('consultar')

  return (
    <div style={{ minHeight: '100vh', color: T.text, fontFamily: 'var(--font-ui, var(--font-outfit, sans-serif))' }}>
      <style>{`
        .mi::placeholder { color: ${T.textDim}; }
        .mi:focus { outline: none; border-color: ${T.gold} !important; box-shadow: 0 0 0 3px rgba(184,148,58,0.12); }
        .mq:hover { border-color: ${T.gold} !important; background: ${T.goldBg} !important; color: ${T.text} !important; }
        .mq:hover .mqi { color: ${T.gold} !important; }
        .md:hover { background: ${T.errorBg}; border-color: rgba(239,68,68,0.3) !important; color: ${T.error} !important; }
        .mdrop:hover { border-color: ${T.gold} !important; background: ${T.goldBg} !important; }
        .mt:hover { color: ${T.text} !important; }
        .mb p h2, .mb h2 { color: ${T.gold}; margin: 10px 0 5px; font-size: 13px; }
        .mb h3 { color: ${T.gold}; margin: 8px 0 4px; font-size: 12px; }
        .mb pre { background: rgba(0,0,0,0.25); border-radius: 5px; padding: 8px 12px; overflow-x: auto; font-size: 11px; }
        .mb code { background: rgba(0,0,0,0.20); border-radius: 3px; padding: 1px 5px; font-size: 11px; }
        .mb li { margin-bottom: 3px; }
        .mb strong { color: ${T.text}; }
        @keyframes spin  { to { transform: rotate(360deg) } }
        @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:.3 } }
        @keyframes fade  { from { opacity:0; transform:translateY(6px) } to { opacity:1; transform:translateY(0) } }
        .ani { animation: fade 250ms ease forwards; }
        .cur { display:inline-block; width:7px; height:14px; background:${T.gold}; border-radius:1px; margin-left:2px; vertical-align:text-bottom; animation:pulse 1s steps(1) infinite; }
        @media (max-width:767px) { .msb { display:none !important; } .mgrid { grid-template-columns:1fr !important; } .mhm { display:none !important; } }
      `}</style>

      {/* Header */}
      <div style={{ padding: '28px 28px 0', borderBottom: `1px solid ${T.border}` }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: T.gold, fontWeight: 700, marginBottom: 6 }}>Motor de Avaliações</div>
              <h1 style={{ fontFamily: 'var(--font-playfair, var(--font-display, serif))', fontSize: 26, color: T.text, margin: 0, lineHeight: 1.2, fontWeight: 700 }}>
                Base de Conhecimento ABNT NBR&nbsp;14653
              </h1>
              <p style={{ color: T.textSub, fontSize: 12, margin: '6px 0 0' }}>Consulte normas, metodologias e elabore PTAMs com assistência IA</p>
            </div>
            <div className="mhm" style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0, marginTop: 4 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 6, background: T.goldBg, border: `1px solid ${T.borderHi}`, fontSize: 11, color: T.gold, fontWeight: 600 }}>
                <Brain size={11} /> claude-haiku-4-5
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 6, background: T.successBg, border: '1px solid rgba(45,143,92,0.25)', fontSize: 11, color: T.success, fontWeight: 600 }}>
                <CheckCircle2 size={11} /> Streaming ativo
              </span>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex' }}>
            {([
              { id: 'consultar',   label: 'Consultar IA',         Icon: Brain      },
              { id: 'calculadora', label: 'Calculadora NBR',     Icon: Calculator },
              { id: 'base',        label: 'Base de Conhecimento', Icon: BookOpen  },
              { id: 'processar',   label: 'Processar Páginas',    Icon: Upload    },
            ] as const).map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} className="mt"
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: tab === t.id ? 700 : 500, color: tab === t.id ? T.gold : T.textSub, borderBottom: tab === t.id ? `2px solid ${T.gold}` : '2px solid transparent', marginBottom: -1, transition: 'all 150ms' }}>
                <t.Icon size={13} />{t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 28px' }}>
        {tab === 'consultar'   && <TabConsultar />}
        {tab === 'calculadora' && <TabCalculadora />}
        {tab === 'base'        && <TabBase />}
        {tab === 'processar'   && <TabProcessar />}
      </div>
    </div>
  )
}

// ── Tab 1: Consultar ──────────────────────────────────────────────────────────
function TabConsultar() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [category, setCategory] = useState('all')
  const endRef   = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const send = useCallback(async (text?: string) => {
    const q = (text ?? input).trim()
    if (!q || loading) return
    setMessages(p => [...p, { role: 'user', content: q, timestamp: new Date() }])
    setInput('')
    setLoading(true)
    setMessages(p => [...p, { role: 'assistant', content: '', timestamp: new Date() }])
    try {
      const res = await fetch('/api/avaliacoes/kb/query', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, category }),
      })
      if (!res.ok) throw new Error(`Erro ${res.status}`)
      const reader = res.body?.getReader()
      const dec = new TextDecoder()
      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = dec.decode(value)
          setMessages(p => { const a = [...p]; a[a.length-1] = {...a[a.length-1], content: a[a.length-1].content + chunk}; return a })
        }
      }
    } catch (err: unknown) {
      setMessages(p => { const a = [...p]; a[a.length-1] = {...a[a.length-1], content: `⚠️ ${(err instanceof Error ? err.message : 'Erro desconhecido')}`}; return a })
    } finally { setLoading(false) }
  }, [input, loading, category])

  return (
    <div className="mgrid" style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 20 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
        {/* Category filter */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: T.textDim, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginRight: 2 }}>Filtrar:</span>
          {CATEGORIES.map(c => (
            <button key={c.value} onClick={() => setCategory(c.value)}
              style={{ padding: '4px 12px', borderRadius: 6, fontSize: 11, cursor: 'pointer', border: `1px solid ${category === c.value ? c.color : T.border}`, background: category === c.value ? `${c.color}18` : 'transparent', color: category === c.value ? c.color : T.textSub, fontWeight: category === c.value ? 700 : 400, transition: 'all 120ms' }}>
              {c.label}
            </button>
          ))}
          {messages.length > 0 && (
            <button onClick={() => setMessages([])}
              style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, padding: '4px 12px', borderRadius: 6, fontSize: 11, cursor: 'pointer', border: `1px solid ${T.border}`, background: 'transparent', color: T.textSub, transition: 'all 120ms' }}>
              <RotateCcw size={10} /> Limpar
            </button>
          )}
        </div>

        {/* Messages */}
        <div style={{ background: T.elevated, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16, minHeight: 360, maxHeight: 460, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {messages.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 8, opacity: 0.6, padding: '40px 0' }}>
              <div style={{ width: 48, height: 48, borderRadius: 6, background: T.goldBg, border: `1px solid ${T.borderHi}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Scale size={22} color={T.gold} />
              </div>
              <p style={{ fontSize: 12, color: T.textSub, textAlign: 'center', lineHeight: 1.6 }}>Pergunte sobre avaliação de imóveis,<br />normas ABNT NBR 14653 ou metodologia PTAM</p>
            </div>
          ) : messages.map((m, i) => (
            <div key={i} className={i === messages.length - 1 ? 'ani' : ''}
              style={{ display: 'flex', gap: 8, flexDirection: m.role === 'user' ? 'row-reverse' : 'row', alignItems: 'flex-start' }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, background: m.role === 'user' ? T.gold : T.goldBg, border: m.role === 'assistant' ? `1px solid ${T.borderHi}` : 'none', color: m.role === 'user' ? T.navy : T.gold }}>
                {m.role === 'user' ? 'V' : <Scale size={13} />}
              </div>
              {m.role === 'user' ? (
                <div style={{ maxWidth: '80%', padding: '10px 14px', borderRadius: '4px 4px 4px 4px', background: T.gold, color: T.navy, fontSize: 12.5, lineHeight: 1.6 }}>
                  {m.content}
                </div>
              ) : (
                <div className="mb" style={{ maxWidth: '82%', padding: '10px 14px', borderRadius: '4px 4px 4px 4px', background: T.surface, color: T.text, fontSize: 12.5, lineHeight: 1.65, border: `1px solid ${T.border}`, wordBreak: 'break-word' }}
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(
                    m.content
                      ? renderMarkdown(m.content) + (loading && i === messages.length - 1 ? '<span class="cur"/>' : '')
                      : loading && i === messages.length - 1 ? '<span style="opacity:.5;font-size:12px">Consultando base de conhecimento...</span>' : ''
                  ) }}
                />
              )}
            </div>
          ))}
          <div ref={endRef} />
        </div>

        {/* Input */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <textarea ref={inputRef} className="mi" value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            placeholder="Pergunte sobre avaliação, NBR 14653, PTAM... (Enter para enviar)" disabled={loading} rows={2}
            style={{ flex: 1, padding: '10px 14px', borderRadius: 6, background: T.elevated, border: `1px solid ${T.border}`, color: T.text, fontSize: 12.5, resize: 'none', fontFamily: 'inherit', transition: 'all 150ms' }}
          />
          <button onClick={() => send()} disabled={loading || !input.trim()}
            style={{ position: 'relative', overflow: 'hidden', width: 44, height: 44, borderRadius: 6, border: loading || !input.trim() ? 'none' : '1px solid rgba(255,255,255,0.08)', cursor: loading || !input.trim() ? 'not-allowed' : 'pointer', background: loading || !input.trim() ? T.surface : 'var(--n, #0A1624)', color: loading || !input.trim() ? T.textDim : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 150ms' }}>
            {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={16} />}
            {!loading && input.trim() && <span style={{ position: 'absolute', bottom: 0, left: '12%', right: '12%', height: 2, background: 'linear-gradient(90deg, transparent, #C8A44A, transparent)', opacity: 0.6, pointerEvents: 'none' as const }} />}
          </button>
        </div>

        <p style={{ fontSize: 11, color: T.textDim, margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
          <Info size={10} /> Verifique sempre com o texto original das normas ABNT NBR 14653.
        </p>
      </div>

      {/* Sidebar */}
      <div className="msb" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.15em', color: T.textDim, fontWeight: 700, margin: '0 0 4px' }}>Perguntas Rápidas</p>
        {QUICK_QUESTIONS.map(({ q, Icon }, i) => (
          <button key={i} onClick={() => send(q)} disabled={loading} className="mq"
            style={{ textAlign: 'left', padding: '10px 12px', borderRadius: 6, background: T.elevated, border: `1px solid ${T.border}`, color: T.textSub, fontSize: 11, cursor: 'pointer', lineHeight: 1.45, transition: 'all 150ms', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <Icon size={12} className="mqi" style={{ marginTop: 1, flexShrink: 0, color: T.textDim, transition: 'color 150ms' }} />
            <span>{q}</span>
          </button>
        ))}
        <div style={{ marginTop: 8, padding: '10px 12px', background: T.goldBg, border: `1px solid ${T.borderHi}`, borderRadius: 6 }}>
          <p style={{ fontSize: 11, color: T.gold, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 8px' }}>Normas Cobertas</p>
          {['NBR 14653-1', 'NBR 14653-2', 'NBR 14653-3', 'NBR 14653-4', 'NBR 14653-7'].map(n => (
            <div key={n} style={{ fontSize: 11, color: T.textSub, padding: '2px 0', display: 'flex', alignItems: 'center', gap: 4 }}>
              <ChevronRight size={9} color={T.gold} /> {n}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Tab: Calculadora NBR ─────────────────────────────────────────────────────
type CalcMethod = 'comparativo' | 'evolutivo' | 'renda' | 'ross_heidecke'
interface CalcComparavel { endereco: string; area: number; valor: number; fator_localizacao: number; fator_padrao: number }

function TabCalculadora() {
  const [method, setMethod] = useState<CalcMethod>('comparativo')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Record<string, unknown> | null>(null)
  const [error, setError] = useState('')

  // Shared property fields
  const [area, setArea] = useState('')
  const [anoConst, setAnoConst] = useState('')
  const [conservacao, setConservacao] = useState('Regular')
  const [padrao, setPadrao] = useState('Normal')

  // Comparativo
  const [comparaveis, setComparaveis] = useState<CalcComparavel[]>([
    { endereco: '', area: 0, valor: 0, fator_localizacao: 1, fator_padrao: 1 },
    { endereco: '', area: 0, valor: 0, fator_localizacao: 1, fator_padrao: 1 },
    { endereco: '', area: 0, valor: 0, fator_localizacao: 1, fator_padrao: 1 },
  ])

  // Evolutivo
  const [valorTerreno, setValorTerreno] = useState('')

  // Renda
  const [rendaMensal, setRendaMensal] = useState('')
  const [taxaCap, setTaxaCap] = useState('0.6')

  const formatBRL = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

  const updateComp = (idx: number, field: keyof CalcComparavel, value: string | number) => {
    setComparaveis(prev => prev.map((c, i) => i === idx ? { ...c, [field]: value } : c))
  }

  async function calculate() {
    setError('')
    setResult(null)
    setLoading(true)
    try {
      const property = {
        area: Number(area),
        ano_construcao: Number(anoConst) || undefined,
        estado_conservacao: conservacao,
        padrao,
        bairro: '',
        tipo: 'Apartamento',
      }
      let body: Record<string, unknown> = { metodo: method, property }

      if (method === 'comparativo') {
        const valid = comparaveis.filter(c => c.area > 0 && c.valor > 0)
        if (valid.length < 2) { setError('Mínimo 2 comparáveis com área e valor'); setLoading(false); return }
        body.comparaveis = valid.map(c => ({
          endereco: c.endereco,
          area: c.area,
          valor_venda: c.valor,
          fator_localizacao: c.fator_localizacao,
          fator_padrao: c.fator_padrao,
        }))
      } else if (method === 'evolutivo') {
        if (!valorTerreno || !area) { setError('Área e valor do terreno obrigatórios'); setLoading(false); return }
        body.valor_terreno = Number(valorTerreno)
      } else if (method === 'renda') {
        if (!rendaMensal || !taxaCap) { setError('Renda mensal e taxa obrigatórias'); setLoading(false); return }
        body.renda = { renda_mensal: Number(rendaMensal), taxa_capitalizacao: Number(taxaCap) }
      } else if (method === 'ross_heidecke') {
        if (!anoConst) { setError('Ano de construção obrigatório'); setLoading(false); return }
      }

      const res = await fetch('/api/avaliacoes/calcular', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro no cálculo')
      setResult(data.result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  const METHODS = [
    { id: 'comparativo' as const, label: 'Comparativo Direto', desc: 'NBR 14653-2 §8', Icon: Scale },
    { id: 'evolutivo' as const, label: 'Evolutivo', desc: 'NBR 14653-2 §10', Icon: Building2 },
    { id: 'renda' as const, label: 'Capitalização da Renda', desc: 'NBR 14653-2 §11', Icon: DollarSign },
    { id: 'ross_heidecke' as const, label: 'Ross-Heidecke', desc: 'Depreciação', Icon: TrendingUp },
  ]

  const inputStyle = { width: '100%', padding: '8px 12px', borderRadius: 6, background: T.elevated, border: `1px solid ${T.border}`, color: T.text, fontSize: 12, boxSizing: 'border-box' as const }
  const labelStyle = { fontSize: 11, color: T.textSub, fontWeight: 600 as const, marginBottom: 4, display: 'block' as const }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 900 }}>
      {/* Method selector */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
        {METHODS.map(m => (
          <button key={m.id} onClick={() => { setMethod(m.id); setResult(null); setError('') }}
            style={{ padding: '14px 12px', borderRadius: 6, border: `1px solid ${method === m.id ? T.gold : T.border}`, background: method === m.id ? T.goldBg : T.elevated, cursor: 'pointer', textAlign: 'left', transition: 'all 150ms' }}>
            <m.Icon size={16} color={method === m.id ? T.gold : T.textDim} style={{ marginBottom: 6 }} />
            <div style={{ fontSize: 12, fontWeight: 700, color: method === m.id ? T.gold : T.text }}>{m.label}</div>
            <div style={{ fontSize: 10, color: T.textDim, marginTop: 2 }}>{m.desc}</div>
          </button>
        ))}
      </div>

      {/* Property fields (shared) */}
      <div style={{ background: T.elevated, border: `1px solid ${T.border}`, borderRadius: 6, padding: 20 }}>
        <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.gold, fontWeight: 700, marginBottom: 14 }}>Dados do Imóvel</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
          <div>
            <label style={labelStyle}>Área (m²) *</label>
            <input className="mi" type="number" value={area} onChange={e => setArea(e.target.value)} placeholder="95" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Ano Construção</label>
            <input className="mi" type="number" value={anoConst} onChange={e => setAnoConst(e.target.value)} placeholder="2015" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Padrão</label>
            <select value={padrao} onChange={e => setPadrao(e.target.value)} style={inputStyle}>
              {['Mínimo', 'Baixo', 'Normal', 'Alto', 'Luxo'].map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Conservação</label>
            <select value={conservacao} onChange={e => setConservacao(e.target.value)} style={inputStyle}>
              {['Novo', 'Entre novo e regular', 'Regular', 'Entre regular e reparos simples', 'Reparos simples', 'Entre reparos simples e importantes', 'Reparos importantes', 'Entre reparos importantes e sem valor', 'Sem valor'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Method-specific fields */}
      {method === 'comparativo' && (
        <div style={{ background: T.elevated, border: `1px solid ${T.border}`, borderRadius: 6, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.gold, fontWeight: 700 }}>Comparáveis ({comparaveis.length})</div>
            <button onClick={() => setComparaveis(prev => [...prev, { endereco: '', area: 0, valor: 0, fator_localizacao: 1, fator_padrao: 1 }])}
              style={{ fontSize: 11, padding: '4px 12px', borderRadius: 6, border: `1px solid ${T.borderHi}`, background: T.goldBg, color: T.gold, cursor: 'pointer', fontWeight: 600 }}>+ Adicionar</button>
          </div>
          {comparaveis.map((c, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.2fr 1fr 1fr auto', gap: 8, marginBottom: 8, alignItems: 'end' }}>
              <div>
                {i === 0 && <label style={labelStyle}>Endereço</label>}
                <input className="mi" value={c.endereco} onChange={e => updateComp(i, 'endereco', e.target.value)} placeholder="Rua..." style={inputStyle} />
              </div>
              <div>
                {i === 0 && <label style={labelStyle}>Área (m²)</label>}
                <input className="mi" type="number" value={c.area || ''} onChange={e => updateComp(i, 'area', Number(e.target.value))} placeholder="90" style={inputStyle} />
              </div>
              <div>
                {i === 0 && <label style={labelStyle}>Valor Venda (R$)</label>}
                <input className="mi" type="number" value={c.valor || ''} onChange={e => updateComp(i, 'valor', Number(e.target.value))} placeholder="450000" style={inputStyle} />
              </div>
              <div>
                {i === 0 && <label style={labelStyle}>Fator Loc.</label>}
                <input className="mi" type="number" step="0.01" value={c.fator_localizacao} onChange={e => updateComp(i, 'fator_localizacao', Number(e.target.value))} style={inputStyle} />
              </div>
              <div>
                {i === 0 && <label style={labelStyle}>Fator Pad.</label>}
                <input className="mi" type="number" step="0.01" value={c.fator_padrao} onChange={e => updateComp(i, 'fator_padrao', Number(e.target.value))} style={inputStyle} />
              </div>
              <button onClick={() => setComparaveis(prev => prev.filter((_, j) => j !== i))} className="md"
                style={{ width: 32, height: 32, borderRadius: 6, border: `1px solid ${T.border}`, background: 'transparent', color: T.textDim, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {method === 'evolutivo' && (
        <div style={{ background: T.elevated, border: `1px solid ${T.border}`, borderRadius: 6, padding: 20 }}>
          <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.gold, fontWeight: 700, marginBottom: 14 }}>Método Evolutivo</div>
          <div style={{ maxWidth: 300 }}>
            <label style={labelStyle}>Valor do Terreno (R$) *</label>
            <input className="mi" type="number" value={valorTerreno} onChange={e => setValorTerreno(e.target.value)} placeholder="200000" style={inputStyle} />
          </div>
          <p style={{ fontSize: 11, color: T.textDim, marginTop: 8 }}>Valor = Terreno + (Área × CUB/m² × Fator Padrão) − Depreciação Ross-Heidecke</p>
        </div>
      )}

      {method === 'renda' && (
        <div style={{ background: T.elevated, border: `1px solid ${T.border}`, borderRadius: 6, padding: 20 }}>
          <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.gold, fontWeight: 700, marginBottom: 14 }}>Capitalização da Renda</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, maxWidth: 400 }}>
            <div>
              <label style={labelStyle}>Renda Mensal (R$) *</label>
              <input className="mi" type="number" value={rendaMensal} onChange={e => setRendaMensal(e.target.value)} placeholder="3500" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Taxa Cap. (% a.m.) *</label>
              <input className="mi" type="number" step="0.01" value={taxaCap} onChange={e => setTaxaCap(e.target.value)} placeholder="0.6" style={inputStyle} />
            </div>
          </div>
          <p style={{ fontSize: 11, color: T.textDim, marginTop: 8 }}>Valor = Renda Mensal / (Taxa ÷ 100) × 12</p>
        </div>
      )}

      {method === 'ross_heidecke' && (
        <div style={{ background: T.elevated, border: `1px solid ${T.border}`, borderRadius: 6, padding: 20 }}>
          <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.gold, fontWeight: 700, marginBottom: 14 }}>Depreciação Ross-Heidecke</div>
          <p style={{ fontSize: 11, color: T.textDim, margin: 0 }}>
            Usa os campos <strong style={{ color: T.text }}>Ano de Construção</strong>, <strong style={{ color: T.text }}>Conservação</strong> e <strong style={{ color: T.text }}>Área</strong> acima.<br />
            D = (1 − R) × ross + c × (1 − ross) — vida útil padrão: 60 anos
          </p>
        </div>
      )}

      {/* Calculate button */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <button onClick={calculate} disabled={loading || !area}
          style={{ position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', gap: 8, padding: '12px 28px', borderRadius: 6, border: loading || !area ? 'none' : '1px solid rgba(255,255,255,0.08)', cursor: loading || !area ? 'not-allowed' : 'pointer', background: loading || !area ? T.surface : 'var(--n, #0A1624)', color: loading || !area ? T.textDim : '#fff', fontSize: 13, fontWeight: 700, transition: 'all 150ms' }}>
          {loading ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Calculator size={15} />}
          {loading ? 'Calculando...' : 'Calcular Valor'}
          {!loading && area && <span style={{ position: 'absolute', bottom: 0, left: '12%', right: '12%', height: 2, background: 'linear-gradient(90deg, transparent, #C8A44A, transparent)', opacity: 0.6, pointerEvents: 'none' as const }} />}
        </button>
        {error && <span style={{ fontSize: 12, color: T.error }}>{error}</span>}
      </div>

      {/* Result */}
      {result && (
        <div style={{ background: T.goldBg, border: `1px solid ${T.borderHi}`, borderRadius: 6, padding: 24 }}>
          <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.gold, fontWeight: 700, marginBottom: 16 }}>Resultado — {METHODS.find(m => m.id === method)?.label}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
            {typeof (result as Record<string, unknown>).valor_total === 'number' && (
              <div>
                <div style={{ fontSize: 11, color: T.textDim, marginBottom: 4 }}>Valor Total</div>
                <div style={{ fontFamily: 'var(--font-playfair, var(--font-display, serif))', fontSize: 28, color: T.gold, fontWeight: 700 }}>{formatBRL((result as Record<string, number>).valor_total)}</div>
              </div>
            )}
            {typeof (result as Record<string, unknown>).valor_unitario === 'number' && (
              <div>
                <div style={{ fontSize: 11, color: T.textDim, marginBottom: 4 }}>Valor Unitário (R$/m²)</div>
                <div style={{ fontSize: 20, color: T.text, fontWeight: 600 }}>{formatBRL((result as Record<string, number>).valor_unitario)}</div>
              </div>
            )}
            {!!(result as Record<string, unknown>).intervalo && (
              <div>
                <div style={{ fontSize: 11, color: T.textDim, marginBottom: 4 }}>Intervalo de Confiança</div>
                <div style={{ fontSize: 14, color: T.text }}>
                  {formatBRL(((result as Record<string, Record<string, number>>).intervalo).min)} — {formatBRL(((result as Record<string, Record<string, number>>).intervalo).max)}
                </div>
              </div>
            )}
            {typeof (result as Record<string, unknown>).depreciacao_percentual === 'number' && (
              <div>
                <div style={{ fontSize: 11, color: T.textDim, marginBottom: 4 }}>Depreciação</div>
                <div style={{ fontSize: 20, color: T.error, fontWeight: 600 }}>{((result as Record<string, number>).depreciacao_percentual * 100).toFixed(1)}%</div>
              </div>
            )}
            {typeof (result as Record<string, unknown>).valor_depreciado === 'number' && (
              <div>
                <div style={{ fontSize: 11, color: T.textDim, marginBottom: 4 }}>Valor Depreciado</div>
                <div style={{ fontSize: 20, color: T.text, fontWeight: 600 }}>{formatBRL((result as Record<string, number>).valor_depreciado)}</div>
              </div>
            )}
            {typeof (result as Record<string, unknown>).valor_capitalizado === 'number' && (
              <div>
                <div style={{ fontSize: 11, color: T.textDim, marginBottom: 4 }}>Valor Capitalizado</div>
                <div style={{ fontFamily: 'var(--font-playfair, var(--font-display, serif))', fontSize: 28, color: T.gold, fontWeight: 700 }}>{formatBRL((result as Record<string, number>).valor_capitalizado)}</div>
              </div>
            )}
            {typeof (result as Record<string, unknown>).grau_fundamentacao === 'string' && (
              <div>
                <div style={{ fontSize: 11, color: T.textDim, marginBottom: 4 }}>Grau de Fundamentação</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: T.success }}>{(result as Record<string, string>).grau_fundamentacao}</div>
              </div>
            )}
            {typeof (result as Record<string, unknown>).grau_precisao === 'string' && (
              <div>
                <div style={{ fontSize: 11, color: T.textDim, marginBottom: 4 }}>Grau de Precisão</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: T.success }}>{(result as Record<string, string>).grau_precisao}</div>
              </div>
            )}
            {typeof (result as Record<string, unknown>).coeficiente_variacao === 'number' && (
              <div>
                <div style={{ fontSize: 11, color: T.textDim, marginBottom: 4 }}>Coeficiente de Variação</div>
                <div style={{ fontSize: 16, color: T.text }}>{((result as Record<string, number>).coeficiente_variacao).toFixed(1)}%</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Tab 2: Base de Conhecimento ───────────────────────────────────────────────
const PAGE_SIZE = 20

function TabBase() {
  const [pages, setPages]     = useState<KBPage[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDel]    = useState<string | null>(null)
  const [search, setSearch]   = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    fetch('/api/avaliacoes/kb/pages')
      .then(r => r.json())
      .then(d => { setPages(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function del(id: string) {
    if (!confirm('Remover esta página e todos os seus tópicos?')) return
    setDel(id)
    await fetch(`/api/avaliacoes/kb/pages?id=${id}`, { method: 'DELETE' })
    setPages(p => p.filter(x => x.id !== id))
    setDel(null)
  }

  const filtered = search.trim()
    ? pages.filter(p => (p.page_title || p.source_file).toLowerCase().includes(search.toLowerCase()) || p.normas_citadas?.some(n => n.toLowerCase().includes(search.toLowerCase())))
    : pages

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage   = Math.min(currentPage, totalPages)
  const paginated  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  // Reset page when search changes
  useEffect(() => { setCurrentPage(1) }, [search])

  const totalTopics = pages.reduce((a, p) => a + (p.avaliacoes_kb_topics?.[0]?.count || 0), 0)
  const allNormas   = [...new Set(pages.flatMap(p => p.normas_citadas || []))]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 900 }}>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
        {[
          { label: 'Páginas indexadas', value: pages.length,      Icon: FileText  },
          { label: 'Tópicos na base',   value: totalTopics,        Icon: BookOpen  },
          { label: 'Normas cobertas',   value: allNormas.length,   Icon: Scale     },
        ].map(s => (
          <div key={s.label} style={{ background: T.elevated, border: `1px solid ${T.border}`, borderRadius: 6, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 6, background: T.goldBg, border: `1px solid ${T.borderHi}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <s.Icon size={16} color={T.gold} />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-playfair, var(--font-display, serif))', fontSize: 22, color: T.gold, fontWeight: 700, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: T.textDim, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 3 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {pages.length > 0 && (
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: T.textDim, pointerEvents: 'none' }} />
          <input className="mi" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por título, arquivo ou norma..."
            style={{ width: '100%', padding: '9px 12px 9px 34px', borderRadius: 6, boxSizing: 'border-box', background: T.elevated, border: `1px solid ${T.border}`, color: T.text, fontSize: 12, transition: 'all 150ms' }}
          />
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: T.textSub, fontSize: 12 }}>
          <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Carregando base...
        </div>
      ) : pages.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 24px', color: T.textSub, border: `1px dashed ${T.border}`, borderRadius: 6 }}>
          <BookOpen size={32} color={T.textDim} style={{ marginBottom: 12 }} />
          <p style={{ fontSize: 13, lineHeight: 1.6, margin: 0 }}>Base de conhecimento vazia.<br />Processe páginas na aba <strong style={{ color: T.gold }}>Processar Páginas</strong> para começar.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.length === 0 && <p style={{ fontSize: 12, color: T.textSub, textAlign: 'center', padding: '24px 0' }}>Nenhuma página encontrada para &ldquo;{search}&rdquo;</p>}
          {filtered.length > 0 && <div style={{ fontSize: 11, color: T.textDim, marginBottom: 4 }}>{filtered.length} resultado{filtered.length !== 1 ? 's' : ''}{search && ` para "${search}"`} — página {safePage}/{totalPages}</div>}
          {paginated.map(p => {
            const cnt = p.avaliacoes_kb_topics?.[0]?.count || 0
            return (
              <div key={p.id} style={{ background: T.elevated, border: `1px solid ${T.border}`, borderRadius: 6, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 34, height: 34, borderRadius: 6, background: T.goldBg, border: `1px solid ${T.borderHi}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <FileText size={14} color={T.gold} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: T.text, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.page_title || p.source_file}</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: T.textSub }}>{cnt} tópico{cnt !== 1 ? 's' : ''}</span>
                    {p.normas_citadas?.slice(0, 4).map(n => (
                      <span key={n} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: T.goldBg, color: T.gold, border: `1px solid ${T.borderHi}`, fontWeight: 600 }}>{n}</span>
                    ))}
                    {(p.normas_citadas?.length ?? 0) > 4 && <span style={{ fontSize: 11, color: T.textDim }}>+{p.normas_citadas!.length - 4}</span>}
                    <span style={{ fontSize: 11, color: T.textDim, marginLeft: 'auto' }}>{new Date(p.created_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
                <button onClick={() => del(p.id)} disabled={deleting === p.id} className="md"
                  style={{ width: 32, height: 32, borderRadius: 6, border: `1px solid ${T.border}`, background: 'transparent', color: T.textDim, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 150ms' }}>
                  {deleting === p.id ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={13} />}
                </button>
              </div>
            )
          })}
          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 8, paddingTop: 12, borderTop: `1px solid ${T.border}` }}>
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={safePage <= 1}
                style={{ padding: '6px 14px', borderRadius: 5, border: `1px solid ${T.border}`, background: safePage <= 1 ? 'transparent' : T.elevated, color: safePage <= 1 ? T.textDim : T.text, fontSize: 11, cursor: safePage <= 1 ? 'default' : 'pointer', opacity: safePage <= 1 ? 0.4 : 1 }}>
                Anterior
              </button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let pg: number
                if (totalPages <= 7) { pg = i + 1 }
                else if (safePage <= 4) { pg = i + 1 }
                else if (safePage >= totalPages - 3) { pg = totalPages - 6 + i }
                else { pg = safePage - 3 + i }
                return (
                  <button key={pg} onClick={() => setCurrentPage(pg)}
                    style={{ width: 30, height: 30, borderRadius: 5, border: `1px solid ${pg === safePage ? T.gold : T.border}`, background: pg === safePage ? T.goldBg : 'transparent', color: pg === safePage ? T.gold : T.textSub, fontSize: 11, fontWeight: pg === safePage ? 700 : 400, cursor: 'pointer' }}>
                    {pg}
                  </button>
                )
              })}
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={safePage >= totalPages}
                style={{ padding: '6px 14px', borderRadius: 5, border: `1px solid ${T.border}`, background: safePage >= totalPages ? 'transparent' : T.elevated, color: safePage >= totalPages ? T.textDim : T.text, fontSize: 11, cursor: safePage >= totalPages ? 'default' : 'pointer', opacity: safePage >= totalPages ? 0.4 : 1 }}>
                Próxima
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Tab 3: Processar Páginas ──────────────────────────────────────────────────
function TabProcessar() {
  const [files, setFiles]         = useState<File[]>([])
  const [processing, setProc]     = useState(false)
  const [isDragOver, setDragOver] = useState(false)
  const [results, setResults]     = useState<Array<{ name: string; status: 'pending'|'processing'|'done'|'error'; message?: string }>>([])
  const inputRef  = useRef<HTMLInputElement>(null)
  const sessionId = useRef(`session-${Date.now()}`)

  function handleFiles(sel: FileList | null) {
    if (!sel) return
    const ALLOWED_TYPES = new Set([
      'image/jpeg', 'image/png', 'image/webp', 'image/gif',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',       // .xlsx
      'application/msword',  // .doc
      'text/plain',          // .txt
    ])
    const ALLOWED_EXT = /\.(docx?|xlsx?|pdf|png|jpe?g|webp|gif|txt|md)$/i
    const arr = Array.from(sel).filter(f => ALLOWED_TYPES.has(f.type) || ALLOWED_EXT.test(f.name))
    setFiles(arr)
    setResults(arr.map(f => ({ name: f.name, status: 'pending' })))
  }

  async function checkDuplicate(fileName: string): Promise<boolean> {
    try {
      const resp = await fetch(`/api/avaliacoes/kb/pages?source_file=${encodeURIComponent(fileName)}`)
      const data = await resp.json()
      return Array.isArray(data) && data.length > 0
    } catch { return false }
  }

  async function processAll() {
    if (!files.length || processing) return
    setProc(true)
    for (let i = 0; i < files.length; i++) {
      setResults(p => p.map((r, idx) => idx === i ? { ...r, status: 'processing' } : r))
      try {
        // Dedup check — warn if file already processed
        const isDup = await checkDuplicate(files[i].name)
        if (isDup && !confirm(`"${files[i].name}" já foi processado anteriormente. Reprocessar?`)) {
          setResults(p => p.map((r, idx) => idx === i ? { ...r, status: 'done', message: 'Ignorado (duplicata)' } : r))
          continue
        }

        const b64 = await new Promise<string>((res, rej) => {
          const r = new FileReader()
          r.onload = e => res((e.target?.result as string).split(',')[1])
          r.onerror = rej
          r.readAsDataURL(files[i])
        })

        // Determine effective media type (browser may return empty for docx/xlsx)
        let mediaType = files[i].type
        if (!mediaType || mediaType === 'application/octet-stream') {
          const ext = files[i].name.split('.').pop()?.toLowerCase()
          const extMap: Record<string, string> = {
            docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            doc: 'application/msword',
            xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            xls: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            pdf: 'application/pdf',
            txt: 'text/plain',
            md: 'text/plain',
          }
          mediaType = extMap[ext || ''] || 'image/png'
        }

        const resp = await fetch('/api/avaliacoes/kb/process-image', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: b64, mediaType, sourceFile: files[i].name, sessionId: sessionId.current }),
        })
        const data = await resp.json()
        if (!resp.ok || data.error) throw new Error(data.error || 'Erro')
        setResults(p => p.map((r, idx) => idx === i ? { ...r, status: 'done', message: `${data.topics_count} tópicos extraídos` } : r))
      } catch (err: unknown) {
        setResults(p => p.map((r, idx) => idx === i ? { ...r, status: 'error', message: (err instanceof Error ? err.message : 'Erro desconhecido') } : r))
      }
    }
    setProc(false)
  }

  const done   = results.filter(r => r.status === 'done').length
  const errors = results.filter(r => r.status === 'error').length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 720 }}>
      {/* Info banner */}
      <div style={{ background: T.goldBg, border: `1px solid ${T.borderHi}`, borderRadius: 6, padding: '16px 20px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <Info size={16} color={T.gold} style={{ flexShrink: 0, marginTop: 1 }} />
        <p style={{ fontSize: 12, color: T.text, margin: 0, lineHeight: 1.65 }}>
          <strong style={{ color: T.gold }}>Como funciona:</strong> Fotografe ou escaneie páginas da NBR 14653, apostilas ou PTAMs de referência e faça upload. O Claude extrairá metodologias, definições, fórmulas e normas para indexar na base de conhecimento.
          <br /><span style={{ color: T.textSub }}>Até 1.200 páginas · PDF, PNG, JPG, WEBP</span>
        </p>
      </div>

      {/* Drop zone */}
      <div onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
        className="mdrop"
        style={{ border: `2px dashed ${isDragOver ? T.gold : T.border}`, borderRadius: 6, padding: '36px 24px', textAlign: 'center', cursor: 'pointer', background: isDragOver ? T.goldBg : files.length ? T.goldBg : 'transparent', transition: 'all 200ms' }}>
        <Upload size={28} color={isDragOver ? T.gold : T.textDim} style={{ marginBottom: 10 }} />
        <p style={{ fontSize: 13, color: isDragOver ? T.gold : T.textSub, margin: 0, fontWeight: isDragOver ? 600 : 400 }}>
          {files.length > 0 ? `${files.length} arquivo${files.length > 1 ? 's' : ''} selecionado${files.length > 1 ? 's' : ''}` : isDragOver ? 'Solte aqui' : 'Clique ou arraste imagens de páginas'}
        </p>
        {!files.length && !isDragOver && <p style={{ fontSize: 11, color: T.textDim, margin: '6px 0 0' }}>PDF, DOCX, XLSX, PNG, JPG, WEBP — múltiplas páginas simultâneas</p>}
        <input ref={inputRef} type="file" accept=".pdf,.png,.jpg,.jpeg,.webp,.docx,.xlsx,.doc,.xls,.txt,image/*" multiple style={{ display: 'none' }} onChange={e => handleFiles(e.target.files)} />
      </div>

      {/* Actions */}
      {files.length > 0 && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={processAll} disabled={processing}
            style={{ position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 22px', borderRadius: 6, border: processing ? 'none' : '1px solid rgba(255,255,255,0.08)', cursor: processing ? 'wait' : 'pointer', background: processing ? T.surface : 'var(--n, #0A1624)', color: processing ? T.textDim : '#fff', fontSize: 12, fontWeight: 700, transition: 'all 150ms' }}>
            {processing ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Brain size={14} />}
            {processing ? 'Processando...' : `Processar ${files.length} página${files.length > 1 ? 's' : ''} com IA`}
            {!processing && <span style={{ position: 'absolute', bottom: 0, left: '12%', right: '12%', height: 2, background: 'linear-gradient(90deg, transparent, #C8A44A, transparent)', opacity: 0.6, pointerEvents: 'none' as const }} />}
          </button>
          {!processing && (
            <button onClick={() => { setFiles([]); setResults([]) }}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '10px 16px', borderRadius: 6, border: `1px solid ${T.border}`, background: 'transparent', color: T.textSub, fontSize: 12, cursor: 'pointer' }}>
              <XCircle size={13} /> Limpar
            </button>
          )}
        </div>
      )}

      {/* Progress */}
      {results.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {results.map((r, i) => {
            const cfg = {
              pending:    { icon: <FileText size={13} color={T.textDim} />,                                            color: T.textDim },
              processing: { icon: <Loader2  size={13} color={T.gold}   style={{ animation: 'spin 1s linear infinite' }} />, color: T.gold    },
              done:       { icon: <CheckCircle2 size={13} color={T.success} />,                                        color: T.success },
              error:      { icon: <XCircle  size={13} color={T.error}  />,                                             color: T.error   },
            }[r.status]
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: T.elevated, border: `1px solid ${T.border}`, borderRadius: 6 }}>
                {cfg.icon}
                <span style={{ flex: 1, fontSize: 11.5, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</span>
                <span style={{ fontSize: 11, color: cfg.color, flexShrink: 0, fontWeight: r.status === 'done' ? 600 : 400 }}>{r.message || r.status}</span>
              </div>
            )
          })}
        </div>
      )}

      {done > 0 && (
        <div style={{ background: T.successBg, border: '1px solid rgba(45,143,92,0.25)', borderRadius: 6, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle2 size={16} color={T.success} />
          <p style={{ fontSize: 12, color: T.success, margin: 0 }}>
            <strong>{done}</strong> página{done > 1 ? 's' : ''} processada{done > 1 ? 's' : ''} com sucesso.
            {errors > 0 && <span style={{ color: T.error }}> {errors} com erro.</span>}
            {' '}Acesse <strong>Base de Conhecimento</strong> para ver os tópicos.
          </p>
        </div>
      )}
    </div>
  )
}

// ── Markdown renderer ─────────────────────────────────────────────────────────
function renderMarkdown(text: string): string {
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/```[\w]*\n?([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/^#### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^[-•] (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>[\s\S]+?<\/li>)/g, '<ul>$1</ul>')
    .replace(/<\/ul>\n<ul>/g, '')
    .replace(/\n{2,}/g, '<br/><br/>')
    .replace(/\n/g, '<br/>')
}
