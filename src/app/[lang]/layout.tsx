
export async function generateStaticParams() {
    return [{ lang: 'pt' }, { lang: 'en' }]
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
