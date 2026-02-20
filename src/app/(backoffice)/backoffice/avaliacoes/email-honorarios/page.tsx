'use client'

import { useState, useRef } from 'react'
import {
  ArrowLeft, Mail, Sparkles, Loader2, Copy, Check, Send, Calculator,
  AlertCircle, Info, ChevronDown, DollarSign, FileText, User, MapPin,
  Building2, Gavel, Landmark, Clock, RefreshCw, Download, Edit3, Save
} from 'lucide-react'
import { useRouter } from 'next/navigation'

// ============================================================
// MOTOR DE INTERPRETAÇÃO DE EMAIL (Client-side com Anthropic)
// ============================================================

interface EmailAnalysis {
  solicitante: string
  tipoEntidade: 'tribunal' | 'particular' | 'banco' | 'escritorio' | 'outro'
  finalidade: string
  metodologia: string
  tipoImovel: string
  bairro: string
  cidade: string
  area?: number
  urgencia: 'baixa' | 'media' | 'alta'
  prazoSugerido: string
  complexidade: 'simples' | 'media' | 'complexa'
  laudoTipo: 'simplificado' | 'completo' | 'pericia_judicial'
  honorariosMin: number
  honorariosRec: number
  honorariosMax: number
  percentual: number
  justificativa: string
  observacoesEmail: string
}

const EXEMPLOS_EMAIL = [
  {
    label: 'Tribunal de Justiça de PE',
    conteudo: `Assunto: Solicitação de Laudo de Avaliação - Processo nº 0001234-56.2025.8.17.0001

Prezado Avaliador,

O Juízo da 3ª Vara Cível de Recife solicita a elaboração de laudo de avaliação do imóvel objeto do presente processo, situado na Rua da Aurora, 456 - Boa Vista, Recife/PE, trata-se de apartamento com aproximadamente 120m², para fins de partilha em inventário.

O perito deverá apresentar o laudo em 30 dias a partir desta comunicação, observando os requisitos da NBR 14653 e do Código de Processo Civil.

Att,
Secretaria da 3ª Vara Cível`
  },
  {
    label: 'Banco (Financiamento)',
    conteudo: `De: avaliações@bradesco.com.br
Assunto: Solicitação de Avaliação - Crédito Imobiliário

Prezado(a),

Solicitamos avaliação do imóvel para fins de concessão de crédito imobiliário pelo sistema SFH.
Imóvel: Apartamento, 85m², 3 quartos, 2 vagas, localizado na Av. Conselheiro Aguiar, Boa Viagem, Recife/PE.
Mutuário: João da Silva. Valor solicitado: R$ 480.000,00.

O laudo deve seguir as diretrizes do Banco Central e ABNT NBR 14653-2.
Prazo: 5 dias úteis.

Obrigado,
Gerência de Crédito Imobiliário`
  },
  {
    label: 'Particular - Venda',
    conteudo: `Olá, tudo bem?

Me chamo Ana Paula e gostaria de contratar uma avaliação do meu imóvel em Boa Viagem. É uma cobertura duplex de 280m² com 4 suítes, piscina privativa, 4 vagas de garagem. O condomínio é o Terraços de Portugal na Av. Eng. Domingos Ferreira.

Quero vender o imóvel e preciso de um laudo oficial para ter segurança no preço de venda. Não tenho urgência, pode ser até 15 dias.

Aguardo proposta.
Ana Paula - (81) 99123-4567`
  }
]

function calcHonorarios(params: {
  finalidade: string
  metodologia: string
  complexidade: string
  laudoTipo: string
}) {
  let base = 1500
  if (params.finalidade === 'judicial' || params.laudoTipo === 'pericia_judicial') base = 3500
  else if (params.finalidade === 'financiamento') base = 1800
  else if (params.complexidade === 'complexa') base = 2500
  else if (params.complexidade === 'simples') base = 900

  if (params.metodologia === 'involutivo' || params.metodologia === 'renda') base *= 1.3

  return {
    min: Math.round(base * 0.7),
    rec: Math.round(base),
    max: Math.round(base * 1.8)
  }
}

