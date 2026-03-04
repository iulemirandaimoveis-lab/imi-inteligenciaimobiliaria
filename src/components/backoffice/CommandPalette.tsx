'use client'

import * as React from 'react'
import { useRouter, usePathname } from 'next/navigation'
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

// Map each backoffice section to its "novo" route
const NOVO_ROUTES: Record<string, string> = {
    '/backoffice/leads':       '/backoffice/leads/novo',
    '/backoffice/imoveis':     '/backoffice/imoveis/novo',
    '/backoffice/avaliacoes':  '/backoffice/avaliacoes/nova',
    '/backoffice/consultorias':'/backoffice/consultorias/nova',
    '/backoffice/contratos':   '/backoffice/contratos/novo',
}

function isInputFocused() {
    const el = document.activeElement
    if (!el) return false
    const tag = el.tagName.toLowerCase()
    return tag === 'input' || tag === 'textarea' || (el as HTMLElement).isContentEditable
}

export function CommandPalette() {
    const [open, setOpen] = React.useState(false)
    const router = useRouter()
    const pathname = usePathname()

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            // Cmd/Ctrl+K — always open palette
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                setOpen(o => !o)
                return
            }
            // Skip if palette is open or an input is focused
            if (open || isInputFocused()) return
            // '/' — open search palette
            if (e.key === '/') {
                e.preventDefault()
                setOpen(true)
                return
            }
            // 'n' — navigate to "novo" for current section
            if (e.key === 'n' && !e.metaKey && !e.ctrlKey && !e.altKey) {
                const base = '/' + pathname.split('/').slice(1, 3).join('/')
                const novoRoute = NOVO_ROUTES[base]
                if (novoRoute) {
                    e.preventDefault()
                    router.push(novoRoute)
                }
            }
        }

        document.addEventListener('keydown', down)
        return () => document.removeEventListener('keydown', down)
    }, [open, pathname, router])

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
                        <span className="text-[10px] flex items-center gap-2" style={{ color: 'var(--bo-text-muted)' }}>
                            <span>Navegar <kbd className="font-sans px-1 py-0.5 rounded" style={{ background: 'var(--bo-surface)', border: '1px solid var(--bo-border)' }}>↑</kbd><kbd className="font-sans px-1 py-0.5 rounded ml-1" style={{ background: 'var(--bo-surface)', border: '1px solid var(--bo-border)' }}>↓</kbd></span>
                            <span className="opacity-50">·</span>
                            <span>Buscar <kbd className="font-sans px-1 py-0.5 rounded" style={{ background: 'var(--bo-surface)', border: '1px solid var(--bo-border)' }}>/</kbd></span>
                            <span className="opacity-50">·</span>
                            <span>Novo <kbd className="font-sans px-1 py-0.5 rounded" style={{ background: 'var(--bo-surface)', border: '1px solid var(--bo-border)' }}>n</kbd></span>
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
