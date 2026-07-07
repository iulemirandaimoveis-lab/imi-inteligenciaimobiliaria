'use client';

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface BreadcrumbsProps {
    items: BreadcrumbItem[];
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
    // Cores legíveis sobre o fundo claro (#F7F5F2) da página de imóvel:
    // caminho em cinza-slate; página atual (nome do empreendimento) em navy.
    const MUTED = '#6B6B6B';
    const ACTIVE = '#0B1928';
    return (
        <nav aria-label="Breadcrumb" className="flex items-center gap-1 overflow-x-auto no-scrollbar py-2" style={{ fontSize: 11, color: MUTED }}>
            <Link
                href="/"
                className="flex items-center gap-1 transition-colors flex-shrink-0 hover:opacity-80"
                style={{ color: MUTED, textDecoration: 'none' }}
            >
                <Home size={12} />
            </Link>
            {items.map((item, i) => (
                <span key={i} className="flex items-center gap-1 flex-shrink-0">
                    <span style={{ margin: '0 4px', color: MUTED, opacity: 0.5 }}>&rsaquo;</span>
                    {item.href ? (
                        <Link
                            href={item.href}
                            className="transition-colors hover:opacity-80"
                            style={{ color: MUTED, textDecoration: 'none' }}
                        >
                            {item.label}
                        </Link>
                    ) : (
                        <span
                            className={i === items.length - 1 ? 'font-medium truncate max-w-[200px]' : ''}
                            style={{ color: i === items.length - 1 ? ACTIVE : MUTED }}
                        >
                            {item.label}
                        </span>
                    )}
                </span>
            ))}
        </nav>
    );
}
