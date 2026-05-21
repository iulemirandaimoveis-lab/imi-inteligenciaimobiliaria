'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { T, inputStyle, cardStyle } from '@/app/(backoffice)/lib/theme'
import { PageIntelHeader } from '@/app/(backoffice)/components/ui/PageIntelHeader'
import { toast } from 'sonner'
import { useIsMobile } from '@/hooks/use-is-mobile'
import {
  ArrowLeft, ArrowRight, Building2, MapPin, Search, Plus, Trash2,
  FileText, Save, Loader2, Eye, Check, BarChart2, Download, Scale,
  ChevronDown, Camera, X, Image as ImageIcon, User, Phone, Mail,
  Home, Star, TrendingUp, TrendingDown, Minus, Key, Shield,
  AlertTriangle, Landmark, ShoppingBag, Briefcase, Factory, HelpCircle,
  FolderOpen, Brain,
} from 'lucide-react'
import { MethodRecommender } from '@/components/backoffice/avaliacoes/MethodRecommender'
import type { MetodoId } from '@/features/avaliacoes/services/method-recommender'

// ── Types ──────────────────────────────────────────────────
type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7

interface PhotoUpload {
  id: string; file: File; preview: string; caption: string; url?: string; uploading?: boolean
}

interface ComparableEntry {
  id?: string; address: string; neighborhood: string; city: string; state: string
  area_sqm: string; bedrooms: string; bathrooms: string; parking_spots: string
  asking_price: string; source: string; source_url: string
  offer_factor: number; area_factor: number; location_factor: number; age_factor: number
  floor_factor: number; parking_factor: number; extra_factor: number
  price_per_sqm?: number; homogenized_price_per_sqm?: number
}

interface CalcResult {
  estimated_value: number
  average_price_per_sqm?: number
  median_price_per_sqm?: number
  std_deviation?: number
  coefficient_of_variation?: number
  confidence_grade?: 'I' | 'II' | 'III'
  label?: string
  details?: Record<string, number>
}

interface Development {
  id: string; name: string; address?: string; location?: string; neighborhood?: string
}

// ── Option data ────────────────────────────────────────────
type LucideIcon = React.FC<{ size?: number; style?: React.CSSProperties }>

interface FinalidadeOpt {
  id: string; label: string; desc: string; valor: string; Icon: LucideIcon
}
interface TipoBemOpt {
  id: string; label: string; desc: string; Icon: LucideIcon
}

const FINALIDADE_OPTIONS: FinalidadeOpt[] = [
  { id: 'venda',         label: 'Vender imóvel',       desc: 'Preço justo de mercado para venda',       valor: 'Venda',           Icon: TrendingUp },
  { id: 'locacao',       label: 'Alugar imóvel',        desc: 'Valor mensal de locação',                 valor: 'Locação',         Icon: Key },
  { id: 'captacao',      label: 'Captar imóvel',        desc: 'Avaliar para carteira de imóveis',        valor: 'Venda',           Icon: Search },
  { id: 'ptam',          label: 'PTAM',                 desc: 'Parecer técnico formal NBR 14653',        valor: 'Venda',           Icon: FileText },
  { id: 'judicial',      label: 'Judicial',             desc: 'Perícia para processos judiciais',        valor: 'Judicial',        Icon: Scale },
  { id: 'inventario',    label: 'Inventário',           desc: 'Partilha de bens e herança',              valor: 'Inventário',      Icon: FolderOpen },
  { id: 'garantia',      label: 'Garantia',             desc: 'Crédito imobiliário e financiamento',     valor: 'Garantia',        Icon: Shield },
  { id: 'liquidacao',    label: 'Liquidação forçada',   desc: 'Venda compulsória com desconto',          valor: 'Garantia',        Icon: AlertTriangle },
  { id: 'desapropriacao',label: 'Desapropriação',       desc: 'Indenização por interesse público',       valor: 'Desapropriação',  Icon: Landmark },
  { id: 'servidao',      label: 'Servidão',             desc: 'Passagem ou direito real de uso',         valor: 'Servidão',        Icon: MapPin },
  { id: 'incorporacao',  label: 'Incorporação',         desc: 'Viabilidade de empreendimento imob.',     valor: 'Incorporação',    Icon: Building2 },
  { id: 'permuta',       label: 'Permuta',              desc: 'Troca de imóveis equivalentes',           valor: 'Permuta',         Icon: ArrowRight },
  { id: 'fundo_comercio',label: 'Fundo de comércio',    desc: 'Goodwill e valor de ponto comercial',     valor: 'Locação',         Icon: ShoppingBag },
  { id: 'valuation',     label: 'Valuation/Empresa',    desc: 'Avaliação de negócio em operação',        valor: 'Venda',           Icon: BarChart2 },
  { id: 'outro',         label: 'Outro',                desc: 'Finalidade específica não listada',       valor: 'Venda',           Icon: HelpCircle },
]

const TIPO_BEM_OPTIONS: TipoBemOpt[] = [
  { id: 'Apartamento',         label: 'Apartamento',         desc: 'Unidade em condomínio vertical',        Icon: Building2 },
  { id: 'Casa',                label: 'Casa',                desc: 'Residência horizontal',                 Icon: Home },
  { id: 'Terreno/Lote',        label: 'Terreno urbano',      desc: 'Lote em área urbana consolidada',       Icon: MapPin },
  { id: 'Gleba',               label: 'Gleba',               desc: 'Terreno sem parcelamento',              Icon: MapPin },
  { id: 'Imóvel Rural',        label: 'Imóvel rural',        desc: 'Fazenda, sítio ou chácara',             Icon: MapPin },
  { id: 'Sala Comercial',      label: 'Sala comercial',      desc: 'Escritório ou sala corporativa',        Icon: Briefcase },
  { id: 'Loja',                label: 'Loja',                desc: 'Loja de rua ou galeria',                Icon: ShoppingBag },
  { id: 'Galpão/Armazém',      label: 'Galpão / Industrial', desc: 'Galpão, fábrica ou armazém',            Icon: Factory },
  { id: 'Shopping/Loja em Mall',label: 'Loja em shopping',  desc: 'Unidade em centro comercial',           Icon: ShoppingBag },
  { id: 'Posto de Combustível', label: 'Posto combustível',  desc: 'Posto e instalações',                   Icon: Briefcase },
  { id: 'Hotel/Pousada',        label: 'Hotel / Pousada',    desc: 'Imóvel de uso hoteleiro',               Icon: Building2 },
  { id: 'Cobertura',            label: 'Cobertura',          desc: 'Cobertura com área descoberta',         Icon: Building2 },
  { id: 'Imóvel inacabado',     label: 'Inacabado',          desc: 'Obra em andamento',                     Icon: Building2 },
  { id: 'Imóvel mobiliado',     label: 'Mobiliado',          desc: 'Com móveis e benfeitorias',             Icon: Home },
  { id: 'Empresa',              label: 'Empresa / Carteira', desc: 'Negócio ou carteira de locações',       Icon: BarChart2 },
  { id: 'Outro',                label: 'Outro',              desc: 'Bem específico não listado',            Icon: HelpCircle },
]

const STEPS: { num: Step; label: string; Icon: LucideIcon }[] = [
  { num: 1, label: 'Finalidade', Icon: FileText },
  { num: 2, label: 'Tipo de Bem', Icon: Building2 },
  { num: 3, label: 'Método', Icon: Brain },
  { num: 4, label: 'Imóvel', Icon: Home },
  { num: 5, label: 'Dados', Icon: BarChart2 },
  { num: 6, label: 'Resultado', Icon: TrendingUp },
  { num: 7, label: 'Gerar', Icon: Download },
]

const STANDARDS = ['Baixo', 'Normal', 'Alto', 'Luxo']
const CONSERVATION = ['Novo', 'Entre Novo e Regular', 'Regular', 'Entre Regular e Reparos Simples', 'Reparos Simples', 'Reparos Importantes']
const SOURCES = ['OLX', 'ZAP Imóveis', 'Viva Real', 'Imovelweb', 'Quinto Andar', 'Imobiliária Local', 'Prefeitura', 'Outro']

const emptyComparable = (): ComparableEntry => ({
  address: '', neighborhood: '', city: '', state: '',
  area_sqm: '', bedrooms: '', bathrooms: '', parking_spots: '',
  asking_price: '', source: '', source_url: '',
  offer_factor: 0.90, area_factor: 1.0, location_factor: 1.0,
  age_factor: 1.0, floor_factor: 1.0, parking_factor: 1.0, extra_factor: 1.0,
})

const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtBRL = (v: number) => 'R$ ' + fmt(v)
const computePricePerSqm = (c: ComparableEntry) => {
  const area = parseFloat(c.area_sqm) || 0
  const price = parseFloat(c.asking_price) || 0
  return area > 0 ? price / area : 0
}
const computeHomogenized = (c: ComparableEntry) =>
  computePricePerSqm(c) * c.offer_factor * c.area_factor * c.location_factor *
  c.age_factor * c.floor_factor * c.parking_factor * c.extra_factor

