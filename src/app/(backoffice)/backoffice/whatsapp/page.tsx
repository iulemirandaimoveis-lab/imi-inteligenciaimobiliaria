'use client'
import PageHeader from '../../components/PageHeader'
import { MessageSquare } from 'lucide-react'

export default function WhatsAppPage() {
  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="WhatsApp Business API"
        subtitle="Central de mensagens unificada."
        breadcrumbs={[{ name: 'WhatsApp' }]}
      />
      <div className="bg-white dark:bg-card-dark rounded-2xl border border-gray-100 dark:border-white/5 p-8 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center mb-6">
          <MessageSquare size={32} className="text-green-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">WhatsApp Multi-agente</h2>
        <p className="text-gray-500">Distribuição de leads e automação de conversas.</p>
        <span className="mt-6 px-4 py-1.5 bg-gray-100 dark:bg-white/5 rounded-full text-xs font-bold text-gray-500 uppercase tracking-widest border border-gray-200 dark:border-white/10">Breve</span>
      </div>
    </div>
  )
}
