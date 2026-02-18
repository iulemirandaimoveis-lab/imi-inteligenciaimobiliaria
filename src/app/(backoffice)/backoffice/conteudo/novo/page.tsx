'use client'
import PageHeader from '@/components/backoffice/PageHeader'
import { FileText } from 'lucide-react'

export default function NovoConteudoPage() {
  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Novo Conteúdo"
        breadcrumbs={[
          { label: 'Conteúdo', href: '/backoffice/conteudo' },
          { label: 'Novo' }
        ]}
      />
      <div className="bg-white dark:bg-card-dark rounded-2xl border border-gray-100 dark:border-white/5 p-8 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
            <FileText size={32} className="text-primary" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Editor de Conteúdo</h2>
        <p className="text-gray-500">Interface de criação de posts e artigos ricos.</p>
        <span className="mt-6 px-4 py-1.5 bg-gray-100 dark:bg-white/5 rounded-full text-xs font-bold text-gray-500 uppercase tracking-widest border border-gray-200 dark:border-white/10">Breve</span>
      </div>
    </div>
  )
}
