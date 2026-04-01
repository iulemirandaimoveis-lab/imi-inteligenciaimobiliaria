
export async function generateStaticParams() {
    return [{ lang: 'pt' }, { lang: 'en' }, { lang: 'es' }, { lang: 'ja' }, { lang: 'ar' }]
}

export default function LangLayout({
    children,
    params,
}: {
    children: React.ReactNode
    params: { lang: string }
}) {
    return children
}
