/**
 * Disponibilidade em tempo real do Loteamento Miguel Marques.
 *
 * Fonte: planilha "Mi Gestão" (Google Sheets) exportada como CSV. O layout é um
 * grid pensado para humanos — blocos de colunas [LOTE, M2, VALOR, DISPONIBILIDADE]
 * repetidos horizontalmente, com várias quadras empilhadas verticalmente dentro de
 * cada bloco. Este módulo extrai apenas o essencial: `${quadra}-${lote}` → status,
 * casando com os ids do CAD (public/maps/miguel-marques-cad-lots.json, ex.: "A-1").
 *
 * Robusto a: blocos em colunas variáveis, células entre aspas com vírgulas/quebras,
 * lote como "1" / "1.0", acentos no status e colunas extras espúrias.
 */

export type MiguelMarquesStatus =
  | 'disponivel'
  | 'vendido'
  | 'negociacao'
  | 'proprietario'
  | 'igreja';

/** Mapa de disponibilidade: id do lote (`${quadra}-${lote}`) → status. */
export type AvailabilityMap = Record<string, MiguelMarquesStatus>;

/** Normaliza texto: maiúsculas, sem acentos PT-BR, sem espaços nas pontas. */
function norm(s: string): string {
  return s
    .trim()
    .toUpperCase()
    .replace(/[ÁÀÂÃÄ]/g, 'A')
    .replace(/[ÉÈÊË]/g, 'E')
    .replace(/[ÍÌÎÏ]/g, 'I')
    .replace(/[ÓÒÔÕÖ]/g, 'O')
    .replace(/[ÚÙÛÜ]/g, 'U')
    .replace(/Ç/g, 'C');
}

const STATUS_BY_LABEL: Record<string, MiguelMarquesStatus> = {
  VENDIDO: 'vendido',
  DISPONIVEL: 'disponivel',
  PROPRIETARIO: 'proprietario',
  NEGOCIACAO: 'negociacao',
  IGREJA: 'igreja',
};

/** Parser CSV mínimo (RFC 4180): aspas, vírgulas e quebras de linha dentro de campos. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else inQuotes = false;
      } else field += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field); field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      rows.push(row); row = [];
    } else field += c;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows;
}

/** Extrai a disponibilidade a partir das linhas já parseadas do CSV. */
export function extractAvailability(rows: string[][]): AvailabilityMap {
  // Colunas que iniciam um bloco = onde aparece um cabeçalho "QUADRA X".
  const blockCols = new Set<number>();
  for (const row of rows) {
    for (let c = 0; c < row.length; c++) {
      if (/^QUADRA\s+[A-Z]+$/.test(norm(row[c] ?? ''))) blockCols.add(c);
    }
  }

  const out: AvailabilityMap = {};
  const currentQuadra = new Map<number, string>();
  for (const row of rows) {
    for (const c of blockCols) {
      const cell = norm(row[c] ?? '');
      const mq = cell.match(/^QUADRA\s+([A-Z]+)$/);
      if (mq) { currentQuadra.set(c, mq[1]); continue; }

      const quadra = currentQuadra.get(c);
      if (!quadra) continue;
      // LOTE na coluna do bloco, DISPONIBILIDADE 3 colunas à direita.
      const loteRaw = (row[c] ?? '').trim();
      if (!/^\d+(?:[.,]0+)?$/.test(loteRaw)) continue; // ignora cabeçalhos/textos
      const status = STATUS_BY_LABEL[norm(row[c + 3] ?? '')];
      if (!status) continue;
      out[`${quadra}-${parseInt(loteRaw, 10)}`] = status;
    }
  }
  return out;
}

/** Conveniência: CSV cru → mapa de disponibilidade. */
export function extractAvailabilityFromCsv(csv: string): AvailabilityMap {
  return extractAvailability(parseCsv(csv));
}