// ── Component ──────────────────────────────────────────────
export default function NovaPTAMPage() {
  const mobile = useIsMobile()
  const [step, setStep] = useState<Step>(1)
  const [saving, setSaving] = useState(false)
  const [isCalculating, setIsCalculating] = useState(false)
  const [avaliacaoId, setAvaliacaoId] = useState<string | null>(null)

  // Step 1 – Finalidade
  const [finalidadeId, setFinalidadeId] = useState('')
  const [finalidade, setFinalidade] = useState('Venda') // recommender-compatible value

  // Step 2 – Tipo de Bem
  const [tipoImovel, setTipoImovel] = useState('')

  // Step 3 – Método (auto-set by MethodRecommender)
  const [metodoId, setMetodoId] = useState<MetodoId | null>(null)
  const [metodoNome, setMetodoNome] = useState('')

  // Step 4 – Dados do Imóvel
  const [developments, setDevelopments] = useState<Development[]>([])
  const [devSearch, setDevSearch] = useState('')
  const [selectedDev, setSelectedDev] = useState<Development | null>(null)
  const [showDevDropdown, setShowDevDropdown] = useState(false)
  const [useManualAddress, setUseManualAddress] = useState(false)
  const [manualAddress, setManualAddress] = useState('')
  const [bairro, setBairro] = useState('')
  const [cidade, setCidade] = useState('Recife')
  const [estado, setEstado] = useState('PE')
  const [area, setArea] = useState('')
  const [quartos, setQuartos] = useState('')
  const [banheiros, setBanheiros] = useState('')
  const [vagas, setVagas] = useState('')
  const [andar, setAndar] = useState('')
  const [anoConst, setAnoConst] = useState('')
  const [padrao, setPadrao] = useState('Normal')
  const [conservacao, setConservacao] = useState('Regular')
  const [photos, setPhotos] = useState<PhotoUpload[]>([])
  const photoInputRef = useRef<HTMLInputElement>(null)
  // Client info
  const [clienteNome, setClienteNome] = useState('')
  const [clienteEmail, setClienteEmail] = useState('')
  const [clienteTelefone, setClienteTelefone] = useState('')
  const [honorarios, setHonorarios] = useState('')
  const [observacoes, setObservacoes] = useState('')

  // Step 5 – Dados Econômicos (method-specific)
  // Comparativo
  const [comparables, setComparables] = useState<ComparableEntry[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [newComp, setNewComp] = useState<ComparableEntry>(emptyComparable())
  // Evolutivo
  const [valorTerreno, setValorTerreno] = useState('')
  const [cubM2, setCubM2] = useState('2450')
  const [bdiForca, setBdiForca] = useState('25')
  // Involutivo
  const [vgv, setVgv] = useState('')
  const [custosPct, setCustosPct] = useState('55')
  const [lucroPct, setLucroPct] = useState('15')
  const [prazoMeses, setPrazoMeses] = useState('24')
  // Renda / Cap Rate
  const [rendaMensal, setRendaMensal] = useState('')
  const [taxaCapitalizacao, setTaxaCapitalizacao] = useState('8')
  const [vacanciaPct, setVacanciaPct] = useState('5')
  const [noiMensal, setNoiMensal] = useState('')
  const [taxaCapRate, setTaxaCapRate] = useState('8')
  // FCD
  const [fluxoAnual, setFluxoAnual] = useState<string[]>(Array(5).fill(''))
  const [taxaDesconto, setTaxaDesconto] = useState('12')
  const [valorResidual, setValorResidual] = useState('0')
  // Liquidação Forçada
  const [valorMercadoLF, setValorMercadoLF] = useState('')
  const [liquidez, setLiquidez] = useState<'alta' | 'media' | 'baixa'>('media')
  // BDI
  const [custoDireto, setCustoDireto] = useState('')
  const [bdiPct, setBdiPct] = useState('25')
  // Fundo de Comércio
  const [faturamentoMensal, setFaturamentoMensal] = useState('')
  const [mesesFaturamento, setMesesFaturamento] = useState('24')

  // Step 6 – Resultado
  const [calcResult, setCalcResult] = useState<CalcResult | null>(null)
  const [cenarios, setCenarios] = useState<{
    conservador: { valor: number; variacao_pct: number; descricao: string }
    realista:    { valor: number; variacao_pct: number; descricao: string }
    agressivo:   { valor: number; variacao_pct: number; descricao: string }
  } | null>(null)

  // ── Effects ────────────────────────────────────────────
  useEffect(() => {
    const supabase = createClient()
    supabase.from('developments').select('id, name, address, location, neighborhood')
      .order('name').limit(300)
      .then(({ data }) => { if (data) setDevelopments(data as Development[]) })
  }, [])

  const filteredDevs = developments.filter(d =>
    d.name.toLowerCase().includes(devSearch.toLowerCase())
  ).slice(0, 20)

  // ── Navigation ─────────────────────────────────────────
  const canNext = useCallback((): boolean => {
    switch (step) {
      case 1: return !!finalidadeId
      case 2: return !!tipoImovel
      case 3: return !!metodoId
      case 4: return !!(useManualAddress ? manualAddress.trim() : selectedDev) && parseFloat(area) > 0
      case 5: {
        const m = metodoId || 'comparativo'
        if (m === 'comparativo') return comparables.length >= 3
        if (m === 'evolutivo') return parseFloat(valorTerreno) > 0
        if (m === 'involutivo') return parseFloat(vgv) > 0
        if (m === 'renda') return parseFloat(rendaMensal) > 0 && parseFloat(taxaCapitalizacao) > 0
        if (m === 'cap_rate') return parseFloat(noiMensal) > 0 && parseFloat(taxaCapRate) > 0
        if (m === 'fcd') return fluxoAnual.some(v => parseFloat(v) > 0) && parseFloat(taxaDesconto) > 0
        if (m === 'liquidacao_forcada') return parseFloat(valorMercadoLF) > 0
        if (m === 'bdi') return parseFloat(custoDireto) > 0
        if (m === 'fundo_comercio' || m === 'ponto_comercial') return parseFloat(faturamentoMensal) > 0
        return true
      }
      case 6: return !!calcResult
      default: return true
    }
  }, [step, finalidadeId, tipoImovel, metodoId, useManualAddress, manualAddress, selectedDev, area,
      comparables, valorTerreno, vgv, rendaMensal, taxaCapitalizacao, noiMensal, taxaCapRate,
      fluxoAnual, taxaDesconto, valorMercadoLF, custoDireto, faturamentoMensal, calcResult])

  const goNext = () => { if (step < 7 && canNext()) setStep((step + 1) as Step) }
  const goPrev = () => { if (step > 1) setStep((step - 1) as Step) }

  // ── Comparable operations ──────────────────────────────
  const addComparable = () => {
    if (!newComp.address || !newComp.area_sqm || !newComp.asking_price) {
      toast.error('Preencha endereço, área e preço'); return
    }
    setComparables(prev => [...prev, {
      ...newComp,
      price_per_sqm: computePricePerSqm(newComp),
      homogenized_price_per_sqm: computeHomogenized(newComp),
    }])
    setNewComp(emptyComparable()); setShowAddForm(false)
    toast.success('Comparando adicionado')
  }
  const removeComparable = (idx: number) => setComparables(prev => prev.filter((_, i) => i !== idx))
  const updateFactor = (idx: number, field: keyof ComparableEntry, val: number) => {
    setComparables(prev => prev.map((c, i) => {
      if (i !== idx) return c
      const updated = { ...c, [field]: val }
      updated.homogenized_price_per_sqm = computeHomogenized(updated)
      return updated
    }))
  }

  // ── Calculate ──────────────────────────────────────────
  const doCalculate = useCallback(async () => {
    setIsCalculating(true)
    try {
      const m = metodoId || 'comparativo'

      if (m === 'comparativo') {
        const values = comparables.map(computeHomogenized).filter(v => v > 0)
        if (values.length === 0) return
        const avg = values.reduce((a, b) => a + b, 0) / values.length
        const sorted = [...values].sort((a, b) => a - b)
        const med = sorted.length % 2 === 0
          ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
          : sorted[Math.floor(sorted.length / 2)]
        const variance = values.reduce((s, v) => s + (v - avg) ** 2, 0) / Math.max(values.length - 1, 1)
        const std = Math.sqrt(variance)
        const cv = avg > 0 ? (std / avg) * 100 : 0
        let grade: 'I' | 'II' | 'III' = 'I'
        if (comparables.length >= 5 && cv <= 30) grade = 'II'
        if (comparables.length >= 6 && cv <= 25) grade = 'III'
        const ev = avg * (parseFloat(area) || 0)
        setCalcResult({ estimated_value: ev, average_price_per_sqm: avg, median_price_per_sqm: med, std_deviation: std, coefficient_of_variation: cv, confidence_grade: grade })
        setCenarios({
          conservador: { valor: Math.round(ev * 0.85), variacao_pct: -15, descricao: 'Cenário pessimista — mercado em retração' },
          realista:    { valor: Math.round(ev),        variacao_pct: 0,   descricao: 'Valor de mercado calculado' },
          agressivo:   { valor: Math.round(ev * 1.12), variacao_pct: 12,  descricao: 'Cenário otimista — mercado em valorização' },
        })
        return
      }

      // API-based methods
      let payload: Record<string, unknown> = { metodo: m }
      const areaNum = parseFloat(area) || 0

      if (m === 'evolutivo') {
        payload = { metodo: 'evolutivo', property: { area: areaNum, ano_construcao: anoConst ? parseInt(anoConst) : undefined, estado_conservacao: conservacao }, valor_terreno: parseFloat(valorTerreno) }
      } else if (m === 'involutivo') {
        const vgvNum = parseFloat(vgv)
        payload = { metodo: 'involutivo', involutivo_input: { vgv: vgvNum, area_terreno: areaNum, custo_construcao: vgvNum * parseFloat(custosPct) / 100, lucro_incorporador: parseFloat(lucroPct) / 100, prazo_meses: parseInt(prazoMeses) } }
      } else if (m === 'renda') {
        payload = { metodo: 'renda', property: { area: areaNum }, renda: { renda_mensal: parseFloat(rendaMensal), taxa_capitalizacao: parseFloat(taxaCapitalizacao), vacancia_pct: parseFloat(vacanciaPct) } }
      } else if (m === 'cap_rate') {
        payload = { metodo: 'cap_rate', cap_rate_input: { noi_mensal: parseFloat(noiMensal), taxa_cap_rate: parseFloat(taxaCapRate), vacancia_pct: 0 } }
      } else if (m === 'fcd') {
        payload = { metodo: 'fcd', dcf_input: { fluxo_anual: fluxoAnual.map(Number).filter(n => n > 0), taxa_desconto: parseFloat(taxaDesconto) / 100, valor_residual: parseFloat(valorResidual) || 0 } }
      } else if (m === 'liquidacao_forcada') {
        payload = { metodo: 'liquidacao_forcada', valor_mercado: parseFloat(valorMercadoLF), liquidez }
      } else if (m === 'bdi') {
        payload = { metodo: 'bdi', custo_direto: parseFloat(custoDireto), bdi_pct: parseFloat(bdiPct) }
      } else if (m === 'fundo_comercio' || m === 'ponto_comercial') {
        payload = { metodo: 'fundo_comercio', fundo_input: { faturamento_mensal: parseFloat(faturamentoMensal), meses_faturamento: parseFloat(mesesFaturamento) } }
      } else if (m === 'ross_heidecke') {
        payload = { metodo: 'ross_heidecke', property: { area: areaNum, ano_construcao: parseInt(anoConst) || 2000, estado_conservacao: conservacao } }
      }

      const res = await fetch('/api/avaliacoes/calcular', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'Erro no cálculo')

      const r = data.result
      const ev: number =
        r.valor_total ?? r.valor_terreno ?? r.vpl ?? r.valor_liquidacao ??
        r.custo_total ?? r.valor_fundo ?? r.valor_depreciado ?? 0

      setCalcResult({ estimated_value: ev, details: r, label: getLabelForMethod(m) })

      if (data.cenarios) {
        setCenarios(data.cenarios)
      } else {
        setCenarios({
          conservador: { valor: Math.round(ev * 0.85), variacao_pct: -15, descricao: 'Cenário pessimista' },
          realista:    { valor: Math.round(ev),        variacao_pct: 0,   descricao: 'Valor estimado' },
          agressivo:   { valor: Math.round(ev * 1.12), variacao_pct: 12,  descricao: 'Cenário otimista' },
        })
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro no cálculo')
    } finally {
      setIsCalculating(false)
    }
  }, [metodoId, comparables, area, anoConst, conservacao, valorTerreno, vgv, custosPct, lucroPct, prazoMeses,
      rendaMensal, taxaCapitalizacao, vacanciaPct, noiMensal, taxaCapRate, fluxoAnual, taxaDesconto,
      valorResidual, valorMercadoLF, liquidez, custoDireto, bdiPct, faturamentoMensal, mesesFaturamento])

  useEffect(() => { if (step === 6) { doCalculate() } }, [step]) // eslint-disable-line react-hooks/exhaustive-deps

  const getLabelForMethod = (m: string) => {
    const map: Record<string, string> = {
      evolutivo: 'Valor do Imóvel (terreno + benfeitoria)',
      involutivo: 'Valor do Terreno (VGV − Custos − Lucro)',
      renda: 'Valor pelo Método da Renda',
      cap_rate: 'Valor pelo Cap Rate',
      fcd: 'Valor Presente Líquido (VPL)',
      liquidacao_forcada: 'Valor de Liquidação Forçada',
      bdi: 'Custo Total com BDI',
      fundo_comercio: 'Valor do Fundo de Comércio',
      ross_heidecke: 'Valor Depreciado (Ross-Heidecke)',
    }
    return map[m] || 'Valor Estimado'
  }

  // ── Photos ─────────────────────────────────────────────
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const newPhotos: PhotoUpload[] = files.slice(0, 10 - photos.length).map(file => ({
      id: crypto.randomUUID(), file, preview: URL.createObjectURL(file), caption: '',
    }))
    setPhotos(prev => [...prev, ...newPhotos])
    if (e.target) e.target.value = ''
  }
  const removePhoto = (id: string) => {
    setPhotos(prev => {
      const p = prev.find(ph => ph.id === id)
      if (p) URL.revokeObjectURL(p.preview)
      return prev.filter(ph => ph.id !== id)
    })
  }
  const uploadPhotos = async () => {
    const supabase = createClient()
    const uploaded: { url: string; name: string; caption: string }[] = []
    for (const photo of photos) {
      if (photo.url) { uploaded.push({ url: photo.url, name: photo.file.name, caption: photo.caption }); continue }
      try {
        setPhotos(prev => prev.map(p => p.id === photo.id ? { ...p, uploading: true } : p))
        const ext = photo.file.name.split('.').pop() || 'jpg'
        const path = `ptam/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`
        const { error } = await supabase.storage.from('avaliacoes').upload(path, photo.file, { cacheControl: '3600', upsert: false })
        if (error) { console.warn('[PHOTO]', error.message); continue }
        const { data: { publicUrl } } = supabase.storage.from('avaliacoes').getPublicUrl(path)
        setPhotos(prev => prev.map(p => p.id === photo.id ? { ...p, url: publicUrl, uploading: false } : p))
        uploaded.push({ url: publicUrl, name: photo.file.name, caption: photo.caption })
      } catch {
        setPhotos(prev => prev.map(p => p.id === photo.id ? { ...p, uploading: false } : p))
      }
    }
    return uploaded
  }

  // ── Save ───────────────────────────────────────────────
  const saveToDatabase = async () => {
    setSaving(true)
    try {
      const uploadedPhotos = photos.length > 0 ? await uploadPhotos() : []
      const areaNum = parseFloat(area) || 0
      const comparaveisData = comparables.map(c => ({
        address: c.address, neighborhood: c.neighborhood, city: c.city, state: c.state,
        area_sqm: parseFloat(c.area_sqm) || 0, bedrooms: parseInt(c.bedrooms) || 0,
        bathrooms: parseInt(c.bathrooms) || 0, parking_spots: parseInt(c.parking_spots) || 0,
        asking_price: parseFloat(c.asking_price) || 0, source: c.source, source_url: c.source_url,
        offer_factor: c.offer_factor, area_factor: c.area_factor, location_factor: c.location_factor,
        age_factor: c.age_factor, floor_factor: c.floor_factor, parking_factor: c.parking_factor,
        extra_factor: c.extra_factor, price_per_sqm: computePricePerSqm(c), homogenized_price_per_sqm: computeHomogenized(c),
      }))

      const estimatedValue = calcResult?.estimated_value || 0
      const avgM2 = calcResult?.average_price_per_sqm || 0
      const enderecoFinal = useManualAddress ? manualAddress : (selectedDev?.name || '')
      const finalidadeOpt = FINALIDADE_OPTIONS.find(f => f.id === finalidadeId)

      const res = await fetch('/api/avaliacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo_imovel: tipoImovel,
          endereco: enderecoFinal,
          bairro: bairro || selectedDev?.neighborhood || '',
          cidade, estado,
          area_privativa: areaNum || null,
          quartos: quartos ? parseInt(quartos) : null,
          banheiros: banheiros ? parseInt(banheiros) : null,
          vagas: vagas ? parseInt(vagas) : null,
          andar: andar || null,
          ano_construcao: anoConst || null,
          padrao, estado_conservacao: conservacao,
          finalidade: finalidadeOpt?.valor || finalidade,
          metodologia: metodoNome || 'Comparativo Direto de Dados de Mercado',
          metodo_principal: metodoId || 'comparativo',
          valor_conservador: cenarios?.conservador.valor || null,
          valor_realista: cenarios?.realista.valor || null,
          valor_agressivo: cenarios?.agressivo.valor || null,
          cliente_nome: clienteNome || null,
          cliente_email: clienteEmail || null,
          cliente_telefone: clienteTelefone || null,
          honorarios: honorarios ? parseFloat(honorarios) : null,
          observacoes: observacoes || null,
          comparaveis: comparaveisData,
          valor_estimado: estimatedValue || null,
          valor_m2: avgM2 || null,
          valor_minimo: cenarios?.conservador.valor || null,
          valor_maximo: cenarios?.agressivo.valor || null,
          grau_fundamentacao: calcResult?.confidence_grade || null,
          resultado_motor: calcResult || null,
          fotos_laudo: uploadedPhotos,
          status: 'em_andamento',
        }),
      })
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Falha ao salvar') }
      const { data } = await res.json()
      if (!data?.id) throw new Error('ID não retornado')
      setAvaliacaoId(data.id)
      toast.success('Avaliação salva com sucesso!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  const openPTAM = () => {
    if (avaliacaoId) window.open(`/api/avaliacoes/${avaliacaoId}/export`, '_blank')
    else toast.error('Salve a avaliação primeiro')
  }

  // ── Styles ─────────────────────────────────────────────
  const btnPrimary: React.CSSProperties = {
    background: `linear-gradient(135deg, ${T.gold}, #D4B86A)`, color: '#050B14', border: 'none',
    borderRadius: 10, padding: '10px 24px', fontWeight: 600, fontSize: 14, cursor: 'pointer',
    display: 'inline-flex', alignItems: 'center', gap: 8,
  }
  const btnSecondary: React.CSSProperties = {
    background: 'transparent', color: T.text, border: `1px solid ${T.border}`,
    borderRadius: 10, padding: '10px 24px', fontWeight: 500, fontSize: 14, cursor: 'pointer',
    display: 'inline-flex', alignItems: 'center', gap: 8,
  }
  const labelStyle: React.CSSProperties = { fontSize: 12, color: T.textMuted, marginBottom: 4, display: 'block', fontWeight: 500 }
  const card: React.CSSProperties = { ...cardStyle, padding: mobile ? 16 : 24, marginBottom: 16 }

  const sectionTitle = (text: string, icon: React.ReactNode) => (
    <h3 style={{ color: T.text, fontSize: 18, marginBottom: 16, fontFamily: T.font.display, display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ color: T.gold }}>{icon}</span> {text}
    </h3>
  )

  // ── Step 1: Finalidade ─────────────────────────────────
  const renderStep1 = () => (
    <div>
      <div style={card}>
        <h2 style={{ color: T.text, fontSize: 20, fontFamily: T.font.display, marginBottom: 4 }}>
          Para que você precisa desta avaliação?
        </h2>
        <p style={{ color: T.textMuted, fontSize: 13, marginBottom: 24 }}>
          Escolha a finalidade — o sistema vai recomendar o método correto e adaptar todo o formulário.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: mobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: 10 }}>
          {FINALIDADE_OPTIONS.map(opt => {
            const selected = finalidadeId === opt.id
            return (
              <button
                key={opt.id}
                onClick={() => { setFinalidadeId(opt.id); setFinalidade(opt.valor) }}
                style={{
                  padding: '16px 12px', borderRadius: 12, textAlign: 'left', cursor: 'pointer',
                  border: `2px solid ${selected ? T.gold : T.borderLight}`,
                  background: selected ? 'rgba(200,164,74,0.08)' : T.surfaceAlt,
                  transition: 'all 0.15s ease',
                  display: 'flex', flexDirection: 'column', gap: 6,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: selected ? T.gold : T.textMuted }}><opt.Icon size={20} /></span>
                  {selected && <Check size={14} style={{ color: T.gold, marginLeft: 'auto' }} />}
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: selected ? T.text : T.text, lineHeight: 1.3 }}>
                  {opt.label}
                </div>
                <div style={{ fontSize: 11, color: T.textMuted, lineHeight: 1.4 }}>{opt.desc}</div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )

  // ── Step 2: Tipo de Bem ────────────────────────────────
  const renderStep2 = () => (
    <div>
      <div style={card}>
        <h2 style={{ color: T.text, fontSize: 20, fontFamily: T.font.display, marginBottom: 4 }}>
          O que será avaliado?
        </h2>
        <p style={{ color: T.textMuted, fontSize: 13, marginBottom: 24 }}>
          Escolha o tipo de bem — os campos do formulário e o método vão se adaptar.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: mobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 10 }}>
          {TIPO_BEM_OPTIONS.map(opt => {
            const selected = tipoImovel === opt.id
            return (
              <button
                key={opt.id}
                onClick={() => setTipoImovel(opt.id)}
                style={{
                  padding: '14px 12px', borderRadius: 12, textAlign: 'left', cursor: 'pointer',
                  border: `2px solid ${selected ? T.gold : T.borderLight}`,
                  background: selected ? 'rgba(200,164,74,0.08)' : T.surfaceAlt,
                  transition: 'all 0.15s ease',
                  display: 'flex', flexDirection: 'column', gap: 5,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: selected ? T.gold : T.textMuted }}><opt.Icon size={20} /></span>
                  {selected && <Check size={12} style={{ color: T.gold, marginLeft: 'auto' }} />}
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.text, lineHeight: 1.3 }}>{opt.label}</div>
                <div style={{ fontSize: 10, color: T.textMuted, lineHeight: 1.4 }}>{opt.desc}</div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )

  // ── Step 3: Método Recomendado ─────────────────────────
  const renderStep3 = () => {
    const finalidadeOpt = FINALIDADE_OPTIONS.find(f => f.id === finalidadeId)
    const tipoBemOpt = TIPO_BEM_OPTIONS.find(t => t.id === tipoImovel)
    return (
      <div>
        {/* Context summary */}
        <div style={{ ...card, display: 'flex', gap: mobile ? 8 : 16, flexWrap: 'wrap', alignItems: 'center', padding: 16 }}>
          <div style={{ padding: '6px 14px', borderRadius: 20, background: 'rgba(200,164,74,0.1)', border: '1px solid rgba(200,164,74,0.25)', fontSize: 12, color: T.textGold, fontWeight: 600 }}>
            {finalidadeOpt?.label}
          </div>
          <ArrowRight size={14} style={{ color: T.textMuted, flexShrink: 0 }} />
          <div style={{ padding: '6px 14px', borderRadius: 20, background: T.surfaceAlt, border: `1px solid ${T.border}`, fontSize: 12, color: T.text, fontWeight: 600 }}>
            {tipoBemOpt?.label}
          </div>
        </div>

        {/* Method recommender */}
        <div style={card}>
          <h2 style={{ color: T.text, fontSize: 20, fontFamily: T.font.display, marginBottom: 4 }}>
            Método avaliatório recomendado
          </h2>
          <p style={{ color: T.textMuted, fontSize: 13, marginBottom: 20 }}>
            Com base na finalidade e no tipo de bem, o sistema recomenda o método mais adequado segundo a NBR 14653.
            Você pode aceitar ou escolher um método alternativo.
          </p>
          <MethodRecommender
            tipoImovel={tipoImovel}
            finalidade={finalidade}
            selectedMethodId={metodoId}
            onSelectMethod={(id, nome) => { setMetodoId(id); setMetodoNome(nome) }}
          />
        </div>

        {/* Client info */}
        <div style={card}>
          {sectionTitle('Dados do Solicitante', <User size={18} />)}
          <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr', gap: 12 }}>
            <div style={{ gridColumn: mobile ? undefined : 'span 2' }}>
              <label style={labelStyle}>Nome do Solicitante</label>
              <input style={inputStyle} placeholder="Nome completo..." value={clienteNome} onChange={e => setClienteNome(e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}><Mail size={11} style={{ marginRight: 4, verticalAlign: 'middle' }} />E-mail</label>
              <input style={inputStyle} type="email" placeholder="email@exemplo.com" value={clienteEmail} onChange={e => setClienteEmail(e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}><Phone size={11} style={{ marginRight: 4, verticalAlign: 'middle' }} />Telefone</label>
              <input style={inputStyle} placeholder="(81) 9 9999-9999" value={clienteTelefone} onChange={e => setClienteTelefone(e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Honorários (R$)</label>
              <input style={inputStyle} type="number" placeholder="800,00" value={honorarios} onChange={e => setHonorarios(e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Observações</label>
              <input style={inputStyle} placeholder="Observações relevantes..." value={observacoes} onChange={e => setObservacoes(e.target.value)} />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Step 4: Dados do Imóvel ────────────────────────────
  const renderStep4 = () => {
    const isResidential = ['Apartamento', 'Casa', 'Cobertura', 'Imóvel inacabado', 'Imóvel mobiliado'].includes(tipoImovel)
    const isTerreno = ['Terreno/Lote', 'Gleba'].includes(tipoImovel)
    const isRural = tipoImovel === 'Imóvel Rural'
    const isCommercial = ['Sala Comercial', 'Loja', 'Shopping/Loja em Mall', 'Posto de Combustível'].includes(tipoImovel)
    const isIndustrial = tipoImovel === 'Galpão/Armazém'
    const isHotel = tipoImovel === 'Hotel/Pousada'

    const areaLabel = isRural ? 'Área total (ha)' : (isTerreno ? 'Área do terreno (m²)' : 'Área privativa (m²)')

    return (
      <div>
        <div style={card}>
          {sectionTitle('Localização do Imóvel', <MapPin size={18} />)}

          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <button style={{ ...(!useManualAddress ? btnPrimary : btnSecondary), padding: '7px 14px', fontSize: 12 }} onClick={() => setUseManualAddress(false)}>
              <Search size={13} /> Buscar Empreendimento
            </button>
            <button style={{ ...(useManualAddress ? btnPrimary : btnSecondary), padding: '7px 14px', fontSize: 12 }} onClick={() => setUseManualAddress(true)}>
              <Home size={13} /> Endereço Livre
            </button>
          </div>

          {!useManualAddress ? (
            <div style={{ position: 'relative', marginBottom: 16 }}>
              <label style={labelStyle}>Empreendimento</label>
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: T.textMuted }} />
                <input
                  style={{ ...inputStyle, paddingLeft: 36 }}
                  placeholder="Digite o nome do empreendimento..."
                  value={selectedDev ? selectedDev.name : devSearch}
                  onChange={e => { setDevSearch(e.target.value); setSelectedDev(null); setShowDevDropdown(true) }}
                  onFocus={() => setShowDevDropdown(true)}
                />
                {selectedDev && <button onClick={() => { setSelectedDev(null); setDevSearch('') }} style={{ position: 'absolute', right: 10, top: 10, background: 'none', border: 'none', color: T.textMuted, cursor: 'pointer' }}><X size={14} /></button>}
              </div>
              {showDevDropdown && !selectedDev && filteredDevs.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, maxHeight: 220, overflowY: 'auto' }}>
                  {filteredDevs.map(d => (
                    <button key={d.id} onClick={() => { setSelectedDev(d); setShowDevDropdown(false); setDevSearch(''); if (d.neighborhood) setBairro(d.neighborhood) }}
                      style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px', background: 'transparent', border: 'none', color: T.text, cursor: 'pointer', borderBottom: `1px solid ${T.borderLight}`, fontSize: 13 }}>
                      <strong>{d.name}</strong><br />
                      <span style={{ fontSize: 11, color: T.textMuted }}>{d.address || d.location || d.neighborhood || ''}</span>
                    </button>
                  ))}
                </div>
              )}
              {selectedDev && (
                <div style={{ padding: 10, background: T.accentBg, borderRadius: 8, marginTop: 8, border: `1px solid ${T.border}` }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{selectedDev.name}</div>
                  <div style={{ fontSize: 11, color: T.textMuted }}>{selectedDev.address || selectedDev.location || ''}</div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Endereço Completo *</label>
              <input style={inputStyle} placeholder="Rua, número, complemento..." value={manualAddress} onChange={e => setManualAddress(e.target.value)} />
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Bairro</label>
              <input style={inputStyle} placeholder="Bairro..." value={bairro} onChange={e => setBairro(e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Cidade</label>
              <input style={inputStyle} value={cidade} onChange={e => setCidade(e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Estado (UF)</label>
              <input style={inputStyle} maxLength={2} value={estado} onChange={e => setEstado(e.target.value.toUpperCase())} />
            </div>
          </div>
        </div>

        <div style={card}>
          {sectionTitle('Características do Bem', <Building2 size={18} />)}
          <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 12 }}>
            <div>
              <label style={labelStyle}>{areaLabel} *</label>
              <input style={inputStyle} type="number" placeholder="85" value={area} onChange={e => setArea(e.target.value)} />
            </div>

            {(isResidential || isHotel) && <>
              <div>
                <label style={labelStyle}>Quartos</label>
                <input style={inputStyle} type="number" placeholder="2" value={quartos} onChange={e => setQuartos(e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Banheiros</label>
                <input style={inputStyle} type="number" placeholder="1" value={banheiros} onChange={e => setBanheiros(e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Vagas</label>
                <input style={inputStyle} type="number" placeholder="1" value={vagas} onChange={e => setVagas(e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Andar</label>
                <input style={inputStyle} placeholder="5" value={andar} onChange={e => setAndar(e.target.value)} />
              </div>
            </>}

            {(isCommercial || isIndustrial) && <>
              <div>
                <label style={labelStyle}>Vagas</label>
                <input style={inputStyle} type="number" placeholder="2" value={vagas} onChange={e => setVagas(e.target.value)} />
              </div>
            </>}

            <div>
              <label style={labelStyle}>Ano de Construção</label>
              <input style={inputStyle} type="number" placeholder="2010" value={anoConst} onChange={e => setAnoConst(e.target.value)} />
            </div>

            {!isTerreno && !isRural && <>
              <div>
                <label style={labelStyle}>Padrão</label>
                <div style={{ position: 'relative' }}>
                  <select value={padrao} onChange={e => setPadrao(e.target.value)} style={{ ...inputStyle, appearance: 'none', paddingRight: 32 }}>
                    {STANDARDS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <ChevronDown size={15} style={{ position: 'absolute', right: 12, top: 12, color: T.textMuted, pointerEvents: 'none' }} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Estado de Conservação</label>
                <div style={{ position: 'relative' }}>
                  <select value={conservacao} onChange={e => setConservacao(e.target.value)} style={{ ...inputStyle, appearance: 'none', paddingRight: 32 }}>
                    {CONSERVATION.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <ChevronDown size={15} style={{ position: 'absolute', right: 12, top: 12, color: T.textMuted, pointerEvents: 'none' }} />
                </div>
              </div>
            </>}
          </div>
        </div>

        {/* Photos */}
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h4 style={{ color: T.text, fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Camera size={15} style={{ color: T.gold }} /> Fotos ({photos.length}/10)
            </h4>
            {photos.length < 10 && <button style={{ ...btnSecondary, padding: '5px 12px', fontSize: 11 }} onClick={() => photoInputRef.current?.click()}><Plus size={12} /> Adicionar</button>}
          </div>
          <input ref={photoInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handlePhotoSelect} />
          {photos.length === 0 ? (
            <div onClick={() => photoInputRef.current?.click()} style={{ border: `2px dashed ${T.border}`, borderRadius: 10, padding: '20px 16px', textAlign: 'center', cursor: 'pointer', color: T.textMuted, fontSize: 12 }}>
              <ImageIcon size={24} style={{ opacity: 0.35, display: 'block', margin: '0 auto 8px' }} />
              Fotos do imóvel (opcional, máx. 10)
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: mobile ? 'repeat(3, 1fr)' : 'repeat(5, 1fr)', gap: 8 }}>
              {photos.map(photo => (
                <div key={photo.id} style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', border: `1px solid ${T.border}` }}>
                  <img src={photo.preview} alt="" style={{ width: '100%', height: 72, objectFit: 'cover', display: 'block' }} />
                  {photo.uploading && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Loader2 size={16} style={{ color: T.gold }} className="animate-spin" /></div>}
                  <button onClick={() => removePhoto(photo.id)} style={{ position: 'absolute', top: 3, right: 3, background: 'rgba(0,0,0,0.65)', border: 'none', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}><X size={10} /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── Step 5: Dados Econômicos ───────────────────────────
  const renderStep5 = () => {
    const m = metodoId || 'comparativo'

    if (m === 'comparativo') return renderStep5Comparativo()

    return (
      <div style={card}>
        {sectionTitle('Dados Econômicos', <BarChart2 size={18} />)}
        <p style={{ fontSize: 12, color: T.textMuted, marginBottom: 20, padding: 10, background: 'rgba(200,164,74,0.06)', borderRadius: 8, border: '1px solid rgba(200,164,74,0.15)' }}>
          <strong style={{ color: T.textGold }}>Método:</strong> {metodoNome}
        </p>

        {m === 'evolutivo' && (
          <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Valor do Terreno (R$) *</label>
              <input style={inputStyle} type="number" placeholder="150000" value={valorTerreno} onChange={e => setValorTerreno(e.target.value)} />
              <p style={{ fontSize: 10, color: T.textMuted, marginTop: 4 }}>Obtido por método comparativo de terrenos similares</p>
            </div>
            <div>
              <label style={labelStyle}>CUB/m² SINDUSCON (R$)</label>
              <input style={inputStyle} type="number" placeholder="2450" value={cubM2} onChange={e => setCubM2(e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>BDI (%)</label>
              <input style={inputStyle} type="number" placeholder="25" value={bdiForca} onChange={e => setBdiForca(e.target.value)} />
              <p style={{ fontSize: 10, color: T.textMuted, marginTop: 4 }}>Benefícios e Despesas Indiretas — padrão 25%</p>
            </div>
          </div>
        )}

        {m === 'involutivo' && (
          <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>VGV Estimado (R$) *</label>
              <input style={inputStyle} type="number" placeholder="3000000" value={vgv} onChange={e => setVgv(e.target.value)} />
              <p style={{ fontSize: 10, color: T.textMuted, marginTop: 4 }}>Valor Geral de Vendas hipotético do empreendimento</p>
            </div>
            <div>
              <label style={labelStyle}>Custos de Construção (% do VGV)</label>
              <input style={inputStyle} type="number" placeholder="55" value={custosPct} onChange={e => setCustosPct(e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Lucro do Incorporador (%)</label>
              <input style={inputStyle} type="number" placeholder="15" value={lucroPct} onChange={e => setLucroPct(e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Prazo do Empreendimento (meses)</label>
              <input style={inputStyle} type="number" placeholder="24" value={prazoMeses} onChange={e => setPrazoMeses(e.target.value)} />
            </div>
            {vgv && custosPct && lucroPct && (
              <div style={{ gridColumn: mobile ? undefined : 'span 2', padding: 12, background: T.surfaceAlt, borderRadius: 8, border: `1px solid ${T.borderLight}` }}>
                <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 4 }}>Estimativa prévia (VT = VGV − C − L)</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: T.gold }}>
                  {fmtBRL(parseFloat(vgv) * (1 - parseFloat(custosPct)/100 - parseFloat(lucroPct)/100))}
                </div>
              </div>
            )}
          </div>
        )}

        {(m === 'renda') && (
          <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Renda Mensal Bruta (R$) *</label>
              <input style={inputStyle} type="number" placeholder="3500" value={rendaMensal} onChange={e => setRendaMensal(e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Taxa de Capitalização (% a.a.) *</label>
              <input style={inputStyle} type="number" placeholder="8" value={taxaCapitalizacao} onChange={e => setTaxaCapitalizacao(e.target.value)} />
              <p style={{ fontSize: 10, color: T.textMuted, marginTop: 4 }}>Taxa de mercado para o tipo de imóvel (tipicamente 6–12% a.a.)</p>
            </div>
            <div>
              <label style={labelStyle}>Vacância Estimada (%)</label>
              <input style={inputStyle} type="number" placeholder="5" value={vacanciaPct} onChange={e => setVacanciaPct(e.target.value)} />
            </div>
            {rendaMensal && taxaCapitalizacao && (
              <div style={{ padding: 12, background: T.surfaceAlt, borderRadius: 8, border: `1px solid ${T.borderLight}` }}>
                <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 4 }}>Estimativa prévia</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: T.gold }}>
                  {fmtBRL(parseFloat(rendaMensal) * 12 / (parseFloat(taxaCapitalizacao)/100))}
                </div>
              </div>
            )}
          </div>
        )}

        {m === 'cap_rate' && (
          <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>NOI Mensal Líquido (R$) *</label>
              <input style={inputStyle} type="number" placeholder="8000" value={noiMensal} onChange={e => setNoiMensal(e.target.value)} />
              <p style={{ fontSize: 10, color: T.textMuted, marginTop: 4 }}>Lucro Operacional Líquido — renda bruta menos despesas operacionais</p>
            </div>
            <div>
              <label style={labelStyle}>Cap Rate (% a.a.) *</label>
              <input style={inputStyle} type="number" placeholder="8" value={taxaCapRate} onChange={e => setTaxaCapRate(e.target.value)} />
            </div>
            {noiMensal && taxaCapRate && (
              <div style={{ padding: 12, background: T.surfaceAlt, borderRadius: 8, border: `1px solid ${T.borderLight}` }}>
                <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 4 }}>NOI anual / Cap Rate</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: T.gold }}>
                  {fmtBRL(parseFloat(noiMensal) * 12 / (parseFloat(taxaCapRate)/100))}
                </div>
              </div>
            )}
          </div>
        )}

        {m === 'fcd' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>Taxa de Desconto / TMA (% a.a.) *</label>
                <input style={inputStyle} type="number" placeholder="12" value={taxaDesconto} onChange={e => setTaxaDesconto(e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Valor Residual (R$)</label>
                <input style={inputStyle} type="number" placeholder="0" value={valorResidual} onChange={e => setValorResidual(e.target.value)} />
              </div>
            </div>
            <div style={{ marginBottom: 8 }}>
              <label style={labelStyle}>Fluxo de Caixa Anual (R$)</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
                {fluxoAnual.map((v, i) => (
                  <div key={i}>
                    <label style={{ ...labelStyle, fontSize: 10 }}>Ano {i + 1}</label>
                    <input style={inputStyle} type="number" placeholder="0" value={v}
                      onChange={e => setFluxoAnual(prev => prev.map((x, j) => j === i ? e.target.value : x))} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {m === 'liquidacao_forcada' && (
          <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Valor de Mercado (R$) *</label>
              <input style={inputStyle} type="number" placeholder="500000" value={valorMercadoLF} onChange={e => setValorMercadoLF(e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Grau de Liquidez</label>
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                {(['alta', 'media', 'baixa'] as const).map(l => (
                  <button key={l} onClick={() => setLiquidez(l)} style={{ flex: 1, padding: '8px 4px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: `2px solid ${liquidez === l ? T.gold : T.borderLight}`, background: liquidez === l ? 'rgba(200,164,74,0.1)' : 'transparent', color: liquidez === l ? T.gold : T.textMuted }}>
                    {l === 'alta' ? 'Alta' : l === 'media' ? 'Média' : 'Baixa'}
                  </button>
                ))}
              </div>
              <p style={{ fontSize: 10, color: T.textMuted, marginTop: 6 }}>
                Alta: −10% · Média: −20% · Baixa: −30%
              </p>
            </div>
            {valorMercadoLF && (
              <div style={{ gridColumn: mobile ? undefined : 'span 2', padding: 12, background: T.surfaceAlt, borderRadius: 8, border: `1px solid ${T.borderLight}` }}>
                <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 4 }}>Valor de Liquidação Estimado</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: T.gold }}>
                  {fmtBRL(parseFloat(valorMercadoLF) * (liquidez === 'alta' ? 0.90 : liquidez === 'media' ? 0.80 : 0.70))}
                </div>
              </div>
            )}
          </div>
        )}

        {m === 'bdi' && (
          <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Custo Direto da Obra (R$) *</label>
              <input style={inputStyle} type="number" placeholder="400000" value={custoDireto} onChange={e => setCustoDireto(e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>BDI (%)</label>
              <input style={inputStyle} type="number" placeholder="25" value={bdiPct} onChange={e => setBdiPct(e.target.value)} />
            </div>
            {custoDireto && (
              <div style={{ padding: 12, background: T.surfaceAlt, borderRadius: 8, border: `1px solid ${T.borderLight}` }}>
                <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 4 }}>Custo Total com BDI</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: T.gold }}>
                  {fmtBRL(parseFloat(custoDireto) * (1 + parseFloat(bdiPct)/100))}
                </div>
              </div>
            )}
          </div>
        )}

        {(m === 'fundo_comercio' || m === 'ponto_comercial') && (
          <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Faturamento Mensal Médio (R$) *</label>
              <input style={inputStyle} type="number" placeholder="50000" value={faturamentoMensal} onChange={e => setFaturamentoMensal(e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Multiplicador de Meses</label>
              <input style={inputStyle} type="number" placeholder="24" value={mesesFaturamento} onChange={e => setMesesFaturamento(e.target.value)} />
              <p style={{ fontSize: 10, color: T.textMuted, marginTop: 4 }}>Tipicamente 12–36 meses conforme setor e maturidade</p>
            </div>
            {faturamentoMensal && (
              <div style={{ padding: 12, background: T.surfaceAlt, borderRadius: 8, border: `1px solid ${T.borderLight}` }}>
                <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 4 }}>Valor estimado do fundo</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: T.gold }}>
                  {fmtBRL(parseFloat(faturamentoMensal) * parseFloat(mesesFaturamento))}
                </div>
              </div>
            )}
          </div>
        )}

        {(m === 'ross_heidecke') && (
          <div style={{ padding: 16, background: 'rgba(200,164,74,0.06)', borderRadius: 10, border: '1px solid rgba(200,164,74,0.2)' }}>
            <p style={{ fontSize: 13, color: T.text, lineHeight: 1.6 }}>
              O método Ross-Heidecke utiliza os dados do imóvel já preenchidos: <strong>ano de construção</strong>, <strong>estado de conservação</strong> e <strong>área</strong>.
              Clique em <em>Próximo</em> para calcular a depreciação e o valor depreciado.
            </p>
          </div>
        )}
      </div>
    )
  }

  const renderStep5Comparativo = () => (
    <div>
      <div style={card}>
        {sectionTitle(`Pesquisa de Mercado — ${comparables.length} elemento${comparables.length !== 1 ? 's' : ''}`, <MapPin size={18} />)}

        {comparables.length < 3 && (
          <div style={{ padding: 10, background: 'rgba(200,164,74,0.08)', borderRadius: 8, marginBottom: 14, fontSize: 12, color: T.textGold, border: '1px solid rgba(200,164,74,0.2)' }}>
            Mínimo de 3 comparandos para o Método Comparativo (NBR 14653-2)
          </div>
        )}

        {comparables.map((c, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: 12, background: T.surfaceAlt, borderRadius: 8, marginBottom: 8, border: `1px solid ${T.borderLight}` }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>#{i + 1} — {c.address}{c.neighborhood ? `, ${c.neighborhood}` : ''}</div>
              <div style={{ fontSize: 11, color: T.textMuted, marginTop: 3 }}>
                {c.area_sqm}m² · {fmtBRL(parseFloat(c.asking_price) || 0)} · {fmt(computePricePerSqm(c))} R$/m²
                {c.homogenized_price_per_sqm ? ` · Hom: ${fmt(c.homogenized_price_per_sqm)} R$/m²` : ''}
                {c.source ? ` · ${c.source}` : ''}
              </div>
            </div>
            <button onClick={() => removeComparable(i)} style={{ background: 'none', border: 'none', color: T.error, cursor: 'pointer', padding: '4px 8px', flexShrink: 0 }}><Trash2 size={14} /></button>
          </div>
        ))}

        {showAddForm ? (
          <div style={{ padding: 16, background: T.surfaceAlt, borderRadius: 10, border: `1px solid ${T.border}`, marginTop: 12 }}>
            <h4 style={{ color: T.textGold, fontSize: 13, marginBottom: 12, fontWeight: 600 }}>Novo Comparando</h4>
            <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr', gap: 10 }}>
              {[
                { label: 'Endereço *', key: 'address', placeholder: 'Rua, número...' },
                { label: 'Bairro', key: 'neighborhood', placeholder: 'Bairro...' },
                { label: 'Cidade', key: 'city', placeholder: 'Cidade...' },
                { label: 'Estado', key: 'state', placeholder: 'UF', maxLen: 2, upper: true },
                { label: 'Área (m²) *', key: 'area_sqm', type: 'number', placeholder: '85' },
                { label: 'Preço Pedido (R$) *', key: 'asking_price', type: 'number', placeholder: '450000' },
                { label: 'Quartos', key: 'bedrooms', type: 'number', placeholder: '2' },
                { label: 'Vagas', key: 'parking_spots', type: 'number', placeholder: '1' },
              ].map(({ label, key, type, placeholder, maxLen, upper }) => (
                <div key={key}>
                  <label style={labelStyle}>{label}</label>
                  <input style={inputStyle} type={type} placeholder={placeholder} maxLength={maxLen}
                    value={(newComp as Record<string, unknown>)[key] as string}
                    onChange={e => setNewComp({ ...newComp, [key]: upper ? e.target.value.toUpperCase() : e.target.value })} />
                </div>
              ))}
              <div>
                <label style={labelStyle}>Fonte</label>
                <div style={{ position: 'relative' }}>
                  <select value={newComp.source} onChange={e => setNewComp({ ...newComp, source: e.target.value })} style={{ ...inputStyle, appearance: 'none', paddingRight: 32 }}>
                    <option value="">Selecionar...</option>
                    {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <ChevronDown size={15} style={{ position: 'absolute', right: 12, top: 12, color: T.textMuted, pointerEvents: 'none' }} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>URL da Fonte</label>
                <input style={inputStyle} placeholder="https://..." value={newComp.source_url} onChange={e => setNewComp({ ...newComp, source_url: e.target.value })} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <button style={btnPrimary} onClick={addComparable}><Plus size={14} /> Adicionar</button>
              <button style={btnSecondary} onClick={() => { setShowAddForm(false); setNewComp(emptyComparable()) }}>Cancelar</button>
            </div>
          </div>
        ) : (
          <button style={{ ...btnSecondary, marginTop: 10, width: '100%', justifyContent: 'center' }} onClick={() => setShowAddForm(true)}>
            <Plus size={14} /> Adicionar Comparando
          </button>
        )}
      </div>

      {/* Homogenization factors */}
      {comparables.length >= 3 && (
        <div style={card}>
          {sectionTitle('Fatores de Homogeneização', <Scale size={18} />)}
          <p style={{ fontSize: 12, color: T.textMuted, marginBottom: 14 }}>Ajuste conforme NBR 14653-2. Valores entre 0,50 e 1,50.</p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                  {['#', 'Endereço', 'R$/m²', 'Oferta', 'Área', 'Local.', 'Idade', 'Pav.', 'Vagas', 'Extra', 'Hom.'].map(h => (
                    <th key={h} style={{ padding: '7px 4px', textAlign: h === 'Endereço' ? 'left' : 'center', color: T.textGold, fontSize: 10, fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparables.map((c, i) => {
                  const fi = (field: keyof ComparableEntry) => (
                    <input type="number" step="0.01" min="0.5" max="1.5" value={c[field] as number}
                      onChange={e => updateFactor(i, field, parseFloat(e.target.value) || 1)}
                      style={{ ...inputStyle, width: 54, padding: '3px 4px', fontSize: 10, textAlign: 'center' }} />
                  )
                  return (
                    <tr key={i} style={{ borderBottom: `1px solid ${T.borderLight}` }}>
                      <td style={{ padding: '6px 4px', color: T.textMuted }}>{i + 1}</td>
                      <td style={{ padding: '6px 4px', color: T.text, maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.address}</td>
                      <td style={{ padding: '6px 4px', textAlign: 'center', color: T.text }}>{fmt(computePricePerSqm(c))}</td>
                      {(['offer_factor', 'area_factor', 'location_factor', 'age_factor', 'floor_factor', 'parking_factor', 'extra_factor'] as (keyof ComparableEntry)[]).map(f => (
                        <td key={f} style={{ padding: '3px 2px', textAlign: 'center' }}>{fi(f)}</td>
                      ))}
                      <td style={{ padding: '6px 4px', textAlign: 'center', color: T.textGold, fontWeight: 700 }}>{fmt(computeHomogenized(c))}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )

  // ── Step 6: Resultado ──────────────────────────────────
  const renderStep6 = () => {
    if (isCalculating || !calcResult) {
      return (
        <div style={{ ...card, textAlign: 'center', padding: 48 }}>
          <Loader2 size={32} className="animate-spin" style={{ color: T.gold, display: 'block', margin: '0 auto 16px' }} />
          <p style={{ color: T.textMuted, fontSize: 13 }}>Calculando...</p>
        </div>
      )
    }

    const { estimated_value, coefficient_of_variation: cv, confidence_grade: grade } = calcResult
    const cvColor = cv !== undefined ? (cv <= 25 ? T.success : cv <= 30 ? T.warning : T.error) : T.textMuted
    const gradeColor = grade === 'III' ? T.success : grade === 'II' ? T.warning : T.error

    return (
      <div>
        <div style={card}>
          {sectionTitle('Resultado da Análise', <BarChart2 size={18} />)}

          {/* Stats grid for comparativo */}
          {calcResult.average_price_per_sqm !== undefined && (
            <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr 1fr' : 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
              {[
                { label: 'Média R$/m²', value: fmt(calcResult.average_price_per_sqm!), color: T.textGold },
                { label: 'Mediana R$/m²', value: fmt(calcResult.median_price_per_sqm!), color: T.text },
                { label: 'CV%', value: fmt(cv!) + '%', color: cvColor },
                { label: 'Desvio Padrão', value: fmt(calcResult.std_deviation!), color: T.text },
                { label: 'Elementos', value: String(comparables.length), color: T.text },
                { label: 'Grau NBR', value: grade!, color: gradeColor },
              ].map((s, i) => (
                <div key={i} style={{ padding: 12, background: T.surfaceAlt, borderRadius: 10, textAlign: 'center', border: `1px solid ${T.borderLight}` }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: s.color, fontFamily: T.font.display }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Hero value */}
          <div style={{ padding: 28, background: 'linear-gradient(135deg, #050B14, #0d2240)', borderRadius: 12, textAlign: 'center', border: `2px solid ${T.gold}` }}>
            <div style={{ fontSize: 11, color: T.textMuted, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>
              {calcResult.label || 'Valor de Mercado Estimado'}
            </div>
            <div style={{ fontSize: 36, fontWeight: 700, color: T.gold, fontFamily: T.font.display, margin: '8px 0' }}>
              {fmtBRL(estimated_value)}
            </div>
            {calcResult.average_price_per_sqm && (
              <div style={{ fontSize: 12, color: T.textMuted }}>{fmtBRL(calcResult.average_price_per_sqm)}/m² × {area} m²</div>
            )}
            {grade && (
              <span style={{ display: 'inline-block', marginTop: 10, background: T.gold, color: '#050B14', padding: '4px 18px', borderRadius: 20, fontWeight: 700, fontSize: 12 }}>
                Grau {grade} · NBR 14653-2
              </span>
            )}
          </div>
        </div>

        {/* Scenarios */}
        {cenarios && (
          <div style={card}>
            <h4 style={{ color: T.text, fontSize: 13, marginBottom: 14, fontWeight: 600 }}>Cenários de Valor</h4>
            <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : 'repeat(3, 1fr)', gap: 10 }}>
              {[
                { label: 'Conservador', icon: <TrendingDown size={15} />, color: '#3B82F6', bg: 'rgba(59,130,246,0.08)', ...cenarios.conservador },
                { label: 'Realista',    icon: <Minus size={15} />,        color: T.gold,     bg: 'rgba(200,164,74,0.08)', ...cenarios.realista },
                { label: 'Agressivo',  icon: <TrendingUp size={15} />,   color: T.success,  bg: 'rgba(16,185,129,0.08)', ...cenarios.agressivo },
              ].map(c => (
                <div key={c.label} style={{ padding: 14, borderRadius: 10, textAlign: 'center', background: c.bg, border: `1px solid ${c.color}30` }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, marginBottom: 8 }}>
                    <span style={{ color: c.color }}>{c.icon}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: c.color }}>{c.label}</span>
                    <span style={{ fontSize: 10, color: c.color, opacity: 0.8 }}>
                      {c.variacao_pct === 0 ? '' : c.variacao_pct > 0 ? `+${c.variacao_pct}%` : `${c.variacao_pct}%`}
                    </span>
                  </div>
                  <div style={{ fontSize: 19, fontWeight: 700, color: c.color, fontFamily: T.font.display }}>{fmtBRL(c.valor)}</div>
                  <div style={{ fontSize: 10, color: T.textMuted, marginTop: 4, lineHeight: 1.4 }}>{c.descricao}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Comparables summary */}
        {comparables.length > 0 && (
          <div style={card}>
            <h4 style={{ color: T.text, fontSize: 13, marginBottom: 12, fontWeight: 600 }}>Elementos Amostrais</h4>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                    {['#', 'Endereço', 'Área', 'Preço', 'R$/m²', 'R$/m² Hom.'].map(h => (
                      <th key={h} style={{ padding: '6px', textAlign: h === 'Endereço' ? 'left' : 'center', color: T.textGold, fontSize: 10 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comparables.map((c, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${T.borderLight}` }}>
                      <td style={{ padding: '6px', color: T.textMuted }}>{i + 1}</td>
                      <td style={{ padding: '6px', color: T.text }}>{c.address}{c.neighborhood ? `, ${c.neighborhood}` : ''}</td>
                      <td style={{ padding: '6px', textAlign: 'center', color: T.textMuted }}>{c.area_sqm}m²</td>
                      <td style={{ padding: '6px', textAlign: 'center', color: T.text }}>{fmtBRL(parseFloat(c.asking_price) || 0)}</td>
                      <td style={{ padding: '6px', textAlign: 'center', color: T.text }}>{fmt(computePricePerSqm(c))}</td>
                      <td style={{ padding: '6px', textAlign: 'center', color: T.textGold, fontWeight: 700 }}>{fmt(computeHomogenized(c))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── Step 7: Gerar PDF ──────────────────────────────────
  const renderStep7 = () => (
    <div style={card}>
      {sectionTitle('Gerar Parecer / Laudo', <Download size={18} />)}

      {!avaliacaoId ? (
        <div>
          <p style={{ color: T.textMuted, fontSize: 13, marginBottom: 20, lineHeight: 1.6 }}>
            Salve a avaliação para gerar o documento em conformidade com a NBR 14653 e Resolução COFECI 1.066/2007.
          </p>
          {calcResult && (
            <div style={{ padding: 16, background: T.surfaceAlt, borderRadius: 10, marginBottom: 20, border: `1px solid ${T.borderLight}` }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, textAlign: 'center' }}>
                <div>
                  <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 4 }}>Valor Estimado</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: T.gold, fontFamily: T.font.display }}>{fmtBRL(calcResult.estimated_value)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 4 }}>Método</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{metodoNome || '—'}</div>
                </div>
              </div>
            </div>
          )}
          <button
            style={{ ...btnPrimary, width: '100%', justifyContent: 'center', opacity: saving ? 0.6 : 1, fontSize: 15, padding: '13px 24px' }}
            onClick={saveToDatabase} disabled={saving}
          >
            {saving ? <><Loader2 size={16} className="animate-spin" /> Salvando...</> : <><Save size={16} /> Salvar Avaliação</>}
          </button>
        </div>
      ) : (
        <div>
          <div style={{ padding: 16, background: 'rgba(16,185,129,0.08)', borderRadius: 10, marginBottom: 20, border: '1px solid rgba(16,185,129,0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Check size={16} style={{ color: T.success }} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Avaliação salva!</div>
                <div style={{ fontSize: 11, color: T.textMuted, fontFamily: 'monospace', marginTop: 2 }}>{avaliacaoId}</div>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: mobile ? 'column' : 'row', gap: 10 }}>
            <button style={{ ...btnPrimary, flex: 1, justifyContent: 'center' }} onClick={openPTAM}><Eye size={14} /> Visualizar PTAM</button>
            <button style={{ ...btnSecondary, flex: 1, justifyContent: 'center' }} onClick={() => { const a = document.createElement('a'); a.href = `/api/avaliacoes/${avaliacaoId}/export`; a.download = `PTAM-${avaliacaoId.slice(0, 8).toUpperCase()}.html`; a.click() }}>
              <Download size={14} /> Download HTML
            </button>
            <button style={{ ...btnSecondary, flex: 1, justifyContent: 'center' }} onClick={() => window.open(`/backoffice/avaliacoes/${avaliacaoId}`, '_blank')}>
              <Star size={14} /> Ver Detalhes
            </button>
          </div>
        </div>
      )}
    </div>
  )

  // ── Main Render ────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', padding: mobile ? '0 12px 180px' : '0 24px 40px' }}>
      <PageIntelHeader
        moduleLabel="AVALIACAO"
        title="Nova Avaliação"
        subtitle="Wizard inteligente · NBR 14653 · COFECI 1.066/2007"
        breadcrumbs={[
          { label: 'Backoffice', href: '/backoffice' },
          { label: 'Avaliações', href: '/backoffice/avaliacoes' },
          { label: 'Nova Avaliação' },
        ]}
      />

      {/* Step indicator */}
      <div style={{ display: 'flex', gap: mobile ? 2 : 4, marginBottom: 24, overflowX: 'auto', paddingBottom: 4 }}>
        {STEPS.map(s => {
          const active = s.num === step
          const done = s.num < step
          return (
            <button key={s.num}
              onClick={() => { if (s.num <= step || done) setStep(s.num) }}
              style={{
                flex: mobile ? undefined : 1, minWidth: mobile ? 40 : undefined,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                padding: mobile ? '7px 8px' : '9px 12px', borderRadius: 8,
                border: active ? `1px solid ${T.gold}` : `1px solid ${T.borderLight}`,
                background: active ? T.accentBg : done ? 'rgba(34,197,94,0.06)' : 'transparent',
                color: active ? T.gold : done ? T.success : T.textMuted,
                cursor: s.num <= step ? 'pointer' : 'default',
                fontSize: 11, fontWeight: active ? 600 : 400, whiteSpace: 'nowrap',
              }}>
              {done ? <Check size={12} /> : <s.Icon size={15} />}
              {!mobile && <span>{s.label}</span>}
            </button>
          )
        })}
      </div>

      {/* Content */}
      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
      {step === 4 && renderStep4()}
      {step === 5 && renderStep5()}
      {step === 6 && renderStep6()}
      {step === 7 && renderStep7()}

      {/* Navigation */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', marginTop: 20,
        ...(mobile ? { position: 'fixed', bottom: 64, left: 0, right: 0, padding: '12px 16px', background: T.surface, borderTop: `1px solid ${T.border}`, zIndex: 50 } : {}),
      }}>
        <button style={{ ...btnSecondary, opacity: step === 1 ? 0.4 : 1 }} onClick={goPrev} disabled={step === 1}>
          <ArrowLeft size={14} /> Voltar
        </button>
        {step < 7 && (
          <button style={{ ...btnPrimary, opacity: canNext() ? 1 : 0.4 }} onClick={goNext} disabled={!canNext()}>
            Próximo <ArrowRight size={14} />
          </button>
        )}
      </div>
    </div>
  )
}
