'use client'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowLeft, ArrowRight, Building2, MapPin, Ruler, User, Mail, Phone,
  FileText, Upload, Check, Save, Loader2, AlertCircle, DollarSign,
  Calendar, Sparkles, X, Home, BarChart2, Scale, Info, Calculator,
  Landmark, ChevronDown, ChevronRight, Car, Layers, Star, Eye,
  Hash, Clock, CreditCard, Gavel
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { T } from '@/app/(backoffice)/lib/theme'
import { PageIntelHeader } from '@/app/(backoffice)/components/ui'
// ============================================================
// TIPOS E CONSTANTES NBR 14653
// ============================================================
type Step = 1 | 2 | 3 | 4 | 5
interface Comparable {
  id: string
  endereco: string
  tipo: string
  area: number
  quartos: number
  banheiros: number
  vagas: number
  andar?: number
  padrao: string
  estado: string
  valorVenda: number
  fonteDado: string
  dataColeta: string
  distanciaKm: number
}
interface FormData {
  // Step 1 - Imóvel
  endereco: string
  complemento: string
  bairro: string
  cidade: string
  estado: string
  cep: string
  tipo: string
  areaPrivativa: string
  areaTotal: string
  quartos: string
  banheiros: string
  vagas: string
  andar: string
  totalAndares: string
  anoContrucao: string
  padrao: string
  estado_conservacao: string
  caracteristicas: string[]
  // Step 2 - Cliente / Solicitante
  clienteNome: string
  clienteEmail: string
  clienteTelefone: string
  clienteCPFCNPJ: string
  clienteTipo: 'PF' | 'PJ'
  solicitanteInstituicao: string
  // Step 3 - Avaliação
  finalidade: string
  metodologia: string
  grauFundamentacao: string
  grauPrecisao: string
  prazoEntrega: string
  valorHonorarios: string
  formaPagamento: string
  observacoes: string
  // Step 4 - Comparáveis
  comparaveis: Comparable[]
  // Step 5 - Documentos
  documentos: File[]
}
const TIPOS_IMOVEL = [
  'Apartamento', 'Casa', 'Cobertura', 'Studio', 'Flat', 'Loft',
  'Terreno Urbano', 'Terreno Rural', 'Comercial - Sala', 'Comercial - Loja',
  'Galpão/Armazém', 'Hotel/Pousada', 'Fazenda/Sítio'
]
const FINALIDADES = [
  { value: 'compra_venda', label: 'Compra e Venda', subtitulo: 'Alienação voluntária' },
  { value: 'financiamento', label: 'Financiamento Bancário', subtitulo: 'Garantia hipotecária / SFH' },
  { value: 'garantia', label: 'Garantia de Empréstimo', subtitulo: 'Alienação fiduciária' },
  { value: 'partilha', label: 'Partilha de Bens', subtitulo: 'Divórcio / Inventário' },
  { value: 'inventario', label: 'Inventário', subtitulo: 'Arrolamento de bens' },
  { value: 'desapropriacao', label: 'Desapropriação', subtitulo: 'Poder público / utilidade pública' },
  { value: 'judicial', label: 'Judicial / Perícia', subtitulo: 'Processo judicial / arbitragem' },
  { value: 'seguro', label: 'Seguro', subtitulo: 'Determinação de valor segurado' },
  { value: 'locacao', label: 'Locação', subtitulo: 'Fixação de aluguel' },
  { value: 'permuta', label: 'Permuta', subtitulo: 'Troca de imóveis' },
  { value: 'fundo', label: 'Fundo de Investimento', subtitulo: 'FII / Marcação a mercado' },
  { value: 'outro', label: 'Outra Finalidade', subtitulo: '' },
]
const METODOLOGIAS = [
  {
    value: 'comparativo',
    label: 'Comparativo Direto de Dados de Mercado',
    descricao: 'Indicado para imóveis com mercado ativo. Padrão NBR 14653-2.',
    norma: 'NBR 14653-2 §8',
    icone: BarChart2
  },
  {
    value: 'involutivo',
    label: 'Método Involutivo',
    descricao: 'Para terrenos: obtém valor por hipotética incorporação residencial ou comercial.',
    norma: 'NBR 14653-2 §9',
    icone: Layers
  },
  {
    value: 'evolutivo',
    label: 'Método Evolutivo',
    descricao: 'Composição: valor do terreno + benfeitorias (Custo de Reprodução).',
    norma: 'NBR 14653-2 §10',
    icone: Home
  },
  {
    value: 'renda',
    label: 'Método da Renda',
    descricao: 'Capitalização da renda auferida pelo imóvel. Indicado para comercial e locações.',
    norma: 'NBR 14653-2 §11',
    icone: DollarSign
  },
  {
    value: 'custo',
    label: 'Método Comparativo de Custo de Reprodução',
    descricao: 'Estimativa de custo de reprodução das benfeitorias, com depreciação.',
    norma: 'NBR 14653-2 §12',
    icone: Calculator
  },
]
const PADROES = ['Baixo', 'Normal', 'Alto', 'Luxo']
const ESTADOS_CONSERVACAO = ['Novo', 'Entre Novo e Regular', 'Regular', 'Entre Regular e Reparos Simples', 'Reparos Simples', 'Entre Reparos Simples e Importantes', 'Reparos Importantes', 'Entre Reparos Importantes e Sem Valor', 'Sem Valor']
const GRAUS_FUNDAMENTACAO = ['I', 'II', 'III']
const GRAUS_PRECISAO = ['III', 'II', 'I']
const CARACTERISTICAS = [
  'Varanda/Sacada', 'Varanda Gourmet', 'Piscina', 'Academia', 'Salão de Festas',
  'Portaria 24h', 'Gerador', 'Playground', 'Quadra Esportiva', 'Armários Planejados',
  'Ar-condicionado', 'Piso Porcelanato', 'Vista Mar', 'Vista para Parque',
  'Cobertura com Terraço', 'Duplex', 'Andar Alto', 'Área de Serviço',
]
// ============================================================
// CÁLCULO DE HONORÁRIOS NBR 14653 (baseado no PDF)
// ============================================================
function calcularHonorarios(valorEstimado: number, finalidade: string, metodologia: string): {
  minimo: number
  recomendado: number
  maximo: number
  percentual: number
  justificativa: string
} {
  // Tabela base IBAPE/SP adaptada
  let percentBase = 0.003 // 0.3% base
  if (valorEstimado <= 200000) percentBase = 0.008
  else if (valorEstimado <= 500000) percentBase = 0.006
  else if (valorEstimado <= 1000000) percentBase = 0.004
  else if (valorEstimado <= 5000000) percentBase = 0.003
  else percentBase = 0.002
  // Multiplicador por finalidade
  let multiplicador = 1.0
  if (finalidade === 'judicial') multiplicador = 1.5
  else if (finalidade === 'desapropriacao') multiplicador = 1.4
  else if (finalidade === 'fundo') multiplicador = 1.3
  else if (finalidade === 'financiamento') multiplicador = 1.1
  // Multiplicador por metodologia
  if (metodologia === 'involutivo' || metodologia === 'renda') multiplicador *= 1.2
  if (metodologia === 'evolutivo') multiplicador *= 1.1
  const recomendado = Math.max(800, valorEstimado * percentBase * multiplicador)
  const minimo = recomendado * 0.7
  const maximo = recomendado * 1.5
  const justificativa = `Calculado conforme IBAPE — ${(percentBase * 100).toFixed(2)}% sobre valor estimado` +
    (multiplicador > 1 ? ` com fator de complexidade ${multiplicador.toFixed(1)}x` : '')
  return {
    minimo: Math.round(minimo),
    recomendado: Math.round(recomendado),
    maximo: Math.round(maximo),
    percentual: percentBase * multiplicador * 100,
    justificativa
  }
}
// ============================================================
// T-OBJECT — Dark theme tokens
// ============================================================
// ============================================================
// COMPONENTES AUXILIARES
// ============================================================
function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
      <AlertCircle size={13} />
      {message}
    </p>
  )
}
function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-medium mb-1.5" style={{ color: T.text }}>
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  )
}
function InputField({ icon: Icon, error, ...props }: { icon?: LucideIcon; error?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="relative">
      {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2" size={18} style={{ color: T.textMuted }} />}
      <input
        {...props}
        className={`w-full h-10 ${Icon ? 'pl-9' : 'px-3'} pr-3 border rounded-[6px] text-sm focus:outline-none focus:ring-2 focus:ring-[#334E68] ${error ? 'border-red-300' : ''}`}
        style={{ background: T.elevated, border: `1px solid ${error ? '#fca5a5' : T.border}`, color: T.text }}
      />
    </div>
  )
}
// ============================================================
// PÁGINA PRINCIPAL
// ============================================================
export default function NovaAvaliacaoPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [currentStep, setCurrentStep] = useState<Step>(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showHonorarios, setShowHonorarios] = useState(false)
  const [valorEstimadoHonorarios, setValorEstimadoHonorarios] = useState(500000)
  const [calcResult, setCalcResult] = useState<Record<string, unknown> | null>(null)
  const [calcLoading, setCalcLoading] = useState(false)
  // Pre-fill from cross-link URL params (e.g. from property detail page)
  const prefillBairro = searchParams.get('bairro') ?? ''
  const prefillArea = searchParams.get('area') ?? ''
  const prefillNome = searchParams.get('nome') ?? ''
  const prefillImovelId = searchParams.get('imovel') ?? ''
  const prefillObs = prefillNome
    ? `Imóvel: ${prefillNome}${prefillImovelId ? ` (ID: ${prefillImovelId})` : ''}`
    : ''
  const [formData, setFormData] = useState<FormData>(() => ({
    endereco: '', complemento: '', bairro: prefillBairro, cidade: 'Recife', estado: 'PE', cep: '',
    tipo: '', areaPrivativa: prefillArea, areaTotal: '', quartos: '', banheiros: '',
    vagas: '', andar: '', totalAndares: '', anoContrucao: '', padrao: 'Normal',
    estado_conservacao: 'Novo', caracteristicas: [],
    clienteNome: '', clienteEmail: '', clienteTelefone: '', clienteCPFCNPJ: '',
    clienteTipo: 'PF', solicitanteInstituicao: '',
    finalidade: '', metodologia: 'comparativo', grauFundamentacao: 'II', grauPrecisao: 'II',
    prazoEntrega: '', valorHonorarios: '', formaPagamento: 'À vista', observacoes: prefillObs,
    comparaveis: [
      {
        id: '1', endereco: '', tipo: 'Apartamento', area: 0, quartos: 0, banheiros: 0,
        vagas: 0, padrao: 'Normal', estado: 'Novo', valorVenda: 0,
        fonteDado: 'ZAP Imóveis', dataColeta: new Date().toISOString().split('T')[0], distanciaKm: 0
      }
    ],
    documentos: [],
  }))

  const handleChange = (field: keyof FormData, value: FormData[keyof FormData]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }))
  }
  const toggleCaracteristica = (item: string) => {
    setFormData(prev => ({
      ...prev,
      caracteristicas: prev.caracteristicas.includes(item)
        ? prev.caracteristicas.filter(c => c !== item)
        : [...prev.caracteristicas, item]
    }))
  }
  const addComparavel = () => {
    const novo: Comparable = {
      id: Date.now().toString(), endereco: '', tipo: 'Apartamento', area: 0,
      quartos: 0, banheiros: 0, vagas: 0, padrao: 'Normal', estado: 'Novo',
      valorVenda: 0, fonteDado: 'ZAP Imóveis', dataColeta: new Date().toISOString().split('T')[0],
      distanciaKm: 0
    }
    setFormData(prev => ({ ...prev, comparaveis: [...prev.comparaveis, novo] }))
  }
  const updateComparavel = (id: string, field: keyof Comparable, value: Comparable[keyof Comparable]) => {
    setFormData(prev => ({
      ...prev,
      comparaveis: prev.comparaveis.map(c => c.id === id ? { ...c, [field]: value } : c)
    }))
  }
  const removeComparavel = (id: string) => {
    setFormData(prev => ({
      ...prev,
      comparaveis: prev.comparaveis.filter(c => c.id !== id)
    }))
  }
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  const validateStep = (step: Step): boolean => {
    const e: Record<string, string> = {}
    if (step === 1) {
      if (!formData.endereco.trim()) e.endereco = 'Endereço obrigatório'
      if (!formData.tipo) e.tipo = 'Tipo obrigatório'
      if (!formData.areaPrivativa) e.areaPrivativa = 'Área obrigatória'
      if (!formData.bairro.trim()) e.bairro = 'Bairro obrigatório'
    }
    if (step === 2) {
      if (!formData.clienteNome.trim()) e.clienteNome = 'Nome obrigatório'
      if (!formData.clienteEmail.trim()) e.clienteEmail = 'Email obrigatório'
    }
    if (step === 3) {
      if (!formData.finalidade) e.finalidade = 'Finalidade obrigatória'
      if (!formData.metodologia) e.metodologia = 'Metodologia obrigatória'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }
  const handleNext = () => { if (validateStep(currentStep)) setCurrentStep(prev => Math.min(5, prev + 1) as Step) }
  const handlePrev = () => setCurrentStep(prev => Math.max(1, prev - 1) as Step)
  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/avaliacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Erro ao salvar')
      router.push('/backoffice/avaliacoes')
    } catch (error) {
      setIsSubmitting(false)
    }
  }
  const STEPS = [
    { n: 1, label: 'Imóvel', icon: Building2 },
    { n: 2, label: 'Cliente', icon: User },
    { n: 3, label: 'Avaliação', icon: Scale },
    { n: 4, label: 'Comparáveis', icon: BarChart2 },
    { n: 5, label: 'Documentos', icon: FileText },
  ]
  const honorarios = calcularHonorarios(valorEstimadoHonorarios, formData.finalidade, formData.metodologia)
  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <PageIntelHeader
        moduleLabel="AVALIAÇÕES · NBR 14653"
        title="Nova Avaliação Técnica"
        subtitle={`Etapa ${currentStep}/5 — Laudo técnico completo com inteligência de mercado`}
        live
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 rounded-[6px] flex items-center justify-center transition-all hover:opacity-80"
              style={{ background: T.card, border: `1px solid ${T.border}` }}
            >
              <ArrowLeft size={18} style={{ color: T.text }} />
            </button>
            <div className="flex items-center gap-2 h-9 px-3 rounded-lg"
              style={{ background: 'rgba(245,158,11,0.10)', border: '1px solid rgba(245,158,11,0.20)' }}>
              <Sparkles size={14} style={{ color: 'var(--warning)' }} />
              <span className="text-xs font-semibold" style={{ color: 'var(--warning)' }}>Motor IA</span>
            </div>
          </div>
        }
      />
      {/* Steps */}
      <div className="rounded-lg p-4" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
        <div className="flex items-center">
          {STEPS.map((step, i) => {
            const Icon = step.icon
            const done = currentStep > step.n
            const active = currentStep === step.n
            return (
              <div key={step.n} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all"
                    style={{
                      background: done ? 'var(--success)' : active ? 'var(--accent-400)' : T.elevated,
                      color: done || active ? 'white' : T.textMuted,
                    }}
                  >
                    {done ? <Check size={16} /> : <Icon size={16} />}
                  </div>
                  <span className="text-xs mt-1 hidden sm:block font-medium"
                    style={{ color: active ? 'var(--accent-400)' : done ? 'var(--success)' : T.textMuted }}>
                    {step.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`h-0.5 flex-1 mx-1 rounded-full ${currentStep > step.n ? 'bg-emerald-400' : ''}`}
                    style={currentStep <= step.n ? { background: T.border } : undefined} />
                )}
              </div>
            )
          })}
        </div>
      </div>
      {/* Form */}
      <div className="rounded-lg p-6 sm:p-8" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
        {/* ===== STEP 1: IMÓVEL ===== */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold pb-3" style={{ color: T.text, borderBottom: `1px solid ${T.border}` }}>Dados do Imóvel</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <Label required>Endereço</Label>
                <InputField icon={MapPin} value={formData.endereco} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => handleChange('endereco', e.target.value)} placeholder="Rua, número" error={errors.endereco} />
                <FieldError message={errors.endereco} />
              </div>
              <div>
                <Label>Complemento</Label>
                <InputField value={formData.complemento} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => handleChange('complemento', e.target.value)} placeholder="Apto, bloco..." />
              </div>
              <div>
                <Label required>Bairro</Label>
                <InputField value={formData.bairro} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => handleChange('bairro', e.target.value)} placeholder="Boa Viagem" error={errors.bairro} />
                <FieldError message={errors.bairro} />
              </div>
              <div>
                <Label>Cidade</Label>
                <InputField value={formData.cidade} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => handleChange('cidade', e.target.value)} placeholder="Recife" />
              </div>
              <div>
                <Label>CEP</Label>
                <InputField value={formData.cep} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => handleChange('cep', e.target.value)} placeholder="50000-000" />
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="col-span-2">
                <Label required>Tipo de Imóvel</Label>
                <select value={formData.tipo} onChange={e => handleChange('tipo', e.target.value)}
                  className={`w-full h-10 px-3 rounded-[6px] text-sm focus:outline-none focus:ring-2 focus:ring-[#334E68]`}
                  style={{ background: T.elevated, border: `1px solid ${errors.tipo ? '#fca5a5' : T.border}`, color: T.text }}>
                  <option value="">Selecione...</option>
                  {TIPOS_IMOVEL.map(t => <option key={t}>{t}</option>)}
                </select>
                <FieldError message={errors.tipo} />
              </div>
              <div>
                <Label required>Área Privativa (m²)</Label>
                <InputField icon={Ruler} type="number" value={formData.areaPrivativa} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => handleChange('areaPrivativa', e.target.value)} placeholder="95" error={errors.areaPrivativa} />
                <FieldError message={errors.areaPrivativa} />
              </div>
              <div>
                <Label>Área Total (m²)</Label>
                <InputField type="number" value={formData.areaTotal} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => handleChange('areaTotal', e.target.value)} placeholder="110" />
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              <div>
                <Label>Quartos</Label>
                <InputField type="number" value={formData.quartos} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => handleChange('quartos', e.target.value)} placeholder="3" />
              </div>
              <div>
                <Label>Banheiros</Label>
                <InputField type="number" value={formData.banheiros} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => handleChange('banheiros', e.target.value)} placeholder="2" />
              </div>
              <div>
                <Label>Vagas</Label>
                <InputField icon={Car} type="number" value={formData.vagas} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => handleChange('vagas', e.target.value)} placeholder="2" />
              </div>
              <div>
                <Label>Andar</Label>
                <InputField type="number" value={formData.andar} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => handleChange('andar', e.target.value)} placeholder="8" />
              </div>
              <div>
                <Label>Ano Constr.</Label>
                <InputField type="number" value={formData.anoContrucao} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => handleChange('anoContrucao', e.target.value)} placeholder="2018" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Padrão Construtivo</Label>
                <select value={formData.padrao} onChange={e => handleChange('padrao', e.target.value)}
                  className="w-full h-10 px-3 rounded-[6px] text-sm focus:outline-none focus:ring-2 focus:ring-[#334E68]"
                  style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }}>
                  {PADROES.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <Label>Estado de Conservação</Label>
                <select value={formData.estado_conservacao} onChange={e => handleChange('estado_conservacao', e.target.value)}
                  className="w-full h-10 px-3 rounded-[6px] text-sm focus:outline-none focus:ring-2 focus:ring-[#334E68]"
                  style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }}>
                  {ESTADOS_CONSERVACAO.map(e => <option key={e}>{e}</option>)}
                </select>
              </div>
            </div>
            <div>
              <Label>Características (selecione todas que se aplicam)</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {CARACTERISTICAS.map(c => (
                  <button key={c} type="button" onClick={() => toggleCaracteristica(c)}
                    className="px-3 py-1.5 rounded-[6px] text-xs font-medium border transition-all"
                    style={formData.caracteristicas.includes(c)
                      ? { background: T.accent, color: 'var(--text-inverse)', borderColor: 'transparent' }
                      : { background: T.elevated, color: T.textMuted, border: `1px solid ${T.border}` }}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        {/* ===== STEP 2: CLIENTE ===== */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold pb-3" style={{ color: T.text, borderBottom: `1px solid ${T.border}` }}>Dados do Solicitante</h2>
            <div className="flex gap-3">
              {(['PF', 'PJ'] as const).map(t => (
                <button key={t} type="button" onClick={() => handleChange('clienteTipo', t)}
                  className="px-4 py-2 rounded-lg text-sm font-medium border transition-all"
                  style={formData.clienteTipo === t
                    ? { background: T.accent, color: 'var(--text-inverse)', borderColor: 'transparent' }
                    : { background: T.elevated, color: T.textMuted, border: `1px solid ${T.border}` }}>
                  {t === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Label required>{formData.clienteTipo === 'PF' ? 'Nome Completo' : 'Razão Social'}</Label>
                <InputField icon={User} value={formData.clienteNome} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => handleChange('clienteNome', e.target.value)} error={errors.clienteNome} />
                <FieldError message={errors.clienteNome} />
              </div>
              <div>
                <Label required>Email</Label>
                <InputField icon={Mail} type="email" value={formData.clienteEmail} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => handleChange('clienteEmail', e.target.value)} error={errors.clienteEmail} />
                <FieldError message={errors.clienteEmail} />
              </div>
              <div>
                <Label>Telefone</Label>
                <InputField icon={Phone} value={formData.clienteTelefone} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => handleChange('clienteTelefone', e.target.value)} placeholder="(81) 99999-9999" />
              </div>
              <div>
                <Label>{formData.clienteTipo === 'PF' ? 'CPF' : 'CNPJ'}</Label>
                <InputField icon={Hash} value={formData.clienteCPFCNPJ} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => handleChange('clienteCPFCNPJ', e.target.value)} placeholder={formData.clienteTipo === 'PF' ? '000.000.000-00' : '00.000.000/0001-00'} />
              </div>
              <div>
                <Label>Instituição / Banco (se financiamento)</Label>
                <InputField icon={Landmark} value={formData.solicitanteInstituicao} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => handleChange('solicitanteInstituicao', e.target.value)} placeholder="CEF, Bradesco, Particular..." />
              </div>
            </div>
            {/* Info Box */}
            <div className="flex gap-3 p-4 rounded-lg" style={{ background: 'rgba(72,101,129,0.10)', border: '1px solid rgba(72,101,129,0.20)' }}>
              <Info size={18} style={{ color: 'var(--accent-400)', flexShrink: 0, marginTop: 1 }} />
              <div className="text-sm">
                <p className="font-medium mb-1" style={{ color: T.text }}>Responsabilidade do Avaliador</p>
                <p className="text-xs" style={{ color: T.textMuted }}>O laudo de avaliação é de responsabilidade exclusiva do profissional habilitado (CNAI/CRECI). Os dados do solicitante são arquivados para rastreabilidade conforme NBR 14653-1.</p>
              </div>
            </div>
          </div>
        )}
        {/* ===== STEP 3: AVALIAÇÃO + HONORÁRIOS ===== */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold pb-3" style={{ color: T.text, borderBottom: `1px solid ${T.border}` }}>Parâmetros da Avaliação</h2>
            {/* Finalidade */}
            <div>
              <Label required>Finalidade da Avaliação</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                {FINALIDADES.map(f => (
                  <button key={f.value} type="button" onClick={() => handleChange('finalidade', f.value)}
                    className="flex items-start gap-3 p-3 rounded-lg text-left transition-all"
                    style={formData.finalidade === f.value
                      ? { border: '1px solid var(--accent-400)', background: 'var(--bg-active)' }
                      : { border: `1px solid ${T.border}`, background: T.elevated }}>
                    <div
                      className="w-4 h-4 rounded-full border-2 mt-0.5 flex-shrink-0"
                      style={{
                        borderColor: formData.finalidade === f.value ? 'var(--accent-400)' : T.border,
                        background: formData.finalidade === f.value ? 'var(--accent-400)' : 'transparent',
                      }}
                    />
                    <div>
                      <p className="text-sm font-medium" style={{ color: T.text }}>{f.label}</p>
                      {f.subtitulo && <p className="text-xs" style={{ color: T.textMuted }}>{f.subtitulo}</p>}
                    </div>
                  </button>
                ))}
              </div>
              <FieldError message={errors.finalidade} />
            </div>
            {/* Metodologia */}
            <div>
              <Label required>Metodologia (NBR 14653)</Label>
              <div className="space-y-2 mt-1">
                {METODOLOGIAS.map(m => {
                  const Icon = m.icone
                  return (
                    <button key={m.value} type="button" onClick={() => handleChange('metodologia', m.value)}
                      className="w-full flex items-center gap-4 p-4 rounded-lg text-left transition-all"
                      style={formData.metodologia === m.value
                        ? { border: '1px solid var(--accent-400)', background: 'var(--bg-active)' }
                        : { border: `1px solid ${T.border}`, background: T.elevated }}>
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={formData.metodologia === m.value
                          ? { background: 'var(--btn-primary-bg)', color: 'white' }
                          : { background: T.surface, color: T.textMuted }}>
                        <Icon size={20} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold" style={{ color: T.text }}>{m.label}</p>
                          <span className="text-xs font-mono" style={{ color: T.textMuted }}>{m.norma}</span>
                        </div>
                        <p className="text-xs mt-0.5" style={{ color: T.textMuted }}>{m.descricao}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
            {/* Graus */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label>Grau de Fundamentação</Label>
                <select value={formData.grauFundamentacao} onChange={e => handleChange('grauFundamentacao', e.target.value)}
                  className="w-full h-10 px-3 rounded-[6px] text-sm focus:outline-none focus:ring-2 focus:ring-[#334E68]"
                  style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }}>
                  {GRAUS_FUNDAMENTACAO.map(g => <option key={g}>Grau {g}</option>)}
                </select>
              </div>
              <div>
                <Label>Grau de Precisão</Label>
                <select value={formData.grauPrecisao} onChange={e => handleChange('grauPrecisao', e.target.value)}
                  className="w-full h-10 px-3 rounded-[6px] text-sm focus:outline-none focus:ring-2 focus:ring-[#334E68]"
                  style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }}>
                  {GRAUS_PRECISAO.map(g => <option key={g}>Grau {g}</option>)}
                </select>
              </div>
              <div>
                <Label>Prazo de Entrega</Label>
                <InputField icon={Calendar} type="date" value={formData.prazoEntrega} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => handleChange('prazoEntrega', e.target.value)} />
              </div>
            </div>
            {/* Calculadora de Honorários */}
            <div className="rounded-lg overflow-hidden" style={{ border: '1px solid rgba(245,158,11,0.30)', background: T.card }}>
              <button type="button" onClick={() => setShowHonorarios(!showHonorarios)}
                className="w-full flex items-center justify-between p-4 transition-colors"
                style={{ background: 'rgba(245,158,11,0.08)' }}>
                <div className="flex items-center gap-3">
                  <Calculator size={18} style={{ color: 'var(--warning)' }} />
                  <span className="text-sm font-semibold" style={{ color: 'var(--warning)' }}>Calculadora de Honorários (IBAPE)</span>
                </div>
                {showHonorarios ? <ChevronDown size={18} style={{ color: 'var(--warning)' }} /> : <ChevronRight size={18} style={{ color: 'var(--warning)' }} />}
              </button>
              {showHonorarios && (
                <div className="p-4 space-y-4" style={{ background: T.surface }}>
                  <div>
                    <Label>Valor Estimado do Imóvel (para cálculo)</Label>
                    <InputField icon={DollarSign} type="number" value={valorEstimadoHonorarios}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setValorEstimadoHonorarios(Number(e.target.value))} placeholder="500000" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { label: 'Mínimo', value: honorarios.minimo, color: T.text },
                      { label: 'Recomendado', value: honorarios.recomendado, color: T.accent, bold: true },
                      { label: 'Máximo', value: honorarios.maximo, color: T.text },
                    ].map(item => (
                      <div key={item.label} className="text-center p-3 rounded-lg" style={{ background: T.elevated, border: `1px solid ${T.border}` }}>
                        <p className="text-xs mb-1" style={{ color: T.textMuted }}>{item.label}</p>
                        <p className={`text-base ${item.bold ? 'font-bold' : ''}`} style={{ color: item.color }}>{formatCurrency(item.value)}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs italic" style={{ color: T.textMuted }}>{honorarios.justificativa}</p>
                  <button type="button" onClick={() => handleChange('valorHonorarios', honorarios.recomendado.toString())}
                    className="w-full py-2 text-white rounded-[6px] text-sm font-semibold transition-all hover:opacity-80"
                    style={{ background: 'var(--btn-primary-bg)' }}>
                    Usar Valor Recomendado ({formatCurrency(honorarios.recomendado)})
                  </button>
                </div>
              )}
            </div>
            {/* Honorários + Pagamento */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Valor dos Honorários (R$)</Label>
                <InputField icon={DollarSign} type="number" value={formData.valorHonorarios}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => handleChange('valorHonorarios', e.target.value)} placeholder="1500" />
              </div>
              <div>
                <Label>Forma de Pagamento</Label>
                <select value={formData.formaPagamento} onChange={e => handleChange('formaPagamento', e.target.value)}
                  className="w-full h-10 px-3 rounded-[6px] text-sm focus:outline-none focus:ring-2 focus:ring-[#334E68]"
                  style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }}>
                  <option>À vista</option>
                  <option>50% entrada / 50% entrega</option>
                  <option>Parcelado 2x</option>
                  <option>No banco (financiamento)</option>
                </select>
              </div>
            </div>
            <div>
              <Label>Observações</Label>
              <textarea value={formData.observacoes} onChange={e => handleChange('observacoes', e.target.value)}
                rows={3} placeholder="Informações adicionais sobre a avaliação..."
                className="w-full px-3 py-2 rounded-[6px] text-sm focus:outline-none focus:ring-2 focus:ring-[#334E68] resize-none"
                style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }} />
            </div>
          </div>
        )}
        {/* ===== STEP 4: COMPARÁVEIS ===== */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-3" style={{ borderBottom: `1px solid ${T.border}` }}>
              <div>
                <h2 className="text-lg font-bold" style={{ color: T.text }}>Dados de Mercado — Comparáveis</h2>
                <p className="text-xs mt-0.5" style={{ color: T.textMuted }}>NBR 14653-2 exige mín. 3 amostras (Grau II) ou 5 amostras (Grau III)</p>
              </div>
              <button type="button" onClick={addComparavel}
                className="flex items-center gap-2 h-9 px-4 rounded-[6px] text-sm font-semibold transition-all hover:opacity-80"
                style={{ background: 'var(--btn-primary-bg)', color: 'white' }}>
                + Adicionar
              </button>
            </div>
            {/* Status de amostras */}
            <div
              className="flex items-center gap-3 p-3 rounded-lg"
              style={{
                background: formData.comparaveis.length >= 5 ? 'rgba(107,184,123,0.10)' : formData.comparaveis.length >= 3 ? 'rgba(245,158,11,0.10)' : 'rgba(229,115,115,0.10)',
                border: `1px solid ${formData.comparaveis.length >= 5 ? 'rgba(107,184,123,0.25)' : formData.comparaveis.length >= 3 ? 'rgba(245,158,11,0.25)' : 'rgba(229,115,115,0.25)'}`,
              }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                style={{
                  background: formData.comparaveis.length >= 5 ? 'var(--success)' : formData.comparaveis.length >= 3 ? 'var(--warning)' : 'var(--error)',
                  color: 'white',
                }}
              >
                {formData.comparaveis.length}
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: T.text }}>
                  {formData.comparaveis.length >= 5 ? 'Grau III — Suficiente para alta precisão' :
                    formData.comparaveis.length >= 3 ? 'Grau II — Mínimo atingido' :
                      `Insuficiente — adicione ${3 - formData.comparaveis.length} amostra(s)`}
                </p>
                <p className="text-xs" style={{ color: T.textMuted }}>Amostras coletadas</p>
              </div>
            </div>
            {formData.comparaveis.map((comp, idx) => (
              <div key={comp.id} className="rounded-lg p-4 space-y-3" style={{ border: `1px solid ${T.border}`, background: T.elevated }}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold" style={{ color: T.text }}>Amostra #{idx + 1}</span>
                  {formData.comparaveis.length > 1 && (
                    <button type="button" onClick={() => removeComparavel(comp.id)} className="text-red-400 hover:text-red-600 text-xs">
                      Remover
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <Label>Endereço / Referência</Label>
                    <input value={comp.endereco} onChange={e => updateComparavel(comp.id, 'endereco', e.target.value)}
                      placeholder="Ex: Av. Conselheiro Aguiar, 3200 - Boa Viagem"
                      className="w-full h-9 px-3 rounded-[6px] text-sm focus:outline-none focus:ring-2 focus:ring-[#334E68]"
                      style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
                  </div>
                  <div>
                    <Label>Área (m²)</Label>
                    <input type="number" value={comp.area || ''} onChange={e => updateComparavel(comp.id, 'area', Number(e.target.value))}
                      placeholder="90"
                      className="w-full h-9 px-3 rounded-[6px] text-sm focus:outline-none focus:ring-2 focus:ring-[#334E68]"
                      style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
                  </div>
                  <div>
                    <Label>Valor de Oferta (R$)</Label>
                    <input type="number" value={comp.valorVenda || ''} onChange={e => updateComparavel(comp.id, 'valorVenda', Number(e.target.value))}
                      placeholder="550000"
                      className="w-full h-9 px-3 rounded-[6px] text-sm focus:outline-none focus:ring-2 focus:ring-[#334E68]"
                      style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
                  </div>
                  <div>
                    <Label>Fonte do Dado</Label>
                    <select value={comp.fonteDado} onChange={e => updateComparavel(comp.id, 'fonteDado', e.target.value)}
                      className="w-full h-9 px-3 rounded-[6px] text-sm focus:outline-none focus:ring-2 focus:ring-[#334E68]"
                      style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }}>
                      <option>ZAP Imóveis</option>
                      <option>VivaReal</option>
                      <option>OLX</option>
                      <option>Imobiliária</option>
                      <option>Particular</option>
                      <option>RI Digital</option>
                      <option>ONR</option>
                    </select>
                  </div>
                  <div>
                    <Label>Data de Coleta</Label>
                    <input type="date" value={comp.dataColeta} onChange={e => updateComparavel(comp.id, 'dataColeta', e.target.value)}
                      className="w-full h-9 px-3 rounded-[6px] text-sm focus:outline-none focus:ring-2 focus:ring-[#334E68]"
                      style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
                  </div>
                </div>
                {/* Valor m² calculado */}
                {comp.area > 0 && comp.valorVenda > 0 && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: T.surface }}>
                    <BarChart2 size={14} style={{ color: T.accent }} />
                    <span className="text-xs" style={{ color: T.textMuted }}>
                      Valor unitário: <strong style={{ color: T.text }}>{formatCurrency(comp.valorVenda / comp.area)}/m²</strong>
                    </span>
                  </div>
                )}
              </div>
            ))}
            {/* Resumo estatístico */}
            {formData.comparaveis.length >= 3 && formData.comparaveis.every(c => c.area > 0 && c.valorVenda > 0) && (
              <div className="rounded-lg p-4" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)" }}>
                <p className="text-xs font-semibold mb-3 uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>Análise Estatística da Amostra</p>
                {(() => {
                  const valores = formData.comparaveis.map(c => c.valorVenda / c.area).filter(v => v > 0)
                  const media = valores.reduce((a, b) => a + b, 0) / valores.length
                  const min = Math.min(...valores)
                  const max = Math.max(...valores)
                  const cv = (Math.sqrt(valores.map(v => Math.pow(v - media, 2)).reduce((a, b) => a + b, 0) / valores.length) / media) * 100
                  return (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                      {[
                        { l: 'Média', v: formatCurrency(media) + '/m²' },
                        { l: 'Mínimo', v: formatCurrency(min) + '/m²' },
                        { l: 'Máximo', v: formatCurrency(max) + '/m²' },
                        { l: 'CV%', v: cv.toFixed(1) + '%', ok: cv < 30 }
                      ].map(item => (
                        <div key={item.l}>
                          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{item.l}</p>
                          <p className={`text-sm font-bold mt-0.5 ${item.ok === false ? 'text-red-400' : item.ok === true ? 'text-emerald-400' : 'text-[var(--accent-400)]'}`}>{item.v}</p>
                        </div>
                      ))}
                    </div>
                  )
                })()}
              </div>
            )}
          </div>
        )}
        {/* ===== STEP 5: DOCUMENTOS ===== */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold pb-3" style={{ color: T.text, borderBottom: `1px solid ${T.border}` }}>Documentação</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-lg" style={{ background: 'rgba(72,101,129,0.10)', border: '1px solid rgba(72,101,129,0.20)' }}>
              <p className="text-sm font-semibold col-span-2" style={{ color: T.text }}>Documentos Necessários (NBR 14653)</p>
              {['Matrícula do imóvel (RI Digital / ONR)', 'IPTU vigente', 'Plantas / Croquis', 'Memorial descritivo', 'Fotos do imóvel (mín. 8 fotos)', 'Habite-se (edificações)'].map(d => (
                <div key={d} className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded flex items-center justify-center" style={{ background: 'rgba(107,184,123,0.15)', border: '1px solid rgba(107,184,123,0.30)' }}>
                    <Check size={10} style={{ color: 'var(--success)' }} />
                  </div>
                  <span className="text-xs" style={{ color: T.textMuted }}>{d}</span>
                </div>
              ))}
            </div>
            <label className="block cursor-pointer">
              <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={e => {
                const files = Array.from(e.target.files || [])
                setFormData(prev => ({ ...prev, documentos: [...prev.documentos, ...files] }))
              }} className="hidden" />
              <div className="border-2 border-dashed rounded-[6px] p-8 text-center transition-all hover:opacity-80" style={{ borderColor: T.border }}>
                <Upload size={32} className="mx-auto mb-3" style={{ color: T.textMuted }} />
                <p className="text-sm font-medium" style={{ color: T.text }}>Arraste ou clique para fazer upload</p>
                <p className="text-xs mt-1" style={{ color: T.textMuted }}>PDF, JPG, PNG, DOC — máx. 10MB cada</p>
              </div>
            </label>
            {formData.documentos.length > 0 && (
              <div className="space-y-2">
                {formData.documentos.map((f, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: T.elevated }}>
                    <FileText size={16} style={{ color: T.accent }} />
                    <span className="text-sm flex-1 truncate" style={{ color: T.text }}>{f.name}</span>
                    <span className="text-xs" style={{ color: T.textMuted }}>{(f.size / 1024).toFixed(0)} KB</span>
                    <button type="button" onClick={() => setFormData(prev => ({ ...prev, documentos: prev.documentos.filter((_, j) => j !== i) }))}
                      className="text-red-400 hover:text-red-600">
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {/* Links úteis */}
            <div className="rounded-lg p-4 space-y-2" style={{ border: `1px solid ${T.border}` }}>
              <p className="text-sm font-semibold mb-3" style={{ color: T.text }}>Links de Consulta</p>
              <a href="https://ridigital.org.br/" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 p-2 rounded-lg transition-colors group" style={{ color: T.text }}>
                <Landmark size={16} style={{ color: 'var(--accent-400)' }} />
                <div>
                  <p className="text-sm group-hover:underline" style={{ color: 'var(--accent-400)' }}>RI Digital — Matrícula do Imóvel</p>
                  <p className="text-xs" style={{ color: T.textMuted }}>ridigital.org.br</p>
                </div>
              </a>
              <a href="https://mapa.onr.org.br/" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 p-2 rounded-lg transition-colors group" style={{ color: T.text }}>
                <MapPin size={16} style={{ color: 'var(--success)' }} />
                <div>
                  <p className="text-sm group-hover:underline" style={{ color: 'var(--success)' }}>ONR — Mapa Registral</p>
                  <p className="text-xs" style={{ color: T.textMuted }}>mapa.onr.org.br</p>
                </div>
              </a>
              <a href="https://www.fipe.org.br/pt-br/indices/fipezap/" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 p-2 rounded-lg transition-colors group" style={{ color: T.text }}>
                <BarChart2 size={16} style={{ color: 'var(--platinum-400)' }} />
                <div>
                  <p className="text-sm group-hover:underline" style={{ color: 'var(--platinum-400)' }}>FIPE ZAP — Índice de Preços</p>
                  <p className="text-xs" style={{ color: T.textMuted }}>fipe.org.br</p>
                </div>
              </a>
            </div>
            {/* Motor de Cálculo */}
            {formData.comparaveis.length >= 1 && formData.areaPrivativa && (
              <div className="rounded-lg p-5 space-y-3" style={{ background: "rgba(184,148,58,0.06)", border: "1px solid rgba(184,148,58,0.25)" }}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold flex items-center gap-2" style={{ color: "var(--accent-400)" }}>
                    <Calculator size={14} /> Motor NBR 14653
                  </p>
                  <button
                    type="button"
                    disabled={calcLoading}
                    onClick={async () => {
                      setCalcLoading(true)
                      try {
                        const res = await fetch('/api/avaliacoes/calcular', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            metodo: formData.metodologia === 'comparativo' ? 'comparativo' : 'evolutivo',
                            property: {
                              area: Number(formData.areaPrivativa),
                              quartos: Number(formData.quartos) || 0,
                              vagas: Number(formData.vagas) || 0,
                              padrao: formData.padrao,
                              estado_conservacao: formData.estado_conservacao,
                              andar: Number(formData.andar) || undefined,
                              ano_construcao: Number(formData.anoContrucao) || undefined,
                              tipo: formData.tipo,
                              bairro: formData.bairro,
                              cidade: formData.cidade,
                            },
                            comparaveis: formData.comparaveis.filter(c => c.valorVenda > 0 && c.area > 0),
                            valor_terreno: 200000,
                          }),
                        })
                        const data = await res.json()
                        if (data.success) setCalcResult(data.result)
                      } catch { /* silent */ }
                      finally { setCalcLoading(false) }
                    }}
                    className="flex items-center gap-2 h-8 px-4 rounded-[6px] text-xs font-semibold transition-all hover:opacity-80"
                    style={{ background: 'var(--accent-400)', color: 'var(--text-inverse)' }}
                  >
                    {calcLoading ? <><Loader2 size={12} className="animate-spin" /> Calculando...</> : <><Sparkles size={12} /> Calcular Valor</>}
                  </button>
                </div>
                {calcResult && (
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div className="rounded-lg p-3" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
                      <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: 'var(--text-secondary)' }}>Valor Estimado</p>
                      <p className="text-lg font-bold mt-1" style={{ color: 'var(--accent-400)', fontFamily: 'var(--font-mono)' }}>
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(Number((calcResult as Record<string, unknown>).valor_total ?? 0))}
                      </p>
                    </div>
                    <div className="rounded-lg p-3" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
                      <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: 'var(--text-secondary)' }}>R$/m²</p>
                      <p className="text-lg font-bold mt-1" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(Number((calcResult as Record<string, unknown>).valor_unitario ?? 0))}
                      </p>
                    </div>
                    <div className="rounded-lg p-3" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
                      <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: 'var(--text-secondary)' }}>Intervalo</p>
                      <p className="text-xs font-medium mt-1" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(Number((calcResult as Record<string, unknown>).valor_minimo ?? 0))}
                        {' — '}
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(Number((calcResult as Record<string, unknown>).valor_maximo ?? 0))}
                      </p>
                    </div>
                    <div className="rounded-lg p-3" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
                      <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: 'var(--text-secondary)' }}>Grau Fund. / Prec.</p>
                      <p className="text-sm font-bold mt-1" style={{ color: 'var(--success)' }}>
                        {String((calcResult as Record<string, unknown>).grau_fundamentacao ?? '—')} / {String((calcResult as Record<string, unknown>).grau_precisao ?? '—')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
            {/* Resumo Final */}
            <div className="rounded-lg p-5 space-y-3" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)" }}>
              <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Resumo da Avaliação</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span style={{ color: "var(--text-secondary)" }}>Imóvel:</span><br /><span style={{ color: "var(--text-primary)" }}>{formData.tipo || '—'} • {formData.bairro || '—'}</span></div>
                <div><span style={{ color: "var(--text-secondary)" }}>Área:</span><br /><span style={{ color: "var(--text-primary)" }}>{formData.areaPrivativa ? formData.areaPrivativa + ' m²' : '—'}</span></div>
                <div><span style={{ color: "var(--text-secondary)" }}>Cliente:</span><br /><span style={{ color: "var(--text-primary)" }}>{formData.clienteNome || '—'}</span></div>
                <div><span style={{ color: "var(--text-secondary)" }}>Metodologia:</span><br /><span style={{ color: "var(--text-primary)" }}>{METODOLOGIAS.find(m => m.value === formData.metodologia)?.label?.split(' ').slice(0, 3).join(' ') || '—'}</span></div>
                <div><span style={{ color: "var(--text-secondary)" }}>Comparáveis:</span><br /><span className={formData.comparaveis.length >= 3 ? 'text-emerald-400' : 'text-red-400'}>{formData.comparaveis.length} amostras</span></div>
                <div><span style={{ color: "var(--text-secondary)" }}>Honorários:</span><br /><span className="text-[var(--accent-400)] font-semibold">{formData.valorHonorarios ? formatCurrency(Number(formData.valorHonorarios)) : '—'}</span></div>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button type="button" onClick={handlePrev} disabled={currentStep === 1}
          className="flex items-center gap-2 h-10 px-5 rounded-[6px] text-sm font-medium transition-colors disabled:opacity-40"
          style={{ border: `1px solid ${T.border}`, color: T.text }}>
          <ArrowLeft size={18} /> Anterior
        </button>
        {currentStep < 5 ? (
          <button type="button" onClick={handleNext}
            className="flex items-center gap-2 h-11 px-6 text-white rounded-[6px] text-sm font-semibold transition-all hover:opacity-80"
            style={{ background: 'var(--btn-primary-bg)' }}>
            Próximo <ArrowRight size={18} />
          </button>
        ) : (
          <button type="button" onClick={handleSubmit} disabled={isSubmitting}
            className="flex items-center gap-2 h-11 px-6 text-white rounded-[6px] text-sm font-semibold transition-all disabled:opacity-50 hover:opacity-80"
            style={{ background: 'var(--success)' }}>
            {isSubmitting ? <><Loader2 size={18} className="animate-spin" /> Criando...</> : <><Save size={18} /> Criar Avaliação</>}
          </button>
        )}
      </div>
    </div>
  )
}
