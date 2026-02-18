'use client'
import PageHeader from '@/components/backoffice/PageHeader'
import { Phone } from 'lucide-react'

export default function NovaConsultoriaPage() {
  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Nova Consultoria"
        breadcrumbs={[
          { label: 'Consultorias', href: '/backoffice/consultorias' },
          { label: 'Nova' }
        ]}
      />
      <div className="bg-white dark:bg-card-dark rounded-2xl border border-gray-100 dark:border-white/5 p-8 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
            <Phone size={32} className="text-primary" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Solicitação de Suporte</h2>
        <p className="text-gray-500">Formulário de abertura de chamado.</p>
        <span className="mt-6 px-4 py-1.5 bg-gray-100 dark:bg-white/5 rounded-full text-xs font-bold text-gray-500 uppercase tracking-widest border border-gray-200 dark:border-white/10">Breve</span>
      </div>
    </div>
  )
}
