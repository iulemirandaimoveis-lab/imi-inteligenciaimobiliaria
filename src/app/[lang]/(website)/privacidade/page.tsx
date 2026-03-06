import type { Metadata } from 'next'
import Link from 'next/link'
import { ShieldCheck, Mail } from 'lucide-react'

export const metadata: Metadata = {
    title: 'Política de Privacidade | IMI — Inteligência Imobiliária',
    description: 'Como a IMI coleta, usa e protege seus dados pessoais. Compromisso com transparência e segurança.',
}

const sections = [
    {
        id: '1',
        title: 'Coleta de Informações',
        content: `Coletamos informações que você nos fornece diretamente ao preencher formulários de contato, solicitar avaliações ou se inscrever em nossa newsletter. Isso pode incluir nome, e-mail, telefone e informações sobre seus interesses imobiliários. Também coletamos automaticamente dados de navegação como endereço IP, tipo de dispositivo e páginas visitadas, com o objetivo exclusivo de melhorar sua experiência.`,
    },
    {
        id: '2',
        title: 'Uso das Informações',
        content: `Utilizamos seus dados para responder às suas solicitações, fornecer nossos serviços de consultoria e corretagem, enviar comunicações relacionadas aos seus interesses imobiliários e melhorar continuamente nossa plataforma. Jamais vendemos ou compartilhamos seus dados com terceiros para fins comerciais.`,
    },
    {
        id: '3',
        title: 'Cookies e Tecnologias de Rastreamento',
        content: `Utilizamos cookies para análise de tráfego e melhoria da experiência do usuário. Você pode gerenciar suas preferências de cookies nas configurações do seu navegador. O uso de cookies essenciais é necessário para o funcionamento correto do site.`,
    },
    {
        id: '4',
        title: 'Segurança dos Dados',
        content: `Implementamos medidas técnicas e organizacionais rigorosas para proteger suas informações contra acesso não autorizado, alteração, divulgação ou destruição. Nossos sistemas utilizam criptografia TLS e são auditados regularmente. Em caso de incidente, notificaremos os usuários afetados conforme exigido pela LGPD.`,
    },
    {
        id: '5',
        title: 'Seus Direitos (LGPD)',
        content: `Conforme a Lei Geral de Proteção de Dados (Lei 13.709/2018), você tem direito a: acessar seus dados, corrigir informações incompletas ou desatualizadas, solicitar a exclusão de dados desnecessários, revogar consentimento a qualquer momento e portabilidade dos dados. Para exercer esses direitos, entre em contato pelo e-mail abaixo.`,
    },
    {
        id: '6',
        title: 'Retenção de Dados',
        content: `Mantemos seus dados pelo tempo necessário para cumprir as finalidades descritas nesta política ou conforme exigido por lei. Após esse período, os dados são eliminados de forma segura ou anonimizados.`,
    },
    {
        id: '7',
        title: 'Atualizações desta Política',
        content: `Esta política pode ser atualizada periodicamente para refletir mudanças em nossas práticas ou obrigações legais. A data da última revisão está indicada no rodapé desta página. Recomendamos a leitura periódica.`,
    },
]

export default function PrivacidadePage() {
    return (
        <main style={{ background: '#FAFAFA', minHeight: '100vh' }}>
            {/* Hero */}
            <section style={{ background: '#0D1117' }} className="relative overflow-hidden">
                <div className="absolute inset-0 opacity-[0.04] bg-[url('/grid.svg')]" />
                <div className="absolute top-0 right-0 w-80 h-80 rounded-full blur-[120px] opacity-15" style={{ background: '#334E68' }} />
                <div className="max-w-[900px] mx-auto px-6 lg:px-8 py-20 lg:py-28 relative z-10">
                    <div className="flex items-center gap-3 mb-5">
                        <ShieldCheck size={18} style={{ color: '#486581' }} />
                        <span className="text-[11px] font-bold uppercase tracking-[0.22em]" style={{ color: '#486581' }}>Legal</span>
                    </div>
                    <h1
                        className="text-4xl lg:text-5xl font-bold text-white leading-[1.1] mb-4"
                        style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                    >
                        Política de Privacidade
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
                        A <strong>IMI – Inteligência Imobiliária</strong> está comprometida com a transparência e proteção
                        dos seus dados pessoais. Esta política descreve quais informações coletamos, como as utilizamos e
                        quais são seus direitos como titular dos dados, em conformidade com a <strong>Lei Geral de Proteção
                        de Dados (LGPD – Lei 13.709/2018)</strong>.
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
                        <p className="text-sm font-bold text-white mb-1">Dúvidas ou solicitações sobre seus dados?</p>
                        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
                            Entre em contato pelo e-mail{' '}
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
