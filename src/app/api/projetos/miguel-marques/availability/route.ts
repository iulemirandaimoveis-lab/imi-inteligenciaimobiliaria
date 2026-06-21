import { NextResponse } from 'next/server';
import { extractAvailabilityFromCsv } from '@/lib/lots/miguel-marques-availability';

/**
 * Disponibilidade em tempo real do Miguel Marques a partir da planilha "Mi Gestão".
 *
 * Configurar `MM_AVAILABILITY_CSV_URL` com a URL de CSV publicado da planilha
 * (Arquivo → Compartilhar → Publicar na web → CSV da aba de disponibilidade).
 * Sem a variável, a rota responde vazio e o mapa mantém o status do CAD/Supabase
 * (degradação segura — nada quebra antes da planilha ser publicada).
 */
// Handler dinâmico (lê a env a cada request); o custo de rede fica protegido pelo
// cache de 60s do fetch upstream do CSV (next: { revalidate: 60 }).
export const dynamic = 'force-dynamic';

export async function GET() {
  const url = process.env.MM_AVAILABILITY_CSV_URL;
  if (!url) {
    return NextResponse.json({ source: 'none', count: 0, availability: {} });
  }
  try {
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) {
      return NextResponse.json({ source: 'error', status: res.status, count: 0, availability: {} });
    }
    const csv = await res.text();
    const availability = extractAvailabilityFromCsv(csv);
    return NextResponse.json({
      source: 'sheet',
      count: Object.keys(availability).length,
      updatedAt: new Date().toISOString(),
      availability,
    });
  } catch {
    return NextResponse.json({ source: 'error', count: 0, availability: {} });
  }
}
