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
            className="sticky top-0 z-40 backdrop-blur-xl border-b -mx-4 px-4 lg:mx-0 lg:px-0"
            style={{
                background: 'rgba(250,251,252,0.92)',
                borderColor: 'rgba(200,164,74,0.1)',
            }}
        >
            <div className="container-custom">
                <div className="flex items-center gap-0.5 overflow-x-auto no-scrollbar py-2.5">
                    {sections.map(s => (
                        <button
                            key={s.id}
                            onClick={() => scrollTo(s.id)}
                            className="relative px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200"
                            style={{
                                color: active === s.id ? '#0B1928' : '#829AB1',
                                background: active === s.id ? 'rgba(200,164,74,0.08)' : 'transparent',
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
            </div>
        </nav>
    );
}
