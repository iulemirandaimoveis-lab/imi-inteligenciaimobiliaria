'use client'
import PageHeader from '@/components/backoffice/PageHeader'
import { TrendingUp } from 'lucide-react'

export default function PipelinePage() {
  const stages = [
    { name: 'Novo', count: 45, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
    { name: 'Contato', count: 23, color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' },
    { name: 'Proposta', count: 12, color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
    { name: 'Ganho', count: 34, color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  ]

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Pipeline de Leads"
        description="Funil comercial dividido por etapas de negociação."
        breadcrumbs={[
          { label: 'Leads', href: '/backoffice/leads' },
          { label: 'Pipeline' }
        ]}
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stages.map((stage) => (
          <div key={stage.name} className="bg-white dark:bg-card-dark rounded-2xl border border-gray-100 dark:border-white/5 p-6 shadow-soft">
            <div className={`inline-flex px-3 py-1 rounded-lg text-xs font-bold mb-4 uppercase tracking-wider ${stage.color}`}>
              {stage.name}
            </div>
            <div className="text-3xl font-display font-bold text-gray-900 dark:text-white">{stage.count}</div>
          </div>
        ))}
      </div>
      <div className="bg-white dark:bg-card-dark rounded-2xl border border-gray-100 dark:border-white/5 p-8 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
            <TrendingUp size={32} className="text-primary" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Kanban Board</h2>
        <p className="text-gray-500">Visualização em colunas para gestão de oportunidades.</p>
        <span className="mt-6 px-4 py-1.5 bg-gray-100 dark:bg-white/5 rounded-full text-xs font-bold text-gray-500 uppercase tracking-widest border border-gray-200 dark:border-white/10">Breve</span>
      </div>
    </div>
  )
}