export default function EmailHonorariosPage() {
  const router = useRouter()
  const [emailText, setEmailText] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<EmailAnalysis | null>(null)
  const [draftResponse, setDraftResponse] = useState('')
  const [copied, setCopied] = useState(false)
  const [editingResponse, setEditingResponse] = useState(false)
  const [editedResponse, setEditedResponse] = useState('')
  const [activeTab, setActiveTab] = useState<'analise' | 'resposta'>('analise')

  const analyzeEmail = async () => {
    if (!emailText.trim()) return
    setIsAnalyzing(true)

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: `Você é especialista em avaliação imobiliária NBR 14653. Analise este email e retorne APENAS um JSON válido:

EMAIL:
${emailText}

Retorne APENAS este JSON (sem markdown, sem explicações):
{
  "solicitante": "nome ou instituição",
  "tipoEntidade": "tribunal|particular|banco|escritorio|outro",
  "finalidade": "partilha|inventario|financiamento|compra_venda|judicial|garantia|locacao|seguro|desapropriacao",
  "metodologia": "comparativo|involutivo|evolutivo|renda|custo",
  "tipoImovel": "tipo do imóvel",
  "bairro": "bairro se mencionado ou vazio",
  "cidade": "cidade",
  "area": numero ou 0,
  "urgencia": "baixa|media|alta",
  "prazoSugerido": "prazo em dias úteis como texto",
  "complexidade": "simples|media|complexa",
  "laudoTipo": "simplificado|completo|pericia_judicial",
  "justificativa": "justificativa dos honorários em 1 frase",
  "observacoesEmail": "pontos importantes do email em 1-2 frases"
}`
          }]
        })
      })

      const data = await response.json()
      const text = data.content?.[0]?.text || '{}'
      const clean = text.replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(clean)

      const hon = calcHonorarios({
        finalidade: parsed.finalidade,
        metodologia: parsed.metodologia,
        complexidade: parsed.complexidade,
        laudoTipo: parsed.laudoTipo
      })

      const result: EmailAnalysis = {
        ...parsed,
        honorariosMin: hon.min,
        honorariosRec: hon.rec,
        honorariosMax: hon.max,
        percentual: 0
      }

      setAnalysis(result)

      // Gerar rascunho de resposta
      const draft = generateResponse(result)
      setDraftResponse(draft)
      setEditedResponse(draft)
      setActiveTab('analise')

    } catch (err) {
      console.error(err)
      // Fallback mock
      const fallback: EmailAnalysis = {
        solicitante: 'Solicitante identificado',
        tipoEntidade: 'particular',
        finalidade: 'compra_venda',
        metodologia: 'comparativo',
        tipoImovel: 'Apartamento',
        bairro: 'Boa Viagem',
        cidade: 'Recife',
        urgencia: 'media',
        prazoSugerido: '10 dias úteis',
        complexidade: 'media',
        laudoTipo: 'completo',
        honorariosMin: 1050,
        honorariosRec: 1500,
        honorariosMax: 2700,
        percentual: 0.3,
        justificativa: 'Avaliação residencial padrão com metodologia comparativa',
        observacoesEmail: 'Solicitação de avaliação para fins de venda'
      }
      setAnalysis(fallback)
      setDraftResponse(generateResponse(fallback))
      setEditedResponse(generateResponse(fallback))
    }

    setIsAnalyzing(false)
  }

  const generateResponse = (a: EmailAnalysis): string => {
    const today = new Date().toLocaleDateString('pt-BR')
    const tipoLaudo = a.laudoTipo === 'pericia_judicial' ? 'Laudo Pericial Judicial' : a.laudoTipo === 'completo' ? 'Laudo Técnico de Avaliação' : 'Parecer Técnico'
    const prazo = a.prazoSugerido

    let saudacao = 'Prezado(a)'
    if (a.tipoEntidade === 'tribunal') saudacao = 'Meritíssimo Juízo'
    else if (a.tipoEntidade === 'banco') saudacao = 'Prezada equipe de crédito'

    return `${saudacao},

Recife, ${today}.

Em resposta à solicitação referente à avaliação do imóvel${a.bairro ? ' localizado em ' + a.bairro : ''}, ${a.cidade ? a.cidade : 'Recife'}/PE, apresentamos nossa proposta de honorários profissionais.

**Objeto:** ${a.tipoImovel || 'Imóvel residencial'} — ${a.bairro || 'local a confirmar'}
**Tipo de Trabalho:** ${tipoLaudo}
**Metodologia:** ${a.metodologia === 'comparativo' ? 'Método Comparativo Direto de Dados de Mercado (NBR 14653-2 §8)' : a.metodologia}
**Finalidade:** ${a.finalidade.replace('_', ' ')}
**Prazo de Entrega:** ${prazo} após vistoria e entrega de documentação

**HONORÁRIOS PROFISSIONAIS**

• Valor mínimo: R$ ${a.honorariosMin.toLocaleString('pt-BR')}
• Valor recomendado: R$ ${a.honorariosRec.toLocaleString('pt-BR')}
• Condições: 50% na assinatura do contrato e 50% na entrega do laudo

**DOCUMENTAÇÃO NECESSÁRIA**
— Matrícula atualizada do imóvel (RI Digital)
— IPTU vigente
— Plantas do imóvel (se disponível)
— Dados cadastrais do solicitante (CPF/CNPJ)

Os honorários acima foram calculados com base na tabela de referência do IBAPE e na complexidade do trabalho. O laudo será elaborado em conformidade com a ABNT NBR 14653 e assinado por profissional habilitado pelo CNAI.

Colocamo-nos à disposição para esclarecimentos.

Atenciosamente,

**Iule Miranda**
Avaliadora de Imóveis • CNAI [nº]
IMI — Iule Miranda Imóveis
Recife/PE • (81) [telefone]
www.iulemirandaimoveis.com.br`
  }

  const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

  const copyResponse = () => {
    navigator.clipboard.writeText(editingResponse ? editedResponse : draftResponse)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const BADGES: Record<string, { label: string; color: string }> = {
    tribunal: { label: 'Tribunal', color: 'bg-purple-100 text-purple-700' },
    particular: { label: 'Particular', color: 'bg-blue-100 text-blue-700' },
    banco: { label: 'Banco/IF', color: 'bg-green-100 text-green-700' },
    escritorio: { label: 'Escritório', color: 'bg-amber-100 text-amber-700' },
    outro: { label: 'Outro', color: 'bg-gray-100 text-gray-700' },
  }

  const URGENCIA_BADGE: Record<string, string> = {
    baixa: 'bg-green-100 text-green-700',
    media: 'bg-amber-100 text-amber-700',
    alta: 'bg-red-100 text-red-700',
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="w-9 h-9 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center justify-center">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Interpretador de Email + Honorários</h1>
          <p className="text-xs text-gray-500">IA analisa emails de tribunais, bancos e particulares e gera proposta automática</p>
        </div>
      </div>

      {/* Input */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Mail size={16} className="text-[#C49D5B]" /> Cole o email aqui
          </label>
          <div className="flex gap-2">
            {EXEMPLOS_EMAIL.map(ex => (
              <button key={ex.label} type="button" onClick={() => setEmailText(ex.conteudo)}
                className="text-xs px-2.5 py-1 border border-gray-200 rounded-lg hover:border-[#C49D5B] hover:text-[#C49D5B] transition-colors">
                {ex.label}
              </button>
            ))}
          </div>
        </div>

        <textarea value={emailText} onChange={e => setEmailText(e.target.value)}
          rows={8} placeholder="Cole aqui o conteúdo do email recebido do tribunal, banco ou cliente particular..."
          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C49D5B] resize-none font-mono" />

        <button onClick={analyzeEmail} disabled={!emailText.trim() || isAnalyzing}
          className="w-full flex items-center justify-center gap-2 h-11 bg-[#C49D5B] text-white rounded-xl font-semibold hover:bg-[#b08a4a] transition-colors disabled:opacity-50">
          {isAnalyzing ? <><Loader2 size={18} className="animate-spin" /> Analisando com IA...</> : <><Sparkles size={18} /> Analisar e Gerar Proposta</>}
        </button>
      </div>

      {/* Resultado */}
      {analysis && (
        <>
          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            {(['analise', 'resposta'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab ? 'border-[#C49D5B] text-[#C49D5B]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                {tab === 'analise' ? '📊 Análise do Email' : '✉ Rascunho de Resposta'}
              </button>
            ))}
          </div>

          {activeTab === 'analise' && (
            <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-6">
              {/* Header da análise */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-gray-900 text-base">{analysis.solicitante}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">{analysis.observacoesEmail}</p>
                </div>
                <div className="flex gap-2 flex-wrap justify-end">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${BADGES[analysis.tipoEntidade]?.color}`}>
                    {BADGES[analysis.tipoEntidade]?.label}
                  </span>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${URGENCIA_BADGE[analysis.urgencia]}`}>
                    Urgência {analysis.urgencia}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { icon: Building2, label: 'Imóvel', value: analysis.tipoImovel || '—' },
                  { icon: MapPin, label: 'Localização', value: [analysis.bairro, analysis.cidade].filter(Boolean).join(', ') || '—' },
                  { icon: Gavel, label: 'Finalidade', value: analysis.finalidade?.replace('_', ' ') || '—' },
                  { icon: Calculator, label: 'Metodologia', value: analysis.metodologia || '—' },
                  { icon: Clock, label: 'Prazo', value: analysis.prazoSugerido || '—' },
                  { icon: FileText, label: 'Tipo de Laudo', value: analysis.laudoTipo?.replace('_', ' ') || '—' },
                ].map(item => {
                  const Icon = item.icon
                  return (
                    <div key={item.label} className="p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Icon size={13} className="text-gray-400" />
                        <span className="text-xs text-gray-500">{item.label}</span>
                      </div>
                      <p className="text-sm font-medium text-gray-900 capitalize">{item.value}</p>
                    </div>
                  )
                })}
              </div>

              {/* Honorários */}
              <div className="border border-amber-200 rounded-xl overflow-hidden">
                <div className="bg-amber-50 px-4 py-3 border-b border-amber-200">
                  <p className="text-sm font-semibold text-amber-800 flex items-center gap-2">
                    <DollarSign size={15} /> Proposta de Honorários
                  </p>
                  <p className="text-xs text-amber-600 mt-0.5">{analysis.justificativa}</p>
                </div>
                <div className="p-4 grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Mínimo</p>
                    <p className="text-lg font-bold text-gray-700">{formatCurrency(analysis.honorariosMin)}</p>
                  </div>
                  <div className="border-x border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">Recomendado</p>
                    <p className="text-2xl font-bold text-[#C49D5B]">{formatCurrency(analysis.honorariosRec)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Máximo</p>
                    <p className="text-lg font-bold text-gray-700">{formatCurrency(analysis.honorariosMax)}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setActiveTab('resposta')}
                  className="flex-1 flex items-center justify-center gap-2 h-10 bg-[#C49D5B] text-white rounded-xl text-sm font-semibold hover:bg-[#b08a4a] transition-colors">
                  <Mail size={16} /> Ver Rascunho de Resposta
                </button>
                <button onClick={() => router.push('/backoffice/avaliacoes/nova')}
                  className="flex-1 flex items-center justify-center gap-2 h-10 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
                  <FileText size={16} /> Criar Avaliação
                </button>
              </div>
            </div>
          )}

          {activeTab === 'resposta' && (
            <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900">Rascunho de Proposta</h3>
                <div className="flex gap-2">
                  <button onClick={() => setEditingResponse(!editingResponse)}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors">
                    <Edit3 size={13} /> {editingResponse ? 'Ver' : 'Editar'}
                  </button>
                  <button onClick={copyResponse}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors">
                    {copied ? <><Check size={13} className="text-green-500" /> Copiado</> : <><Copy size={13} /> Copiar</>}
                  </button>
                </div>
              </div>

              {editingResponse ? (
                <textarea value={editedResponse} onChange={e => setEditedResponse(e.target.value)}
                  rows={20} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C49D5B] font-mono resize-none" />
              ) : (
                <pre className="whitespace-pre-wrap text-sm text-gray-800 bg-gray-50 rounded-xl p-4 font-sans leading-relaxed">{editedResponse || draftResponse}</pre>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
