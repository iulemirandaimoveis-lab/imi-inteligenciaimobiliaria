import { Development } from '@/types/development'
import { Edit, Trash2, MapPin, Building2, Car, Bed, Bath, ArrowUpRight } from 'lucide-react'
import Image from 'next/image'
import Button from '@/components/ui/Button'
import { formatCurrency } from '@/lib/utils'

interface DevelopmentCardProps {
    development: Development
    onEdit: () => void
    onDelete: () => void
    onSelect?: () => void
    isSelected?: boolean
}

export default function DevelopmentCard({ development, onEdit, onDelete, onSelect, isSelected }: DevelopmentCardProps) {
    const statusColors: Record<string, string> = {
        launch: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
        ready: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
        under_construction: 'bg-primary/10 text-primary dark:text-primary border-primary/20'
    }

    // Safely handle potentially undefined specs
    const specs = development.specs || {}
    const bedrooms = specs.bedrooms || development.bedrooms || '-'
    const parking = specs.parking_spots || development.parking_spaces || specs.parking || '-'
    const area = specs.area || development.area_from || '-'

    // Handle price safely
    const price = development.price_min || development.price_from || 0

    return (
        <div className="group relative bg-white dark:bg-card-dark rounded-2xl border border-gray-200 dark:border-white/5 shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden flex flex-col h-full hover:-translate-y-1">
            {/* Image Area */}
            <div className="relative h-64 overflow-hidden bg-gray-100 dark:bg-card-darker">
                {onSelect && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onSelect();
                        }}
                        className={`absolute top-4 right-4 z-20 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${isSelected
                            ? 'bg-primary border-primary text-background-dark shadow-glow scale-110'
                            : 'bg-white/10 border-white/30 backdrop-blur-md hover:bg-white/20'
                            }`}
                    >
                        {isSelected && <div className="w-3 h-3 bg-background-dark rounded-full" />}
                    </button>
                )}

                {development.images?.main ? (
                    <Image
                        src={development.images.main}
                        alt={development.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-300 dark:text-gray-700">
                        <Building2 size={48} strokeWidth={1} />
                    </div>
                )}

                <div className="absolute top-4 left-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border backdrop-blur-md ${statusColors[development.status] || 'bg-gray-100 text-gray-500'}`}>
                        {development.status === 'launch' ? 'Lançamento' : development.status === 'ready' ? 'Pronto' : 'Em Obras'}
                    </span>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background-dark via-background-dark/80 to-transparent pt-12">
                    <h3 className="text-white font-bold text-lg leading-tight mb-1 truncate font-display">{development.name}</h3>
                    <div className="flex items-center text-gray-300 text-xs">
                        <MapPin size={12} className="mr-1 text-primary" />
                        {development.neighborhood || 'Bairro'}, {development.city || 'Cidade'}
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="p-5 flex flex-col flex-1">
                <div className="grid grid-cols-3 gap-2 mb-6">
                    <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                        <Bed size={16} className="mb-1 text-primary" />
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{bedrooms} <span className="text-[9px] font-normal text-gray-400">dorms</span></span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                        <Car size={16} className="mb-1 text-primary" />
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{parking} <span className="text-[9px] font-normal text-gray-400">vagas</span></span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                        <ArrowUpRight size={16} className="mb-1 text-primary" />
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{area} <span className="text-[9px] font-normal text-gray-400">m²</span></span>
                    </div>
                </div>

                <div className="mt-auto pt-4 border-t border-gray-100 dark:border-white/5">
                    <div className="mb-4">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">A partir de</span>
                        <span className="text-xl font-bold text-text-header-light dark:text-white font-display">
                            {price ? formatCurrency(price) : 'Sob Consulta'}
                        </span>
                    </div>

                    <div className="flex gap-2">
                        <Button onClick={onEdit} className="flex-1 h-10 border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 text-gray-700 dark:text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all">
                            <Edit size={14} className="mr-2" /> Editar
                        </Button>
                        <button onClick={onDelete} className="w-10 h-10 flex items-center justify-center rounded-xl border border-red-200 dark:border-red-900/30 text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
