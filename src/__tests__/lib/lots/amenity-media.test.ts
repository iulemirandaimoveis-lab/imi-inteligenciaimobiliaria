import {
  resolveAmenityInfo,
  amenityPrefix,
  type AmenityInfo,
  type AmenityOverride,
} from '@/lib/lots/amenity-media';

const TABLE: Record<string, AmenityInfo> = {
  portaria: {
    title: 'Portaria Principal',
    subtitle: 'Acesso e segurança',
    description: 'Entrada monitorada.',
    fn: 'Controle de acesso 24h',
    photos: ['/default-portaria.jpg'],
  },
  recreativa: {
    title: 'Área Recreativa',
    subtitle: 'Esporte',
    description: 'Recreação.',
    fn: 'Esporte',
    photos: ['/default-rec.jpg'],
  },
};

describe('amenityPrefix', () => {
  it('remove o sufixo numérico', () => {
    expect(amenityPrefix('recreativa-01')).toBe('recreativa');
    expect(amenityPrefix('recreativa-12')).toBe('recreativa');
  });
  it('mantém ids sem sufixo', () => {
    expect(amenityPrefix('portaria')).toBe('portaria');
    expect(amenityPrefix('area-verde')).toBe('area-verde'); // não termina em -\d+
  });
});

describe('resolveAmenityInfo', () => {
  it('usa o default editorial quando não há override', () => {
    const info = resolveAmenityInfo({ id: 'portaria', label: 'X' }, TABLE);
    expect(info.title).toBe('Portaria Principal');
    expect(info.photos).toEqual(['/default-portaria.jpg']);
  });

  it('resolve por prefixo (recreativa-01 → recreativa)', () => {
    const info = resolveAmenityInfo({ id: 'recreativa-02', label: 'Área Recreativa 02' }, TABLE);
    expect(info.title).toBe('Área Recreativa');
    expect(info.photos).toEqual(['/default-rec.jpg']);
  });

  it('usa fallback genérico com o label quando id desconhecido', () => {
    const info = resolveAmenityInfo({ id: 'capela', label: 'Capela' }, TABLE);
    expect(info.title).toBe('Capela');
    expect(info.subtitle).toBe('Área comum');
    expect(info.photos).toBeUndefined();
  });

  it('campos do backoffice têm prioridade sobre o default', () => {
    const override: AmenityOverride = {
      id: 'portaria',
      label: 'Portaria',
      title: 'Portaria Editada',
      photos: ['/upload-1.jpg', '/upload-2.jpg'],
    };
    const info = resolveAmenityInfo(override, TABLE);
    expect(info.title).toBe('Portaria Editada');
    expect(info.photos).toEqual(['/upload-1.jpg', '/upload-2.jpg']);
    // campos não sobrescritos mantêm o default
    expect(info.fn).toBe('Controle de acesso 24h');
  });

  // Regressão do fix #306: vídeos enviados (videos[]) devem ser carregados ponta a ponta.
  it('carrega videos[] enviados pelo backoffice (regressão #306)', () => {
    const override: AmenityOverride = {
      id: 'lazer',
      label: 'Lazer',
      videos: ['https://cdn/x/clube.mp4'],
    };
    const info = resolveAmenityInfo(override, TABLE);
    expect(info.videos).toEqual(['https://cdn/x/clube.mp4']);
  });

  it('preserva video (embed) e tour360 vindos do override', () => {
    const info = resolveAmenityInfo(
      { id: 'lazer', label: 'Lazer', video: 'https://youtube/embed/abc', tour360: 'https://kuula/x' },
      TABLE,
    );
    expect(info.video).toBe('https://youtube/embed/abc');
    expect(info.tour360).toBe('https://kuula/x');
  });
});
