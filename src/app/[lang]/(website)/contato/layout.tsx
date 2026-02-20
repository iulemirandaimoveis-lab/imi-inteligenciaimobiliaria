// Layout Server Component — exporta metadata para rota '/contato'
// A página pode ser 'use client' — metadata só funciona em Server Components
import type { Metadata } from 'next'
import { PAGE_METADATA } from '@/lib/page-metadata'

interface Props {
  children: React.ReactNode
  params: { lang: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return PAGE_METADATA.contato(params.lang)
}

export default function Layout({ children }: Props) {
  return children as React.ReactElement
}
