'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, ArrowRight, Building2, MapPin, Ruler, User, Mail, Phone,
  FileText, Upload, Check, Save, Loader2, AlertCircle, DollarSign,
  Calendar, Sparkles, X, Home, BarChart2, Scale, Info, Calculator,
  Landmark, ChevronDown, ChevronRight, Car, Layers, Star, Eye,
  Hash, Clock, CreditCard, Gavel
} from 'lucide-react'

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
    <label className="block text-sm font-medium text-gray-700 mb-1.5">
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  )
}

function InputField({ icon: Icon, error, ...props }: any) {
  return (
    <div className="relative">
      {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />}
      <input
        {...props}
        className={`w-full h-10 ${Icon ? 'pl-9' : 'px-3'} pr-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6] ${error ? 'border-red-300 bg-red-50' : 'border-gray-200'} bg-white`}
      />
    </div>
  )
}

// ============================================================
// PÁGINA PRINCIPAL
// ============================================================

export default function NovaAvaliacaoPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<Step>(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showHonorarios, setShowHonorarios] = useState(false)
  const [valorEstimadoHonorarios, setValorEstimadoHonorarios] = useState(500000)

  const [formData, setFormData] = useState<FormData>({
    endereco: '', complemento: '', bairro: '', cidade: 'Recife', estado: 'PE', cep: '',
    tipo: '', areaPrivativa: '', areaTotal: '', quartos: '', banheiros: '',
    vagas: '', andar: '', totalAndares: '', anoContrucao: '', padrao: 'Normal',
    estado_conservacao: 'Novo', caracteristicas: [],
    clienteNome: '', clienteEmail: '', clienteTelefone: '', clienteCPFCNPJ: '',
    clienteTipo: 'PF', solicitanteInstituicao: '',
    finalidade: '', metodologia: 'comparativo', grauFundamentacao: 'II', grauPrecisao: 'II',
    prazoEntrega: '', valorHonorarios: '', formaPagamento: 'À vista', observacoes: '',
    comparaveis: [
      {
        id: '1', endereco: '', tipo: 'Apartamento', area: 0, quartos: 0, banheiros: 0,
        vagas: 0, padrao: 'Normal', estado: 'Novo', valorVenda: 0,
        fonteDado: 'ZAP Imóveis', dataColeta: new Date().toISOString().split('T')[0], distanciaKm: 0
      }
    ],
    documentos: [],
  })

  const handleChange = (field: keyof FormData, value: any) => {
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

  const updateComparavel = (id: string, field: keyof Comparable, value: any) => {
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
      console.error('Erro ao salvar avaliação:', error)
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
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="w-9 h-9 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center justify-center transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Nova Avaliação Técnica</h1>
          <p className="text-xs text-gray-500 mt-0.5">Laudo NBR 14653 • Etapa {currentStep}/5</p>
        </div>
        <div className="ml-auto flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg">
          <Sparkles size={14} className="text-amber-600" />
          <span className="text-xs font-medium text-amber-700">Motor IA Ativo</span>
        </div>
      </div>

      {/* Steps */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <div className="flex items-center">
          {STEPS.map((step, i) => {
            const Icon = step.icon
            const done = currentStep > step.n
            const active = currentStep === step.n
            return (
              <div key={step.n} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${done ? 'bg-emerald-500 text-white' : active ? 'bg-[#1A1A2E] text-white' : 'bg-gray-100 text-gray-400'}`}>
                    {done ? <Check size={16} /> : <Icon size={16} />}
                  </div>
                  <span className={`text-xs mt-1 hidden sm:block ${active ? 'text-[#3B82F6] font-medium' : done ? 'text-emerald-600' : 'text-gray-400'}`}>
                    {step.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`h-0.5 flex-1 mx-1 rounded-full ${currentStep > step.n ? 'bg-emerald-400' : 'bg-gray-200'}`} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 sm:p-8">

        {/* ===== STEP 1: IMÓVEL ===== */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-gray-900 pb-3 border-b border-gray-100">Dados do Imóvel</h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <Label required>Endereço</Label>
                <InputField icon={MapPin} value={formData.endereco} onChange={(e: any) => handleChange('endereco', e.target.value)} placeholder="Rua, número" error={errors.endereco} />
                <FieldError message={errors.endereco} />
              </div>
              <div>
                <Label>Complemento</Label>
                <InputField value={formData.complemento} onChange={(e: any) => handleChange('complemento', e.target.value)} placeholder="Apto, bloco..." />
              </div>
              <div>
                <Label required>Bairro</Label>
                <InputField value={formData.bairro} onChange={(e: any) => handleChange('bairro', e.target.value)} placeholder="Boa Viagem" error={errors.bairro} />
                <FieldError message={errors.bairro} />
              </div>
              <div>
                <Label>Cidade</Label>
                <InputField value={formData.cidade} onChange={(e: any) => handleChange('cidade', e.target.value)} placeholder="Recife" />
              </div>
              <div>
                <Label>CEP</Label>
                <InputField value={formData.cep} onChange={(e: any) => handleChange('cep', e.target.value)} placeholder="50000-000" />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="col-span-2">
                <Label required>Tipo de Imóvel</Label>
                <select value={formData.tipo} onChange={e => handleChange('tipo', e.target.value)}
                  className={`w-full h-10 px-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6] bg-white ${errors.tipo ? 'border-red-300' : 'border-gray-200'}`}>
                  <option value="">Selecione...</option>
                  {TIPOS_IMOVEL.map(t => <option key={t}>{t}</option>)}
                </select>
                <FieldError message={errors.tipo} />
              </div>
              <div>
                <Label required>Área Privativa (m²)</Label>
                <InputField icon={Ruler} type="number" value={formData.areaPrivativa} onChange={(e: any) => handleChange('areaPrivativa', e.target.value)} placeholder="95" error={errors.areaPrivativa} />
                <FieldError message={errors.areaPrivativa} />
              </div>
              <div>
                <Label>Área Total (m²)</Label>
                <InputField type="number" value={formData.areaTotal} onChange={(e: any) => handleChange('areaTotal', e.target.value)} placeholder="110" />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              <div>
                <Label>Quartos</Label>
                <InputField type="number" value={formData.quartos} onChange={(e: any) => handleChange('quartos', e.target.value)} placeholder="3" />
              </div>
              <div>
                <Label>Banheiros</Label>
                <InputField type="number" value={formData.banheiros} onChange={(e: any) => handleChange('banheiros', e.target.value)} placeholder="2" />
              </div>
              <div>
                <Label>Vagas</Label>
                <InputField icon={Car} type="number" value={formData.vagas} onChange={(e: any) => handleChange('vagas', e.target.value)} placeholder="2" />
              </div>
              <div>
                <Label>Andar</Label>
                <InputField type="number" value={formData.andar} onChange={(e: any) => handleChange('andar', e.target.value)} placeholder="8" />
              </div>
              <div>
                <Label>Ano Constr.</Label>
                <InputField type="number" value={formData.anoContrucao} onChange={(e: any) => handleChange('anoContrucao', e.target.value)} placeholder="2018" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Padrão Construtivo</Label>
                <select value={formData.padrao} onChange={e => handleChange('padrao', e.target.value)}
                  className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6] bg-white">
                  {PADROES.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <Label>Estado de Conservação</Label>
                <select value={formData.estado_conservacao} onChange={e => handleChange('estado_conservacao', e.target.value)}
                  className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6] bg-white">
                  {ESTADOS_CONSERVACAO.map(e => <option key={e}>{e}</option>)}
                </select>
              </div>
            </div>

            <div>
              <Label>Características (selecione todas que se aplicam)</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {CARACTERISTICAS.map(c => (
                  <button key={c} type="button" onClick={() => toggleCaracteristica(c)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${formData.caracteristicas.includes(c) ? 'bg-[#1A1A2E] text-white border-[#3B82F6]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#3B82F6]'}`}>
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
            <h2 className="text-lg font-bold text-gray-900 pb-3 border-b border-gray-100">Dados do Solicitante</h2>

            <div className="flex gap-3">
              {(['PF', 'PJ'] as const).map(t => (
                <button key={t} type="button" onClick={() => handleChange('clienteTipo', t)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${formData.clienteTipo === t ? 'bg-[#1A1A2E] text-white border-[#3B82F6]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#3B82F6]'}`}>
                  {t === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Label required>{formData.clienteTipo === 'PF' ? 'Nome Completo' : 'Razão Social'}</Label>
                <InputField icon={User} value={formData.clienteNome} onChange={(e: any) => handleChange('clienteNome', e.target.value)} error={errors.clienteNome} />
                <FieldError message={errors.clienteNome} />
              </div>
              <div>
                <Label required>Email</Label>
                <InputField icon={Mail} type="email" value={formData.clienteEmail} onChange={(e: any) => handleChange('clienteEmail', e.target.value)} error={errors.clienteEmail} />
                <FieldError message={errors.clienteEmail} />
              </div>
              <div>
                <Label>Telefone</Label>
                <InputField icon={Phone} value={formData.clienteTelefone} onChange={(e: any) => handleChange('clienteTelefone', e.target.value)} placeholder="(81) 99999-9999" />
              </div>
              <div>
                <Label>{formData.clienteTipo === 'PF' ? 'CPF' : 'CNPJ'}</Label>
                <InputField icon={Hash} value={formData.clienteCPFCNPJ} onChange={(e: any) => handleChange('clienteCPFCNPJ', e.target.value)} placeholder={formData.clienteTipo === 'PF' ? '000.000.000-00' : '00.000.000/0001-00'} />
              </div>
              <div>
                <Label>Instituição / Banco (se financiamento)</Label>
                <InputField icon={Landmark} value={formData.solicitanteInstituicao} onChange={(e: any) => handleChange('solicitanteInstituicao', e.target.value)} placeholder="CEF, Bradesco, Particular..." />
              </div>
            </div>

            {/* Info Box */}
            <div className="flex gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <Info size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-1">Responsabilidade do Avaliador</p>
                <p className="text-xs text-blue-600">O laudo de avaliação é de responsabilidade exclusiva do profissional habilitado (CNAI/CRECI). Os dados do solicitante são arquivados para rastreabilidade conforme NBR 14653-1.</p>
              </div>
            </div>
          </div>
        )}

        {/* ===== STEP 3: AVALIAÇÃO + HONORÁRIOS ===== */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-gray-900 pb-3 border-b border-gray-100">Parâmetros da Avaliação</h2>

            {/* Finalidade */}
            <div>
              <Label required>Finalidade da Avaliação</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                {FINALIDADES.map(f => (
                  <button key={f.value} type="button" onClick={() => handleChange('finalidade', f.value)}
                    className={`flex items-start gap-3 p-3 border rounded-xl text-left transition-all ${formData.finalidade === f.value ? 'border-[#3B82F6] bg-amber-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <div className={`w-4 h-4 rounded-full border-2 mt-0.5 flex-shrink-0 ${formData.finalidade === f.value ? 'border-[#3B82F6] bg-[#1A1A2E]' : 'border-gray-300'}`} />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{f.label}</p>
                      {f.subtitulo && <p className="text-xs text-gray-500">{f.subtitulo}</p>}
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
                      className={`w-full flex items-center gap-4 p-4 border rounded-xl text-left transition-all ${formData.metodologia === m.value ? 'border-[#3B82F6] bg-amber-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${formData.metodologia === m.value ? 'bg-[#1A1A2E] text-white' : 'bg-gray-100 text-gray-500'}`}>
                        <Icon size={20} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-gray-900">{m.label}</p>
                          <span className="text-xs text-gray-400 font-mono">{m.norma}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{m.descricao}</p>
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
                  className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6] bg-white">
                  {GRAUS_FUNDAMENTACAO.map(g => <option key={g}>Grau {g}</option>)}
                </select>
              </div>
              <div>
                <Label>Grau de Precisão</Label>
                <select value={formData.grauPrecisao} onChange={e => handleChange('grauPrecisao', e.target.value)}
                  className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6] bg-white">
                  {GRAUS_PRECISAO.map(g => <option key={g}>Grau {g}</option>)}
                </select>
              </div>
              <div>
                <Label>Prazo de Entrega</Label>
                <InputField icon={Calendar} type="date" value={formData.prazoEntrega} onChange={(e: any) => handleChange('prazoEntrega', e.target.value)} />
              </div>
            </div>

            {/* Calculadora de Honorários */}
            <div className="border border-amber-200 rounded-xl overflow-hidden">
              <button type="button" onClick={() => setShowHonorarios(!showHonorarios)}
                className="w-full flex items-center justify-between p-4 bg-amber-50 hover:bg-amber-100 transition-colors">
                <div className="flex items-center gap-3">
                  <Calculator size={18} className="text-amber-600" />
                  <span className="text-sm font-semibold text-amber-800">Calculadora de Honorários (IBAPE)</span>
                </div>
                {showHonorarios ? <ChevronDown size={18} className="text-amber-600" /> : <ChevronRight size={18} className="text-amber-600" />}
              </button>

              {showHonorarios && (
                <div className="p-4 space-y-4">
                  <div>
                    <Label>Valor Estimado do Imóvel (para cálculo)</Label>
                    <InputField icon={DollarSign} type="number" value={valorEstimadoHonorarios}
                      onChange={(e: any) => setValorEstimadoHonorarios(Number(e.target.value))} placeholder="500000" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { label: 'Mínimo', value: honorarios.minimo, color: 'text-gray-700' },
                      { label: 'Recomendado', value: honorarios.recomendado, color: 'text-[#3B82F6] font-bold' },
                      { label: 'Máximo', value: honorarios.maximo, color: 'text-gray-700' },
                    ].map(item => (
                      <div key={item.label} className="text-center p-3 bg-white rounded-lg border border-gray-100">
                        <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                        <p className={`text-base ${item.color}`}>{formatCurrency(item.value)}</p>
                      </div>
                    ))}
                  </div>

                  <p className="text-xs text-gray-500 italic">{honorarios.justificativa}</p>

                  <button type="button" onClick={() => handleChange('valorHonorarios', honorarios.recomendado.toString())}
                    className="w-full py-2 bg-[#1A1A2E] text-white rounded-lg text-sm font-medium hover:bg-[#16162A] transition-colors">
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
                  onChange={(e: any) => handleChange('valorHonorarios', e.target.value)} placeholder="1500" />
              </div>
              <div>
                <Label>Forma de Pagamento</Label>
                <select value={formData.formaPagamento} onChange={e => handleChange('formaPagamento', e.target.value)}
                  className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6] bg-white">
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
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6] resize-none" />
            </div>
          </div>
        )}

        {/* ===== STEP 4: COMPARÁVEIS ===== */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Dados de Mercado — Comparáveis</h2>
                <p className="text-xs text-gray-500 mt-0.5">NBR 14653-2 exige mín. 3 amostras (Grau II) ou 5 amostras (Grau III)</p>
              </div>
              <button type="button" onClick={addComparavel}
                className="flex items-center gap-2 px-4 py-2 bg-[#1A1A2E] text-white rounded-lg text-sm font-medium hover:bg-[#16162A] transition-colors">
                + Adicionar
              </button>
            </div>

            {/* Status de amostras */}
            <div className={`flex items-center gap-3 p-3 rounded-xl border ${formData.comparaveis.length >= 5 ? 'bg-emerald-50 border-emerald-200' : formData.comparaveis.length >= 3 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${formData.comparaveis.length >= 5 ? 'bg-emerald-500 text-white' : formData.comparaveis.length >= 3 ? 'bg-amber-500 text-white' : 'bg-red-500 text-white'}`}>
                {formData.comparaveis.length}
              </div>
              <div>
                <p className="text-sm font-medium">
                  {formData.comparaveis.length >= 5 ? '✓ Grau III — Suficiente para alta precisão' :
                    formData.comparaveis.length >= 3 ? '⚠ Grau II — Mínimo atingido' :
                      `✗ Insuficiente — adicione ${3 - formData.comparaveis.length} amostra(s)`}
                </p>
                <p className="text-xs text-gray-500">Amostras coletadas</p>
              </div>
            </div>

            {formData.comparaveis.map((comp, idx) => (
              <div key={comp.id} className="border border-gray-100 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-700">Amostra #{idx + 1}</span>
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
                      className="w-full h-9 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6]" />
                  </div>
                  <div>
                    <Label>Área (m²)</Label>
                    <input type="number" value={comp.area || ''} onChange={e => updateComparavel(comp.id, 'area', Number(e.target.value))}
                      placeholder="90"
                      className="w-full h-9 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6]" />
                  </div>
                  <div>
                    <Label>Valor de Oferta (R$)</Label>
                    <input type="number" value={comp.valorVenda || ''} onChange={e => updateComparavel(comp.id, 'valorVenda', Number(e.target.value))}
                      placeholder="550000"
                      className="w-full h-9 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6]" />
                  </div>
                  <div>
                    <Label>Fonte do Dado</Label>
                    <select value={comp.fonteDado} onChange={e => updateComparavel(comp.id, 'fonteDado', e.target.value)}
                      className="w-full h-9 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6] bg-white">
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
                      className="w-full h-9 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6]" />
                  </div>
                </div>

                {/* Valor m² calculado */}
                {comp.area > 0 && comp.valorVenda > 0 && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                    <BarChart2 size={14} className="text-[#3B82F6]" />
                    <span className="text-xs text-gray-600">
                      Valor unitário: <strong className="text-gray-900">{formatCurrency(comp.valorVenda / comp.area)}/m²</strong>
                    </span>
                  </div>
                )}
              </div>
            ))}

            {/* Resumo estatístico */}
            {formData.comparaveis.length >= 3 && formData.comparaveis.every(c => c.area > 0 && c.valorVenda > 0) && (
              <div className="bg-gray-900 rounded-xl p-4 text-white">
                <p className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wider">Análise Estatística da Amostra</p>
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
                          <p className="text-xs text-gray-500">{item.l}</p>
                          <p className={`text-sm font-bold mt-0.5 ${item.ok === false ? 'text-red-400' : item.ok === true ? 'text-emerald-400' : 'text-[#3B82F6]'}`}>{item.v}</p>
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
            <h2 className="text-lg font-bold text-gray-900 pb-3 border-b border-gray-100">Documentação</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <p className="text-sm font-semibold text-blue-800 col-span-2">Documentos Necessários (NBR 14653)</p>
              {['Matrícula do imóvel (RI Digital / ONR)', 'IPTU vigente', 'Plantas / Croquis', 'Memorial descritivo', 'Fotos do imóvel (mín. 8 fotos)', 'Habite-se (edificações)'].map(d => (
                <div key={d} className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded border border-blue-300 bg-white flex items-center justify-center">
                    <Check size={10} className="text-blue-500" />
                  </div>
                  <span className="text-xs text-blue-700">{d}</span>
                </div>
              ))}
            </div>

            <label className="block cursor-pointer">
              <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={e => {
                const files = Array.from(e.target.files || [])
                setFormData(prev => ({ ...prev, documentos: [...prev.documentos, ...files] }))
              }} className="hidden" />
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-[#3B82F6] hover:bg-amber-50 transition-all">
                <Upload size={32} className="mx-auto text-gray-400 mb-3" />
                <p className="text-sm font-medium text-gray-900">Arraste ou clique para fazer upload</p>
                <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG, DOC — máx. 10MB cada</p>
              </div>
            </label>

            {formData.documentos.length > 0 && (
              <div className="space-y-2">
                {formData.documentos.map((f, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <FileText size={16} className="text-[#3B82F6]" />
                    <span className="text-sm text-gray-900 flex-1 truncate">{f.name}</span>
                    <span className="text-xs text-gray-500">{(f.size / 1024).toFixed(0)} KB</span>
                    <button type="button" onClick={() => setFormData(prev => ({ ...prev, documentos: prev.documentos.filter((_, j) => j !== i) }))}
                      className="text-red-400 hover:text-red-600">
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Links úteis */}
            <div className="border border-gray-200 rounded-xl p-4 space-y-2">
              <p className="text-sm font-semibold text-gray-700 mb-3">Links de Consulta</p>
              <a href="https://ridigital.org.br/" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg transition-colors group">
                <Landmark size={16} className="text-blue-600" />
                <div>
                  <p className="text-sm text-blue-600 group-hover:underline">RI Digital — Matrícula do Imóvel</p>
                  <p className="text-xs text-gray-500">ridigital.org.br</p>
                </div>
              </a>
              <a href="https://mapa.onr.org.br/" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg transition-colors group">
                <MapPin size={16} className="text-green-600" />
                <div>
                  <p className="text-sm text-green-600 group-hover:underline">ONR — Mapa Registral</p>
                  <p className="text-xs text-gray-500">mapa.onr.org.br</p>
                </div>
              </a>
              <a href="https://www.fipe.org.br/pt-br/indices/fipezap/" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg transition-colors group">
                <BarChart2 size={16} className="text-purple-600" />
                <div>
                  <p className="text-sm text-purple-600 group-hover:underline">FIPE ZAP — Índice de Preços</p>
                  <p className="text-xs text-gray-500">fipe.org.br</p>
                </div>
              </a>
            </div>

            {/* Resumo Final */}
            <div className="bg-gray-900 rounded-xl p-5 text-white space-y-3">
              <p className="text-sm font-semibold text-gray-300">Resumo da Avaliação</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-gray-500">Imóvel:</span><br /><span className="text-white">{formData.tipo || '—'} • {formData.bairro || '—'}</span></div>
                <div><span className="text-gray-500">Área:</span><br /><span className="text-white">{formData.areaPrivativa ? formData.areaPrivativa + ' m²' : '—'}</span></div>
                <div><span className="text-gray-500">Cliente:</span><br /><span className="text-white">{formData.clienteNome || '—'}</span></div>
                <div><span className="text-gray-500">Metodologia:</span><br /><span className="text-white">{METODOLOGIAS.find(m => m.value === formData.metodologia)?.label?.split(' ').slice(0, 3).join(' ') || '—'}</span></div>
                <div><span className="text-gray-500">Comparáveis:</span><br /><span className={formData.comparaveis.length >= 3 ? 'text-emerald-400' : 'text-red-400'}>{formData.comparaveis.length} amostras</span></div>
                <div><span className="text-gray-500">Honorários:</span><br /><span className="text-[#3B82F6] font-semibold">{formData.valorHonorarios ? formatCurrency(Number(formData.valorHonorarios)) : '—'}</span></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button type="button" onClick={handlePrev} disabled={currentStep === 1}
          className="flex items-center gap-2 h-10 px-5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-40">
          <ArrowLeft size={18} /> Anterior
        </button>

        {currentStep < 5 ? (
          <button type="button" onClick={handleNext}
            className="flex items-center gap-2 h-10 px-6 bg-[#1A1A2E] text-white rounded-xl text-sm font-semibold hover:bg-[#16162A] transition-colors">
            Próximo <ArrowRight size={18} />
          </button>
        ) : (
          <button type="button" onClick={handleSubmit} disabled={isSubmitting}
            className="flex items-center gap-2 h-10 px-6 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50">
            {isSubmitting ? <><Loader2 size={18} className="animate-spin" /> Criando...</> : <><Save size={18} /> Criar Avaliação</>}
          </button>
        )}
      </div>
    </div>
  )
}
