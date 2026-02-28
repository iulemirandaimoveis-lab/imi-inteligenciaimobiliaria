'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { slideUp, staggerContainer } from '@/lib/animations'
import { Building2, Banknote, TrendingUp, ShieldCheck, Clock, ChevronDown, ChevronUp, MessageCircle, Info } from 'lucide-react'
import Button from '@/components/ui/Button'
import { formatCurrency } from '@/lib/utils'
import Image from 'next/image'
import LeadCaptureModal from '@/app/[lang]/(website)/imoveis/components/LeadCaptureModal'

const creditTypes = [
    {
        icon: Building2,
        title: 'Consórcio Imobiliário',
        description: 'Solução estratégica sem juros para aquisição de imóveis através de grupos de consórcio. Ideal para quem planeja o futuro com inteligência financeira.',
        benefits: [
            'Sem juros, apenas taxa de administração',
            'Parcelas que cabem no seu planejamento',
            'Possibilidade de antecipar com lances',
            'Uso do FGTS para lances ou amortização'
        ]
    },
    {
        icon: Banknote,
        title: 'Financiamento Bancário',
        description: 'Acesso imediato ao imóvel com as melhores taxas do mercado. Assessoria completa para aprovação de crédito junto aos principais bancos.',
        benefits: [
            'Posse imediata do imóvel',
            'Taxas competitivas e prazos longos',
            'Prazos de até 35 anos (420 meses)',
            'Parceria com Caixa, Bradesco, Itaú e Santander'
        ]
    }
]

const consortiumPlans = [
    { value: 200000, parcels: 200, monthly: 1320, admin: '18%', insurance: '0.025%/mês' },
    { value: 350000, parcels: 200, monthly: 2310, admin: '18%', insurance: '0.025%/mês' },
    { value: 500000, parcels: 200, monthly: 3300, admin: '18%', insurance: '0.025%/mês' },
    { value: 700000, parcels: 220, monthly: 4200, admin: '17%', insurance: '0.025%/mês' },
    { value: 1000000, parcels: 220, monthly: 6000, admin: '16%', insurance: '0.025%/mês' },
    { value: 1500000, parcels: 240, monthly: 8250, admin: '15%', insurance: '0.025%/mês' },
]

const faqs = [
    {
        question: 'O que é consórcio imobiliário?',
        answer: 'O consórcio imobiliário é uma modalidade de compra coletiva onde um grupo de pessoas se une para formar uma poupança comum. Mensalmente, participantes são contemplados por sorteio ou lance e recebem a carta de crédito.'
    },
    {
        question: 'Quais as vantagens do consórcio?',
        answer: 'As principais vantagens são: ausência de juros, parcelas menores que financiamento, possibilidade de usar FGTS e flexibilidade para escolher o imóvel após a contemplação.'
    },
    {
        question: 'Quanto tempo demora para ser contemplado?',
        answer: 'A contemplação pode ocorrer desde o primeiro mês por sorteio. Com lances estratégicos, você pode acelerar significativamente esse processo.'
    }
]

