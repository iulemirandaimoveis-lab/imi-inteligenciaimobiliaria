import JazzBoulevardLPClient from './JazzBoulevardLPClient'

export const metadata = {
  title: 'Jazz Boulevard Garanhuns | Sistema de Decisão para Investimento Imobiliário',
  description: 'Simule renda com imóveis, compare com CDI, IFIX e Tesouro IPCA e descubra quantas unidades do Jazz Boulevard fazem sentido para seu perfil.',
  keywords: ['investimento imobiliário garanhuns', 'renda com imóveis', 'airbnb interior pernambuco']
}

export default function Page() {
  return <JazzBoulevardLPClient />
}
