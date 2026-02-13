'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import PageHeader from '@/components/backoffice/PageHeader'
import { createClient } from '@/lib/supabase/client'
import {
  FileText,
  Download,
  Save,
  MapPin,
  User,
  Calendar,
  Layers,
  CheckCircle2,
  AlertCircle,
  Loader,
  RefreshCw,
  ExternalLink,
  ChevronLeft,
  Trash2
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'

const supabase = createClient()

export default function AvaliacaoDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [evaluation, setEvaluation] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [content, setContent] = useState('')

  const loadEvaluation = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('property_evaluations')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      setEvaluation(data)
      setContent(data.final_content || data.draft_content || '')
    } catch (error) {
      console.error('Erro ao carregar avaliação:', error)
      toast.error('Erro ao carregar os detalhes da avaliação')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadEvaluation()
  }, [loadEvaluation])

  const handleSave = async (isFinal = false) => {
    setSaving(true)
    try {
      const updates: any = {
        updated_at: new Date().toISOString()
      }

      if (isFinal) {
        updates.final_content = content
        updates.status = 'completed'
        updates.completed_at = new Date().toISOString()
      } else {
        updates.draft_content = content
        updates.status = 'draft'
      }

      const { error } = await supabase
        .from('property_evaluations')
        .update(updates)
        .eq('id', id)

      if (error) throw error

      toast.success(isFinal ? 'Laudo finalizado e concluído!' : 'Laudo salvo com sucesso!')
      if (isFinal) router.push('/backoffice/avaliacoes')
    } catch (error) {
      toast.error('Erro ao salvar laudo')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <Loader size={48} className="text-accent-500 animate-spin" />
      <p className="text-imi-500 animate-pulse font-bold uppercase tracking-widest text-xs">Carregando Laudo Técnico...</p>
    </div>
  )

  if (!evaluation) return (
    <div className="text-center py-20 px-8">
      <AlertCircle size={64} className="text-red-500 mx-auto mb-6" />
      <h2 className="text-2xl font-bold text-imi-900">Avaliação não encontrada</h2>
      <p className="text-imi-600 mt-2">O link pode estar quebrado ou o registro foi removido.</p>
      <button onClick={() => router.push('/backoffice/avaliacoes')} className="mt-8 text-accent-600 font-bold underline">Voltar para lista</button>
    </div>
  )

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20 animate-fade-in">
      <PageHeader
        title="Detalhes da Avaliação"
        description={`Ref: ${evaluation.id.substring(0, 8)}`}
        breadcrumbs={[
          { label: 'Avaliações', href: '/backoffice/avaliacoes' },
          { label: 'Detalhes' }
        ]}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/backoffice/avaliacoes')}
            className="h-12 px-6 border border-imi-100 bg-white text-imi-600 rounded-2xl font-bold flex items-center gap-2 hover:bg-imi-50 transition-all"
          >
            <ChevronLeft size={20} />
            Voltar
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={saving}
            className="h-12 px-8 bg-green-600 text-white rounded-2xl font-bold flex items-center gap-2 shadow-glow hover:bg-green-700 transition-all disabled:opacity-50"
          >
            {saving ? <Loader size={20} className="animate-spin" /> : <CheckCircle2 size={20} />}
            Finalizar Laudo
          </button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Coluna da Esquerda: Resumo e Documentos */}
        <div className="space-y-6">
          {/* Card de Informações */}
          <div className="bg-white rounded-3xl border border-imi-100 p-6 shadow-soft">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-accent-50 rounded-xl flex items-center justify-center text-accent-600">
                <MapPin size={20} />
              </div>
              <div>
                <h4 className="font-bold text-imi-900">Características</h4>
                <p className="text-[10px] text-imi-400 font-bold uppercase tracking-widest">Base do Imóvel</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-xs text-imi-400 font-bold uppercase tracking-widest block mb-1">Endereço</span>
                <p className="text-sm text-imi-800 font-medium leading-relaxed">{evaluation.property_address}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-imi-400 font-bold uppercase tracking-widest block mb-1">Tipo</span>
                  <p className="text-sm text-imi-900 font-bold">{evaluation.property_type}</p>
                </div>
                <div>
                  <span className="text-xs text-imi-400 font-bold uppercase tracking-widest block mb-1">Área</span>
                  <p className="text-sm text-imi-900 font-bold">{evaluation.property_area} m²</p>
                </div>
              </div>
              <div className="pt-4 border-t border-imi-50">
                <div className="flex items-center gap-2 text-imi-600 text-sm mb-2">
                  <User size={16} className="text-accent-600" />
                  <span className="font-bold">{evaluation.client_name}</span>
                </div>
                <div className="flex items-center gap-2 text-imi-400 text-xs">
                  <Calendar size={14} />
                  <span>Criado em {format(new Date(evaluation.created_at), "dd/MM/yyyy HH:mm")}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card de Documentos */}
          <div className="bg-white rounded-3xl border border-imi-100 p-6 shadow-soft">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                  <Layers size={20} />
                </div>
                <h4 className="font-bold text-imi-900">Anexos ({evaluation.documents?.length || 0})</h4>
              </div>
              <button className="text-xs font-bold text-accent-600">Ver todos</button>
            </div>

            <div className="space-y-3">
              {evaluation.documents?.map((doc: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 bg-imi-50/50 rounded-2xl border border-imi-50 group hover:border-accent-200 transition-all">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText size={18} className="text-imi-400" />
                    <span className="text-xs font-bold text-imi-700 truncate">{doc.name}</span>
                  </div>
                  <a href={doc.url} target="_blank" className="p-2 hover:bg-white rounded-lg transition-colors text-accent-600">
                    <ExternalLink size={14} />
                  </a>
                </div>
              ))}
              {(!evaluation.documents || evaluation.documents.length === 0) && (
                <p className="text-xs text-imi-400 text-center py-4 italic">Sem documentos anexados</p>
              )}
            </div>
          </div>

          <button className="w-full h-12 rounded-2xl border border-red-100 text-red-500 font-bold text-sm flex items-center justify-center gap-2 hover:bg-red-50 transition-colors">
            <Trash2 size={16} />
            Remover Avaliação
          </button>
        </div>

        {/* Coluna da Direita: Editor de Laudo */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-imi-100 shadow-soft overflow-hidden">
            <div className="bg-imi-50/50 p-6 border-b border-imi-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-imi-900">Conteúdo do Laudo NBR 14653</h3>
                <p className="text-[10px] text-imi-400 font-bold uppercase tracking-widest mt-0.5">Editor Master de IA</p>
              </div>
              <div className="flex gap-2">
                <button className="p-2 bg-white border border-imi-100 rounded-xl text-imi-400 hover:text-accent-600 transition-colors">
                  <RefreshCw size={18} />
                </button>
                <button className="p-2 bg-white border border-imi-100 rounded-xl text-imi-400 hover:text-accent-600 transition-colors">
                  <Download size={18} />
                </button>
              </div>
            </div>

            <div className="p-6">
              {evaluation.status === 'pending' ? (
                <div className="text-center py-20">
                  <div className="w-20 h-20 bg-accent-50 text-accent-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <RefreshCw size={32} className="animate-spin-slow" />
                  </div>
                  <h4 className="text-xl font-bold text-imi-900">Aguardando Geração</h4>
                  <p className="text-imi-600 mt-2 max-w-sm mx-auto">Esta avaliação ainda não possui um rascunho. Vá para "Nova Avaliacão" ou reinicie o processo.</p>
                </div>
              ) : (
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full h-[800px] p-8 border-none focus:ring-0 font-mono text-sm leading-relaxed text-imi-800 resize-none bg-transparent"
                  placeholder="Descreva o laudo técnico aqui..."
                />
              )}
            </div>

            <div className="bg-imi-50/30 p-4 border-t border-imi-100 flex items-center justify-between">
              <div className="text-[10px] font-bold text-imi-400 uppercase tracking-widest flex items-center gap-2">
                <span>{content.length} caracteres</span>
                <span>•</span>
                <span>{content.split(/\s+/).length} palavras</span>
              </div>
              <button
                onClick={() => handleSave(false)}
                disabled={saving}
                className="h-10 px-6 bg-white border border-imi-100 text-imi-900 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-imi-50 transition-colors shadow-sm"
              >
                {saving ? <Loader size={16} className="animate-spin" /> : <Save size={16} className="text-accent-600" />}
                Salvar Rascunho
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
