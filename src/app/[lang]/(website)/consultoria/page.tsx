import { HeroSection } from '@/components/consultoria/HeroSection';
import { ForWhom } from '@/components/consultoria/ForWhom';
import { LocationsSection } from '@/components/consultoria/LocationsSection';
import { InvestmentSimulator } from '@/components/consultoria/InvestmentSimulator';
import { LeverageCalculator } from '@/components/consultoria/LeverageCalculator';
import { StressTestCalculator } from '@/components/consultoria/StressTestCalculator';
import { QualificationCTA } from '@/components/consultoria/QualificationCTA';
import { LegalDisclaimer } from '@/components/consultoria/LegalDisclaimer';
import { consultingCities } from './data/cities';
import Link from 'next/link';

export const metadata = {
    title: 'Consultoria - Renda Imobiliária Internacional | IMI',
    description: 'Gere renda em dólar com imóveis internacionais. Estrutura jurídica, gestão profissional e crédito inteligente.'
};

interface PageProps {
    params: { lang: string };
}

export default function ConsultoriaPage({ params }: PageProps) {
    const { lang } = params;

    return (
        <div className="min-h-screen bg-[#0D0F14]">
            {/* Hero */}
            <HeroSection />

            {/* Para quem é / não é */}
            <ForWhom />

            {/* Localizações */}
            <LocationsSection />

            {/* Cidades de Consultoria */}
            <section className="section-padding bg-[#141420]">
                <div className="container-custom">
                    <div className="text-center mb-16">
                        <span className="text-[#3B82F6] font-bold tracking-widest uppercase text-xs">Destinos de Investimento</span>
                        <h2 className="text-3xl md:text-5xl font-display font-bold mt-4 mb-6 text-white">
                            Estratégias Prontas por Praça
                        </h2>
                        <p className="text-lg text-[#9CA3AF] max-w-2xl mx-auto font-light">
                            Explore as teses de investimento específicas para os mercados mais promissores do mundo.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {consultingCities.map(city => (
                            <Link
                                key={city.slug}
                                href={`/${lang}/consultoria/${city.slug}`}
                                className="group bg-[#0D0F14] border border-white/[0.05] p-8 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.2)] hover:shadow-[0_12px_40px_rgba(26,26,46,0.15)] hover:border-[#3B82F6]/30 hover:-translate-y-1 transition-all duration-300"
                            >
                                <div className="flex items-center gap-3 mb-6">
                                    <span className="text-3xl">{city.flag}</span>
                                    <h3 className="text-xl font-bold text-white font-display group-hover:text-[#3B82F6] transition-colors">
                                        {city.name}
                                    </h3>
                                </div>
                                <p className="text-sm text-[#9CA3AF] mb-6 font-light leading-relaxed line-clamp-2">
                                    {city.tagline}
                                </p>
                                <div className="pt-6 border-t border-white/5 flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-widest">Yield Estimado</span>
                                    <span className="text-sm font-bold text-white">{city.investmentProfile.avgYield}</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* Simulador principal */}
            <section className="section-padding bg-[#0D0F14]" id="simulator">
                <div className="container-custom">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-16">
                            <span className="text-[#3B82F6] font-bold tracking-widest uppercase text-xs">Análise de Viabilidade</span>
                            <h2 className="text-3xl md:text-5xl font-display font-bold mt-4 mb-6 text-white">
                                Simule seu Investimento em Tempo Real
                            </h2>
                            <p className="text-lg text-[#9CA3AF] max-w-2xl mx-auto font-light">
                                Ajuste os parâmetros de entrada, taxas e projeções de yield para visualizar o potencial de retorno (Cash-on-Cash) e fluxo de caixa mensal.
                            </p>
                        </div>

                        <InvestmentSimulator />
                    </div>
                </div>
            </section>

            {/* Calculadoras avançadas */}
            <section className="section-padding bg-[#141420]">
                <div className="container-custom">
                    <div className="max-w-6xl mx-auto space-y-20">

                        <div className="text-center">
                            <h2 className="text-3xl md:text-5xl font-display font-bold mb-6 text-white tracking-tight">
                                Robustez & Alavancagem
                            </h2>
                            <p className="text-lg text-[#9CA3AF] max-w-2xl mx-auto font-light leading-relaxed">
                                O investidor profissional trabalha com cenários, não com sorte. Entenda como o crédito inteligente potencializa seus ganhos e como sua operação se comporta sob estresse.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                            <div className="h-full">
                                <LeverageCalculator />
                            </div>
                            <div className="h-full">
                                <StressTestCalculator />
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            {/* CTA Final */}
            <QualificationCTA />

            {/* Disclaimer */}
            <section className="py-12 bg-[#0D0F14]">
                <div className="container-custom">
                    <div className="max-w-4xl mx-auto">
                        <LegalDisclaimer />
                    </div>
                </div>
            </section>
        </div>
    );
}
