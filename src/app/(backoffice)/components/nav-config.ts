import {
    Sun, LayoutDashboard, Users, Handshake, MessageSquare, CalendarDays, Building2,
    Sparkles, BarChart3, Megaphone, BarChart2, QrCode, TrendingUp, CreditCard,
    LineChart, Scale, List, Key, Building, FolderOpen, FileText, Wand2, BookMarked,
    Video, Zap, Brain, BookOpen, FileSignature, Briefcase, Banknote, TrendingDown,
    Target, FileStack, Layers, MessageCircle, Bot, Camera, Eye, Link2,
    GraduationCap, Award, Globe2, Trophy, Shield, Settings, Plug,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface NavItem {
    label: string
    href?: string
    icon: LucideIcon
    badge?: string | number
    children?: NavItem[]
}

export interface NavSection {
    label: string
    alwaysOpen?: boolean
    items: NavItem[]
}

export type UserRole = 'admin' | 'manager' | 'agent' | 'viewer'

export const SECTION_ACCESS: Record<string, UserRole[]> = {
    'Operações Diárias': ['admin', 'manager', 'agent', 'viewer'],
    'Captação': ['admin', 'manager', 'agent'],
    'Conversão': ['admin', 'manager', 'agent'],
    'Portfólio': ['admin', 'manager', 'agent'],
    'Operação': ['admin', 'manager'],
    'Financeiro': ['admin', 'manager'],
    'Inteligência': ['admin', 'manager', 'agent'],
    'Academy & Carreira': ['admin', 'manager', 'agent', 'viewer'],
    'Configurações': ['admin'],
}

export const SECTION_COLORS: Record<string, string> = {
    'Operações Diárias': 'var(--accent-400)',
    'Captação': 'var(--warning)',
    'Conversão': '#4ADE80',
    'Portfólio': '#D4A929',
    'Operação': '#4ECDC4',
    'Financeiro': '#84CC16',
    'Inteligência': 'var(--info)',
    'Academy & Carreira': '#C8A44A',
    'Configurações': 'var(--text-tertiary)',
}

export const SECTION_BG_COLORS: Record<string, string> = {
    'Operações Diárias': 'rgba(200,164,74,0.10)',
    'Captação': 'rgba(232,168,124,0.12)',
    'Conversão': 'rgba(74,222,128,0.10)',
    'Portfólio': 'rgba(212,169,41,0.12)',
    'Operação': 'rgba(78,205,196,0.12)',
    'Financeiro': 'rgba(132,204,22,0.10)',
    'Inteligência': 'rgba(96,165,250,0.12)',
    'Academy & Carreira': 'rgba(200,164,74,0.08)',
    'Configurações': 'rgba(148,163,184,0.10)',
}

export const SECTIONS: NavSection[] = [
    {
        label: 'Operações Diárias',
        alwaysOpen: true,
        items: [
            { label: 'Hoje',        href: '/backoffice/hoje',      icon: Sun             },
            { label: 'Dashboard',   href: '/backoffice/dashboard', icon: LayoutDashboard },
            { label: 'Leads',       href: '/backoffice/leads',     icon: Users           },
            { label: 'Parcerias',   href: '/backoffice/parcerias', icon: Handshake, badge: 'NEW' },
            { label: 'Chat Equipe', href: '/backoffice/connect',   icon: MessageSquare   },
            { label: 'Agenda',      href: '/backoffice/agenda',    icon: CalendarDays    },
            { label: 'Imóveis',     href: '/backoffice/imoveis',   icon: Building2       },
        ],
    },
    {
        label: 'Captação',
        items: [
            {
                label: 'Leads', icon: Users,
                children: [
                    { label: 'Todos os Leads',  href: '/backoffice/leads',          icon: Users     },
                    { label: 'Inbox IA',        href: '/backoffice/leads/inbox',    icon: Sparkles  },
                    { label: 'Comportamento',   href: '/backoffice/leads/behavior', icon: BarChart3 },
                    { label: 'Novo Lead',       href: '/backoffice/leads/novo',     icon: Users     },
                ],
            },
            {
                label: 'Campanhas', icon: Megaphone,
                children: [
                    { label: 'Todas',           href: '/backoffice/campanhas',      icon: Megaphone },
                    { label: 'Ads Performance', href: '/backoffice/campanhas/ads',  icon: BarChart2 },
                    { label: 'Nova',            href: '/backoffice/campanhas/nova', icon: Megaphone },
                ],
            },
            { label: 'QR Tracking', href: '/backoffice/tracking/qr', icon: QrCode },
        ],
    },
    {
        label: 'Conversão',
        items: [
            { label: 'Pipeline',   href: '/backoffice/leads/pipeline',    icon: TrendingUp  },
            { label: 'Simulações', href: '/backoffice/credito/simulador', icon: CreditCard  },
            { label: 'Agenda',     href: '/backoffice/agenda',            icon: CalendarDays },
        ],
    },
    {
        label: 'Portfólio',
        items: [
            {
                label: 'Imóveis', icon: Building2,
                children: [
                    { label: 'Listagem',    href: '/backoffice/imoveis',            icon: Building2 },
                    { label: 'Explorer',    href: '/backoffice/imoveis/explorer',   icon: BarChart2 },
                    { label: 'Portfolio',   href: '/backoffice/imoveis/portfolio',  icon: LineChart },
                    { label: 'Comparar',    href: '/backoffice/imoveis/comparar',   icon: Scale     },
                    { label: 'Inventário',  href: '/backoffice/imoveis/inventario', icon: List      },
                    { label: 'Novo Imóvel', href: '/backoffice/imoveis/novo',       icon: Building2 },
                    { label: 'Rentals',     href: '/backoffice/rentals',            icon: Key       },
                ],
            },
            { label: 'Fornecedores', href: '/backoffice/fornecedores', icon: Building, badge: 'NEW' },
            { label: 'Projetos',     href: '/backoffice/projetos',     icon: FolderOpen              },
            {
                label: 'Conteúdo', icon: FileText,
                children: [
                    { label: 'Publicações', href: '/backoffice/conteudo',           icon: FileText   },
                    { label: 'Criador IA',  href: '/backoffice/conteudo/criador',   icon: Wand2      },
                    { label: 'eBook IA',    href: '/backoffice/conteudo/ebook',     icon: BookMarked },
                    { label: 'Vídeo IA',    href: '/backoffice/conteudo/video',     icon: Video      },
                    { label: 'Automação',   href: '/backoffice/conteudo/automacao', icon: Zap        },
                ],
            },
        ],
    },
    {
        label: 'Operação',
        items: [
            {
                label: 'Avaliações', icon: Scale,
                children: [
                    { label: 'Todas',               href: '/backoffice/avaliacoes',                  icon: Scale    },
                    { label: 'Nova',                href: '/backoffice/avaliacoes/nova',             icon: Scale    },
                    { label: 'Motor de Avaliações', href: '/backoffice/avaliacoes/motor',            icon: Brain, badge: 'IA' },
                    { label: 'Email + Honorários',  href: '/backoffice/avaliacoes/email-honorarios', icon: Scale    },
                    { label: 'Exercícios NBR',      href: '/backoffice/avaliacoes/exercicios',       icon: BookOpen },
                ],
            },
            {
                label: 'Propostas', icon: FileText,
                children: [
                    { label: 'Todas', href: '/backoffice/propostas',      icon: FileText },
                    { label: 'Nova',  href: '/backoffice/propostas/nova', icon: FileText },
                ],
            },
            {
                label: 'Contratos', icon: FileSignature,
                children: [
                    { label: 'Gerenciador', href: '/backoffice/contratos',      icon: FileSignature },
                    { label: 'Novo',        href: '/backoffice/contratos/novo', icon: FileSignature },
                ],
            },
            {
                label: 'Consultoria', icon: Briefcase,
                children: [
                    { label: 'Consultorias', href: '/backoffice/consultorias',      icon: Briefcase },
                    { label: 'Nova',         href: '/backoffice/consultorias/nova', icon: Briefcase },
                ],
            },
            {
                label: 'Crédito', icon: CreditCard,
                children: [
                    { label: 'Operações', href: '/backoffice/credito',           icon: CreditCard },
                    { label: 'Simulador', href: '/backoffice/credito/simulador', icon: CreditCard },
                ],
            },
            {
                label: 'Rentals', icon: Key,
                children: [
                    { label: 'Dashboard',  href: '/backoffice/rentals',          icon: Key          },
                    { label: 'Calendário', href: '/backoffice/rentals/calendar', icon: CalendarDays },
                ],
            },
        ],
    },
    {
        label: 'Financeiro',
        items: [
            { label: 'Visão Geral', href: '/backoffice/financeiro',         icon: Banknote     },
            { label: 'A Receber',   href: '/backoffice/financeiro/receber', icon: TrendingUp   },
            { label: 'A Pagar',     href: '/backoffice/financeiro/pagar',   icon: TrendingDown },
            { label: 'Metas',       href: '/backoffice/financeiro/metas',   icon: Target       },
            {
                label: 'BPO Financeiro', icon: Briefcase, badge: 'NEW',
                children: [
                    { label: 'Dashboard',   href: '/backoffice/bpo',             icon: Briefcase },
                    { label: 'DRE',         href: '/backoffice/bpo/dre',         icon: FileText  },
                    { label: 'Conciliação', href: '/backoffice/bpo/conciliacao', icon: Scale     },
                ],
            },
        ],
    },
    {
        label: 'Inteligência',
        items: [
            { label: 'Biblioteca',    href: '/backoffice/biblioteca',               icon: BookOpen      },
            { label: 'Relatórios',    href: '/backoffice/inteligencia/relatorios',  icon: FileStack     },
            { label: 'Indicadores',   href: '/backoffice/inteligencia/indicadores', icon: LineChart     },
            { label: 'Índices IMI',   href: '/backoffice/inteligencia/indices',     icon: Brain         },
            { label: 'Widgets',       href: '/backoffice/inteligencia/widgets',     icon: Layers        },
            { label: 'AI Chat',       href: '/backoffice/ai-chat',                  icon: MessageCircle },
            { label: 'Central de IA', href: '/backoffice/ia',                       icon: Sparkles      },
            { label: 'Agentes IA',    href: '/backoffice/ia/agentes',               icon: Bot           },
            { label: 'Prompt Agent',  href: '/backoffice/prompt-agent',             icon: Camera        },
            { label: 'Visão IA',      href: '/backoffice/ai/vision',                icon: Eye           },
            { label: 'Automações',    href: '/backoffice/automacoes',               icon: Zap           },
            {
                label: 'Analytics', icon: BarChart2,
                children: [
                    { label: 'Dashboard', href: '/backoffice/tracking',       icon: BarChart2 },
                    { label: 'Links',     href: '/backoffice/tracking/links', icon: Link2     },
                    { label: 'QR Codes',  href: '/backoffice/tracking/qr',   icon: QrCode    },
                ],
            },
        ],
    },
    {
        label: 'Academy & Carreira',
        items: [
            { label: 'IMI Academy',    href: '/backoffice/academy',  icon: GraduationCap, badge: 'NEW' },
            { label: 'Minha Carreira', href: '/backoffice/carreira', icon: Award,         badge: 'NEW' },
            { label: 'Global Market',  href: '/backoffice/global',   icon: Globe2,        badge: 'NEW' },
        ],
    },
    {
        label: 'Configurações',
        items: [
            { label: 'Organização', href: '/backoffice/organizacao', icon: Building },
            {
                label: 'Equipe', icon: Users,
                children: [
                    { label: 'Visão Geral', href: '/backoffice/equipe',             icon: Users         },
                    { label: 'Ranking',     href: '/backoffice/ranking',            icon: Trophy        },
                    { label: 'Canais',      href: '/backoffice/canais',             icon: MessageSquare },
                    { label: 'Colaboração', href: '/backoffice/equipe/colaboracao', icon: Handshake     },
                ],
            },
            { label: 'Usuários',    href: '/backoffice/settings/usuarios', icon: Users  },
            { label: 'Integrações', href: '/backoffice/integracoes',       icon: Plug   },
            {
                label: 'Configurações', icon: Settings,
                children: [
                    { label: 'Geral',            href: '/backoffice/settings',            icon: Settings  },
                    { label: 'Corretores',        href: '/backoffice/settings/corretores', icon: Users     },
                    { label: 'Permissões',        href: '/backoffice/settings/permissoes', icon: Shield    },
                    { label: 'Logs do Sistema',   href: '/backoffice/settings/logs',       icon: FileText  },
                    { label: 'Configurações IA',  href: '/backoffice/settings/ia',         icon: Brain     },
                ],
            },
        ],
    },
]

/** Flatten a section's items into a simple list of hrefs for mobile tiles. */
export function flattenSectionItems(items: NavItem[]): Array<{ label: string; href: string; icon: LucideIcon; badge?: string | number }> {
    const result: Array<{ label: string; href: string; icon: LucideIcon; badge?: string | number }> = []
    for (const item of items) {
        if (item.href) {
            result.push({ label: item.label, href: item.href, icon: item.icon, badge: item.badge })
        }
        if (item.children) {
            for (const child of item.children) {
                if (child.href) {
                    result.push({ label: child.label, href: child.href, icon: child.icon, badge: child.badge })
                }
            }
        }
    }
    return result
}
