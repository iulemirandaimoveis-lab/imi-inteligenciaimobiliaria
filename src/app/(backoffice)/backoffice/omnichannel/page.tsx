'use client'

import { Layers, MessageSquare, Mail, Phone, Instagram } from 'lucide-react'

const T = {
    surface: 'var(--bo-surface)',
    elevated: 'var(--bo-elevated)',
    border: 'var(--bo-border)',
    borderGold: 'var(--bo-border-gold)',
    text: 'var(--bo-text)',
    textMuted: 'var(--bo-text-muted)',
    gold: '#C49D5B',
}

const channels = [
    { name: 'WhatsApp', icon: MessageSquare, status: 'Ativo', color: '#25D366' },
    { name: 'E-mail', icon: Mail, status: 'Ativo', color: '#4A90D9' },
    { name: 'Telefone', icon: Phone, status: 'Em breve', color: '#8B93A7' },
    { name: 'Instagram', icon: Instagram, status: 'Em breve', color: '#E1306C' },
]

export default function OmniChannelPage() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-xl sm:text-2xl font-bold" style={{ color: T.text }}>
                    Omni Channel
                </h1>
                <p className="text-sm mt-1" style={{ color: T.textMuted }}>
                    Central unificada de comunicação com leads e clientes.
                </p>
            </div>

            {/* Channels Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {channels.map(ch => (
                    <div
                        key={ch.name}
                        className="rounded-2xl p-5 flex items-center gap-4"
                        style={{
                            background: T.elevated,
                            border: `1px solid ${T.borderGold}`,
                        }}
                    >
                        <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: `${ch.color}15` }}
                        >
                            <ch.icon size={22} style={{ color: ch.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold" style={{ color: T.text }}>
                                {ch.name}
                            </p>
                            <p className="text-xs mt-0.5" style={{ color: T.textMuted }}>
                                Canal de comunicação
                            </p>
                        </div>
                        <span
                            className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full"
                            style={{
                                background: ch.status === 'Ativo' ? 'rgba(107,184,123,0.12)' : 'rgba(139,147,167,0.12)',
                                color: ch.status === 'Ativo' ? '#6BB87B' : '#8B93A7',
                            }}
                        >
                            {ch.status}
                        </span>
                    </div>
                ))}
            </div>

            {/* Coming Soon Notice */}
            <div
                className="rounded-2xl p-6 text-center"
                style={{
                    background: T.elevated,
                    border: `1px solid ${T.borderGold}`,
                }}
            >
                <Layers size={40} className="mx-auto mb-3" style={{ color: T.gold, opacity: 0.5 }} />
                <h3 className="text-base font-semibold mb-1" style={{ color: T.text }}>
                    Central Omni Channel
                </h3>
                <p className="text-sm max-w-md mx-auto" style={{ color: T.textMuted }}>
                    Integração unificada de todos os canais de comunicação em uma única interface.
                    Gerencie WhatsApp, e-mail, telefone e redes sociais em um só lugar.
                </p>
            </div>
        </div>
    )
}
