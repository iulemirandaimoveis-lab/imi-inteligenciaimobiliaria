'use client'

import { useEffect, useState } from 'react'
import PageHeader from '@/components/backoffice/PageHeader'
import { createClient } from '@/lib/supabase/client'
import {
  FileText,
  Plus,
  Search,
  MapPin,
  User,
  Calendar,
  Clock,
  ChevronRight,
  MoreVertical,
  Download,
  Trash2,
  Filter
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const supabase = createClient()

export default function AvaliacoesPage() {
  const [evaluations, setEvaluations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadEvaluations()
  }, [])

  const loadEvaluations = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('property_evaluations')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setEvaluations(data || [])
    } catch (error) {
      console.error('Erro ao carregar avaliações:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { label: string, color: string }> = {
      pending: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-700' },
      analyzing: { label: 'Analisando', color: 'bg-blue-100 text-blue-700' },
      draft: { label: 'Rascunho', color: 'bg-purple-100 text-purple-700' },
      completed: { label: 'Concluído', color: 'bg-green-100 text-green-700' },
      archived: { label: 'Arquivado', color: 'bg-gray-100 text-gray-700' }
    }
    const config = configs[status] || configs.pending
    return (
      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${config.color}`}>
        {config.label}
      </span>
    )
  }

  const filteredEvaluations = evaluations.filter(e =>
    e.property_address.toLowerCase().includes(search.toLowerCase()) ||
    e.client_name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <PageHeader
        title="Gestão de Avaliações"
        description="Laudos técnicos NBR 14653 gerados por inteligência artificial."
        breadcrumbs={[
          { label: 'Backoffice', href: '/backoffice' },
          { label: 'Avaliações' }
        ]}
      >
        <Link
          href="/backoffice/avaliacoes/nova"
          className="h-12 px-6 bg-accent-500 text-white rounded-2xl font-bold flex items-center gap-2 shadow-glow hover:shadow-glow-lg transition-all"
        >
          <Plus size={20} />
          Nova Avaliação
        </Link>
      </PageHeader>

      {/* Filters & Stats */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-imi-400" size={18} />
          <input
            type="text"
            placeholder="Buscar por endereço ou cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-12 pl-12 pr-4 bg-white border border-imi-100 rounded-2xl focus:ring-2 focus:ring-accent-500 transition-all font-medium"
          />
        </div>

        <div className="flex items-center gap-2">
          <button className="h-12 px-4 bg-white border border-imi-100 rounded-2xl text-imi-600 hover:bg-imi-50 transition-colors flex items-center gap-2 font-bold text-sm">
            <Filter size={18} />
            Filtros
          </button>
          <div className="h-12 px-6 bg-white border border-imi-100 rounded-2xl flex items-center gap-4">
            <div className="text-center">
              <span className="block text-[10px] font-bold text-imi-400 uppercase tracking-widest">Total</span>
              <span className="block text-sm font-black text-imi-900 leading-none">{evaluations.length}</span>
            </div>
            <div className="w-px h-6 bg-imi-100" />
            <div className="text-center">
              <span className="block text-[10px] font-bold text-imi-400 uppercase tracking-widest">Este Mês</span>
              <span className="block text-sm font-black text-green-600 leading-none">+{evaluations.filter(e => new Date(e.created_at).getMonth() === new Date().getMonth()).length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Evaluations List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 bg-white border border-imi-100 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : filteredEvaluations.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-imi-100 border-dashed">
          <FileText size={48} className="text-imi-200 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-imi-900">Nenhuma avaliação encontrada</h3>
          <p className="text-imi-500 mt-2">Comece criando sua primeira avaliação técnica.</p>
          <Link
            href="/backoffice/avaliacoes/nova"
            className="inline-flex items-center gap-2 mt-6 text-accent-600 font-bold hover:underline"
          >
            Clique aqui para começar
            <Plus size={16} />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvaluations.map((evaluation) => (
            <div
              key={evaluation.id}
              className="group bg-white rounded-3xl border border-imi-100 shadow-soft hover:shadow-glow-lg transition-all duration-500 overflow-hidden flex flex-col"
            >
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-4">
                  {getStatusBadge(evaluation.status)}
                  <button className="text-imi-300 hover:text-imi-900 transition-colors">
                    <MoreVertical size={20} />
                  </button>
                </div>

                <Link href={`/backoffice/avaliacoes/${evaluation.id}`} className="block">
                  <h3 className="font-bold text-imi-900 leading-tight group-hover:text-accent-600 transition-colors line-clamp-2 min-h-[3rem]">
                    {evaluation.property_address}
                  </h3>
                </Link>

                <div className="mt-6 space-y-3">
                  <div className="flex items-center gap-2 text-sm text-imi-600">
                    <User size={16} className="text-accent-600" />
                    <span>{evaluation.client_name || 'Cliente não informado'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-imi-600">
                    <Calendar size={16} className="text-accent-600" />
                    <span>{format(new Date(evaluation.created_at), "dd 'de' MMMM", { locale: ptBR })}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-imi-600">
                    <FileText size={16} className="text-accent-600" />
                    <span>{evaluation.documents?.length || 0} documentos anexados</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-imi-50 flex items-center justify-between">
                <div className="text-[10px] font-bold text-imi-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Clock size={10} />
                  Atualizado {format(new Date(evaluation.updated_at), "HH:mm")}
                </div>
                <Link
                  href={`/backoffice/avaliacoes/${evaluation.id}`}
                  className="w-10 h-10 bg-white border border-imi-100 rounded-xl flex items-center justify-center text-imi-400 group-hover:bg-accent-500 group-hover:text-white transition-all shadow-sm"
                >
                  <ChevronRight size={20} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
