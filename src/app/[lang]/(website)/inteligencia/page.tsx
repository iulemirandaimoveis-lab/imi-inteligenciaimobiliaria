import type { Metadata } from 'next'
import IntelligenceDashboard from './IntelligenceDashboard'

export const metadata: Metadata = {
    title: 'Inteligencia Imobiliaria | IMI — Iule Miranda Imoveis',
    description: 'Dashboard de inteligencia imobiliaria da IMI. Precos por bairro, tendencias de mercado, indicadores de qualidade de vida e mapa de precos para decisoes orientadas por dados.',
    openGraph: {
        title: 'Inteligencia Imobiliaria | IMI — Iule Miranda Imoveis',
        description: 'Dashboard de inteligencia imobiliaria. Precos, tendencias e indicadores por bairro nas principais cidades.',
        type: 'website',
    },
}

export default function InteligenciaPage({ params }: { params: { lang: string } }) {
    const { lang } = params

    return <IntelligenceDashboard lang={lang} />
}
