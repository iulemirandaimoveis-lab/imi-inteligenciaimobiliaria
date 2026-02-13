'use client'
import PageHeader from '@/components/backoffice/PageHeader'
import { Building2 } from 'lucide-react'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'

export default function NovoImovelPage() {
  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <PageHeader
        title="Novo Empreendimento"
        description="Cadastre um novo empreendimento imobiliário."
        breadcrumbs={[
          { label: 'Imóveis', href: '/backoffice/imoveis' },
          { label: 'Novo' }
        ]}
      />
      <div className="max-w-4xl mx-auto space-y-6">
        <Card title="Informações Básicas" icon={<Building2 size={20} />}>
            <div className="grid grid-cols-1 gap-6 p-6">
                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Nome do Empreendimento</label>
                    <Input placeholder="Ex: Residencial Atlantis" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Cidade</label>
                    <Input />
                    </div>
                    <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Estado</label>
                    <select className="w-full h-11 px-4 border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-card-dark focus:ring-2 focus:ring-primary/20 outline-none">
                        <option>PE</option>
                        <option>PB</option>
                        <option>SP</option>
                    </select>
                    </div>
                </div>
            </div>
        </Card>
        
        <div className="flex justify-end gap-4 pt-4">
            <Link href="/backoffice/imoveis">
                <Button variant="outline">Cancelar</Button>
            </Link>
            <Button>Salvar Empreendimento</Button>
        </div>
      </div>
    </div>
  )
}
