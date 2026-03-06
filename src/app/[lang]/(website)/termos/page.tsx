import type { Metadata } from 'next'
import Link from 'next/link'
import { FileText, Mail } from 'lucide-react'

export const metadata: Metadata = {
    title: 'Termos de Uso | IMI — Inteligência Imobiliária',
    description: 'Condições de uso do site e dos serviços da IMI – Inteligência Imobiliária.',
}

const sections = [
    {
        id: '1',
        title: 'Aceitação dos Termos',
        content: `Ao acessar e utilizar o site da IMI – Inteligência Imobiliária, você declara que leu, compreendeu e concorda com estes Termos de Uso. Caso não concorde com qualquer disposição, recomendamos que não utilize nossos serviços. Estes termos constituem um acordo legalmente vinculante entre você e a IMI.`,
    },
    {
        id: '2',
        title: 'Uso Permitido do Site',
        content: `O conteúdo deste site é destinado exclusivamente para fins informativos e de prestação de serviços de consultoria e corretagem imobiliária. É proibido: utilizar o site para fins ilegais, reproduzir ou distribuir qualquer conteúdo sem autorização expressa, realizar engenharia reversa de qualquer funcionalidade, enviar conteúdo abusivo, difamatório ou que viole direitos de terceiros.`,
    },
    {
        id: '3',
        title: 'Propriedade Intelectual',
        content: `Todo o conteúdo disponível no site — incluindo textos, análises, logotipos, design, código-fonte, banco de dados e metodologias — é de propriedade exclusiva da IMI – Inteligência Imobiliária e protegido pelas leis de direitos autorais (Lei 9.610/98) e marca registrada. A reprodução parcial ou total, sem prévia autorização por escrito, constitui infração legal.`,
    },
    {
        id: '4',
        title: 'Disclaimer de Informações',
        content: `As análises, projeções e informações de mercado disponibilizadas têm caráter meramente informativo e educacional. Não constituem oferta de investimento, recomendação financeira ou garantia de resultados. Embora busquemos a máxima precisão, não garantimos que todas as informações estejam isentas de erros ou totalmente atualizadas. Decisões de investimento devem ser tomadas com assessoria qualificada.`,
    },
    {
        id: '5',
        title: 'Limitação de Responsabilidade',
        content: `A IMI não se responsabiliza por danos diretos, indiretos ou consequenciais resultantes do uso ou impossibilidade de uso do site, interpretação equivocada de informações ou interrupções temporárias do serviço por razões técnicas ou de manutenção. Nossa responsabilidade em qualquer caso é limitada ao valor dos serviços contratados.`,
    },
    {
        id: '6',
        title: 'Links Externos',
        content: `Nosso site pode conter links para sites de terceiros. A IMI não controla nem endossa o conteúdo de sites externos e não assume responsabilidade por suas políticas de privacidade ou práticas comerciais. O acesso a sites de terceiros é feito por sua conta e risco.`,
    },
    {
        id: '7',
        title: 'Modificações nos Termos',
        content: `A IMI reserva-se o direito de modificar estes Termos de Uso a qualquer momento, sem aviso prévio. As alterações entram em vigor imediatamente após publicação no site. O uso continuado após modificações representa sua aceitação dos novos termos. Recomendamos a leitura periódica desta página.`,
    },
    {
        id: '8',
        title: 'Lei Aplicável e Foro',
        content: `Estes termos são regidos pelas leis da República Federativa do Brasil. Quaisquer disputas decorrentes do uso deste site serão submetidas ao foro da Comarca do Recife – Pernambuco, com exclusão de qualquer outro, por mais privilegiado que seja.`,
    },
]

export default function TermosPage() {
    return (
        <main style={{ background: '#FAFAFA', minHeight: '100vh' }}>
            {/* Hero */}
            <section style={{ background: '#0D1117' }} className="relative overflow-hidden">
                <div className="absolute inset-0 opacity-[0.04] bg-[url('/grid.svg')]" />
                <div className="absolute top-0 right-0 w-80 h-80 rounded-full blur-[120px] opacity-15" style={{ background: '#334E68' }} />
                <div className="max-w-[900px] mx-auto px-6 lg:px-8 py-20 lg:py-28 relative z-10">
                    <div className="flex items-center gap-3 mb-5">
                        <FileText size={18} style={{ color: '#486581' }} />
                        <span className="text-[11px] font-bold uppercase tracking-[0.22em]" style={{ color: '#486581' }}>Legal</span>
                    </div>
                    <h1
                        className="text-4xl lg:text-5xl font-bold text-white leading-[1.1] mb-4"
                        style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                    >
                        Termos de Uso
                    </h1>
                    <p className="text-base font-light" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        Última atualização: março de 2026
                    </p>
                </div>
            </section>

            {/* Content */}
            <div className="max-w-[900px] mx-auto px-6 lg:px-8 py-14 lg:py-20">
                {/* Lead */}
                <div className="rounded-3xl p-8 mb-10" style={{ background: '#fff', border: '1px solid #E9ECEF' }}>
                    <p className="text-base leading-relaxed" style={{ color: '#3D3D3D' }}>
                        Estes Termos de Uso regem o acesso e a utilização do site e dos serviços da{' '}
                        <strong>IMI – Inteligência Imobiliária</strong>, pertencente a Iule Miranda,
                        corretora de imóveis credenciada (CRECI 17933 | CNAI 53290), com sede em Recife, Pernambuco.
                        Por favor, leia com atenção antes de utilizar nossos serviços.
                    </p>
                </div>

                {/* Sections */}
                <div className="space-y-6">
                    {sections.map((section) => (
                        <div
                            key={section.id}
                            className="rounded-3xl p-7"
                            style={{ background: '#fff', border: '1px solid #E9ECEF' }}
                        >
                            <div className="flex items-start gap-4">
                                <span
                                    className="text-[11px] font-black uppercase tracking-widest mt-1 flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center"
                                    style={{ background: '#F0F4F8', color: '#486581' }}
                                >
                                    {section.id}
                                </span>
                                <div>
                                    <h2
                                        className="text-[17px] font-bold mb-3"
                                        style={{ color: '#1A1A1A', fontFamily: "'Playfair Display', Georgia, serif" }}
                                    >
                                        {section.title}
                                    </h2>
                                    <p className="text-sm leading-relaxed" style={{ color: '#6C757D' }}>
                                        {section.content}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Contact CTA */}
                <div
                    className="mt-10 rounded-3xl p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6"
                    style={{ background: '#0D1117' }}
                >
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: '#1A2333' }}>
                        <Mail size={20} style={{ color: '#486581' }} />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-bold text-white mb-1">Dúvidas jurídicas ou comerciais?</p>
                        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
                            Fale diretamente com nossa equipe pelo e-mail{' '}
                            <a
                                href="mailto:iulemirandaimoveis@gmail.com"
                                className="font-semibold underline"
                                style={{ color: '#486581' }}
                            >
                                iulemirandaimoveis@gmail.com
                            </a>
                        </p>
                    </div>
                    <Link
                        href="../contato"
                        className="flex-shrink-0 px-6 py-3 rounded-2xl text-sm font-bold"
                        style={{ background: '#334E68', color: '#fff' }}
                    >
                        Falar Conosco
                    </Link>
                </div>
            </div>
        </main>
    )
}
