import { Suspense } from 'react';
import CarrinhoClient from './CarrinhoClient';

export const metadata = {
  title: 'Seleção de lotes | IMI',
  description: 'Lotes selecionados para proposta — Inteligência Imobiliária.',
  robots: { index: false, follow: false },
};

export default function CarrinhoPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '60vh' }} />}>
      <CarrinhoClient />
    </Suspense>
  );
}
