import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Testes de REGRESSÃO protegendo a página comercial de produção `/imoveis/alto-bellevue`.
 * Não exercitam render (Server Components async); validam estaticamente que o caminho de
 * produção continua intacto e que a homologação só ativa o Digital Twin atrás da flag.
 */

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

describe('produção /imoveis/alto-bellevue — intacta', () => {
  const prod = read('src/app/[lang]/(website)/imoveis/[slug]/page.tsx');

  it('mantém o caminho dedicado do alto-bellevue', () => {
    expect(prod).toContain("params.slug === 'alto-bellevue'");
  });

  it('continua usando os componentes de produção atuais', () => {
    for (const comp of ['DevelopmentHero', 'DevelopmentGallery', 'SubdivisionLotMap', 'DevelopmentLocation']) {
      expect(prod).toContain(comp);
    }
  });

  it('NÃO acopla a produção ao namespace digital-twin', () => {
    expect(prod).not.toContain('digital-twin');
    expect(prod).not.toContain('DigitalTwinExperience');
  });
});

describe('homologação /projetos/alto-bellevue — Digital Twin atrás de flag', () => {
  const homolog = read('src/app/[lang]/(website)/projetos/alto-bellevue/page.tsx');

  it('só renderiza o Digital Twin quando a flag está ativa', () => {
    expect(homolog).toContain('isDigitalTwinEnabled()');
    expect(homolog).toContain('DigitalTwinExperience');
  });

  it('preserva o conteúdo legado como fallback (nada removido)', () => {
    expect(homolog).toContain('AltoBellevueMapExplorer');
  });
});
