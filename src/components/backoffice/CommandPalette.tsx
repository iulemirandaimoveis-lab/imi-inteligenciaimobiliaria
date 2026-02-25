'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Command } from 'cmdk'
import {
    Calculator,
    Calendar,
    CreditCard,
    Settings,
    User,
    Search,
    LayoutDashboard,
    Building2,
    Users,
    BarChart3,
    Sparkles,
    MousePointerClick,
    FileText,
    PieChart,
    Layers,
    MessageSquare,
    Command as CommandIcon
} from 'lucide-react'

export function CommandPalette() {
    const [open, setOpen] = React.useState(false)
    const router = useRouter()

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                setOpen((open) => !open)
            }
        }

        document.addEventListener('keydown', down)
        return () => document.removeEventListener('keydown', down)
    }, [])

    const runCommand = React.useCallback((command: () => unknown) => {
        setOpen(false)
        command()
    }, [])

    if (!open) return null

    const itemClass = "flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-colors"

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] animate-in fade-in duration-200"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
            <Command className="w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
                style={{ background: 'var(--bo-elevated)', border: '1px solid var(--bo-border)' }}>
                <div className="flex items-center px-4" style={{ borderBottom: '1px solid var(--bo-border)' }}>
                    <Search className="mr-2 h-5 w-5 shrink-0 opacity-50" style={{ color: 'var(--bo-text-muted)' }} />
                    <Command.Input
                        placeholder="Busque por páginas, leads ou comandos..."
                        className="flex h-16 w-full rounded-md bg-transparent py-3 text-lg outline-none disabled:cursor-not-allowed disabled:opacity-50"
                        style={{ color: 'var(--bo-text)' }}
                    />
                    <div className="text-xs px-2 py-1 rounded" style={{ color: 'var(--bo-text-muted)', border: '1px solid var(--bo-border)', background: 'var(--bo-surface)' }}>ESC</div>
                </div>

                <Command.List className="max-h-[60vh] overflow-y-auto overflow-x-hidden py-2 px-2 custom-scrollbar">
                    <Command.Empty className="py-12 text-center text-sm" style={{ color: 'var(--bo-text-muted)' }}>
                        Nenhum resultado encontrado.
                    </Command.Empty>

                    <Command.Group heading="Sugestões" className="px-2 pb-2 text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--bo-text-muted)' }}>
                        {[
                            { href: '/backoffice/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
                            { href: '/backoffice/leads', icon: Users, label: 'Gestão de Leads' },
                            { href: '/backoffice/imoveis', icon: Building2, label: 'Portfólio de Imóveis' },
                        ].map(({ href, icon: Icon, label }) => (
                            <Command.Item key={href} onSelect={() => runCommand(() => router.push(href))}
                                className={itemClass}
                                style={{ color: 'var(--bo-text-muted)' }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'var(--bo-hover)'; e.currentTarget.style.color = 'var(--bo-text)' }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--bo-text-muted)' }}>
                                <Icon className="h-5 w-5 opacity-70" />
                                <span className="font-medium text-sm">{label}</span>
                            </Command.Item>
                        ))}
                    </Command.Group>

                    <Command.Separator className="h-px mx-2 my-2" style={{ background: 'var(--bo-border)' }} />

                    <Command.Group heading="Ferramentas" className="px-2 pb-2 text-xs font-bold uppercase tracking-widest mb-2 mt-2" style={{ color: 'var(--bo-text-muted)' }}>
                        {[
                            { href: '/backoffice/campanhas', icon: BarChart3, label: 'Campanhas' },
                            { href: '/backoffice/conteudo', icon: Sparkles, label: 'Conteúdo & IA' },
                            { href: '/backoffice/tracking', icon: MousePointerClick, label: 'Tracking' },
                            { href: '/backoffice/relatorios', icon: PieChart, label: 'Relatórios' },
                        ].map(({ href, icon: Icon, label }) => (
                            <Command.Item key={href} onSelect={() => runCommand(() => router.push(href))}
                                className={itemClass}
                                style={{ color: 'var(--bo-text-muted)' }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'var(--bo-hover)'; e.currentTarget.style.color = 'var(--bo-text)' }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--bo-text-muted)' }}>
                                <Icon className="h-5 w-5 opacity-70" />
                                <span className="font-medium text-sm">{label}</span>
                            </Command.Item>
                        ))}
                    </Command.Group>

                    <Command.Separator className="h-px mx-2 my-2" style={{ background: 'var(--bo-border)' }} />

                    <Command.Group heading="Configurações" className="px-2 pb-2 text-xs font-bold uppercase tracking-widest mb-2 mt-2" style={{ color: 'var(--bo-text-muted)' }}>
                        {[
                            { href: '/backoffice/settings', icon: Settings, label: 'Geral' },
                            { href: '/backoffice/settings/corretores', icon: User, label: 'Corretores' },
                            { href: '/backoffice/integracoes', icon: Layers, label: 'Integrações' },
                        ].map(({ href, icon: Icon, label }) => (
                            <Command.Item key={href} onSelect={() => runCommand(() => router.push(href))}
                                className={itemClass}
                                style={{ color: 'var(--bo-text-muted)' }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'var(--bo-hover)'; e.currentTarget.style.color = 'var(--bo-text)' }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--bo-text-muted)' }}>
                                <Icon className="h-5 w-5 opacity-70" />
                                <span className="font-medium text-sm">{label}</span>
                            </Command.Item>
                        ))}
                    </Command.Group>
                </Command.List>

                <div className="p-2" style={{ borderTop: '1px solid var(--bo-border)', background: 'rgba(255,255,255,0.02)' }}>
                    <div className="flex items-center justify-between px-3">
                        <span className="text-[10px]" style={{ color: 'var(--bo-text-muted)' }}>
                            Navegue com <kbd className="font-sans px-1 py-0.5 rounded mx-1" style={{ background: 'var(--bo-surface)', border: '1px solid var(--bo-border)' }}>↑</kbd><kbd className="font-sans px-1 py-0.5 rounded mx-1" style={{ background: 'var(--bo-surface)', border: '1px solid var(--bo-border)' }}>↓</kbd>
                        </span>
                        <span className="text-[10px] flex items-center gap-1" style={{ color: 'var(--bo-text-muted)' }}>
                            <CommandIcon size={10} /> IMI Intelligence
                        </span>
                    </div>
                </div>
            </Command>
        </div>
    )
}
