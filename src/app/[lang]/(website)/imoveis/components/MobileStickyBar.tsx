'use client'

import { useState } from 'react'
import { MessageCircle } from 'lucide-react'
import { AnimatePresence } from 'framer-motion'
import LeadCaptureModal from './LeadCaptureModal'

interface MobileStickyBarProps {
    propertyName: string
    propertyId: string
    priceMin: number
    whatsappContact: string
}

export default function MobileStickyBar({ propertyName, propertyId, priceMin, whatsappContact }: MobileStickyBarProps) {
    const [modalOpen, setModalOpen] = useState(false)

    const handleSuccess = () => {
        const msg = encodeURIComponent(`Olá! Tenho interesse no ${propertyName}. Gostaria de mais informações.`)
        window.open(`https://wa.me/${whatsappContact}?text=${msg}`, '_blank')
        setModalOpen(false)
    }

    const priceDisplay = priceMin > 0
        ? `R$ ${priceMin >= 1_000_000
            ? `${(priceMin / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
            : priceMin.toLocaleString('pt-BR')}`
        : 'Consulte'

    return (
        <>
            <div
                className="fixed left-0 right-0 z-[140] lg:hidden"
                style={{
                    bottom: 0,
                    background: 'rgba(255,255,255,0.97)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    borderTop: '1px solid rgba(184,179,168,0.25)',
                    padding: '10px 16px',
                    paddingBottom: 'calc(10px + env(safe-area-inset-bottom, 0px))',
                    boxShadow: '0 -4px 20px rgba(0,0,0,0.08)',
                }}
            >
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: '25%',
                        right: '25%',
                        height: 1.5,
                        background: 'linear-gradient(90deg, transparent, #C8A44A, transparent)',
                        opacity: 0.6,
                    }}
                />
                <div className="flex items-center gap-3 max-w-lg mx-auto">
                    <div className="flex-1 min-w-0">
                        <p style={{ fontSize: 9, color: '#948F84', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', fontFamily: "var(--fu, 'Outfit', sans-serif)", margin: '0 0 1px' }}>
                            A partir de
                        </p>
                        <p style={{ fontSize: 18, fontWeight: 700, color: '#0B1928', fontFamily: "var(--fm, 'JetBrains Mono', monospace)", margin: 0, lineHeight: 1.2 }}>
                            {priceDisplay}
                        </p>
                    </div>
                    <button
                        onClick={() => setModalOpen(true)}
                        style={{
                            position: 'relative',
                            background: '#0B1928',
                            color: '#FFFFFF',
                            borderRadius: 10,
                            padding: '0 18px',
                            height: 44,
                            fontWeight: 700,
                            fontSize: 11,
                            letterSpacing: '0.07em',
                            textTransform: 'uppercase',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 7,
                            whiteSpace: 'nowrap',
                            fontFamily: "var(--fu, 'Outfit', sans-serif)",
                            overflow: 'hidden',
                            flexShrink: 0,
                        }}
                    >
                        <MessageCircle size={13} />
                        Falar com Especialista
                        <span style={{ position: 'absolute', bottom: 0, left: '15%', right: '15%', height: 1.5, background: 'linear-gradient(90deg, transparent, #C8A44A, transparent)', opacity: 0.6 }} />
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {modalOpen && (
                    <LeadCaptureModal
                        propertyName={propertyName}
                        propertyId={propertyId}
                        title="Falar com Especialista"
                        onClose={() => setModalOpen(false)}
                        onSuccess={handleSuccess}
                    />
                )}
            </AnimatePresence>
        </>
    )
}
