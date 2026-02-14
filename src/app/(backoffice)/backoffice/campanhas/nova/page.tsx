'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import PageHeader from '../../../components/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardBody, CardFooter } from '@/components/ui/Card'
import { Input, Textarea } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { Save, ArrowLeft, ArrowRight, Check, Target, TrendingUp, DollarSign, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useDevelopments } from '@/hooks/use-developments'
import { toast } from 'sonner'

const supabase = createClient()

const steps = [
  { id: 1, name: 'Estratégia', description: 'Ativos e objetivos' },
  { id: 2, name: 'Veiculação', description: 'Budget e cronograma' },
  { id: 3, name: 'Profiling', description: 'Audiência e interesses' },
]

export default function CampanhasNovaPage() {
  const router = useRouter()
  const { developments } = useDevelopments()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    // Step 1
    name: '',
    type: '',
    development_id: '',
    objective: '',
    description: '',

    // Step 2
    budget: '',
    start_date: '',
    end_date: '',
    daily_budget: '',

    // Step 3
    target_age_min: '25',
    target_age_max: '55',
    target_gender: 'all',
    target_locations: '',
    target_interests: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const devOptions = developments?.map((dev: any) => ({
    value: dev.id,
    label: dev.name
  })) || []

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {}

    if (step === 1) {
      if (!formData.name.trim()) newErrors.name = 'Identificador da campanha é obrigatório'
      if (!formData.type) newErrors.type = 'Selecione o canal de veiculação'
      if (!formData.objective) newErrors.objective = 'Defina o objetivo principal'
    }

    if (step === 2) {
      if (!formData.budget) newErrors.budget = 'Budget total é obrigatório'
      if (!formData.start_date) newErrors.start_date = 'Data inicial é obrigatória'
      if (!formData.end_date) newErrors.end_date = 'Data de término é obrigatória'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length))
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      toast.error('Preencha os campos obrigatórios da etapa atual.')
    }
  }

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return

    setIsSubmitting(true)

    try {
      const { error } = await supabase.from('ads_campaigns').insert({
        name: formData.name,
        type: formData.type,
        development_id: formData.development_id || null,
        objective: formData.objective,
        description: formData.description || null,
        budget: Number(formData.budget),
        start_date: formData.start_date,
        end_date: formData.end_date,
        daily_budget: formData.daily_budget ? Number(formData.daily_budget) : null,
        target_age_min: Number(formData.target_age_min),
        target_age_max: Number(formData.target_age_max),
        target_gender: formData.target_gender,
        target_locations: formData.target_locations || null,
        target_interests: formData.target_interests || null,
        status: 'draft',
        spent: 0,
        impressions: 0,
        clicks: 0,
        leads: 0,
        conversions: 0,
      })

      if (error) throw error

      toast.success('Campanha estrategizada com sucesso!')
      router.push('/backoffice/backoffice/campanhas')
    } catch (error: any) {
      console.error('Erro ao salvar:', error)
      toast.error(`Falha ao registrar campanha: ${error.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Cálculos de estimativa
  const duration = formData.start_date && formData.end_date
    ? Math.ceil((new Date(formData.end_date).getTime() - new Date(formData.start_date).getTime()) / (1000 * 60 * 60 * 24))
    : 0

  const estDaily = (duration > 0 && formData.budget)
    ? (Number(formData.budget) / duration).toFixed(2)
    : '0.00'

  return (
    <div className="space-y-6">
      <PageHeader
        title="Novo Engine de Campanha"
        subtitle="Configure os parâmetros de tração e investimentos digitais"
        breadcrumbs={[
          { name: 'Dashboard', href: '/backoffice/backoffice/dashboard' },
          { name: 'Campanhas', href: '/backoffice/backoffice/campanhas' },
          { name: 'Deploy de Campanha' },
        ]}
      />

      {/* Progress Architecture */}
      <Card className="border-none bg-transparent shadow-none">
        <CardBody className="px-0">
          <div className="flex items-center justify-between gap-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col md:flex-row items-center gap-4">
                  <div
                    className={`
                      w-12 h-12 rounded-2xl flex items-center justify-center
                      text-lg font-black transition-all duration-500 shadow-sm
                      ${currentStep > step.id
                        ? 'bg-green-500 text-white'
                        : currentStep === step.id
                          ? 'bg-accent-500 text-white scale-110 shadow-glow'
                          : 'bg-white text-imi-300 border border-imi-100'
                      }
                    `}
                  >
                    {currentStep > step.id ? <Check size={24} strokeWidth={4} /> : step.id}
                  </div>
                  <div className="hidden lg:block text-center md:text-left">
                    <p className={`text-[10px] font-black uppercase tracking-widest ${currentStep >= step.id ? 'text-imi-950' : 'text-imi-300'}`}>Fase {step.id}</p>
                    <p className={`text-sm font-bold ${currentStep >= step.id ? 'text-imi-900' : 'text-imi-400'}`}>{step.name}</p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className="flex-1 mx-6 h-1 bg-imi-100 rounded-full overflow-hidden hidden sm:block">
                    <div
                      className={`h-full transition-all duration-700 ease-smooth ${currentStep > step.id ? 'bg-green-500 w-full' : 'bg-accent-200 w-0'
                        }`}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Step Content Architecture */}
      <Card className="shadow-elevated border-imi-50">
        <CardHeader
          title={`Sessão: ${steps[currentStep - 1].name}`}
          subtitle={steps[currentStep - 1].description}
          className="bg-imi-50/50"
        />
        <CardBody className="p-8">
          {/* Step 1: Básico */}
          {currentStep === 1 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <Input
                label="Título Interno da Operação *"
                name="name"
                value={formData.name}
                onChange={handleChange}
                error={errors.name}
                placeholder="Ex: [NOME_EMPREENDIMENTO] - [CANAL] - [MES/ANO]"
                className="h-14"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Select
                  label="Canal de Tráfego Principal *"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  error={errors.type}
                  className="h-14"
                  options={[
                    { value: '', label: 'Selecione o canal' },
                    { value: 'instagram', label: 'Instagram Ads - Feed & Stories' },
                    { value: 'facebook', label: 'Facebook Ads - Rede Social' },
                    { value: 'google', label: 'Google Ads - Search & Display' },
                    { value: 'email', label: 'Email Marketing / Newsletter' },
                    { value: 'whatsapp', label: 'WhatsApp Business API' },
                  ]}
                />

                <Select
                  label="Empreendimento Vinculado"
                  name="development_id"
                  value={formData.development_id}
                  onChange={handleChange}
                  className="h-14"
                  options={[
                    { value: '', label: 'Focar na marca institucional IMI' },
                    ...devOptions,
                  ]}
                />
              </div>

              <div className="p-6 bg-accent-50/30 rounded-2xl border border-accent-100/50">
                <div className="flex items-center gap-3 mb-4">
                  <Target className="text-accent-600" size={20} />
                  <p className="text-sm font-black text-accent-700 uppercase tracking-widest">Objetivo de Performance</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {['awareness', 'traffic', 'engagement', 'leads', 'conversions'].map((obj) => (
                    <div
                      key={obj}
                      onClick={() => setFormData(prev => ({ ...prev, objective: obj }))}
                      className={`
                                cursor-pointer p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2
                                ${formData.objective === obj
                          ? 'bg-accent-500 border-accent-600 shadow-glow'
                          : 'bg-white border-imi-100 hover:border-accent-300'
                        }
                            `}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${formData.objective === obj ? 'bg-white/20 text-white' : 'bg-imi-50 text-imi-400'}`}>
                        {obj === 'awareness' && <Users size={18} />}
                        {obj === 'traffic' && <TrendingUp size={18} />}
                        {obj === 'engagement' && <TrendingUp size={18} />}
                        {obj === 'leads' && <Target size={18} />}
                        {obj === 'conversions' && <DollarSign size={18} />}
                      </div>
                      <span className={`text-[10px] font-black uppercase tracking-wider ${formData.objective === obj ? 'text-white' : 'text-imi-600'}`}>
                        {obj}
                      </span>
                    </div>
                  ))}
                </div>
                {errors.objective && <p className="text-xs text-red-500 mt-2 font-bold">{errors.objective}</p>}
              </div>

              <Textarea
                label="Briefing Estratégico (Opcional)"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                placeholder="Descreva as dores do público, o diferencial do ativo e a copy principal..."
                className="bg-imi-50/20"
              />
            </div>
          )}

          {/* Step 2: Configuração */}
          {currentStep === 2 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Input
                  label="Budget Total Estimado (R$) *"
                  name="budget"
                  type="number"
                  value={formData.budget}
                  onChange={handleChange}
                  error={errors.budget}
                  placeholder="Ex: 5000"
                  className="h-14"
                  hint="Volume total de capital alocado para esta ação"
                />

                <Input
                  label="Teto de Gasto Diário (Opcional)"
                  name="daily_budget"
                  type="number"
                  value={formData.daily_budget}
                  onChange={handleChange}
                  placeholder="Ex: 150"
                  className="h-14"
                  hint="Limite de segurança para as plataformas"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Input
                  label="Início da Veiculação *"
                  name="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={handleChange}
                  error={errors.start_date}
                  className="h-14"
                />

                <Input
                  label="Encerramento Previsto *"
                  name="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={handleChange}
                  error={errors.end_date}
                  className="h-14"
                />
              </div>

              {duration > 0 && formData.budget && (
                <div className="p-8 bg-imi-950 rounded-2xl border border-imi-800 shadow-elevated">
                  <p className="text-[10px] font-black text-accent-500 uppercase tracking-[0.2em] mb-4">Projeção IMI Intelligence</p>
                  <div className="grid grid-cols-2 gap-8 text-white">
                    <div className="space-y-1">
                      <p className="text-[10px] text-imi-400 font-bold uppercase">Janela de Tração</p>
                      <p className="text-2xl font-black">{duration} <span className="text-sm font-medium text-imi-500">dias corridos</span></p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-imi-400 font-bold uppercase">Investimento Real/Dia</p>
                      <p className="text-2xl font-black text-accent-400">R$ {estDaily}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Segmentação */}
          {currentStep === 3 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <p className="text-xs font-black text-imi-600 uppercase tracking-widest">Faixa Etária do Público</p>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      name="target_age_min"
                      type="number"
                      value={formData.target_age_min}
                      onChange={handleChange}
                      min="18"
                      max="65"
                      className="text-center font-bold"
                      hint="Idade Mín."
                    />
                    <Input
                      name="target_age_max"
                      type="number"
                      value={formData.target_age_max}
                      onChange={handleChange}
                      min="18"
                      max="65"
                      className="text-center font-bold"
                      hint="Idade Máx."
                    />
                  </div>
                </div>

                <Select
                  label="Direcionamento de Gênero"
                  name="target_gender"
                  value={formData.target_gender}
                  onChange={handleChange}
                  className="h-14"
                  options={[
                    { value: 'all', label: 'Todos os gêneros' },
                    { value: 'male', label: 'Masculino (Homenagem ao proponente)' },
                    { value: 'female', label: 'Feminino (Foco em decisão do lar)' },
                  ]}
                />
              </div>

              <Input
                label="Geolocalização Customizada"
                name="target_locations"
                value={formData.target_locations}
                onChange={handleChange}
                placeholder="Ex: Recife (Raio 10km), Boa Viagem, Caruaru, Petrolina"
                className="h-14"
                hint="Cidades, bairros ou CEPs de interesse estratégico"
              />

              <Textarea
                label="Interesses e Comportamentos (Tags)"
                name="target_interests"
                value={formData.target_interests}
                onChange={handleChange}
                rows={4}
                placeholder="Ex: Investimento Imobiliário, Luxo, Arquitetura, Beach Park, Porsche..."
                className="bg-imi-50/30"
                hint="Utilize vírgulas para separar as palavras-chave do público."
              />
            </div>
          )}
        </CardBody>

        <CardFooter className="bg-imi-50/30 p-8 border-t border-imi-100">
          <div className="flex items-center justify-between w-full">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
              icon={<ArrowLeft size={18} />}
              className="h-14 px-8 border-imi-200 text-imi-500"
            >
              Fase Anterior
            </Button>

            {currentStep < steps.length ? (
              <Button onClick={handleNext} icon={<ArrowRight size={18} />} className="h-14 px-12 shadow-glow">
                Continuar
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                loading={isSubmitting}
                icon={<Save size={18} />}
                className="h-14 px-16 shadow-glow"
              >
                Ativar Deploy de Campanha
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
