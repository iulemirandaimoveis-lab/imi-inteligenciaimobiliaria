'use client';

import { useState } from 'react';
import { Development } from '../types/development';
import Button from '@/components/ui/Button';
import { MessageCircle, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { slideUp, staggerContainer } from '@/lib/animations';
import LeadCaptureModal from './LeadCaptureModal';

interface DevelopmentCTAProps {
    development: Development;
}

export default function DevelopmentCTA({ development }: DevelopmentCTAProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [ctaType, setCtaType] = useState<'info' | 'table'>('info');

    const handleCTAClick = (type: 'info' | 'table') => {
        setCtaType(type);
        setIsModalOpen(true);
    };

    const handleSuccess = () => {
        const messages = {
            info: `Olá! Tenho interesse no ${development.name}. Gostaria de mais informações.`,
            table: `Olá! Gostaria de receber a tabela completa de preços do ${development.name}.`
        };

        const message = encodeURIComponent(messages[ctaType as keyof typeof messages]);
        window.open(`https://wa.me/5581997230455?text=${message}`, '_blank');
        setIsModalOpen(false);
    };

    return (
        <section className="section-padding bg-imi-900 text-white relative overflow-hidden">
            {/* Background Decorative Element */}
            <div className="absolute top-0 right-0 w-1/3 h-full bg-accent-500/5 -skew-x-12 translate-x-1/2" />

            <div className="container-custom relative z-10">
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={staggerContainer}
                    className="text-center max-w-4xl mx-auto"
                >
                    <motion.h2 variants={slideUp} className="font-display text-4xl md:text-5xl lg:text-6xl mb-6 font-bold tracking-tight">
                        Interessado neste <span className="text-accent-500 italic">ativo?</span>
                    </motion.h2>
                    <motion.p variants={slideUp} className="text-accent-500 text-lg md:text-xl mb-12 font-light max-w-2xl mx-auto leading-relaxed">
                        Fale diretamente com nossa mesa de negócios técnica e tire todas as suas dúvidas sobre rentabilidade e viabilidade.
                    </motion.p>

                    <motion.div variants={slideUp} className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full">
                        <Button
                            size="lg"
                            className="bg-white text-imi-900 hover:bg-imi-50 w-full sm:w-auto sm:min-w-[280px] min-h-[64px] h-auto py-4 font-bold uppercase tracking-[0.2em] text-xs sm:text-sm shadow-xl flex-wrap text-center"
                            onClick={() => handleCTAClick('info')}
                        >
                            <MessageCircle className="w-5 h-5 mr-0 sm:mr-3 shrink-0 text-imi-600 mb-1 sm:mb-0 block sm:inline-block" />
                            Falar com Especialista
                        </Button>

                        <Button
                            size="lg"
                            variant="outline"
                            className="border-white/30 text-white hover:bg-white/10 w-full sm:w-auto sm:min-w-[280px] min-h-[64px] h-auto py-4 font-bold uppercase tracking-[0.2em] text-xs sm:text-sm flex-wrap text-center"
                            onClick={() => handleCTAClick('table')}
                        >
                            <FileText className="w-5 h-5 mr-0 sm:mr-3 shrink-0 text-accent-500 mb-1 sm:mb-0 block sm:inline-block" />
                            Solicitar Tabela Completa
                        </Button>
                    </motion.div>
                </motion.div>
            </div>
            <AnimatePresence>
                {isModalOpen && (
                    <LeadCaptureModal
                        propertyName={development.name}
                        propertyId={development.id}
                        onClose={() => setIsModalOpen(false)}
                        onSuccess={handleSuccess}
                    />
                )}
            </AnimatePresence>
        </section>
    );
}
