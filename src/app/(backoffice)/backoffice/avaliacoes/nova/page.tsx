'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import PageHeader from '@/components/backoffice/PageHeader'
import DocumentUploader from '@/components/backoffice/avaliacoes/DocumentUploader'
import EvaluationEditor from '@/components/backoffice/avaliacoes/EvaluationEditor'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import {
  Building2,
  Users,
  MapPin,
  FileText,
  Search,
  ChevronRight,
  ArrowLeft
} from 'lucide-react'

const supabase = createClient()

export default function NovaAvaliacaoPage() {
  const router = useRouter()
  const [evaluationId, setEvaluationId] = useState<string | null>(null)
  const [step, setStep] = useState<'info' | 'documents' | 'generate'>('info')
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    property_address: '',
    property_type: 'apartment',
    property_area: '',
    bedrooms: '',
    bathrooms: '',
    city: '',
    state: 'PE',
    client_name: '',
    client_email: '',
    client_phone: ''
  })
  const [documents, setDocuments] = useState<any[]>([])

  const handleCreateEvaluation = async () => {
    if (!formData.property_address || !formData.client_name) {
      toast.error('Preencha os campos obrigatórios')
      return
    }

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()

      const { data, error } = await supabase
        .from('property_evaluations')
        .insert({
          ...formData,
          property_area: formData.property_area ? parseFloat(formData.property_area) : null,
          bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
          bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : null,
          status: 'pending',
          created_by: user?.id
        })
        .select()
        .single()

      if (error) throw error

      setEvaluationId(data.id)
      setStep('documents')
      toast.success('Avaliação criada com sucesso!')
    } catch (error: any) {
      console.error('Erro ao criar avaliação:', error)
      toast.error('Erro ao criar avaliação base')
    } finally {
      setLoading(false)
    }
  }

  const handleDocumentsUploaded = (files: any[]) => {
    setDocuments(files)
  }

  const handleSaveContent = async (content: string) => {
    if (!evaluationId) return

    try {
      const { error } = await supabase
        .from('property_evaluations')
        .update({
          draft_content: content,
          status: 'draft',
          documents: documents.map(d => ({ url: d.url, name: d.name, type: d.type })),
          generated_at: new Date().toISOString()
        })
        .eq('id', evaluationId)

      if (error) throw error

      toast.success('Laudo salvo como rascunho!')
      router.push(`/backoffice/avaliacoes`)
    } catch (error) {
      toast.error('Erro ao salvar conteúdo do laudo')
    }
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20">
      <PageHeader
        title="Nova Avaliação Técnica"
        description="Sistema de geração de laudos NBR 14653 com inteligência artificial."
        breadcrumbs={[
          { label: 'Backoffice', href: '/backoffice' },
          { label: 'Avaliações', href: '/backoffice/avaliacoes' },
          { label: 'Nova' }
        ]}
      />

      {/* Progress Stepper */}
      <div className="flex items-center justify-center py-4">
        {[
          { key: 'info', label: 'Dados Iniciais', icon: Search },
          { key: 'documents', label: 'Documentação', icon: FileText },
          { key: 'generate', label: 'Geração IA', icon: Building2 }
        ].map((s, index, arr) => (
          <div key={s.key} className="flex items-center">
            <div className="flex flex-col items-center gap-2">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${step === s.key
                  ? 'bg-accent-500 text-white shadow-glow scale-110'
                  : index < arr.findIndex(st => st.key === step)
                    ? 'bg-green-500 text-white'
                    : 'bg-white border border-imi-100 text-imi-300'
                }`}>
                <s.icon size={20} />
              </div>
              <span className={`text-[10px] uppercase font-bold tracking-widest ${step === s.key ? 'text-accent-600' : 'text-imi-400'
                }`}>
                {s.label}
              </span>
            </div>
            {index < arr.length - 1 && (
              <div className="w-16 h-px bg-imi-100 mx-4" />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Info Form */}
      {step === 'info' && (
        <div className="bg-white rounded-3xl border border-imi-100 shadow-soft overflow-hidden animate-slide-up">
          <div className="bg-imi-50/50 p-8 border-b border-imi-100">
            <h3 className="text-xl font-bold text-imi-900 flex items-center gap-3">
              <MapPin className="text-accent-600" />
              Informações do Imóvel
            </h3>
            <p className="text-sm text-imi-600 mt-1">Preencha os dados básicos para contextualizar a IA.</p>
          </div>

          <div className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Coluna 1: Imóvel */}
              <div className="space-y-6">
                <h4 className="text-xs font-black text-imi-400 uppercase tracking-widest">Características</h4>

                <div>
                  <label className="block text-sm font-bold text-imi-700 mb-2">Tipo de Imóvel</label>
                  <select
                    value={formData.property_type}
                    onChange={(e) => setFormData({ ...formData, property_type: e.target.value })}
                    className="w-full h-12 px-4 bg-imi-50 border-none rounded-2xl focus:ring-2 focus:ring-accent-500 transition-all font-medium"
                  >
                    <option value="apartment">Apartamento</option>
                    <option value="house">Casa Residencial</option>
                    <option value="commercial">Comercial / Sala</option>
                    <option value="land">Terreno / Lote</option>
                    <option value="industrial">Galpão / Industrial</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-imi-700 mb-2">Endereço Completo *</label>
                  <textarea
                    value={formData.property_address}
                    onChange={(e) => setFormData({ ...formData, property_address: e.target.value })}
                    className="w-full h-24 p-4 bg-imi-50 border-none rounded-2xl focus:ring-2 focus:ring-accent-500 transition-all font-medium"
                    placeholder="Av. Boa Viagem, 1000 - Edifício Atlante"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-imi-600 mb-2">Área (m²)</label>
                    <input
                      type="number"
                      value={formData.property_area}
                      onChange={(e) => setFormData({ ...formData, property_area: e.target.value })}
                      className="w-full h-12 px-4 bg-imi-50 border-none rounded-2xl"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-imi-600 mb-2">Quartos</label>
                    <input
                      type="number"
                      value={formData.bedrooms}
                      onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
                      className="w-full h-12 px-4 bg-imi-50 border-none rounded-2xl"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-imi-600 mb-2">Banheiros</label>
                    <input
                      type="number"
                      value={formData.bathrooms}
                      onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
                      className="w-full h-12 px-4 bg-imi-50 border-none rounded-2xl"
                    />
                  </div>
                </div>
              </div>

              {/* Coluna 2: Cliente */}
              <div className="space-y-6">
                <h4 className="text-xs font-black text-imi-400 uppercase tracking-widest">Contratante</h4>

                <div>
                  <label className="block text-sm font-bold text-imi-700 mb-2">Nome do Cliente *</label>
                  <input
                    type="text"
                    value={formData.client_name}
                    onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                    className="w-full h-12 px-4 bg-imi-50 border-none rounded-2xl"
                    placeholder="Nome Completo ou Empresa"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-imi-700 mb-2">E-mail</label>
                  <input
                    type="email"
                    value={formData.client_email}
                    onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
                    className="w-full h-12 px-4 bg-imi-50 border-none rounded-2xl"
                    placeholder="contato@cliente.com.br"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-imi-700 mb-2">WhatsApp / Telefone</label>
                  <input
                    type="tel"
                    value={formData.client_phone}
                    onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })}
                    className="w-full h-12 px-4 bg-imi-50 border-none rounded-2xl"
                    placeholder="(81) 99999-9999"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end border-t border-imi-50 pt-8">
              <button
                onClick={handleCreateEvaluation}
                disabled={loading}
                className="h-14 px-10 bg-accent-500 text-white rounded-2xl font-bold flex items-center gap-3 shadow-glow hover:shadow-glow-lg transition-all disabled:opacity-50"
              >
                {loading ? 'Criando...' : 'Próximo: Documentação'}
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Documents */}
      {step === 'documents' && evaluationId && (
        <div className="animate-slide-up space-y-6">
          <div className="bg-white rounded-3xl border border-imi-100 p-8">
            <DocumentUploader
              evaluationId={evaluationId}
              onFilesUploaded={handleDocumentsUploaded}
            />
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setStep('info')}
              className="h-12 px-8 flex items-center gap-2 text-imi-500 font-bold hover:text-imi-900 transition-colors"
            >
              <ArrowLeft size={20} />
              Voltar para Informações
            </button>
            <button
              onClick={() => setStep('generate')}
              disabled={documents.length === 0}
              className="h-14 px-10 bg-accent-500 text-white rounded-2xl font-bold flex items-center gap-3 shadow-glow hover:shadow-glow-lg transition-all disabled:opacity-50"
            >
              Gerar Laudo IA
              <Sparkles size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Editor */}
      {step === 'generate' && evaluationId && (
        <div className="animate-slide-up">
          <EvaluationEditor
            evaluationId={evaluationId}
            documents={documents}
            propertyData={{
              address: formData.property_address,
              type: formData.property_type,
              area: formData.property_area ? parseFloat(formData.property_area) : undefined,
              bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : undefined,
              bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : undefined,
              city: formData.city,
              state: formData.state
            }}
            onSave={handleSaveContent}
          />
        </div>
      )}
    </div>
  )
}
