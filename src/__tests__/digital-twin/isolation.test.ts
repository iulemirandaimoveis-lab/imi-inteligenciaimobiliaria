import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

/**
 * Garante o ISOLAMENTO do namespace digital-twin: nenhum arquivo da experiência de
 * homologação pode importar componentes/engines de produção. Se este teste quebrar,
 * o isolamento foi violado (risco de regressão na página comercial).
 */

const DT_DIRS = [
  'src/components/digital-twin',
  'src/lib/digital-twin',
  'src/types/digital-twin',
  'src/data/digital-twin',
];

// Fragmentos de caminho proibidos em IMPORTS dentro do namespace digital-twin
// (componentes/engines/dados de produção). Verificamos apenas os especificadores de
// import — comentários que citem esses caminhos para fins de documentação são OK.
const FORBIDDEN = [
  'imoveis/components',
  'components/maps',
  'projetos/miguel-marques',
  'lib/lots/',
  'hooks/use-ab',
];

/** Extrai os caminhos de todos os imports estáticos/dinâmicos de um arquivo. */
function importSpecifiers(src: string): string[] {
  const specs: string[] = [];
  const patterns = [/\bfrom\s+['"]([^'"]+)['"]/g, /\bimport\(\s*['"]([^'"]+)['"]\s*\)/g, /\brequire\(\s*['"]([^'"]+)['"]\s*\)/g];
  for (const re of patterns) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(src)) !== null) specs.push(m[1]);
  }
  return specs;
}

function walk(dir: string): string[] {
  const abs = join(process.cwd(), dir);
  let out: string[] = [];
  for (const entry of readdirSync(abs)) {
    const full = join(abs, entry);
    if (statSync(full).isDirectory()) out = out.concat(walk(join(dir, entry)));
    else if (/\.(ts|tsx)$/.test(entry)) out.push(full);
  }
  return out;
}

describe('digital-twin isolation', () => {
  const files = DT_DIRS.flatMap((d) => {
    try {
      return walk(d);
    } catch {
      return [];
    }
  });

  it('coleta os arquivos do namespace digital-twin', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it('nenhum arquivo do digital-twin importa componentes/engines de produção', () => {
    const offenders: string[] = [];
    for (const file of files) {
      const specs = importSpecifiers(readFileSync(file, 'utf8'));
      for (const spec of specs) {
        for (const pattern of FORBIDDEN) {
          if (spec.includes(pattern)) offenders.push(`${file} → import "${spec}"`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