export default function CreditPage() {
    const [loanAmount, setLoanAmount] = useState(500000)
    const [propertyValue, setPropertyValue] = useState(700000)
    const [years, setYears] = useState(20)
    const [interestRate] = useState(10.5)
    const [openFaq, setOpenFaq] = useState<number | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)

    const handleSuccess = () => {
        window.open("https://wa.me/5581997230455", "_blank")
        setIsModalOpen(false)
    }

    const calculateMonthlyPayment = () => {
        const monthlyRate = interestRate / 100 / 12
        const numberOfPayments = years * 12
        const monthlyPayment = (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
            (Math.pow(1 + monthlyRate, numberOfPayments) - 1)
        return monthlyPayment
    }

    const monthlyPayment = calculateMonthlyPayment()
    const totalPaid = monthlyPayment * years * 12
    const totalInterest = totalPaid - loanAmount
    const ltv = (loanAmount / propertyValue) * 100

    return (
        <main className="bg-[#0D0F14] min-h-screen">
            {/* HERO */}
            <section className="relative bg-[#141420] overflow-hidden">
                <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)', backgroundSize: '40px 40px' }} />
                <div className="absolute top-0 right-0 w-[500px] h-[500px] -translate-y-1/3 translate-x-1/3 rounded-full bg-[#1A1A2E]/[0.07] blur-[80px]" />
                <div className="relative z-10 container-custom py-20 lg:py-28">
                    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-3xl">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-8 h-px bg-[#1A1A2E]" />
                            <span className="text-[#3B82F6] text-[11px] font-bold uppercase tracking-[0.25em]">Crédito Imobiliário</span>
                        </div>
                        <h1 className="text-[40px] sm:text-[52px] lg:text-[64px] font-black leading-[1.02] tracking-tight mb-6 text-white" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                            Financie com <span className="text-[#3B82F6]">Inteligência</span>
                        </h1>
                        <p className="text-[17px] lg:text-[19px] leading-relaxed font-light text-[#9CA3AF] max-w-2xl">
                            Assessoria especializada para garantir as melhores condições de crédito, seja através do consórcio CAIXA ou financiamento bancário personalizado.
                        </p>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-12 flex flex-wrap gap-x-10 gap-y-6">
                            {[{ v: 'CAIXA', l: 'Consórcio oficial' }, { v: '35', l: 'Anos de prazo máx.' }, { v: 'Selic', l: 'Taxas atualizadas' }].map((s, i) => (
                                <div key={i}>
                                    <div className="text-[30px] font-black text-[#3B82F6] leading-none mb-1" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>{s.v}</div>
                                    <div className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#6C757D]">{s.l}</div>
                                </div>
                            ))}
                        </motion.div>
                    </motion.div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent" />
            </section>

            {/* MODALIDADES */}
            <section className="section-padding">
                <div className="container-custom">
                    <h2 className="font-display text-3xl md:text-5xl font-bold text-white mb-4 text-center">
                        Modalidades de Crédito
                    </h2>
                    <p className="text-[#9CA3AF] text-lg max-w-2xl mx-auto text-center mb-16 font-light">
                        Oferecemos as melhores opções do mercado para viabilizar seu investimento imobiliário com o máximo de eficiência financeira.
                    </p>

                    <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                        {creditTypes.map((type, index) => (
                            <motion.div
                                key={index}
                                variants={slideUp}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className="p-10 rounded-3xl bg-[#141420] border border-white/[0.05] shadow-[0_8px_32px_rgba(0,0,0,0.2)] hover:border-[#3B82F6]/30 hover:shadow-[0_12px_40px_rgba(26,26,46,0.15)] transition-all duration-300"
                            >
                                <div className="w-14 h-14 bg-[#1A1E2A] border border-white/10 text-[#3B82F6] rounded-2xl flex items-center justify-center mb-8">
                                    <type.icon className="w-6 h-6" strokeWidth={1.5} />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-4 font-display">
                                    {type.title}
                                </h3>
                                <p className="text-[#9CA3AF] mb-8 text-sm leading-relaxed">
                                    {type.description}
                                </p>
                                <ul className="space-y-4">
                                    {type.benefits.map((benefit, i) => (
                                        <li key={i} className="flex items-start gap-3 text-sm text-[#D1D5DB] font-medium">
                                            <ShieldCheck className="w-5 h-5 text-[#3B82F6] flex-shrink-0" strokeWidth={1.5} />
                                            {benefit}
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* SEÇÃO CAIXA CONSÓRCIOS */}
            <section className="section-padding bg-[#0D0F14] text-white relative overflow-hidden border-t border-white/[0.05]">
                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                    <div className="absolute top-0 right-0 w-1/2 h-full bg-[#1A1A2E] -skew-x-12 translate-x-1/2" />
                </div>

                <div className="container-custom relative z-10">
                    <div className="max-w-6xl mx-auto">
                        <div className="grid lg:grid-cols-2 gap-16 items-center mb-20">
                            <div>
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8">
                                    <span className="w-2 h-2 bg-[#1A1A2E] rounded-full animate-pulse" />
                                    <span className="text-xs font-bold uppercase tracking-widest text-[#9CA3AF]">IMI & CAIXA Consórcios</span>
                                </div>
                                <h2 className="text-3xl md:text-5xl font-display font-bold mb-8 leading-tight">
                                    Parceiro Oficial <br />
                                    <span className="text-[#3B82F6]">CAIXA Consórcios</span>
                                </h2>
                                <p className="text-[#9CA3AF] text-lg font-light leading-relaxed mb-8">
                                    A IMI é parceira estratégica da Caixa Econômica Federal. O consórcio CAIXA é a solução mais segura e vendida do Brasil, com mais de 1 milhão de consorciados ativos e as menores taxas de administração do mercado.
                                </p>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-6 h-6 rounded-full bg-accent-500 flex items-center justify-center text-imi-900">
                                            <ShieldCheck size={14} />
                                        </div>
                                        <span className="font-medium">Maior administradora de consórcios do país</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-6 h-6 rounded-full bg-accent-500 flex items-center justify-center text-imi-900">
                                            <ShieldCheck size={14} />
                                        </div>
                                        <span className="font-medium">Garantia e solidez da Caixa Econômica Federal</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {consortiumPlans.map((plan, index) => (
                                    <div key={index} className="bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-2xl hover:bg-white/10 transition-colors group">
                                        <p className="text-[#9CA3AF] text-[10px] font-bold uppercase tracking-widest mb-2">Carta de Crédito</p>
                                        <p className="text-2xl font-bold text-white mb-4 font-display group-hover:text-[#3B82F6] transition-colors">
                                            {formatCurrency(plan.value)}
                                        </p>
                                        <div className="space-y-2 text-xs">
                                            <div className="flex justify-between">
                                                <span className="text-[#9CA3AF]">Parcela Mensal</span>
                                                <span className="font-bold text-[#3B82F6]">{formatCurrency(plan.monthly)}</span>
                                            </div>
                                            <div className="flex justify-between border-t border-white/5 pt-2">
                                                <span className="text-[#9CA3AF]">Prazo</span>
                                                <span>{plan.parcels} meses</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-[#9CA3AF]">Taxa Admin</span>
                                                <span>{plan.admin} total</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-[#9CA3AF]">Seguro</span>
                                                <span>{plan.insurance}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-xl text-[10px] text-[#9CA3AF] uppercase tracking-tighter">
                            <Info size={14} className="text-[#3B82F6] flex-shrink-0" />
                            <p>
                                * Valores de referência com base nas condições vigentes da Caixa Consórcios. Sujeitos a alteração sem aviso prévio. Consulte condições atualizadas com nossos especialistas.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* SIMULADOR DE FINANCIAMENTO */}
            <section id="simulador" className="section-padding bg-[#141420] border-t border-white/[0.05]">
                <div className="container-custom">
                    <div className="max-w-4xl mx-auto">
                        <div className="text-center mb-16">
                            <span className="text-[#3B82F6] font-bold tracking-widest uppercase text-xs">Simulador Financeiro</span>
                            <h2 className="font-display text-3xl md:text-5xl font-bold text-white mt-4 mb-6">
                                Financiamento Bancário
                            </h2>
                            <p className="text-[#9CA3AF] text-lg font-light">
                                Calcule sua parcela mensal no Sistema Price e planeje sua aquisição com total clareza.
                            </p>
                        </div>

                        <div className="bg-[#0D0F14] rounded-3xl p-8 md:p-12 border border-white/[0.05] shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
                            <div className="grid lg:grid-cols-2 gap-16">
                                <div className="space-y-10">
                                    {/* Valor do imóvel */}
                                    <div>
                                        <div className="flex justify-between mb-4">
                                            <label className="text-sm font-bold text-[#9CA3AF] uppercase tracking-wider">Valor do Imóvel</label>
                                            <span className="text-xl font-bold text-white font-display">{formatCurrency(propertyValue)}</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="100000"
                                            max="5000000"
                                            step="50000"
                                            value={propertyValue}
                                            onChange={(e) => {
                                                const val = Number(e.target.value)
                                                setPropertyValue(val)
                                                if (loanAmount > val * 0.8) setLoanAmount(val * 0.8)
                                            }}
                                            className="w-full h-3 bg-[#1A1E2A] rounded-lg appearance-none cursor-pointer [#3B82F6] touch-pan-x"
                                        />
                                    </div>

                                    {/* Valor a financiar */}
                                    <div>
                                        <div className="flex justify-between mb-4">
                                            <label className="text-sm font-bold text-[#9CA3AF] uppercase tracking-wider">Valor a Financiar</label>
                                            <span className="text-xl font-bold text-white font-display">{formatCurrency(loanAmount)}</span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-6">
                                            {[50, 70, 80].map((percent) => (
                                                <button
                                                    key={percent}
                                                    onClick={() => setLoanAmount((propertyValue * percent) / 100)}
                                                    className={`py-3 sm:py-2 text-sm sm:text-xs font-bold rounded-xl border transition-all min-h-[44px] ${Math.round((loanAmount / propertyValue) * 100) === percent
                                                        ? 'bg-[#1A1E2A] text-white border-[#21263A] border-l-2 border-[#3B82F6]'
                                                        : 'border-white/10 text-[#9CA3AF] hover:bg-white/5 hover:border-white/20'
                                                        }`}
                                                >
                                                    {percent}%
                                                </button>
                                            ))}
                                        </div>
                                        <input
                                            type="range"
                                            min="50000"
                                            max={propertyValue * 0.9}
                                            step="10000"
                                            value={loanAmount}
                                            onChange={(e) => setLoanAmount(Number(e.target.value))}
                                            className="w-full h-3 bg-[#1A1E2A] rounded-lg appearance-none cursor-pointer [#3B82F6] touch-pan-x"
                                        />
                                    </div>

                                    {/* Prazo */}
                                    <div>
                                        <div className="flex justify-between mb-4">
                                            <label className="text-sm font-bold text-[#9CA3AF] uppercase tracking-wider">Prazo de Pagamento</label>
                                            <span className="text-xl font-bold text-white font-display">{years} anos</span>
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                                            {[10, 15, 20, 30].map((y) => (
                                                <button
                                                    key={y}
                                                    onClick={() => setYears(y)}
                                                    className={`py-3 sm:py-2 text-sm sm:text-xs font-bold rounded-xl border transition-all min-h-[44px] ${years === y
                                                        ? 'bg-[#1A1E2A] text-white border-[#21263A] border-l-2 border-[#3B82F6]'
                                                        : 'border-white/10 text-[#9CA3AF] hover:bg-white/5 hover:border-white/20'
                                                        }`}
                                                >
                                                    {y} anos
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* RESULTADO */}
                                <div className="bg-[#141420] border border-white/[0.05] text-white rounded-2xl p-8 flex flex-col justify-between relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#1A1A2E]/10 rounded-full blur-3xl -mr-16 -mt-16" />
                                    <div className="relative z-10">
                                        <div className="text-[#9CA3AF] text-xs font-bold uppercase tracking-widest mb-2">Parcela Mensal Estimada</div>
                                        <div className="text-3xl sm:text-4xl md:text-5xl font-bold mb-8 sm:mb-10 font-display text-[#3B82F6]">
                                            {formatCurrency(monthlyPayment)}
                                        </div>

                                        <div className="space-y-6">
                                            <div className="flex justify-between text-sm py-4 border-b border-white/5">
                                                <span className="text-[#9CA3AF] font-medium font-display uppercase tracking-widest text-[10px]">Total Financiado</span>
                                                <span className="font-bold">{formatCurrency(loanAmount)}</span>
                                            </div>
                                            <div className="flex justify-between text-sm py-4 border-b border-white/5">
                                                <span className="text-[#9CA3AF] font-medium font-display uppercase tracking-widest text-[10px]">Total de Juros</span>
                                                <span className="font-bold">{formatCurrency(totalInterest)}</span>
                                            </div>
                                            <div className="flex justify-between text-sm py-4 border-b border-white/5">
                                                <span className="text-[#9CA3AF] font-medium font-display uppercase tracking-widest text-[10px]">LTV (Alienação)</span>
                                                <span className="font-bold">{ltv.toFixed(1)}%</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-10 flex items-center gap-3 p-4 bg-white/5 rounded-xl text-[10px] text-[#9CA3AF] leading-tight">
                                        <Info size={14} className="text-[#3B82F6] flex-shrink-0" />
                                        <p>* Simulação baseada em taxa média de mercado. Valores reais podem variar conforme o banco escolhido e perfil de crédito.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* POR QUE ESCOLHER IMI */}
            <section className="section-padding bg-[#0D0F14]">
                <div className="container-custom">
                    <h2 className="font-display text-3xl md:text-5xl font-bold text-white mb-16 text-center">
                        Diferenciais da Assessoria IMI
                    </h2>

                    <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
                        {[
                            {
                                icon: TrendingUp,
                                title: 'Taxas Preferenciais',
                                description: 'Negociação exclusiva com bancos parceiros para garantir taxas abaixo da média de mercado.'
                            },
                            {
                                icon: ShieldCheck,
                                title: 'Compliance Jurídico',
                                description: 'Blindagem total do seu investimento com análise preventiva de riscos e documentação técnica.'
                            },
                            {
                                icon: Clock,
                                title: 'Tramitação Express',
                                description: 'Fluxo de aprovação acelerado, reduzindo o tempo de espera do financiamento em até 40%.'
                            }
                        ].map((item, index) => (
                            <div key={index} className="text-center group">
                                <div className="w-20 h-20 bg-[#1A1E2A] text-[#3B82F6] border border-white/10 rounded-3xl flex items-center justify-center mx-auto mb-8 group-hover:bg-[#141420] group-hover:border-[#3B82F6]/30 transition-all duration-500 group-hover:-translate-y-2">
                                    <item.icon className="w-8 h-8" strokeWidth={1.5} />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-4 font-display uppercase tracking-tight">
                                    {item.title}
                                </h3>
                                <p className="text-[#9CA3AF] leading-relaxed text-sm font-light">
                                    {item.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className="section-padding bg-[#141420] border-t border-white/[0.05]">
                <div className="container-custom">
                    <div className="max-w-3xl mx-auto">
                        <div className="text-center mb-16">
                            <span className="text-[#3B82F6] font-bold tracking-widest uppercase text-xs">Suporte Técnico</span>
                            <h2 className="font-display text-3xl md:text-5xl font-bold text-white mt-4">
                                Dúvidas Frequentes
                            </h2>
                        </div>

                        <div className="space-y-4">
                            {faqs.map((faq, index) => (
                                <div key={index} className="bg-[#0D0F14] rounded-2xl border border-white/[0.05] overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
                                    <button
                                        onClick={() => setOpenFaq(openFaq === index ? null : index)}
                                        className="w-full px-8 py-6 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
                                    >
                                        <span className="font-bold text-white font-display">{faq.question}</span>
                                        {openFaq === index ? (
                                            <div className="w-8 h-8 bg-white/10 text-white rounded-full flex items-center justify-center"><ChevronUp size={18} /></div>
                                        ) : (
                                            <div className="w-8 h-8 bg-[#1A1E2A] text-white rounded-full flex items-center justify-center"><ChevronDown size={18} /></div>
                                        )}
                                    </button>
                                    <AnimatePresence>
                                        {openFaq === index && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="px-8 pb-8"
                                            >
                                                <p className="text-[#9CA3AF] text-sm leading-relaxed font-light">{faq.answer}</p>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA FINAL */}
            <section className="bg-[#0D0F14] section-padding text-center relative overflow-hidden">
                <div className="container-custom relative z-10">
                    <div className="max-w-4xl mx-auto bg-[#141420] text-white rounded-[40px] p-12 md:p-20 relative overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.3)] border border-[#21263A] border-b-4 border-b-[#3B82F6]">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-[#1A1A2E]/10 rounded-full blur-3xl -mr-32 -mt-32" />
                        <h2 className="font-display text-3xl md:text-5xl font-bold mb-8 relative z-10 tracking-tight leading-tight">
                            Vamos estruturar sua <br />
                            <span className="text-[#3B82F6] italic">Engenharia Financeira?</span>
                        </h2>
                        <p className="text-[#9CA3AF] text-lg md:text-xl mb-12 max-w-2xl mx-auto font-light leading-relaxed relative z-10">
                            Fale agora com um especialista IMI e descubra qual a melhor alavancagem para o seu momento de investimento.
                        </p>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="inline-flex items-center justify-center gap-3 h-14 sm:h-16 px-8 sm:px-12 text-[14px] sm:text-[16px] font-bold uppercase tracking-widest bg-[#1A1E2A] text-white rounded-2xl border border-[#21263A] border-l-4 border-[#3B82F6] border-r-4 border-r-[#E53935] shadow-[0_8px_32px_rgba(26,26,46,0.15)] hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(26,26,46,0.25)] transition-all duration-300 relative z-10 w-full sm:w-auto"
                        >
                            <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 text-[#3B82F6]" />
                            Agendar Sessão de Crédito
                        </button>
                    </div>
                </div>
            </section>

            <AnimatePresence>
                {isModalOpen && (
                    <LeadCaptureModal
                        title="Assessoria de Crédito"
                        description="Preencha seus dados para receber uma análise personalizada de crédito e alavancagem financeira."
                        customInterest="Consultoria de Crédito / Financiamento"
                        onClose={() => setIsModalOpen(false)}
                        onSuccess={handleSuccess}
                    />
                )}
            </AnimatePresence>
        </main>
    )
}
