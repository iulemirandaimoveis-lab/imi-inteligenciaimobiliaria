import { notFound } from 'next/navigation'
import JazzBoulevardLPClient from '../../jazz-boulevard-garanhuns/lp/JazzBoulevardLPClient'

interface Props {
  params: { slug: string }
}

export const metadata = {
  title: 'Jazz Boulevard Garanhuns | Sistema de Decisão para Investimento Imobiliário',
  description: 'Simule renda com imóveis, compare com CDI, IFIX e Tesouro IPCA e descubra quantas unidades do Jazz Boulevard fazem sentido para seu perfil.',
  keywords: ['investimento imobiliário garanhuns', 'renda com imóveis', 'airbnb interior pernambuco']
}

export default function PropertyLpPage({ params }: Props) {
  if (params.slug !== 'jazz-boulevard-garanhuns') {
    notFound()
  }

  return <JazzBoulevardLPClient />
}
