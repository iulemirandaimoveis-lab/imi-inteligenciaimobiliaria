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
        <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs text-gray-400 overflow-x-auto no-scrollbar py-2">
            <Link
                href="/"
                className="flex items-center gap-1 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
            >
                <Home size={12} />
            </Link>
            {items.map((item, i) => (
                <span key={i} className="flex items-center gap-1 flex-shrink-0">
                    <ChevronRight size={10} className="text-gray-300" />
                    {item.href ? (
                        <Link
                            href={item.href}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            {item.label}
                        </Link>
                    ) : (
                        <span className={i === items.length - 1 ? 'text-gray-700 font-medium truncate max-w-[200px]' : 'text-gray-400'}>
                            {item.label}
                        </span>
                    )}
                </span>
            ))}
        </nav>
    );
}
