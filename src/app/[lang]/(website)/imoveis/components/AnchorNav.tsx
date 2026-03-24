'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const GOLD = '#C8A44A';

interface AnchorNavProps {
    sections: { id: string; label: string }[];
}

export default function AnchorNav({ sections }: AnchorNavProps) {
    const [active, setActive] = useState(sections[0]?.id || '');

    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        setActive(entry.target.id);
                    }
                }
            },
            { rootMargin: '-80px 0px -60% 0px', threshold: 0.1 }
        );

        for (const section of sections) {
            const el = document.getElementById(section.id);
            if (el) observer.observe(el);
        }

        return () => observer.disconnect();
    }, [sections]);

    const scrollTo = (id: string) => {
        const el = document.getElementById(id);
        if (el) {
            const y = el.getBoundingClientRect().top + window.scrollY - 72;
            window.scrollTo({ top: y, behavior: 'smooth' });
        }
    };

    return (
        <nav
            className="sticky top-16 z-30 overflow-x-auto no-scrollbar"
            style={{
                background: 'rgba(5,11,20,0.95)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                borderBottom: '1px solid rgba(200,164,74,0.12)',
            }}
        >
            <div className="flex gap-0 max-w-7xl mx-auto px-4">
                {sections.map(s => (
                    <button
                        key={s.id}
                        onClick={() => scrollTo(s.id)}
                        className="relative px-4 text-sm font-medium whitespace-nowrap transition-colors duration-200"
                        style={{
                            color: active === s.id ? GOLD : '#8E99AB',
                            fontFamily: "var(--fu, 'Outfit', sans-serif)",
                            minHeight: 44, display: 'flex', alignItems: 'center',
                        }}
                    >
                        {s.label}
                        {active === s.id && (
                            <motion.div
                                layoutId="anchor-indicator"
                                className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full"
                                style={{ background: GOLD }}
                                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                            />
                        )}
                    </button>
                ))}
            </div>
        </nav>
    );
}
