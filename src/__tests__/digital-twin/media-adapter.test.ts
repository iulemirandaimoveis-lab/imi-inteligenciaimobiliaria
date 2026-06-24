import {
  adaptDevelopmentMedia,
  isRenderableUrl,
  normalizeVideoUrl,
  getYouTubeId,
  resolveTour,
  hasAmenityMedia,
} from '@/lib/digital-twin/media-adapter';

const SB = 'https://zocffccwjjyelwrgunhu.supabase.co/storage/v1/object/public/media';

describe('digital-twin media adapter (FASE 1)', () => {
  it('aceita apenas URLs renderizáveis (http/https/raiz-relativa)', () => {
    expect(isRenderableUrl(`${SB}/a.jpg`)).toBe(true);
    expect(isRenderableUrl('/local.jpg')).toBe(true);
    expect(isRenderableUrl('relativo.jpg')).toBe(false);
    expect(isRenderableUrl('')).toBe(false);
    expect(isRenderableUrl(null)).toBe(false);
    expect(isRenderableUrl(123)).toBe(false);
  });

  it('mescla galeria JSONB + coluna legada e deduplica; resolve a capa', () => {
    const m = adaptDevelopmentMedia({
      image: `${SB}/legacy.jpg`,
      images: { main: `${SB}/main.jpg`, gallery: [`${SB}/a.jpg`, `${SB}/b.jpg`, 'quebrado'] },
      gallery_images: [`${SB}/b.jpg`, `${SB}/c.jpg`],
    });
    expect(m.main).toBe(`${SB}/main.jpg`);
    // capa primeiro, sem duplicar b.jpg, sem o item "quebrado" (não absoluto)
    expect(m.photos).toEqual([`${SB}/main.jpg`, `${SB}/a.jpg`, `${SB}/b.jpg`, `${SB}/c.jpg`]);
  });

  it('cai para gallery[0] e depois para a coluna image quando não há main', () => {
    expect(adaptDevelopmentMedia({ images: { gallery: [`${SB}/a.jpg`] } }).main).toBe(`${SB}/a.jpg`);
    expect(adaptDevelopmentMedia({ image: `${SB}/legacy.jpg` }).main).toBe(`${SB}/legacy.jpg`);
    expect(adaptDevelopmentMedia({}).main).toBeUndefined();
  });

  it('normaliza e deduplica vídeos por ID do YouTube', () => {
    const m = adaptDevelopmentMedia({
      images: { videos: ['https://youtu.be/abcdefghijk'] },
      video_url: 'https://www.youtube.com/watch?v=abcdefghijk',
      video_short_url: 'https://youtube.com/shorts/zzzzzzzzzzz',
    });
    expect(m.videos).toEqual(['https://youtu.be/abcdefghijk', 'https://youtube.com/shorts/zzzzzzzzzzz']);
    expect(getYouTubeId('https://youtu.be/abcdefghijk')).toBe('abcdefghijk');
    expect(normalizeVideoUrl('https://youtu.be/abcdefghijk')).toContain('youtube-nocookie.com/embed/abcdefghijk');
    expect(normalizeVideoUrl('https://vimeo.com/123456')).toBe('https://player.vimeo.com/video/123456');
  });

  it('resolve o tour Kuula como externo e desliga fs/inst (URL canônica preservada)', () => {
    const kuula = 'https://kuula.co/share/collection/7KKb9?logo=1&fs=1&inst=pt';
    const t = resolveTour(kuula);
    expect(t).not.toBeNull();
    expect(t!.external).toBe(true);
    expect(t!.host).toBe('kuula.co');
    expect(t!.url).toContain('fs=0');
    expect(t!.url).toContain('inst=0');
    expect(t!.url).toContain('7KKb9'); // coleção preservada
    expect(resolveTour(null)).toBeNull();
  });

  it('normaliza áreas comuns e detecta presença de mídia', () => {
    const m = adaptDevelopmentMedia({
      lot_map_amenities: [
        { id: 'portaria', title: null, photos: [`${SB}/p.jpg`] },
        { id: 'capela', title: '  Capela  ', photos: [], video: `${SB}/v.mp4` },
        { id: 'vazio', photos: ['relativo'], video: '' },
      ],
    });
    expect(m.amenities).toHaveLength(3);
    expect(m.amenities[0].title).toBe('portaria'); // fallback p/ id quando título nulo
    expect(m.amenities[1].title).toBe('Capela'); // trim
    expect(hasAmenityMedia(m.amenities[0])).toBe(true);
    expect(hasAmenityMedia(m.amenities[1])).toBe(true);
    expect(hasAmenityMedia(m.amenities[2])).toBe(false); // "relativo" filtrado, video vazio
  });

  it('é seguro com registro vazio (sem mídia quebrada)', () => {
    const m = adaptDevelopmentMedia({});
    expect(m.photos).toEqual([]);
    expect(m.videos).toEqual([]);
    expect(m.virtualTourUrl).toBeUndefined();
    expect(m.amenities).toEqual([]);
  });

  it('reflete o estado real do Alto Bellevue (16 fotos, 0 vídeos, tour Kuula, áreas sem mídia)', () => {
    const gallery = Array.from({ length: 16 }, (_, i) => `${SB}/developments/ab/g${i}.jpg`);
    const m = adaptDevelopmentMedia({
      image: `${SB}/developments/ab/cover.jpg`,
      images: { main: gallery[0], gallery },
      gallery_images: gallery,
      virtual_tour_url: 'https://kuula.co/share/collection/7KKb9?fs=1&inst=pt',
      lot_map_amenities: [
        { id: 'portaria' }, { id: 'lazer' }, { id: 'coworking' },
        { id: 'recreativa-03', title: 'Academia ' }, { id: 'capela' },
      ],
    });
    expect(m.photos).toHaveLength(16);
    expect(m.videos).toHaveLength(0);
    expect(m.virtualTourUrl).toBeDefined();
    expect(m.amenities.filter(hasAmenityMedia)).toHaveLength(0);
  });
});
