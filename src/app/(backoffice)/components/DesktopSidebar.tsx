'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard, Building2, FileText, TrendingUp, MessageSquare,
  Users, Megaphone, Settings, ChevronDown, ChevronRight, LogOut,
  BookOpen, Mail, Sparkles, Calculator, BarChart2, Home, Scale,
  Landmark, CreditCard, Briefcase, Layers, BarChart, FileStack,
  BookmarkPlus, Target, Zap
} from 'lucide-react'
import { useState } from 'react'

interface NavItem {
  label: string
  href?: string
  icon: React.ComponentType<any>
  badge?: string | number
  badgeColor?: string
  children?: NavItem[]
}

const NAV: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/backoffice/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Avaliações',
    icon: Scale,
    badge: '5',
    badgeColor: 'bg-amber-500',
    children: [
      { label: 'Todas Avaliações', href: '/backoffice/avaliacoes', icon: FileText },
      { label: 'Nova Avaliação', href: '/backoffice/avaliacoes/nova', icon: BookmarkPlus },
      { label: 'Gerar com IA', href: '/backoffice/avaliacoes/ia', icon: Sparkles },
      { label: 'Email + Honorários', href: '/backoffice/avaliacoes/email-honorarios', icon: Mail },
      { label: 'Exercícios NBR', href: '/backoffice/avaliacoes/exercicios', icon: BookOpen },
      { label: 'Analytics', href: '/backoffice/avaliacoes/analytics', icon: BarChart2 },
    ]
  },
  {
    label: 'Imóveis',
    icon: Building2,
    children: [
      { label: 'Portfólio', href: '/backoffice/imoveis', icon: Building2 },
      { label: 'Novo Imóvel', href: '/backoffice/imoveis/novo', icon: BookmarkPlus },
    ]
  },
  {
    label: 'Crédito',
    icon: CreditCard,
    children: [
      { label: 'Operações', href: '/backoffice/credito', icon: CreditCard },
      { label: 'Simulador', href: '/backoffice/credito/simulador', icon: Calculator },
      { label: 'Nova Operação', href: '/backoffice/credito/novo', icon: BookmarkPlus },
    ]
  },
  {
    label: 'Consultoria',
    icon: Briefcase,
    children: [
      { label: 'Consultorias', href: '/backoffice/consultorias', icon: Briefcase },
      { label: 'Nova Consultoria', href: '/backoffice/consultorias/nova', icon: BookmarkPlus },
    ]
  },
  {
    label: 'Leads',
    icon: Users,
    badge: '12',
    badgeColor: 'bg-blue-500',
    children: [
      { label: 'Todos os Leads', href: '/backoffice/leads', icon: Users },
      { label: 'Pipeline', href: '/backoffice/leads/kanban', icon: Layers },
      { label: 'Novo Lead', href: '/backoffice/leads/novo', icon: BookmarkPlus },
      { label: 'Automações', href: '/backoffice/leads/rules', icon: Zap },
    ]
  },
  {
    label: 'Campanhas',
    icon: Megaphone,
    children: [
      { label: 'Campanhas', href: '/backoffice/campanhas', icon: Megaphone },
      { label: 'Nova Campanha', href: '/backoffice/campanhas/nova', icon: BookmarkPlus },
    ]
  },
  {
    label: 'Financeiro',
    icon: TrendingUp,
    children: [
      { label: 'Visão Geral', href: '/backoffice/financeiro', icon: BarChart },
      { label: 'A Receber', href: '/backoffice/financeiro/receber', icon: TrendingUp },
      { label: 'A Pagar', href: '/backoffice/financeiro/pagar', icon: TrendingUp },
      { label: 'Metas & Performance', href: '/backoffice/financeiro/metas', icon: Target },
    ]
  },
  {
    label: 'Projetos',
    href: '/backoffice/projetos',
    icon: Target,
  },
  {
    label: 'Relatórios',
    href: '/backoffice/relatorios',
    icon: FileStack,
  },
  {
    label: 'Configurações',
    href: '/backoffice/settings',
    icon: Settings,
  },
]

function NavItemComponent({ item, depth = 0 }: { item: NavItem; depth?: number }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(() => {
    if (!item.children) return false
    return item.children.some(c => c.href && pathname.startsWith(c.href.split('/').slice(0, 4).join('/')))
  })

  const Icon = item.icon
  const isActive = item.href ? pathname === item.href || (item.href !== '/backoffice/dashboard' && pathname.startsWith(item.href)) : false
  const hasChildren = item.children && item.children.length > 0
  const isParentActive = hasChildren && item.children!.some(c => c.href && pathname.startsWith(c.href))

  if (hasChildren) {
    return (
      <div>
        <button
          onClick={() => setOpen(!open)}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${isParentActive || open ? 'bg-[#C49D5B]/10 text-[#C49D5B]' : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'}`}
        >
          <Icon size={18} className="flex-shrink-0" />
          <span className="flex-1 text-left">{item.label}</span>
          {item.badge && (
            <span className={`text-xs px-1.5 py-0.5 rounded-full text-white font-bold ${item.badgeColor || 'bg-gray-600'}`}>
              {item.badge}
            </span>
          )}
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>

        {open && (
          <div className="ml-6 mt-1 space-y-0.5 border-l border-white/10 pl-3">
            {item.children!.map(child => (
              <NavItemComponent key={child.href || child.label} item={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <Link
      href={item.href!}
      className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all ${isActive ? 'bg-[#C49D5B] text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'}`}
    >
      <Icon size={16} className="flex-shrink-0" />
      <span className="flex-1">{item.label}</span>
      {item.badge && (
        <span className={`text-xs px-1.5 py-0.5 rounded-full text-white font-bold ${item.badgeColor || 'bg-gray-600'}`}>
          {item.badge}
        </span>
      )}
    </Link>
  )
}

export default function DesktopSidebar() {
  return (
    <aside className="hidden lg:flex flex-col w-60 h-screen bg-[#141420] border-r border-white/10 fixed left-0 top-0 z-40">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-white/10 flex-shrink-0">
        <div className="w-8 h-8 rounded-lg bg-[#C49D5B] flex items-center justify-center">
          <span className="text-sm font-black text-white">I</span>
        </div>
        <div>
          <p className="text-sm font-bold text-white tracking-tight">IMI</p>
          <p className="text-xs text-gray-500">Inteligência Imobiliária</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5 scrollbar-thin scrollbar-thumb-white/10">
        {NAV.map(item => (
          <NavItemComponent key={item.href || item.label} item={item} />
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-white/10 flex-shrink-0">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 cursor-pointer group">
          <div className="w-8 h-8 rounded-full bg-[#C49D5B] flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-white">IM</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">Iule Miranda</p>
            <p className="text-xs text-gray-500 truncate">CTO • CNAI</p>
          </div>
          <LogOut size={15} className="text-gray-500 group-hover:text-red-400 transition-colors" />
        </div>
      </div>
    </aside>
  )
}
