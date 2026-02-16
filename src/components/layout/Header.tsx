'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import Button from '@/components/ui/Button';

interface HeaderProps {
    lang: string;
    dict: {
        presentation: string;
        services: string;
        properties: string;
        credit: string;
        consulting: string;
        intelligence: string;
        projects: string;
        about: string;
        contact: string;
        whatsapp: string;
    }
}

export default function Header({ lang, dict }: HeaderProps) {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();

    const navigation = [
        { label: dict.services, href: `/${lang}/avaliacoes` },
        { label: dict.properties, href: `/${lang}/imoveis` },
        { label: dict.credit, href: `/${lang}/credito` },
        { label: dict.consulting, href: `/${lang}/consultoria` },
        { label: dict.intelligence, href: `/${lang}/inteligencia` },
        { label: dict.about, href: `/${lang}/sobre` },
        { label: dict.contact, href: `/${lang}/contato` },
    ];

    // Close menu on resize if above mobile breakpoint
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) {
                setIsOpen(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Prevent scroll when menu is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
    }, [isOpen]);

    return (
        <>
            <header className="fixed top-0 left-0 right-0 z-[100] bg-white/80 backdrop-blur-xl border-b border-slate-100 shadow-header">
                <div className="container-custom">
                    <div className="flex items-center justify-between h-16 lg:h-20">
                        {/* Logo */}
                        <Link href={`/${lang}`} className="flex items-center space-x-3 group z-[110]" onClick={() => setIsOpen(false)}>
                            <div className="flex items-center gap-3">
                                <span
                                    className="text-2xl font-bold text-navy-900 tracking-tight transition-colors"
                                    style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                                >
                                    IMI
                                </span>
                                <div className="h-6 w-px bg-slate-200"></div>
                                <span className="text-[10px] sm:text-[11px] font-medium text-slate-500 uppercase tracking-[0.15em] leading-[1.1]">
                                    Inteligência<br />Imobiliária
                                </span>
                            </div>
                        </Link>

                        {/* Desktop Navigation */}
                        <nav className="hidden md:flex items-center space-x-6 lg:space-x-8">
                            {navigation.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "relative text-sm font-medium tracking-tight transition-colors duration-300",
                                        pathname === item.href
                                            ? "text-navy-900 after:absolute after:left-0 after:bottom-[-4px] after:w-full after:h-0.5 after:bg-gold-600"
                                            : "text-slate-500 hover:text-navy-900"
                                    )}
                                >
                                    {item.label}
                                </Link>
                            ))}

                            {/* Lang Selector Simple */}
                            <div className="flex items-center gap-2 ml-4 border-l border-slate-200 pl-4">
                                <Link href="/pt" className={cn("text-xs font-bold uppercase", lang === 'pt' ? "text-navy-900" : "text-slate-400 hover:text-navy-700")}>PT</Link>
                                <Link href="/en" className={cn("text-xs font-bold uppercase", lang === 'en' ? "text-navy-900" : "text-slate-400 hover:text-navy-700")}>EN</Link>
                                <Link href="/ja" className={cn("text-xs font-bold uppercase", lang === 'ja' ? "text-navy-900" : "text-slate-400 hover:text-navy-700")}>JP</Link>
                            </div>
                        </nav>

                        {/* Mobile Toggle */}
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="md:hidden p-2 rounded-lg hover:bg-slate-50 transition text-navy-900 z-[110]"
                            aria-label="Toggle menu"
                        >
                            {isOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu Overlay */}
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-navy-900/20 backdrop-blur-sm z-[90] md:hidden"
                            onClick={() => setIsOpen(false)}
                        />
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            variants={menuVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="md:hidden fixed inset-x-0 top-0 pt-[env(safe-area-inset-top,20px)] bg-white z-[95] shadow-2xl overflow-y-auto h-[100dvh] flex flex-col"
                        >
                            <div className="h-16 flex items-center justify-end px-6 mb-4">
                                {/* Placeholder */}
                            </div>

                            <nav className="px-6 flex flex-col space-y-1">
                                {navigation.map((item) => (
                                    <motion.div key={item.href} variants={itemVariants}>
                                        <Link
                                            href={item.href}
                                            onClick={() => setIsOpen(false)}
                                            className={cn(
                                                "block text-lg font-medium py-3 px-4 rounded-xl transition-all h-12 flex items-center",
                                                pathname === item.href
                                                    ? "text-navy-900 bg-slate-50 border-l-2 border-gold-600"
                                                    : "text-slate-600 hover:text-navy-900 hover:bg-slate-50"
                                            )}
                                        >
                                            {item.label}
                                        </Link>
                                    </motion.div>
                                ))}

                                <motion.div variants={itemVariants} className="pt-6 mt-6 border-t border-slate-100">
                                    <Button asChild fullWidth variant="primary" className="h-14">
                                        <a href="https://wa.me/5581997230455" target="_blank" rel="noopener noreferrer">
                                            {dict.whatsapp}
                                        </a>
                                    </Button>
                                </motion.div>

                                <div className="mt-4 flex justify-center gap-6">
                                    <Link href="/pt" className={cn("text-sm font-bold uppercase p-2", lang === 'pt' ? "text-navy-900 underline decoration-gold-600" : "text-slate-400")}>Português</Link>
                                    <Link href="/en" className={cn("text-sm font-bold uppercase p-2", lang === 'en' ? "text-navy-900 underline decoration-gold-600" : "text-slate-400")}>English</Link>
                                    <Link href="/ja" className={cn("text-sm font-bold uppercase p-2", lang === 'ja' ? "text-navy-900 underline decoration-gold-600" : "text-slate-400")}>日本語</Link>
                                </div>

                                {/* Mobile Footer in Menu */}
                                <div className="mt-8 p-6 bg-slate-50 rounded-2xl">
                                    <p className="text-sm font-bold text-navy-900 mb-1">Iule Miranda</p>
                                    <p className="text-[10px] text-slate-400 uppercase tracking-widest">CRECI 17933 | CNAI 53290</p>
                                </div>
                            </nav>
                        </motion.div>
                    )}
                </AnimatePresence>
            </header>
        </>
    );
}

const menuVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.3,
            ease: 'easeOut',
            staggerChildren: 0.05,
        },
    },
    exit: { opacity: 0, y: -20, transition: { duration: 0.2 } },
};

const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
};
