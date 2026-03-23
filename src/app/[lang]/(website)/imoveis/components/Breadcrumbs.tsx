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
    return (
        <nav aria-label="Breadcrumb" className="flex items-center gap-1 overflow-x-auto no-scrollbar py-2" style={{ fontSize: 11, color: '#8E99AB' }}>
            <Link
                href="/"
                className="flex items-center gap-1 transition-colors flex-shrink-0 hover:opacity-80"
                style={{ color: '#8E99AB', textDecoration: 'none' }}
            >
                <Home size={12} />
            </Link>
            {items.map((item, i) => (
                <span key={i} className="flex items-center gap-1 flex-shrink-0">
                    <span style={{ margin: '0 4px', color: '#8E99AB', opacity: 0.5 }}>&rsaquo;</span>
                    {item.href ? (
                        <Link
                            href={item.href}
                            className="transition-colors hover:opacity-80"
                            style={{ color: '#8E99AB', textDecoration: 'none' }}
                        >
                            {item.label}
                        </Link>
                    ) : (
                        <span
                            className={i === items.length - 1 ? 'font-medium truncate max-w-[200px]' : ''}
                            style={{ color: i === items.length - 1 ? '#E8E4DC' : '#8E99AB' }}
                        >
                            {item.label}
                        </span>
                    )}
                </span>
            ))}
        </nav>
    );
}
