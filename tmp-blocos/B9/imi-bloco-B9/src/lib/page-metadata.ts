// src/lib/page-metadata.ts
// ── Metadata centralizado por rota — Next.js 14 App Router ───
// Usar em layouts de Server Component, não em páginas 'use client'
// Pattern: cada rota tem seu próprio layout.tsx que exporta generateMetadata

import type { Metadata } from 'next'

const BASE = 'https://www.iulemirandaimoveis.com.br'
const SITE = 'IMI — Iule Miranda Imóveis'
const OG   = `${BASE}/og-image.jpg`

function meta(
  title: string,
  description: string,
  path: string,
  image = OG
): Metadata {
  const fullTitle = `${title} | ${SITE}`
  const url = `${BASE}${path}`
  return {
    title: fullTitle,
    description,
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: SITE,
      images: [{ url: image, width: 1200, height: 630, alt: title }],
      locale: 'pt_BR',
      type: 'website',
    },
    twitter: { card: 'summary_large_image', title: fullTitle, description, images: [image] },
    alternates: { canonical: url },
  }
}

export const PAGE_METADATA = {
  home: (lang: string) => meta(
    'Inteligência Imobiliária',
    'Avaliações NBR 14653, consultoria patrimonial e corretagem de alto padrão em Recife, Dubai e EUA.',
    `/${lang}`
  ),
  avaliacoes: (lang: string) => meta(
    'Avaliações Imobiliárias NBR 14653',
    'Laudos técnicos para fins judiciais, garantia bancária, inventários e partilhas. CNAI habilitado. Recife e região metropolitana.',
    `/${lang}/avaliacoes`
  ),
  credito: (lang: string) => meta(
    'Crédito Imobiliário — Simulador e Assessoria',
    'Simulação PRICE e SAC, comparativo entre bancos, enquadramento SFH/SFI. Assessoria completa na contratação.',
    `/${lang}/credito`
  ),
  consultoria: (lang: string) => meta(
    'Consultoria Estratégica Imobiliária',
    'Análise de viabilidade, estruturação patrimonial e consultoria para investimentos no Brasil, Dubai e EUA. Para investidores institucionais e qualificados.',
    `/${lang}/consultoria`
  ),
  imoveis: (lang: string) => meta(
    'Imóveis de Alto Padrão — Portfólio Curado',
    'Residências, coberturas e empreendimentos premium em Recife e Olinda. Curadoria técnica com análise de mercado.',
    `/${lang}/imoveis`
  ),
  projetos: (lang: string) => meta(
    'Projetos & Empreendimentos',
    'Portfólio de desenvolvimentos imobiliários de alto padrão. Reserva Atlantis e outros empreendimentos estruturados para investidores institucionais.',
    `/${lang}/projetos`
  ),
  sobre: (lang: string) => meta(
    'Sobre a IMI — Quem Somos',
    'Iule Miranda Imóveis: 15+ anos de experiência em inteligência imobiliária, avaliações técnicas e consultoria estratégica em Recife e mercados internacionais.',
    `/${lang}/sobre`
  ),
  contato: (lang: string) => meta(
    'Contato — Fale com um Especialista',
    'Entre em contato para solicitar avaliação, consultoria ou informações sobre nosso portfólio. Resposta em até 2 horas.',
    `/${lang}/contato`
  ),
  inteligencia: (lang: string) => meta(
    'Inteligência de Mercado Imobiliário',
    'Análises, indicadores e dados do mercado imobiliário de Recife e região. Atualização mensal com metodologia FIPE ZAP.',
    `/${lang}/inteligencia`
  ),
} as const
