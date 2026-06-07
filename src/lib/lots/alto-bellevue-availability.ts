/**
 * Disponibilidade ao vivo do Alto Bellevue a partir da planilha do Google Sheets.
 *
 * A planilha é a "fonte viva" de disponibilidade (editada pela equipe comercial).
 * Layout: blocos horizontais de 3 quadras; cada grupo = [QUADRA, LOTE, ÁREA, Disponibilidade]
 * começando nas colunas 0, 4 e 8. Status: "Disponível", "VENDA" (vendido), "NEGOCIAÇÃO".
 *
 * O parsing é compartilhado pela API route (server) e testável isoladamente.
 */

// Configurável por env (backoffice/infra); fallback no link público em CSV.
export const AB_AVAILABILITY_SHEET_URL =
  process.env.AB_AVAILABILITY_SHEET_URL ||
  'https://docs.google.com/spreadsheets/d/1htpZAtQDDgZaBo_EiVsGr-Ou4AKR4ELDkkCfcEoAGGc/export?format=csv';

export type LotStatusCode = 'DISPONIVEL' | 'NEGOCIACAO' | 'VENDIDO' | 'RESERVADO' | 'PROPRIETARIO';

const STATUS_MAP: Record<string, LotStatusCode> = {
  disponivel: 'DISPONIVEL',
  disponível: 'DISPONIVEL',
  venda: 'VENDIDO',
  vendido: 'VENDIDO',
  vendida: 'VENDIDO',
  negociacao: 'NEGOCIACAO',
  negociação: 'NEGOCIACAO',
  reservado: 'RESERVADO',
  reserva: 'RESERVADO',
  proprietario: 'PROPRIETARIO',
  proprietário: 'PROPRIETARIO',
};

/** Normaliza um rótulo de status da planilha para o código do mapa. */
export function normalizeAvailabilityStatus(raw: string): LotStatusCode | null {
  const key = raw.trim().toLowerCase();
  return STATUS_MAP[key] ?? null;
}

/** Parser de uma linha CSV tolerante a campos entre aspas (ex.: "355,99"). */
function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (quoted && line[i + 1] === '"') { cur += '"'; i++; }
      else quoted = !quoted;
    } else if (ch === ',' && !quoted) {
      out.push(cur); cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

const QUADRA_RE = /^QUADRA\s+([A-P])$/i;
const GROUP_STARTS = [0, 4, 8]; // 3 quadras lado a lado por bloco

/**
 * Extrai o mapa `{ "A-01": "VENDIDO", … }` do CSV da planilha.
 * Robusto a colunas vazias e à quadra-título aparecer em col g ou g+1.
 */
export function parseAvailabilityCSV(csv: string): Record<string, LotStatusCode> {
  const rows = csv.split(/\r?\n/).map(parseCsvLine);
  const current: Record<number, string | null> = { 0: null, 4: null, 8: null };
  const out: Record<string, LotStatusCode> = {};

  for (const r of rows) {
    // Atualiza a quadra corrente de cada grupo
    for (const g of GROUP_STARTS) {
      for (let c = g; c < Math.min(g + 2, r.length); c++) {
        const m = (r[c] ?? '').trim().match(QUADRA_RE);
        if (m) current[g] = m[1].toUpperCase();
      }
    }
    // Lê lote/status de cada grupo
    for (const g of GROUP_STARTS) {
      if (g + 3 >= r.length) continue;
      const q = current[g];
      const lote = (r[g + 1] ?? '').trim();
      const disp = (r[g + 3] ?? '').trim();
      if (!q || !/^\d+$/.test(lote) || !disp) continue;
      const status = normalizeAvailabilityStatus(disp);
      if (status) out[`${q}-${String(parseInt(lote, 10)).padStart(2, '0')}`] = status;
    }
  }
  return out;
}
