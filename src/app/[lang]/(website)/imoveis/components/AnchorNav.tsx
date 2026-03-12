'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

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
        <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-lg border-b border-gray-100 -mx-4 px-4 lg:mx-0 lg:px-0">
            <div className="container-custom">
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-3">
                    {sections.map(s => (
                        <button
                            key={s.id}
                            onClick={() => scrollTo(s.id)}
                            className="relative px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors"
                            style={{
                                color: active === s.id ? '#102A43' : '#829AB1',
                            }}
                        >
                            {s.label}
                            {active === s.id && (
                                <motion.div
                                    layoutId="anchor-indicator"
                                    className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-[#334E68]"
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
