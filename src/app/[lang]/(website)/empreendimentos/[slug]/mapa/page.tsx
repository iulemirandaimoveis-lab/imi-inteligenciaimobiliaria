import { redirect } from 'next/navigation'

interface Props {
  params: Promise<{ lang: string; slug: string }>
}

export default async function EmpreendimentoMapaPage({ params }: Props) {
  const { lang, slug } = await params
  redirect(`/${lang}/empreendimentos/${slug}`)
}
