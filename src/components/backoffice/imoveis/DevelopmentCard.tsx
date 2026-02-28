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
    const price = development.price_from || 0

    return (
        <div className="group relative bg-white dark:bg-[#0A0B0D] rounded-3xl border border-imi-100 dark:border-white/5 shadow-sm hover:shadow-2xl hover:shadow-imi-950/10 transition-all duration-500 overflow-hidden flex flex-col h-full hover:-translate-y-2">
            {/* Image Area - Pure Authority */}
            <div className="relative h-64 overflow-hidden bg-imi-50 dark:bg-black">
                {onSelect && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onSelect();
                        }}
                        className={`absolute top-6 right-6 z-20 w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${isSelected
                            ? 'bg-imi-500 border-imi-500 text-white shadow-lg scale-110'
                            : 'bg-white/10 border-white/20 backdrop-blur-md hover:bg-white/20'
                            }`}
                    >
                        {isSelected && <div className="w-4 h-4 bg-white rounded-full shadow-inner" />}
                    </button>
                )}

                {development.images?.main ? (
                    <Image
                        src={development.images.main}
                        alt={development.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-1000"
                    />
                ) : (
                    <div className="flex items-center justify-center h-full text-imi-200">
                        <Building2 size={48} strokeWidth={1} />
                    </div>
                )}

                <div className="absolute top-6 left-6">
                    <span className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-[0.2em] border backdrop-blur-md shadow-sm ${statusColors[development.status] || 'bg-white/90 text-gray-500'}`}>
                        {development.status === 'launch' ? 'Lançamento' : development.status === 'ready' ? 'Pronto' : 'Em Obras'}
                    </span>
                </div>

                <div className="absolute inset-x-0 bottom-0 p-8 bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-24">
                    <h3 className="text-white font-display font-bold text-xl leading-tight mb-2 truncate">{development.name}</h3>
                    <div className="flex items-center text-white/70 text-[11px] font-bold uppercase tracking-widest">
                        <MapPin size={12} className="mr-2 text-imi-500" />
                        {development.neighborhood || 'Bairro'}, {development.city || 'Cidade'}
                    </div>
                </div>
            </div>

            {/* Content Area - Data Focused */}
            <div className="p-8 flex flex-col flex-1">
                <div className="grid grid-cols-3 gap-3 mb-10">
                    <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-imi-50/50 dark:bg-white/5 border border-imi-50 dark:border-white/5 group-hover:bg-white transition-colors duration-300">
                        <Bed size={16} className="mb-2 text-imi-600" strokeWidth={1.5} />
                        <span className="text-[11px] font-bold text-imi-900">{bedrooms} <span className="text-imi-400 font-medium">DORM</span></span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-imi-50/50 dark:bg-white/5 border border-imi-50 dark:border-white/5 group-hover:bg-white transition-colors duration-300">
                        <Car size={16} className="mb-2 text-imi-600" strokeWidth={1.5} />
                        <span className="text-[11px] font-bold text-imi-900">{parking} <span className="text-imi-400 font-medium">VAGAS</span></span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-imi-50/50 dark:bg-white/5 border border-imi-50 dark:border-white/5 group-hover:bg-white transition-colors duration-300">
                        <ArrowUpRight size={16} className="mb-2 text-imi-600" strokeWidth={1.5} />
                        <span className="text-[11px] font-bold text-imi-900">{area} <span className="text-imi-400 font-medium">M²</span></span>
                    </div>
                </div>

                <div className="mt-auto space-y-8">
                    <div className="flex justify-between items-end">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-imi-400 uppercase tracking-widest leading-none mb-3">Valor Institucional</span>
                            <span className="text-2xl font-display font-bold text-imi-950 tabular-nums leading-none">
                                {price ? formatCurrency(price) : 'Sob Consulta'}
                            </span>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-imi-50 flex items-center justify-center text-imi-600">
                            <ArrowUpRight size={18} />
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={onEdit}
                            className="flex-1 h-12 bg-[#0A0B0D] hover:bg-black text-white rounded-xl text-xs font-bold uppercase tracking-[0.2em] transition-all duration-300 shadow-lg shadow-black/10 flex items-center justify-center"
                        >
                            <Edit size={14} className="mr-3 text-imi-400" /> Gerenciar
                        </button>
                        <button
                            onClick={onDelete}
                            className="w-12 h-12 flex items-center justify-center rounded-xl border border-red-100 text-red-400 hover:bg-red-500 hover:text-white transition-all duration-300"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
