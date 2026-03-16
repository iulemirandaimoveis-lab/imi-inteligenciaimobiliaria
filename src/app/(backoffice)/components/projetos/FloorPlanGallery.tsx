'use client'

import { Bed, Bath, Car, Ruler } from 'lucide-react'
import { T } from '@/app/(backoffice)/lib/theme'

interface FloorPlan {
    tipo: string
    area_privativa?: number
    quartos?: number
    suites?: number
    vagas?: number
    imagem_descricao?: string
    imagem_url?: string
}

interface FloorPlanGalleryProps {
    plantas: FloorPlan[]
}

function fmtPrice(v: number | undefined) {
    if (!v) return '—'
    if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1).replace('.', ',')}M`
    if (v >= 1_000) return `R$ ${Math.floor(v / 1_000)}k`
    return `R$ ${v.toLocaleString('pt-BR')}`
}

export default function FloorPlanGallery({ plantas }: FloorPlanGalleryProps) {
    if (!plantas || plantas.length === 0) {
        return (
            <div className="text-center py-12" style={{ color: T.textMuted }}>
                <Ruler size={32} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">Nenhuma planta cadastrada</p>
                <p className="text-xs mt-1">Importe um PDF da construtora para extrair plantas automaticamente</p>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plantas.map((planta, i) => (
                <div
                    key={i}
                    className="rounded-2xl overflow-hidden"
                    style={{ background: T.elevated, border: `1px solid ${T.border}` }}
                >
                    {/* Image or placeholder */}
                    {planta.imagem_url ? (
                        <img src={planta.imagem_url} alt={planta.tipo} className="w-full h-40 object-cover" />
                    ) : (
                        <div
                            className="w-full h-40 flex items-center justify-center"
                            style={{ background: `${T.accent}10` }}
                        >
                            <Ruler size={40} style={{ color: T.accent, opacity: 0.3 }} />
                        </div>
                    )}

                    {/* Info */}
                    <div className="p-4">
                        <h3 className="text-sm font-bold mb-3" style={{ color: T.text }}>{planta.tipo}</h3>

                        <div className="grid grid-cols-2 gap-2">
                            {planta.area_privativa && (
                                <div className="flex items-center gap-1.5">
                                    <Ruler size={11} style={{ color: T.accent }} />
                                    <span className="text-xs" style={{ color: T.textMuted }}>{planta.area_privativa} m²</span>
                                </div>
                            )}
                            {planta.quartos != null && (
                                <div className="flex items-center gap-1.5">
                                    <Bed size={11} style={{ color: T.accent }} />
                                    <span className="text-xs" style={{ color: T.textMuted }}>{planta.quartos} quartos</span>
                                </div>
                            )}
                            {planta.suites != null && (
                                <div className="flex items-center gap-1.5">
                                    <Bath size={11} style={{ color: T.accent }} />
                                    <span className="text-xs" style={{ color: T.textMuted }}>{planta.suites} suítes</span>
                                </div>
                            )}
                            {planta.vagas != null && (
                                <div className="flex items-center gap-1.5">
                                    <Car size={11} style={{ color: T.accent }} />
                                    <span className="text-xs" style={{ color: T.textMuted }}>{planta.vagas} vagas</span>
                                </div>
                            )}
                        </div>

                        {planta.imagem_descricao && (
                            <p className="text-[10px] mt-2 leading-relaxed" style={{ color: T.textDim }}>
                                {planta.imagem_descricao}
                            </p>
                        )}
                    </div>
                </div>
            ))}
        </div>
    )
}
