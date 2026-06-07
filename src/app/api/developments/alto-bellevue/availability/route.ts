import { NextResponse } from "next/server"
import {
  AB_AVAILABILITY_SHEET_URL,
  parseAvailabilityCSV,
} from "@/lib/lots/alto-bellevue-availability"

// Disponibilidade ao vivo do Alto Bellevue a partir da planilha do Google Sheets.
// Revalida no servidor a cada 60s (near-real-time) + cache de CDN com SWR.
export const revalidate = 60

export async function GET() {
  try {
    const res = await fetch(AB_AVAILABILITY_SHEET_URL, {
      // Cache no servidor por 60s; a planilha é a fonte editável (comercial).
      next: { revalidate: 60 },
      headers: { "User-Agent": "imi-availability-sync" },
    })
    if (!res.ok) {
      return NextResponse.json(
        { availability: {}, error: `sheet HTTP ${res.status}`, updatedAt: new Date().toISOString() },
        { status: 200, headers: { "Cache-Control": "public, s-maxage=30" } },
      )
    }
    const csv = await res.text()
    const availability = parseAvailabilityCSV(csv)
    return NextResponse.json(
      { availability, count: Object.keys(availability).length, updatedAt: new Date().toISOString() },
      {
        status: 200,
        headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=600" },
      },
    )
  } catch (err) {
    // Falha graciosa: mapa cai para o status do JSON canônico.
    return NextResponse.json(
      { availability: {}, error: err instanceof Error ? err.message : "fetch failed", updatedAt: new Date().toISOString() },
      { status: 200, headers: { "Cache-Control": "public, s-maxage=30" } },
    )
  }
}
