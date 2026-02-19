'use client'

import { useRouter } from 'next/navigation'
import { Plus, Building2, MapPin, TrendingUp, Users } from 'lucide-react'

const PROJETOS = [
    {
        id: 1,
        nome: 'Reserva Atlantis',
        tipo: 'Loteamento Premium',
        localizacao: 'Catuama / Goiana',
        status: 'estruturacao',
        statusLabel: 'Estruturação',
        vgv: 480000000,
        captacao: 42000000,
        captacaoAlvo: 120000000,
        unidades: 320,
        avatar: 'RA',
        color: 'bg-blue-600',
    }
]

export default function ProjetosPage() {
    const router = useRouter()

    const formatCurrency = (v: number) =>
        v >= 1000000 ? `R$ ${(v / 1000000).toFixed(0)}M` : `R$ ${(v / 1000).toFixed(0)}K`

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Projetos Estruturados</h1>
                    <p className="text-sm text-gray-600 mt-1">Gestão de VGV, captação e milestones</p>
                </div>
                <button className="flex items-center gap-2 h-11 px-5 bg-accent-600 text-white rounded-xl text-sm font-medium hover:bg-accent-700 transition-colors">
                    <Plus size={16} />
                    Novo Projeto
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {PROJETOS.map(projeto => (
                    <div
                        key={projeto.id}
                        onClick={() => router.push(`/backoffice/projetos/${projeto.id}`)}
                        className="group bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-sm transition-all cursor-pointer"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className={`w-12 h-12 ${projeto.color} rounded-xl flex items-center justify-center text-white font-bold text-lg`}>
                                {projeto.avatar}
                            </div>
                            <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium">
                                {projeto.statusLabel}
                            </span>
                        </div>

                        <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-accent-600 transition-colors">
                            {projeto.nome}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
                            <MapPin size={14} />
                            {projeto.localizacao}
                        </div>

                        <div className="space-y-4">
                            <div>
                                <div className="flex items-center justify-between text-xs mb-1.5">
                                    <span className="text-gray-500 font-medium">Captação</span>
                                    <span className="text-gray-900 font-bold">{((projeto.captacao / projeto.captacaoAlvo) * 100).toFixed(0)}%</span>
                                </div>
                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-accent-500 rounded-full"
                                        style={{ width: `${(projeto.captacao / projeto.captacaoAlvo) * 100}%` }}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <div>
                                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-0.5">VGV Alvo</p>
                                    <p className="text-sm font-bold text-gray-900">{formatCurrency(projeto.vgv)}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-0.5">Captado</p>
                                    <p className="text-sm font-bold text-green-600">{formatCurrency(projeto.captacao)}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
