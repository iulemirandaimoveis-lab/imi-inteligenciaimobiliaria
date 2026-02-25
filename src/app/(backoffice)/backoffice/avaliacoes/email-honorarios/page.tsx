'use client'

import { useState } from 'react'
import {
  ArrowLeft, Mail, Sparkles, Loader2, Copy, Check, Calculator,
  DollarSign, FileText, User, MapPin, Building2, Gavel, Clock, Edit3
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface EmailAnalysis {
  solicitante: string
  tipo_entidade: 'tribunal' | 'particular' | 'banco' | 'escritorio' | 'outro'
  finalidade: string
  metodologia_sugerida: string
  tipo_imovel: string
  endereco_bairro: string
  endereco_cidade: string
  urgencia: 'baixa' | 'media' | 'alta'
  prazo_sugerido: string
  complexidade: 'simples' | 'media' | 'complexa'
  laudo_tipo: 'simplificado' | 'completo' | 'pericia_judicial'
  valor_estimado_imovel: number | null
  observacoes_relevantes: string
  // calculados localmente
  honorariosMin: number
  honorariosRec: number
  honorariosMax: number
}

const EXEMPLOS = [
  {
    label: 'TJ-PE',
    conteudo: `Assunto: Solicitação de Laudo - Processo nº 0001234-56.2025.8.17.0001

Prezado Avaliador,

O Juízo da 3ª Vara Cível de Recife solicita elaboração de laudo de avaliação do imóvel situado na Rua da Aurora, 456 - Boa Vista, Recife/PE. Trata-se de apartamento com aproximadamente 120m², para fins de partilha em inventário.

Prazo: 30 dias. Seguir requisitos NBR 14653 e CPC.

Secretaria da 3ª Vara Cível`
  },
  {
    label: 'Bradesco',
    conteudo: `De: avaliacoes@bradesco.com.br
Assunto: Solicitação de Avaliação - Crédito Imobiliário SFH

Solicitamos avaliação para concessão de crédito imobiliário.
Imóvel: Apartamento, 85m², 3 quartos, 2 vagas, Av. Conselheiro Aguiar, Boa Viagem, Recife/PE.
Valor solicitado: R$ 480.000,00. Prazo: 5 dias úteis.

Gerência de Crédito Imobiliário`
  },
  {
    label: 'Particular',
    conteudo: `Olá, boa tarde!

Sou Ana Paula e gostaria de avaliar minha cobertura duplex de 280m² em Boa Viagem, 4 suítes, piscina, 4 vagas. Condomínio Terraços de Portugal.

Quero vender e preciso do laudo para definir preço. Sem urgência, pode ser em 2 semanas.

(81) 99123-4567`
  }
]

function calcularHonorarios(analise: Partial<EmailAnalysis>) {
  let base = 1500
  if (analise.laudo_tipo === 'pericia_judicial' || analise.finalidade === 'judicial') base = 3500
  else if (analise.finalidade === 'financiamento') base = 1800
  else if (analise.complexidade === 'complexa') base = 2500
  else if (analise.complexidade === 'simples') base = 900

  if (analise.metodologia_sugerida === 'involutivo' || analise.metodologia_sugerida === 'renda') base *= 1.3
  if (analise.tipo_entidade === 'tribunal') base *= 1.2

  // Se valor do imóvel informado, usar percentual IBAPE
  if (analise.valor_estimado_imovel && analise.valor_estimado_imovel > 0) {
    const v = analise.valor_estimado_imovel
    let pct = 0.003
    if (v <= 200000) pct = 0.008
    else if (v <= 500000) pct = 0.006
    else if (v <= 1000000) pct = 0.004
    else if (v <= 5000000) pct = 0.003
    const ibape = Math.max(800, v * pct * (analise.laudo_tipo === 'pericia_judicial' ? 1.5 : 1.0))
    base = Math.max(base, ibape)
  }

  return {
    min: Math.round(Math.max(800, base * 0.7)),
    rec: Math.round(base),
    max: Math.round(base * 1.8)
  }
}

function gerarResposta(a: EmailAnalysis): string {
  const hoje = new Date().toLocaleDateString('pt-BR')
  const tipoLaudo = a.laudo_tipo === 'pericia_judicial' ? 'Laudo Pericial Judicial' : a.laudo_tipo === 'completo' ? 'Laudo Técnico de Avaliação' : 'Parecer Técnico'
  const saudacao = a.tipo_entidade === 'tribunal' ? 'Meritíssimo Juízo' : a.tipo_entidade === 'banco' ? 'Prezada equipe de crédito' : 'Prezado(a)'
  const loc = [a.endereco_bairro, a.endereco_cidade].filter(Boolean).join(', ')

  return `${saudacao},

Recife, ${hoje}.

Em resposta à solicitação referente à avaliação do imóvel${loc ? ' em ' + loc : ''}, apresentamos nossa proposta de honorários profissionais.

OBJETO: ${a.tipo_imovel || 'Imóvel residencial'}${loc ? ' — ' + loc : ''}
TIPO DE TRABALHO: ${tipoLaudo}
METODOLOGIA: ${a.metodologia_sugerida === 'comparativo' ? 'Método Comparativo Direto de Dados de Mercado (NBR 14653-2)' : a.metodologia_sugerida || 'A definir após vistoria'}
FINALIDADE: ${(a.finalidade || '').replace(/_/g, ' ')}
PRAZO DE ENTREGA: ${a.prazo_sugerido || 'A combinar'} após vistoria e entrega de documentação

HONORÁRIOS PROFISSIONAIS:

• Valor mínimo: R$ ${a.honorariosMin.toLocaleString('pt-BR')}
• Valor recomendado: R$ ${a.honorariosRec.toLocaleString('pt-BR')}
• Condições: 50% na assinatura do contrato / 50% na entrega do laudo

DOCUMENTAÇÃO NECESSÁRIA:
— Matrícula atualizada do imóvel (RI Digital)
— IPTU vigente
— Planta baixa (se disponível)
— Dados do solicitante (CPF/CNPJ)

Honorários calculados conforme tabela IBAPE e complexidade do trabalho.
Laudo elaborado em conformidade com ABNT NBR 14653, assinado por profissional habilitado com CNAI.

Colocamo-nos à disposição para esclarecimentos.

Atenciosamente,

Iule Miranda
Avaliadora de Imóveis • CNAI [nº] • CRECI-PE [nº]
IMI — Iule Miranda Imóveis
Recife/PE • (81) 9 9723-0455
www.iulemirandaimoveis.com.br`
}

// ── Component ─────────────────────────────────────────────────
export default function EmailHonorariosPage() {
  const router = useRouter()
  const [emailText, setEmailText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [analysis, setAnalysis] = useState<EmailAnalysis | null>(null)
  const [draft, setDraft] = useState('')
  const [activeTab, setActiveTab] = useState<'analise' | 'resposta'>('analise')
  const [editing, setEditing] = useState(false)
  const [editedDraft, setEditedDraft] = useState('')
  const [copied, setCopied] = useState(false)

  const analisar = async () => {
    if (!emailText.trim()) return
    setLoading(true)
    setError('')

    try {
      // Chama rota de servidor — API key nunca exposta ao cliente
      const res = await fetch('/api/avaliacoes/interpretar-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailText }),
      })

      const json = await res.json()

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Falha na análise')
      }

      const d = json.dados
      const hon = calcularHonorarios(d)

      const result: EmailAnalysis = {
        solicitante: d.solicitante || 'Solicitante',
        tipo_entidade: d.tipo_entidade || 'particular',
        finalidade: d.finalidade || 'compra_venda',
        metodologia_sugerida: d.metodologia_sugerida || 'comparativo',
        tipo_imovel: d.tipo_imovel || 'Imóvel residencial',
        endereco_bairro: d.endereco_bairro || '',
        endereco_cidade: d.endereco_cidade || 'Recife',
        urgencia: d.urgencia || 'media',
        prazo_sugerido: d.prazo_sugerido || '10 dias úteis',
        complexidade: d.complexidade || 'media',
        laudo_tipo: d.laudo_tipo || 'completo',
        valor_estimado_imovel: d.valor_estimado_imovel || null,
        observacoes_relevantes: d.observacoes_relevantes || '',
        honorariosMin: hon.min,
        honorariosRec: hon.rec,
        honorariosMax: hon.max,
      }

      setAnalysis(result)
      const resposta = gerarResposta(result)
      setDraft(resposta)
      setEditedDraft(resposta)
      setActiveTab('analise')

    } catch (err: any) {
      setError(err.message || 'Erro na análise. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const copiar = () => {
    navigator.clipboard.writeText(editing ? editedDraft : draft)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const fmtCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)

  const ENTITY_BADGE: Record<string, string> = {
    tribunal: 'bg-purple-50 text-purple-700',
    banco: 'bg-blue-50 text-blue-700',
    particular: 'bg-emerald-50 text-emerald-700',
    escritorio: 'bg-amber-50 text-amber-700',
    outro: 'bg-gray-100 text-gray-600',
  }
  const URGENCIA_BADGE: Record<string, string> = {
    baixa: 'bg-green-50 text-green-700',
    media: 'bg-amber-50 text-amber-700',
    alta: 'bg-red-50 text-red-700',
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()}
          className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50">
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Interpretador de Email + Honorários</h1>
          <p className="text-xs text-gray-500">IA analisa emails de tribunais, bancos e particulares e gera proposta automática</p>
        </div>
      </div>

      {/* Input */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Mail size={15} className="text-[#C49D5B]" /> Cole o email aqui
          </label>
          <div className="flex gap-2">
            {EXEMPLOS.map(ex => (
              <button key={ex.label} onClick={() => setEmailText(ex.conteudo)}
                className="text-xs px-2.5 py-1 border border-gray-200 rounded-lg hover:border-[#C49D5B] hover:text-[#C49D5B] transition-colors">
                {ex.label}
              </button>
            ))}
          </div>
        </div>

        <textarea value={emailText} onChange={e => setEmailText(e.target.value)}
          rows={7} placeholder="Cole aqui o conteúdo do email recebido do tribunal, banco ou cliente..."
          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:border-[#C49D5B] resize-none" />

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{error}</p>
        )}

        <button onClick={analisar} disabled={!emailText.trim() || loading}
          className="w-full flex items-center justify-center gap-2 h-11 bg-[#C49D5B] text-white rounded-xl font-semibold hover:bg-[#b08a4a] transition-colors disabled:opacity-50">
          {loading
            ? <><Loader2 size={17} className="animate-spin" /> Analisando com IA…</>
            : <><Sparkles size={17} /> Analisar e Gerar Proposta</>}
        </button>
      </div>

      {/* Resultado */}
      {analysis && (
        <>
          <div className="flex border-b border-gray-200">
            {(['analise', 'resposta'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab ? 'border-[#C49D5B] text-[#C49D5B]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                {tab === 'analise' ? '📊 Análise do Email' : '✉ Rascunho de Resposta'}
              </button>
            ))}
          </div>

          {activeTab === 'analise' && (
            <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-5">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <p className="font-bold text-gray-900">{analysis.solicitante}</p>
                  {analysis.observacoes_relevantes && (
                    <p className="text-xs text-gray-500 mt-0.5">{analysis.observacoes_relevantes}</p>
                  )}
                </div>
                <div className="flex gap-2 flex-wrap">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${ENTITY_BADGE[analysis.tipo_entidade]}`}>
                    {analysis.tipo_entidade}
                  </span>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${URGENCIA_BADGE[analysis.urgencia]}`}>
                    Urgência {analysis.urgencia}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { icon: Building2, label: 'Imóvel', value: analysis.tipo_imovel },
                  { icon: MapPin, label: 'Local', value: [analysis.endereco_bairro, analysis.endereco_cidade].filter(Boolean).join(', ') || '—' },
                  { icon: Gavel, label: 'Finalidade', value: (analysis.finalidade || '').replace(/_/g, ' ') },
                  { icon: Calculator, label: 'Metodologia', value: analysis.metodologia_sugerida || '—' },
                  { icon: Clock, label: 'Prazo', value: analysis.prazo_sugerido || '—' },
                  { icon: FileText, label: 'Tipo de Laudo', value: (analysis.laudo_tipo || '').replace(/_/g, ' ') },
                ].map(item => {
                  const Icon = item.icon
                  return (
                    <div key={item.label} className="p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Icon size={12} className="text-gray-400" />
                        <span className="text-xs text-gray-500">{item.label}</span>
                      </div>
                      <p className="text-sm font-medium text-gray-900 capitalize">{item.value}</p>
                    </div>
                  )
                })}
              </div>

              {/* Honorários */}
              <div className="border border-amber-200 rounded-xl overflow-hidden">
                <div className="bg-amber-50 px-4 py-2.5 border-b border-amber-100">
                  <p className="text-sm font-semibold text-amber-800 flex items-center gap-2">
                    <DollarSign size={14} /> Proposta de Honorários (IBAPE)
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-0 sm:divide-x divide-gray-100 p-4 text-center">
                  {[
                    { l: 'Mínimo', v: analysis.honorariosMin, cls: 'text-gray-700' },
                    { l: 'Recomendado', v: analysis.honorariosRec, cls: 'text-[#C49D5B]' },
                    { l: 'Máximo', v: analysis.honorariosMax, cls: 'text-gray-700' },
                  ].map(h => (
                    <div key={h.l}>
                      <p className="text-xs text-gray-500 mb-1">{h.l}</p>
                      <p className={`text-xl font-bold ${h.cls}`}>{fmtCurrency(h.v)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setActiveTab('resposta')}
                  className="flex-1 h-10 bg-[#C49D5B] text-white rounded-xl text-sm font-semibold hover:bg-[#b08a4a] transition-colors flex items-center justify-center gap-2">
                  <Mail size={15} /> Ver Rascunho
                </button>
                <button onClick={() => router.push('/backoffice/avaliacoes/nova')}
                  className="flex-1 h-10 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                  <FileText size={15} /> Criar Avaliação
                </button>
              </div>
            </div>
          )}

          {activeTab === 'resposta' && (
            <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-gray-900">Rascunho de Proposta</p>
                <div className="flex gap-2">
                  <button onClick={() => setEditing(p => !p)}
                    className="flex items-center gap-1.5 h-8 px-3 border border-gray-200 rounded-lg text-xs hover:bg-gray-50">
                    <Edit3 size={12} /> {editing ? 'Pré-visualizar' : 'Editar'}
                  </button>
                  <button onClick={copiar}
                    className="flex items-center gap-1.5 h-8 px-3 border border-gray-200 rounded-lg text-xs hover:bg-gray-50">
                    {copied ? <><Check size={12} className="text-emerald-500" /> Copiado</> : <><Copy size={12} /> Copiar</>}
                  </button>
                </div>
              </div>
              {editing
                ? <textarea value={editedDraft} onChange={e => setEditedDraft(e.target.value)}
                  rows={22} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:border-[#C49D5B] resize-none" />
                : <pre className="whitespace-pre-wrap text-sm text-gray-800 bg-gray-50 rounded-xl p-4 font-sans leading-relaxed">{editing ? editedDraft : draft}</pre>
              }
            </div>
          )}
        </>
      )}
    </div>
  )
}
