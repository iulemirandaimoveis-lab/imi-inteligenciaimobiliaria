'use client'
import React from 'react'
import { useLead } from '@/hooks/use-leads-complete'
import PageHeader from '@/components/backoffice/PageHeader'
import InteractionsTimeline from '@/components/backoffice/leads/InteractionsTimeline'
import { Mail, Phone, DollarSign, Building2, TrendingUp, User, Calendar } from 'lucide-react'
import { format } from 'date-fns'

export default function LeadDetailsPage({ params }: { params: { id: string } }) {
  const { lead, isLoading } = useLead(params.id)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!lead) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-gray-400">
        <User size={48} className="mb-4 opacity-50" />
        <p>Lead não encontrado</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        title={lead.name}
        description={`Status: ${lead.status.toUpperCase()}`}
        breadcrumbs={[
          { label: 'Leads', href: '/backoffice/leads' },
          { label: 'Pipeline', href: '/backoffice/leads/pipeline' },
          { label: lead.name }
        ]}
      />

      {/* Info Card */}
      <div className="bg-white dark:bg-card-dark rounded-2xl border border-gray-100 dark:border-white/5 p-8 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

          {/* Contact Info */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-gray-100 pb-2">Contato</h4>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/10 flex items-center justify-center text-blue-600">
                <Mail size={18} />
              </div>
              <div>
                <div className="text-xs text-gray-500">E-mail</div>
                <div className="font-medium text-gray-900 dark:text-gray-200 truncate max-w-[200px]" title={lead.email}>{lead.email || '-'}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-50 dark:bg-green-900/10 flex items-center justify-center text-green-600">
                <Phone size={18} />
              </div>
              <div>
                <div className="text-xs text-gray-500">Telefone</div>
                <div className="font-medium text-gray-900 dark:text-gray-200">{lead.phone || '-'}</div>
              </div>
            </div>
          </div>

          {/* Business Info */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-gray-100 pb-2">Negócio</h4>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-yellow-50 dark:bg-yellow-900/10 flex items-center justify-center text-yellow-600">
                <DollarSign size={18} />
              </div>
              <div>
                <div className="text-xs text-gray-500">Capital</div>
                <div className="font-medium text-gray-900 dark:text-gray-200">
                  {lead.capital ? new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                    minimumFractionDigits: 0
                  }).format(lead.capital) : '-'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-50 dark:bg-purple-900/10 flex items-center justify-center text-purple-600">
                <Building2 size={18} />
              </div>
              <div>
                <div className="text-xs text-gray-500">Interesse</div>
                <div className="font-medium text-gray-900 dark:text-gray-200">{lead.interest || '-'}</div>
              </div>
            </div>
          </div>

          {/* Score & Source */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-gray-100 pb-2">Qualificação</h4>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${lead.score >= 80 ? 'bg-green-100 text-green-600' :
                  lead.score >= 50 ? 'bg-yellow-100 text-yellow-600' :
                    'bg-red-100 text-red-600'
                }`}>
                <TrendingUp size={18} />
              </div>
              <div>
                <div className="text-xs text-gray-500">Score</div>
                <div className="font-bold text-xl text-gray-900 dark:text-gray-200">{lead.score} / 100</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-500">
                <Calendar size={18} />
              </div>
              <div>
                <div className="text-xs text-gray-500">Data Cadastro</div>
                <div className="font-medium text-gray-900 dark:text-gray-200">
                  {format(new Date(lead.created_at), 'dd/MM/yyyy')}
                </div>
              </div>
            </div>
          </div>

          {/* Tags & Message */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-gray-100 pb-2">Detalhes</h4>

            {lead.tags && lead.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {lead.tags.map(tag => (
                  <span key={tag} className="px-2 py-1 bg-gray-100 dark:bg-white/10 text-xs rounded-md text-gray-600 dark:text-gray-300">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {lead.message && (
              <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-lg text-sm text-gray-600 dark:text-gray-300 italic">
                "{lead.message}"
              </div>
            )}

            {lead.source && (
              <div className="text-xs text-gray-400">
                Origem: <span className="font-medium text-gray-600 dark:text-gray-300">{lead.source}</span>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Interactions */}
      <InteractionsTimeline leadId={params.id} />
    </div>
  )
}
