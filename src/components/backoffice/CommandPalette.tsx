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

    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center pt-[20vh] animate-in fade-in duration-200">
            <Command className="w-full max-w-2xl bg-white dark:bg-card-dark rounded-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-white/10 animate-in zoom-in-95 duration-200">
                <div className="flex items-center border-b border-gray-100 dark:border-white/5 px-4">
                    <Search className="mr-2 h-5 w-5 shrink-0 opacity-50 text-gray-400" />
                    <Command.Input
                        placeholder="Busque por páginas, leads ou comandos..."
                        className="flex h-16 w-full rounded-md bg-transparent py-3 text-lg outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 text-gray-900 dark:text-white disabled:cursor-not-allowed disabled:opacity-50"
                    />
                    <div className="text-xs text-gray-400 border border-gray-200 dark:border-white/10 px-2 py-1 rounded bg-gray-50 dark:bg-white/5">ESC</div>
                </div>

                <Command.List className="max-h-[60vh] overflow-y-auto overflow-x-hidden py-2 px-2 custom-scrollbar">
                    <Command.Empty className="py-12 text-center text-sm text-gray-500">
                        Nenhum resultado encontrado.
                    </Command.Empty>

                    <Command.Group heading="Sugestões" className="px-2 pb-2 text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                        <Command.Item
                            onSelect={() => runCommand(() => router.push('/backoffice/dashboard'))}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer transition-colors text-gray-700 dark:text-gray-300 aria-selected:bg-primary/10 aria-selected:text-primary"
                        >
                            <LayoutDashboard className="h-5 w-5 opacity-70" />
                            <span className="font-medium text-sm">Dashboard</span>
                        </Command.Item>
                        <Command.Item
                            onSelect={() => runCommand(() => router.push('/backoffice/leads'))}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer transition-colors text-gray-700 dark:text-gray-300 aria-selected:bg-primary/10 aria-selected:text-primary"
                        >
                            <Users className="h-5 w-5 opacity-70" />
                            <span className="font-medium text-sm">Gestão de Leads</span>
                        </Command.Item>
                        <Command.Item
                            onSelect={() => runCommand(() => router.push('/backoffice/imoveis'))}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer transition-colors text-gray-700 dark:text-gray-300 aria-selected:bg-primary/10 aria-selected:text-primary"
                        >
                            <Building2 className="h-5 w-5 opacity-70" />
                            <span className="font-medium text-sm">Portfólio de Imóveis</span>
                        </Command.Item>
                    </Command.Group>

                    <Command.Separator className="h-px bg-gray-100 dark:bg-white/5 mx-2 my-2" />

                    <Command.Group heading="Ferramentas" className="px-2 pb-2 text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 mt-2">
                        <Command.Item
                            onSelect={() => runCommand(() => router.push('/backoffice/campanhas'))}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer transition-colors text-gray-700 dark:text-gray-300 aria-selected:bg-primary/10 aria-selected:text-primary"
                        >
                            <BarChart3 className="h-5 w-5 opacity-70" />
                            <span className="font-medium text-sm">Campanhas</span>
                        </Command.Item>
                        <Command.Item
                            onSelect={() => runCommand(() => router.push('/backoffice/conteudo'))}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer transition-colors text-gray-700 dark:text-gray-300 aria-selected:bg-primary/10 aria-selected:text-primary"
                        >
                            <Sparkles className="h-5 w-5 opacity-70 text-purple-500" />
                            <span className="font-medium text-sm">Conteúdo & IA</span>
                        </Command.Item>
                        <Command.Item
                            onSelect={() => runCommand(() => router.push('/backoffice/tracking'))}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer transition-colors text-gray-700 dark:text-gray-300 aria-selected:bg-primary/10 aria-selected:text-primary"
                        >
                            <MousePointerClick className="h-5 w-5 opacity-70" />
                            <span className="font-medium text-sm">Tracking</span>
                        </Command.Item>
                        <Command.Item
                            onSelect={() => runCommand(() => router.push('/backoffice/relatorios'))}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer transition-colors text-gray-700 dark:text-gray-300 aria-selected:bg-primary/10 aria-selected:text-primary"
                        >
                            <PieChart className="h-5 w-5 opacity-70" />
                            <span className="font-medium text-sm">Relatórios</span>
                        </Command.Item>
                    </Command.Group>

                    <Command.Separator className="h-px bg-gray-100 dark:bg-white/5 mx-2 my-2" />

                    <Command.Group heading="Configurações" className="px-2 pb-2 text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 mt-2">
                        <Command.Item
                            onSelect={() => runCommand(() => router.push('/backoffice/settings'))}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer transition-colors text-gray-700 dark:text-gray-300 aria-selected:bg-primary/10 aria-selected:text-primary"
                        >
                            <Settings className="h-5 w-5 opacity-70" />
                            <span className="font-medium text-sm">Geral</span>
                        </Command.Item>
                        <Command.Item
                            onSelect={() => runCommand(() => router.push('/backoffice/settings/corretores'))}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer transition-colors text-gray-700 dark:text-gray-300 aria-selected:bg-primary/10 aria-selected:text-primary"
                        >
                            <User className="h-5 w-5 opacity-70" />
                            <span className="font-medium text-sm">Corretores</span>
                        </Command.Item>
                        <Command.Item
                            onSelect={() => runCommand(() => router.push('/backoffice/integracoes'))}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer transition-colors text-gray-700 dark:text-gray-300 aria-selected:bg-primary/10 aria-selected:text-primary"
                        >
                            <Layers className="h-5 w-5 opacity-70" />
                            <span className="font-medium text-sm">Integrações</span>
                        </Command.Item>
                    </Command.Group>
                </Command.List>

                <div className="border-t border-gray-100 dark:border-white/5 p-2 bg-gray-50/50 dark:bg-white/[0.02]">
                    <div className="flex items-center justify-between px-3">
                        <span className="text-[10px] text-gray-400">
                            Navegue com <kbd className="font-sans px-1 py-0.5 rounded bg-white dark:bg-white/10 mx-1 border border-gray-200 dark:border-white/10">↑</kbd><kbd className="font-sans px-1 py-0.5 rounded bg-white dark:bg-white/10 mx-1 border border-gray-200 dark:border-white/10">↓</kbd>
                        </span>
                        <span className="text-[10px] text-gray-400 flex items-center gap-1">
                            <CommandIcon size={10} /> IMI Intelligence
                        </span>
                    </div>
                </div>
            </Command>
        </div>
    )
}
